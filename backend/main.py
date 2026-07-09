from fastapi import FastAPI, Depends, HTTPException, status, Form, Request, Response, BackgroundTasks, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, RedirectResponse, HTMLResponse, JSONResponse
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, text
from sqlalchemy.exc import OperationalError
from datetime import datetime, timedelta
from typing import Optional
from user_agents import parse
import jwt
import csv
import io

import os
import geoip2.database

import models, schemas, utils
from database import engine, get_db, SessionLocal

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "GeoLite2-City.mmdb")

geoip_reader = None
try:
    if os.path.exists(DB_PATH):
        geoip_reader = geoip2.database.Reader(DB_PATH)
        print("GeoIP database loaded successfully.")
    else:
        print(f"GeoIP database not found at: {DB_PATH}")
except Exception as e:
    print(f"Error loading GeoIP database: {e}")


# Tự động khởi tạo cấu trúc bảng trong cơ sở dữ liệu SQLite nếu chưa có
models.Base.metadata.create_all(bind=engine)
for alter_sql in [
    "ALTER TABLE links ADD COLUMN params TEXT",
    "ALTER TABLE links ADD COLUMN name TEXT",
    "ALTER TABLE click_logs ADD COLUMN is_bot BOOLEAN DEFAULT 0",
    "ALTER TABLE links ADD COLUMN max_clicks INTEGER",
    "ALTER TABLE links ADD COLUMN utm_source VARCHAR",
    "ALTER TABLE links ADD COLUMN utm_medium VARCHAR",
    "ALTER TABLE links ADD COLUMN utm_campaign VARCHAR",
    "ALTER TABLE links ADD COLUMN utm_content VARCHAR",
    "ALTER TABLE links ADD COLUMN utm_term VARCHAR"
]:
    try:
        with engine.connect() as conn:
            conn.execute(text(alter_sql))
            conn.commit()
    except Exception:
        pass

# Tự động khởi tạo tài khoản Admin cố định
db_init = SessionLocal()
try:
    admin_email = "adminslt@gmail.com"
    admin_user = db_init.query(models.User).filter(models.User.email == admin_email).first()
    if not admin_user:
        hashed_pwd = utils.hash_password("123456")
        new_admin = models.User(
            email=admin_email,
            password_hash=hashed_pwd,
            role="admin"
        )
        if hasattr(models.User, 'username'):
            setattr(new_admin, 'username', 'admin_slt')
        db_init.add(new_admin)
        db_init.commit()
        print("Tai khoan Admin co dinh da duoc tao thanh cong!")
finally:
    db_init.close()

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Hệ thống Shortlink & Analytics nâng cao", root_path="/slink")
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
def rate_limit_custom_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Bạn đã vượt quá giới hạn yêu cầu. Vui lòng thử lại sau ít phút!"}
    )

def create_audit_log(db: Session, user_id: Optional[int], action: str, target: str, detail: Optional[str] = None):
    try:
        log = models.AuditLog(
            user_id=user_id,
            action=action,
            target=target,
            detail=detail
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Error creating audit log: {e}")

# --- CẤU HÌNH CỦA CỔNG BẢO MẬT CORS CHUẨN ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Cho phép Frontend kết nối thoải mái từ mọi cổng mạng local
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn!",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        print(f"Token: {token}")
        payload = jwt.decode(token, utils.SECRET_KEY, algorithms=[utils.ALGORITHM])
        print(f"Payload: {payload}")
        user_id: int = payload.get("user_id")
        print(f"User ID: {user_id}")
        if user_id is None:
            raise credentials_exception
        
        user = db.query(models.User).filter(models.User.id == user_id).first()
        print(f"User: {user}")
        if user is None:
            raise credentials_exception
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token đã hết hạn, vui lòng đăng nhập lại")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token không hợp lệ")
    except Exception as e:
        print(e)
        raise credentials_exception
    
def get_current_user_optional(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None
    try:
        scheme, token = auth_header.split(" ", 1)
        if scheme.lower() != "bearer":
            return None
        payload = jwt.decode(token, utils.SECRET_KEY, algorithms=[utils.ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            return None
        return db.query(models.User).filter(models.User.id == user_id).first()
    except Exception:
        return None

@app.get("/")
def read_root():
    return {"message": "Backend đã sẵn sàng cho các API chức năng!"}

# --- API ĐĂNG KÝ TÀI KHOẢN (Fix ATTRIBUTE) ---
@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    if email_clean.startswith("admin"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không được phép đăng ký tài khoản admin!")

    # Kiểm tra an toàn: Nếu bảng User có trường username thì lọc theo username, ngược lại lọc theo email
    if hasattr(models.User, 'username'):
        existing_username = db.query(models.User).filter(models.User.username == payload.username).first()
        if existing_username:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tên tài khoản này đã được đăng ký sử dụng!")
    
    existing_user = db.query(models.User).filter(models.User.email == email_clean).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email này đã được đăng ký sử dụng!")
    
    hashed_pwd = utils.hash_password(payload.password)
    
    new_user = models.User(email=email_clean, password_hash=hashed_pwd, role="member")
    if hasattr(models.User, 'username'):
        setattr(new_user, 'username', payload.username)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"status": "success", "message": "Đăng ký tài khoản thành công!", "user_id": new_user.id}

# --- API ĐĂNG NHẬP (Fix ATTRIBUTE) ---
@app.post("/api/auth/token")
@limiter.limit("5/minute")
def login(request: Request, username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    username_clean = username.strip().lower()
    # Tìm kiếm linh hoạt: nếu model có `username` thì dò cả `username` hoặc `email`.
    # Nếu model không có `username`, dò theo `email`.
    if hasattr(models.User, 'username'):
        user = db.query(models.User).filter(or_(models.User.username == username.strip(), models.User.email == username_clean)).first()
    else:
        user = db.query(models.User).filter(models.User.email == username_clean).first()
        
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tài khoản này không tồn tại!")
    
    is_password_correct = utils.verify_password(password, user.password_hash)
    if not is_password_correct:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mật khẩu không chính xác!")
    
    user_email = user.email if hasattr(user, 'email') else ""
    user_username = user.username if hasattr(user, 'username') else username
    
    access_token = utils.create_access_token(
        data={"user_id": user.id, "email": user_email, "role": user.role if hasattr(user, 'role') else "user"}
    )
    print(f"Generated Token: {access_token}")
    return {
        "status": "success",
        "message": "Đăng nhập thành công!",
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role if hasattr(user, 'role') else "member"
    }

# @app.post("/api/auth/oauth")
# def oauth_login(payload: schemas.OAuthLoginPayload, db: Session = Depends(get_db)):
#     email = payload.email.strip().lower()
#     if not email:
#         raise HTTPException(status_code=400, detail="Email không hợp lệ!")
# 
#     user = db.query(models.User).filter(models.User.email == email).first()
#     
#     if not user:
#         hashed_pwd = utils.hash_password(utils.generate_short_code())
#         user = models.User(email=email, password_hash=hashed_pwd)
#         if hasattr(models.User, 'username'):
#             username_part = email.split("@")[0]
#             existing_user = db.query(models.User).filter(models.User.username == username_part).first()
#             if existing_user:
#                 username_part = f"{username_part}_{utils.generate_short_code()[:4]}"
#             setattr(user, 'username', username_part)
#         
#         db.add(user)
#         db.commit()
#         db.refresh(user)
#         message = "Đăng ký và đăng nhập thành công bằng tài khoản mạng xã hội!"
#     else:
#         message = "Đăng nhập thành công bằng tài khoản mạng xã hội!"
# 
#     user_email = user.email if hasattr(user, 'email') else email
#     
#     access_token = utils.create_access_token(
#         data={"user_id": user.id, "email": user_email, "role": "member"}
#     )
#     
#     return {
#         "status": "success",
#         "message": message,
#         "access_token": access_token,
#         "token_type": "bearer"
#     }

@app.post("/api/auth/forgot")
def forgot_password(payload: schemas.ForgotPassword, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email_clean).first()
    if not user:
        return {"status": "success", "message": "Nếu tài khoản tồn tại, mã OTP đặt lại mật khẩu đã được gửi."}

    # Đặt mã OTP mặc định là 123456 để kiểm thử dễ dàng
    otp = "123456"
    
    # Lưu OTP và thời gian hết hạn (5 phút) vào DB
    user.reset_otp = otp
    user.reset_otp_expires_at = datetime.utcnow() + timedelta(minutes=5)
    db.commit()

    email_body = (
        f"Xin chào,\n\n"
        f"Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản này.\n"
        f"Mã OTP xác thực đặt lại mật khẩu của bạn là:\n\n"
        f"          {otp}\n\n"
        f"Mã OTP này có hiệu lực trong vòng 5 phút.\n"
        f"Nếu bạn không yêu cầu, vui lòng bỏ qua email này.\n\n"
        f"Trân trọng,\nSLinkTrack Team"
    )
    
    # Đưa tác vụ gửi email vào chạy ngầm (Background Task)
    background_tasks.add_task(
        utils.send_email,
        subject="[SLinkTrack] Mã OTP đặt lại mật khẩu",
        body=email_body,
        to_email=user.email
    )

    response = {
        "status": "success", 
        "message": "Đã tạo OTP thành công! Nếu tài khoản tồn tại, mã OTP đặt lại mật khẩu sẽ được gửi đến email của bạn.",
        "otp": otp
    }
    return response


@app.post("/api/auth/verify-otp")
def verify_otp(payload: schemas.VerifyOTP, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email_clean).first()
    if not user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")

    if not user.reset_otp or user.reset_otp != payload.otp.strip():
        raise HTTPException(status_code=400, detail="Mã OTP không chính xác")

    if user.reset_otp_expires_at and user.reset_otp_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Mã OTP đã hết hạn (chỉ có hiệu lực trong 5 phút)")

    return {"status": "success", "message": "Mã OTP chính xác!"}


@app.post("/api/auth/reset")
def reset_password(payload: schemas.ResetPassword, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email_clean).first()
    if not user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")

    if not user.reset_otp or user.reset_otp != payload.otp:
        raise HTTPException(status_code=400, detail="Mã OTP không chính xác")

    if user.reset_otp_expires_at and user.reset_otp_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Mã OTP đã hết hạn (chỉ có hiệu lực trong 5 phút)")

    user.password_hash = utils.hash_password(payload.new_password)
    user.reset_otp = None
    user.reset_otp_expires_at = None
    db.commit()
    return {"status": "success", "message": "Mật khẩu đã được cập nhật thành công."}

# --- API TẠO ĐƯỜNG DẪN RÚT GỌN MỚI ---
@app.post("/api/shorten")
@limiter.limit("10/minute")
def shorten_url(request: Request, payload: schemas.ShortenRequest, current_user: Optional[models.User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    if payload.alias:
        existing = db.query(models.Link).filter(models.Link.short_code == payload.alias).first()
        if existing:
            raise HTTPException(status_code=400, detail="Alias/Hậu tố tùy chỉnh này đã được sử dụng!")
        short_code = payload.alias
    else:
        while True:
            short_code = utils.generate_short_code()
            existing = db.query(models.Link).filter(models.Link.short_code == short_code).first()
            if not existing:
                break

    domain_id = None
    final_domain_name = None
    if getattr(payload, 'domain_id', None):
        selected_domain = db.query(models.Domain).filter(models.Domain.id == payload.domain_id).first()
        if not selected_domain:
            raise HTTPException(status_code=404, detail="Domain tùy chỉnh không tồn tại!")
        
        # Kiểm tra xem domain có thuộc workspace của user không
        if selected_domain.workspace_id is not None:
            if not current_user:
                raise HTTPException(status_code=403, detail="Tên miền thuộc một không gian làm việc khác!")
            is_member = db.query(models.WorkspaceMember).filter(
                models.WorkspaceMember.workspace_id == selected_domain.workspace_id,
                models.WorkspaceMember.user_id == current_user.id
            ).first()
            if not is_member:
                raise HTTPException(status_code=403, detail="Tên miền thuộc một không gian làm việc khác bạn không được phép dùng!")
                
        domain_id = selected_domain.id
        final_domain_name = selected_domain.domain_name
    elif getattr(payload, 'domain', None):
        domain_name = payload.domain.strip()
        if domain_name.startswith("http://") or domain_name.startswith("https://"):
            domain_name = domain_name.split("://", 1)[1]
        domain_name = domain_name.rstrip("/")
        if domain_name:
            selected_domain = db.query(models.Domain).filter(models.Domain.domain_name == domain_name).first()
            if selected_domain:
                # Kiểm tra xem domain có thuộc workspace của user không
                if selected_domain.workspace_id is not None:
                    if not current_user:
                        raise HTTPException(status_code=403, detail="Tên miền thuộc một không gian làm việc khác!")
                    is_member = db.query(models.WorkspaceMember).filter(
                        models.WorkspaceMember.workspace_id == selected_domain.workspace_id,
                        models.WorkspaceMember.user_id == current_user.id
                    ).first()
                    if not is_member:
                        raise HTTPException(status_code=403, detail="Tên miền thuộc một không gian làm việc khác bạn không được phép dùng!")
            else:
                selected_domain = models.Domain(domain_name=domain_name, workspace_id=payload.workspace_id if getattr(payload, 'workspace_id', None) else None)
                db.add(selected_domain)
                db.commit()
                db.refresh(selected_domain)
            domain_id = selected_domain.id
            final_domain_name = selected_domain.domain_name

    params_value = payload.params.strip() if getattr(payload, 'params', None) else None
    if params_value == "":
        params_value = None

    link_pwd_hash = None
    if getattr(payload, 'password', None) and payload.password.strip():
        link_pwd_hash = utils.hash_password(payload.password.strip())

    utm_data = {
        "utm_source": getattr(payload, 'utm_source', None),
        "utm_medium": getattr(payload, 'utm_medium', None),
        "utm_campaign": getattr(payload, 'utm_campaign', None),
        "utm_content": getattr(payload, 'utm_content', None),
        "utm_term": getattr(payload, 'utm_term', None)
    }
    final_original_url = utils.append_utm_params(payload.url, utm_data)

    new_link = models.Link(
        original_url=final_original_url,
        name=payload.name.strip() if getattr(payload, 'name', None) else None,
        short_code=short_code,
        domain_id=domain_id,
        workspace_id=payload.workspace_id if getattr(payload, 'workspace_id', None) else None,
        user_id=current_user.id if current_user else None,
        params=params_value,
        expired_at=payload.expired_at,
        password_hash=link_pwd_hash,
        max_clicks=getattr(payload, 'max_clicks', None),
        utm_source=utm_data["utm_source"],
        utm_medium=utm_data["utm_medium"],
        utm_campaign=utm_data["utm_campaign"],
        utm_content=utm_data["utm_content"],
        utm_term=utm_data["utm_term"],
        status="active"
    )
    db.add(new_link)
    db.commit()
    db.refresh(new_link)

    # Ghi Audit Log
    if current_user:
        create_audit_log(db, current_user.id, "create_link", short_code, f"Tạo liên kết rút gọn cho {new_link.original_url}")

    short_url = f"https://{final_domain_name}/{short_code}" if final_domain_name else f"http://localhost:8000/{short_code}"
    return {
        "status": "success",
        "message": "Tạo liên kết rút gọn thành công!",
        "short_code": short_code,
        "name": new_link.name,
        "short_url": short_url
    }

@app.post("/api/links/import-csv")
def import_links_from_csv(
    file: UploadFile = File(...),
    workspace_id: Optional[int] = Form(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Chỉ chấp nhận tập tin định dạng .csv")
        
    try:
        content = file.file.read().decode('utf-8-sig')
    except Exception as e:
        raise HTTPException(status_code=400, detail="Không thể đọc file. Vui lòng đảm bảo file được mã hóa UTF-8.")
        
    import csv
    import io
    
    f = io.StringIO(content)
    reader = csv.DictReader(f)
    
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="File CSV rỗng hoặc không đúng định dạng")
        
    errors = []
    created_links = []
    total_rows = 0
    created_count = 0
    failed_count = 0
    processed_aliases = set()
    
    for idx, row in enumerate(reader, start=1):
        total_rows += 1
        row = {k.strip() if k else "": v.strip() if v else "" for k, v in row.items()}
        
        original_url = row.get("original_url")
        if not original_url:
            failed_count += 1
            errors.append({"row": idx, "reason": "Thiếu trường original_url bắt buộc"})
            continue
            
        if not (original_url.startswith("http://") or original_url.startswith("https://")):
            failed_count += 1
            errors.append({"row": idx, "reason": "original_url không hợp lệ (phải bắt đầu bằng http:// hoặc https://)"})
            continue
            
        custom_alias = row.get("custom_alias")
        if custom_alias == "":
            custom_alias = None
            
        if custom_alias:
            if custom_alias in processed_aliases:
                failed_count += 1
                errors.append({"row": idx, "reason": f"Hậu tố tùy chỉnh '{custom_alias}' bị trùng lặp trong file CSV"})
                continue
                
            existing = db.query(models.Link).filter(models.Link.short_code == custom_alias).first()
            if existing:
                failed_count += 1
                errors.append({"row": idx, "reason": f"Hậu tố tùy chỉnh '{custom_alias}' đã tồn tại trên hệ thống"})
                continue
                
        max_clicks = row.get("max_clicks")
        max_clicks_val = None
        if max_clicks:
            try:
                max_clicks_val = int(max_clicks)
                if max_clicks_val <= 0:
                    raise ValueError()
            except ValueError:
                failed_count += 1
                errors.append({"row": idx, "reason": "Giới hạn click (max_clicks) phải là một số nguyên dương"})
                continue
                
        utm_source = row.get("utm_source") or None
        utm_medium = row.get("utm_medium") or None
        utm_campaign = row.get("utm_campaign") or None
        utm_content = row.get("utm_content") or None
        utm_term = row.get("utm_term") or None
        
        utm_data = {
            "utm_source": utm_source,
            "utm_medium": utm_medium,
            "utm_campaign": utm_campaign,
            "utm_content": utm_content,
            "utm_term": utm_term
        }
        
        final_original_url = utils.append_utm_params(original_url, utm_data)
        
        if custom_alias:
            short_code = custom_alias
            processed_aliases.add(custom_alias)
        else:
            while True:
                short_code = utils.generate_short_code()
                existing = db.query(models.Link).filter(models.Link.short_code == short_code).first()
                if not existing and short_code not in processed_aliases:
                    break
            processed_aliases.add(short_code)
            
        title = row.get("title") or None
        
        new_link = models.Link(
            original_url=final_original_url,
            name=title,
            short_code=short_code,
            domain_id=None,
            workspace_id=workspace_id,
            user_id=current_user.id,
            max_clicks=max_clicks_val,
            utm_source=utm_source,
            utm_medium=utm_medium,
            utm_campaign=utm_campaign,
            utm_content=utm_content,
            utm_term=utm_term,
            status="active"
        )
        db.add(new_link)
        created_count += 1
        
        created_links.append({
            "short_code": short_code,
            "original_url": original_url,
            "title": title
        })
        
    db.commit()
    
    if current_user:
        create_audit_log(
            db, 
            current_user.id, 
            "import_csv", 
            f"Thành công: {created_count}, Lỗi: {failed_count}",
            f"Nhập danh sách liên kết từ CSV. Tổng số dòng: {total_rows}."
        )
        
    return {
        "total_rows": total_rows,
        "created": created_count,
        "failed": failed_count,
        "errors": errors,
        "created_links": created_links
    }

# --- API TỰ ĐỘNG XUẤX FILE ẢNH QR CODE ĐỘNG ---
@app.get("/api/qrcode/{short_code}")
def get_qr_code(
    short_code: str,
    fill_color: str = "black",
    back_color: str = "white",
    format: str = "png",
    db: Session = Depends(get_db)
):
    link = db.query(models.Link).filter(models.Link.short_code == short_code).first()
    if not link:
        raise HTTPException(status_code=404, detail="Không tìm thấy đường dẫn tương ứng để tạo QR!")
        
    qr_stream = utils.generate_qrcode_stream(short_code, fill_color=fill_color, back_color=back_color, format=format)
    media_type = "image/svg+xml" if format.lower() == "svg" else "image/png"
    return StreamingResponse(qr_stream, media_type=media_type)

@app.post("/api/qrcode/{short_code}/custom")
async def customize_qr_code(
    short_code: str,
    fill_color: str = Form("black"),
    back_color: str = Form("white"),
    logo: Optional[UploadFile] = File(None),
    format: str = Form("png"),
    db: Session = Depends(get_db)
):
    link = db.query(models.Link).filter(models.Link.short_code == short_code).first()
    if not link:
        raise HTTPException(status_code=404, detail="Không tìm thấy đường dẫn tương ứng để tạo QR!")
        
    logo_bytes = None
    if logo and logo.filename:
        logo_bytes = await logo.read()
        
    qr_stream = utils.generate_qrcode_stream(
        short_code, 
        fill_color=fill_color, 
        back_color=back_color, 
        logo_bytes=logo_bytes,
        format=format
    )
    media_type = "image/svg+xml" if format.lower() == "svg" else "image/png"
    return StreamingResponse(qr_stream, media_type=media_type)

# --- API ĐIỀU HƯỚNG LINK & QUÉT ANALYTICS NGẦM ---
def get_password_prompt_html(short_code: str, error: Optional[str] = None) -> str:
    error_html = f'<div class="error-message">{error}</div>' if error else ''
    return f"""<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SLinkTrack - Nhập mật khẩu truy cập</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body {{
            margin: 0;
            padding: 0;
            background-color: #0b0b0f;
            color: #e8e8f0;
            font-family: 'Inter', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }}
        .container {{
            width: 100%;
            max-width: 400px;
            padding: 20px;
        }}
        .card {{
            background-color: #111118;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            text-align: center;
        }}
        .logo {{
            font-size: 24px;
            font-weight: 800;
            margin-bottom: 24px;
            color: #e8e8f0;
        }}
        .logo span {{
            color: #a29bfe;
        }}
        .lock-icon {{
            font-size: 48px;
            margin-bottom: 16px;
            display: inline-block;
        }}
        h2 {{
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 8px 0;
        }}
        p {{
            font-size: 13px;
            color: #7a7a9a;
            margin: 0 0 24px 0;
        }}
        .input-group {{
            text-align: left;
            margin-bottom: 20px;
        }}
        label {{
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            color: #7a7a9a;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 6px;
        }}
        input {{
            width: 100%;
            box-sizing: border-box;
            background-color: #18181f;
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 8px;
            padding: 12px;
            color: white;
            font-size: 14px;
            outline: none;
            transition: all 0.3s;
        }}
        input:focus {{
            border-color: #6c5ce7;
            box-shadow: 0 0 0 2px rgba(108, 92, 231, 0.15);
        }}
        button {{
            width: 100%;
            background-color: #6c5ce7;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }}
        button:hover {{
            background-color: #5b4bc4;
        }}
        .error-message {{
            background-color: rgba(255, 118, 117, 0.15);
            border: 1px solid rgba(255, 118, 117, 0.3);
            color: #ff7675;
            font-size: 12px;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: left;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="logo">SLink<span>Track</span></div>
            <div class="lock-icon">🔒</div>
            <h2>Mật khẩu yêu cầu</h2>
            <p>Liên kết này được bảo vệ bằng mật khẩu. Vui lòng nhập mật khẩu chính xác để tiếp tục.</p>
            
            <form method="POST" action="/{short_code}">
                {error_html}
                <div class="input-group">
                    <label>Mật khẩu truy cập</label>
                    <input type="password" name="password" required placeholder="Nhập mật khẩu tại đây..." autofocus />
                </div>
                <button type="submit">Xác nhận & Truy cập</button>
            </form>
        </div>
    </div>
</body>
</html>"""

def get_limit_exceeded_html() -> str:
    return """<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Liên kết đạt giới hạn truy cập</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #0b0b0f;
            color: #e8e8f0;
            font-family: 'Inter', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .container {
            width: 100%;
            max-width: 400px;
            padding: 20px;
        }
        .card {
            background-color: #111118;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            text-align: center;
        }
        .logo {
            font-size: 24px;
            font-weight: 800;
            margin-bottom: 24px;
            color: #e8e8f0;
        }
        .logo span {
            color: #ff7675;
        }
        .icon {
            font-size: 48px;
            margin-bottom: 20px;
            color: #ff7675;
        }
        h1 {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #e8e8f0;
        }
        p {
            font-size: 14px;
            color: #a2a2c2;
            line-height: 1.6;
            margin-bottom: 24px;
        }
        .footer {
            margin-top: 24px;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="logo">SLink<span>Track</span></div>
            <div class="icon">🚫</div>
            <h1>Liên kết đạt giới hạn</h1>
            <p>Liên kết này đã đạt giới hạn số lượt truy cập tối đa cho phép và hiện không còn khả dụng.</p>
            <div class="footer">Cung cấp bởi SLinkTrack</div>
        </div>
    </div>
</body>
</html>"""

def check_and_create_alerts(db: Session, link: models.Link, click_log: models.ClickLog):
    if not link.user_id:
        return
    now = datetime.utcnow()
    ten_minutes_ago = now - timedelta(minutes=10)
    thirty_minutes_ago = now - timedelta(minutes=30)
    
    # Rule 1: Click tăng đột biến (> 100 click trong 10 phút)
    clicks_10m = db.query(models.ClickLog).filter(
        models.ClickLog.link_id == link.id,
        models.ClickLog.created_at >= ten_minutes_ago
    ).count()
    if clicks_10m > 100:
        recent_alert = db.query(models.Alert).filter(
            models.Alert.link_id == link.id,
            models.Alert.type == "high_traffic",
            models.Alert.created_at >= thirty_minutes_ago
        ).first()
        if not recent_alert:
            alert = models.Alert(
                user_id=link.user_id,
                link_id=link.id,
                short_code=link.short_code,
                type="high_traffic",
                title="Traffic tăng đột biến",
                message=f"Đường dẫn '{link.short_code}' nhận được hơn 100 lượt truy cập trong 10 phút qua ({clicks_10m} lượt).",
                severity="high"
            )
            db.add(alert)
            db.commit()

    # Rule 2: Tỷ lệ bot cao (>= 20 clicks trong 10 phút, bot > 50%)
    if clicks_10m >= 20:
        bot_clicks_10m = db.query(models.ClickLog).filter(
            models.ClickLog.link_id == link.id,
            models.ClickLog.created_at >= ten_minutes_ago,
            models.ClickLog.is_bot == True
        ).count()
        if bot_clicks_10m / clicks_10m > 0.5:
            recent_alert = db.query(models.Alert).filter(
                models.Alert.link_id == link.id,
                models.Alert.type == "bot_spike",
                models.Alert.created_at >= thirty_minutes_ago
            ).first()
            if not recent_alert:
                alert = models.Alert(
                    user_id=link.user_id,
                    link_id=link.id,
                    short_code=link.short_code,
                    type="bot_spike",
                    title="Phát hiện lưu lượng truy cập Bot cao",
                    message=f"Đường dẫn '{link.short_code}' có tỷ lệ lượt truy cập từ bot vượt quá 50% trong 10 phút qua ({bot_clicks_10m}/{clicks_10m} lượt).",
                    severity="medium"
                )
                db.add(alert)
                db.commit()

    # Rule 3: Click từ quốc gia lạ
    if click_log.country and click_log.country != "Unknown":
        prior_clicks = db.query(models.ClickLog).filter(
            models.ClickLog.link_id == link.id,
            models.ClickLog.country == click_log.country,
            models.ClickLog.id != click_log.id
        ).count()
        if prior_clicks == 0:
            recent_alert = db.query(models.Alert).filter(
                models.Alert.link_id == link.id,
                models.Alert.type == "suspicious_country",
                models.Alert.message.like(f"%{click_log.country}%")
            ).first()
            if not recent_alert:
                alert = models.Alert(
                    user_id=link.user_id,
                    link_id=link.id,
                    short_code=link.short_code,
                    type="suspicious_country",
                    title="Truy cập từ quốc gia lạ",
                    message=f"Đường dẫn '{link.short_code}' nhận được lượt truy cập từ quốc gia mới: {click_log.country}.",
                    severity="low"
                )
                db.add(alert)
                db.commit()

    # Rule 4: Click từ cùng một IP quá nhiều lần (> 30 lần trong 10 phút)
    if click_log.ip_address:
        ip_clicks_10m = db.query(models.ClickLog).filter(
            models.ClickLog.link_id == link.id,
            models.ClickLog.ip_address == click_log.ip_address,
            models.ClickLog.created_at >= ten_minutes_ago
        ).count()
        if ip_clicks_10m > 30:
            recent_alert = db.query(models.Alert).filter(
                models.Alert.link_id == link.id,
                models.Alert.type == "suspicious_ip",
                models.Alert.message.like(f"%{click_log.ip_address}%"),
                models.Alert.created_at >= thirty_minutes_ago
            ).first()
            if not recent_alert:
                alert = models.Alert(
                    user_id=link.user_id,
                    link_id=link.id,
                    short_code=link.short_code,
                    type="suspicious_ip",
                    title="Spam truy cập từ một IP",
                    message=f"Đường dẫn '{link.short_code}' nhận hơn 30 click từ cùng địa chỉ IP ({click_log.ip_address}) trong 10 phút qua ({ip_clicks_10m} lượt).",
                    severity="high"
                )
                db.add(alert)
                db.commit()

def perform_tracking_and_redirect(link: models.Link, request: Request, db: Session):
    ip_address = request.client.host if request.client else "127.0.0.1"
    user_agent_string = request.headers.get("user-agent", "")
    user_agent = parse(user_agent_string)
    is_bot = getattr(user_agent, "is_bot", False)
    
    if user_agent.is_mobile:
        device_type = "Mobile (Điện thoại)"
    elif user_agent.is_tablet:
        device_type = "Tablet (Máy tính bảng)"
    else:
        device_type = "Desktop (Máy tính vuông)"

    os_name = user_agent.os.family       
    browser_name = user_agent.browser.family 

    country = "Unknown"
    city = "Unknown"
    if geoip_reader and ip_address and ip_address not in ("127.0.0.1", "::1", "localhost"):
        try:
            response = geoip_reader.city(ip_address)
            country = response.country.name or "Unknown"
            city = response.city.name or "Unknown"
        except Exception:
            pass

    referer = request.headers.get("referer", "")
    traffic_source = "Direct (Trực tiếp / Gõ URL)"
    if referer:
        referer_lower = referer.lower()
        if "facebook.com" in referer_lower or "fb.me" in referer_lower:
            traffic_source = "Facebook"
        elif "instagram.com" in referer_lower:
            traffic_source = "Instagram"
        elif "zalo" in referer_lower or "zalo.me" in referer_lower:
            traffic_source = "Zalo"
        elif "tiktok.com" in referer_lower:
            traffic_source = "TikTok"
        elif "youtube.com" in referer_lower or "youtu.be" in referer_lower:
            traffic_source = "YouTube"
        elif "twitter.com" in referer_lower or "t.co" in referer_lower or "x.com" in referer_lower:
            traffic_source = "Twitter / X"
        elif "linkedin.com" in referer_lower:
            traffic_source = "LinkedIn"
        elif "google" in referer_lower:
            traffic_source = "Google Search"
        else:
            try:
                from urllib.parse import urlparse
                domain = urlparse(referer).netloc
                if domain.startswith("www."):
                    domain = domain[4:]
                traffic_source = domain if domain else "Website khác"
            except Exception:
                traffic_source = "Website khác"

    new_log = models.ClickLog(
        link_id=link.id,
        ip_address=ip_address,
        country=country,
        city=city,
        device_type=device_type,
        os=os_name,
        browser=browser_name,
        traffic_source=traffic_source,
        referer=referer if referer else None,
        is_bot=is_bot
    )
    db.add(new_log)
    db.commit()
    
    try:
        check_and_create_alerts(db, link, new_log)
    except Exception as ae:
        print(f"Lỗi kiểm tra alert: {ae}")

    target_url = link.original_url
    if getattr(link, 'params', None):
        params = link.params.strip()
        if params.startswith("?") or params.startswith("&"):
            params = params[1:]
        if params:
            connector = "&" if "?" in target_url else "?"
            target_url = f"{target_url}{connector}{params}"

    return RedirectResponse(url=target_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

# --- API ĐIỀU HƯỚNG LINK & QUÉT ANALYTICS NGẦM ---
@app.get("/{short_code}")
@limiter.limit("60/minute")
def redirect_and_track(short_code: str, request: Request, pwd: Optional[str] = None, db: Session = Depends(get_db)):
    link = db.query(models.Link).filter(models.Link.short_code == short_code, models.Link.status == "active").first()
    if not link:
        raise HTTPException(status_code=404, detail="Đường dẫn không tồn tại hoặc đã bị tạm dừng!")

    if getattr(link, 'expired_at', None) and link.expired_at < datetime.utcnow():
        raise HTTPException(status_code=404, detail="Đường dẫn đã hết hạn.")

    if getattr(link, 'max_clicks', None) is not None:
        total_clicks = db.query(models.ClickLog).filter(models.ClickLog.link_id == link.id).count()
        if total_clicks >= link.max_clicks:
            return HTMLResponse(content=get_limit_exceeded_html(), status_code=200)

    if link.password_hash:
        password_attempt = pwd or request.headers.get("X-Link-Password")
        if not password_attempt or not utils.verify_password(password_attempt.strip(), link.password_hash):
            return HTMLResponse(content=get_password_prompt_html(short_code), status_code=200)

    return perform_tracking_and_redirect(link, request, db)

@app.post("/{short_code}")
def verify_password_and_redirect(short_code: str, request: Request, password: str = Form(...), db: Session = Depends(get_db)):
    link = db.query(models.Link).filter(models.Link.short_code == short_code, models.Link.status == "active").first()
    if not link:
        raise HTTPException(status_code=404, detail="Đường dẫn không tồn tại hoặc đã bị tạm dừng!")

    if getattr(link, 'expired_at', None) and link.expired_at < datetime.utcnow():
        raise HTTPException(status_code=404, detail="Đường dẫn đã hết hạn.")

    if getattr(link, 'max_clicks', None) is not None:
        total_clicks = db.query(models.ClickLog).filter(models.ClickLog.link_id == link.id).count()
        if total_clicks >= link.max_clicks:
            return HTMLResponse(content=get_limit_exceeded_html(), status_code=200)

    if not link.password_hash:
        return perform_tracking_and_redirect(link, request, db)

    if not utils.verify_password(password.strip(), link.password_hash):
        return HTMLResponse(content=get_password_prompt_html(short_code, error="Mật khẩu không chính xác! Vui lòng thử lại."), status_code=200)

    return perform_tracking_and_redirect(link, request, db)

# --- API LẤY THỐNG KÊ ANALYTICS CHI TIẾT CỦA MỘT LINK ---
@app.get("/api/analytics/{short_code}")
def get_link_analytics(
    short_code: str,
    period: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    workspace_id: Optional[int] = None,
    device_type: Optional[str] = None,
    exclude_bots: bool = True,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Xác định mốc thời gian lọc
    now = datetime.utcnow()
    filter_start = None
    filter_end = None
    
    if period == "today":
        filter_start = datetime(now.year, now.month, now.day)
    elif period == "7days":
        filter_start = now - timedelta(days=7)
    elif period == "30days":
        filter_start = now - timedelta(days=30)
    elif period == "custom":
        if start_date:
            try:
                filter_start = datetime.strptime(start_date, "%Y-%m-%d")
            except ValueError:
                pass
        if end_date:
            try:
                filter_end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1) - timedelta(seconds=1)
            except ValueError:
                pass

    # Phân giải danh sách link_ids
    if short_code == "all":
        if workspace_id:
            # Kiểm tra quyền xem workspace
            is_member = db.query(models.WorkspaceMember).filter(
                models.WorkspaceMember.workspace_id == workspace_id,
                models.WorkspaceMember.user_id == current_user.id
            ).first()
            if not is_member:
                raise HTTPException(status_code=403, detail="Từ chối truy cập không gian!")
            links = db.query(models.Link).filter(models.Link.workspace_id == workspace_id).all()
            
            # Lọc phân quyền nếu không phải chủ sở hữu workspace
            if is_member.role_in_workspace != "owner":
                user_memberships = db.query(models.WorkspaceMember).filter(models.WorkspaceMember.user_id == current_user.id).all()
                user_ws_ids = [m.workspace_id for m in user_memberships]
                allowed_permissions = db.query(models.LinkPermission).filter(
                    models.LinkPermission.workspace_id.in_(user_ws_ids),
                    models.LinkPermission.permission.in_(["view_analytics", "manage"])
                ).all()
                allowed_link_ids = {p.link_id for p in allowed_permissions}
                
                hidden_permissions = db.query(models.LinkPermission).filter(
                    models.LinkPermission.workspace_id.in_(user_ws_ids),
                    models.LinkPermission.permission == "hide_analytics"
                ).all()
                hidden_link_ids = {p.link_id for p in hidden_permissions}
                
                links = [l for l in links if l.id in allowed_link_ids and l.id not in hidden_link_ids]
        else:
            links = db.query(models.Link).filter(
                models.Link.user_id == current_user.id,
                models.Link.workspace_id == None
            ).all()
        link_ids = [l.id for l in links]
    else:
        link = db.query(models.Link).filter(models.Link.short_code == short_code).first()
        if not link:
            raise HTTPException(status_code=404, detail="Không tìm thấy đường dẫn để xem thống kê!")
        
        # Kiểm tra quyền xem link này
        has_access = False
        if link.workspace_id:
            # 1. Chủ sở hữu workspace
            is_ws_owner = db.query(models.WorkspaceMember).filter(
                models.WorkspaceMember.workspace_id == link.workspace_id,
                models.WorkspaceMember.user_id == current_user.id,
                models.WorkspaceMember.role_in_workspace == "owner"
            ).first()
            if is_ws_owner:
                has_access = True
            else:
                # 2. Workspace member chi tiết phân quyền
                user_memberships = db.query(models.WorkspaceMember).filter(models.WorkspaceMember.user_id == current_user.id).all()
                user_ws_ids = [m.workspace_id for m in user_memberships]
                
                permissions = db.query(models.LinkPermission).filter(
                    models.LinkPermission.link_id == link.id,
                    models.LinkPermission.workspace_id.in_(user_ws_ids)
                ).all()
                perm_values = [p.permission for p in permissions]
                
                if "manage" in perm_values or "view_analytics" in perm_values:
                    has_access = True
                elif "hide_analytics" in perm_values:
                    raise HTTPException(status_code=403, detail="Bạn không có quyền xem analytics link này")
                else:
                    raise HTTPException(status_code=403, detail="Bạn không có quyền xem analytics link này")
        else:
            if link.user_id == current_user.id:
                has_access = True
            else:
                # Share cho workspace khác
                user_memberships = db.query(models.WorkspaceMember).filter(models.WorkspaceMember.user_id == current_user.id).all()
                user_ws_ids = [m.workspace_id for m in user_memberships]
                permissions = db.query(models.LinkPermission).filter(
                    models.LinkPermission.link_id == link.id,
                    models.LinkPermission.workspace_id.in_(user_ws_ids)
                ).all()
                perm_values = [p.permission for p in permissions]
                if "manage" in perm_values or "view_analytics" in perm_values:
                    has_access = True
                else:
                    raise HTTPException(status_code=403, detail="Bạn không có quyền xem analytics link này")

        if not has_access:
            raise HTTPException(status_code=403, detail="Bạn không có quyền xem analytics link này")
            
        link_ids = [link.id]

    if not link_ids:
        return {
            "status": "success",
            "link_info": {
                "short_code": short_code,
                "name": "Tất cả link" if short_code == "all" else "",
                "original_url": ""
            },
            "summary": {
                "total_clicks": 0,
                "unique_clicks": 0,
                "peak_hour": -1,
                "click_trend": []
            },
            "charts": {
                "devices": {},
                "operating_systems": {},
                "browsers": {},
                "traffic_sources": {},
                "clicks_over_time": {},
                "top_countries": {},
                "top_cities": {}
            },
            "click_rows": [],
            "edit_history": []
        }

    # Truy vấn dữ liệu click logs
    query = db.query(models.ClickLog).filter(models.ClickLog.link_id.in_(link_ids))
    if exclude_bots:
        query = query.filter(models.ClickLog.is_bot == False)
    if filter_start:
        query = query.filter(models.ClickLog.created_at >= filter_start)
    if filter_end:
        query = query.filter(models.ClickLog.created_at <= filter_end)
    if device_type and device_type.lower() != "all":
        if device_type.lower() == "mobile":
            query = query.filter(models.ClickLog.device_type.like("%Mobile%"))
        elif device_type.lower() == "desktop":
            query = query.filter(models.ClickLog.device_type.like("%Desktop%"))
        elif device_type.lower() == "tablet":
            query = query.filter(models.ClickLog.device_type.like("%Tablet%"))
        
    click_logs = query.order_by(models.ClickLog.created_at.desc()).all()
    total_clicks = len(click_logs)

    # Thống kê phân loại và theo thời gian (clicks_over_time)
    device_stats = {}
    os_stats = {}
    browser_stats = {}
    source_stats = {}
    clicks_over_time = {}
    
    country_counts = {}
    city_counts = {}
    hour_counts = {}
    unique_ips = set()

    for click in click_logs:
        device = click.device_type or "Unknown"
        device_stats[device] = device_stats.get(device, 0) + 1
        
        os = click.os or "Unknown"
        os_stats[os] = os_stats.get(os, 0) + 1
        
        browser = click.browser or "Unknown"
        browser_stats[browser] = browser_stats.get(browser, 0) + 1
        
        source = click.traffic_source or "Direct (Trực tiếp)"
        source_stats[source] = source_stats.get(source, 0) + 1
        
        if click.created_at:
            date_str = click.created_at.strftime("%Y-%m-%d")
            clicks_over_time[date_str] = clicks_over_time.get(date_str, 0) + 1
            
            # Thống kê giờ trong ngày
            h = click.created_at.hour
            hour_counts[h] = hour_counts.get(h, 0) + 1
            
        # Thống kê Quốc gia / Thành phố / IP
        country = click.country or "Unknown"
        country_counts[country] = country_counts.get(country, 0) + 1
        
        city = click.city or "Unknown"
        city_counts[city] = city_counts.get(city, 0) + 1
        
        if click.ip_address:
            unique_ips.add(click.ip_address)

    sorted_clicks_over_time = dict(sorted(clicks_over_time.items()))
    top_countries = dict(sorted(country_counts.items(), key=lambda x: x[1], reverse=True)[:5])
    top_cities = dict(sorted(city_counts.items(), key=lambda x: x[1], reverse=True)[:5])
    unique_clicks = len(unique_ips)
    peak_hour = max(hour_counts.items(), key=lambda x: x[1])[0] if hour_counts else -1

    # Xu hướng lượt click trong 24h qua
    now_utc = datetime.utcnow()
    start_hour = (now_utc - timedelta(hours=23)).replace(minute=0, second=0, microsecond=0)
    
    trend_slots = {start_hour + timedelta(hours=i): 0 for i in range(24)}
    for click in click_logs:
        if click.created_at and click.created_at >= start_hour:
            click_hour = click.created_at.replace(minute=0, second=0, microsecond=0)
            if click_hour in trend_slots:
                trend_slots[click_hour] += 1
                
    click_trend = [
        {"hour": slot.strftime("%H:00"), "clicks": trend_slots[slot]}
        for slot in sorted(trend_slots.keys())
    ]

    click_rows = [
        {
            "timestamp": click.created_at.isoformat() if getattr(click, 'created_at', None) else None,
            "ip_address": click.ip_address,
            "country": click.country,
            "city": click.city,
            "device_type": click.device_type,
            "os": click.os,
            "browser": click.browser,
            "traffic_source": click.traffic_source,
            "referer": click.referer,
        }
        for click in click_logs[:100]
    ]

    link_name = "Tất cả link" if short_code == "all" else (link.name if 'link' in locals() and link else "")
    original_url = "" if short_code == "all" else (link.original_url if 'link' in locals() and link else "")

    # Lấy lịch sử chỉnh sửa nếu có
    edit_history_list = []
    if short_code != "all" and 'link' in locals() and link:
        histories = db.query(models.LinkEditHistory).filter(models.LinkEditHistory.link_id == link.id).order_by(models.LinkEditHistory.edited_at.desc()).all()
        for h in histories:
            editor = db.query(models.User).filter(models.User.id == h.edited_by).first()
            edit_history_list.append({
                "old_expired_at": h.old_expired_at.strftime('%d/%m/%Y %H:%M') if h.old_expired_at else "Vô thời hạn",
                "new_expired_at": h.new_expired_at.strftime('%d/%m/%Y %H:%M') if h.new_expired_at else "Vô thời hạn",
                "edited_at": h.edited_at.strftime('%d/%m/%Y %H:%M') if h.edited_at else None,
                "edited_by": editor.email if editor else "Hệ thống"
            })

    return {
        "status": "success",
        "link_info": {
            "short_code": short_code,
            "name": link_name,
            "original_url": original_url
        },
        "summary": {
            "total_clicks": total_clicks,
            "unique_clicks": unique_clicks,
            "peak_hour": peak_hour,
            "click_trend": click_trend
        },
        "charts": {
            "devices": device_stats,
            "operating_systems": os_stats,
            "browsers": browser_stats,
            "traffic_sources": source_stats,
            "clicks_over_time": sorted_clicks_over_time,
            "top_countries": top_countries,
            "top_cities": top_cities
        },
        "click_rows": click_rows,
        "edit_history": edit_history_list
    }

@app.get("/api/analytics/compare")
def compare_link_analytics(
    codes: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    code_list = [c.strip() for c in codes.split(",") if c.strip()]
    if not code_list:
        raise HTTPException(status_code=400, detail="Mã so sánh không hợp lệ.")
        
    results = []
    for code in code_list:
        link = db.query(models.Link).filter(models.Link.short_code == code).first()
        if not link:
            results.append({
                "short_code": code,
                "exists": False,
                "total_clicks": 0,
                "unique_clicks": 0
            })
            continue
            
        # Kiểm tra quyền xem thống kê link này
        if link.workspace_id:
            is_member = db.query(models.WorkspaceMember).filter(
                models.WorkspaceMember.workspace_id == link.workspace_id,
                models.WorkspaceMember.user_id == current_user.id
            ).first()
            if not is_member:
                raise HTTPException(status_code=403, detail=f"Không có quyền xem thống kê cho link /{code}")
        else:
            if link.user_id != current_user.id:
                raise HTTPException(status_code=403, detail=f"Không có quyền xem thống kê cho link /{code}")
                
        total_clicks = db.query(func.count(models.ClickLog.id)).filter(models.ClickLog.link_id == link.id).scalar() or 0
        unique_clicks = db.query(func.count(models.ClickLog.ip_address.distinct())).filter(models.ClickLog.link_id == link.id).scalar() or 0
        
        results.append({
            "short_code": code,
            "exists": True,
            "total_clicks": total_clicks,
            "unique_clicks": unique_clicks
        })
        
    return results

@app.get("/api/analytics/{short_code}/export")
def export_link_clicks(short_code: str, db: Session = Depends(get_db)):
    link = db.query(models.Link).filter(models.Link.short_code == short_code).first()
    if not link:
        raise HTTPException(status_code=404, detail="Không tìm thấy đường dẫn để xuất dữ liệu!")

    click_logs = db.query(models.ClickLog).filter(models.ClickLog.link_id == link.id).order_by(models.ClickLog.created_at.desc() if hasattr(models.ClickLog, 'created_at') else models.ClickLog.id.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Timestamp", "IP Address", "Country", "City", "Device Type", "OS", "Browser", "Traffic Source", "Referer"])
    for click in click_logs:
        writer.writerow([
            click.created_at.isoformat() if getattr(click, 'created_at', None) else "",
            click.ip_address,
            click.country,
            click.city,
            click.device_type,
            click.os,
            click.browser,
            click.traffic_source,
            click.referer,
        ])

    csv_bytes = output.getvalue().encode("utf-8")
    headers = {
        "Content-Disposition": f"attachment; filename=clicks_{short_code}.csv"
    }
    return Response(content=csv_bytes, media_type="text/csv", headers=headers)

@app.get("/api/workspaces")
def get_workspaces(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    memberships = db.query(models.WorkspaceMember).filter(models.WorkspaceMember.user_id == current_user.id).all()
    workspace_ids = [m.workspace_id for m in memberships]
    workspaces = db.query(models.Workspace).filter(models.Workspace.id.in_(workspace_ids)).all()
    
    result = []
    for ws in workspaces:
        # Tìm role của user trong workspace này
        role = next((m.role_in_workspace for m in memberships if m.workspace_id == ws.id), "viewer")
        result.append({
            "id": ws.id,
            "name": ws.name,
            "role": role,
            "created_at": ws.created_at.isoformat() if ws.created_at else None
        })
    return {"status": "success", "workspaces": result}

@app.post("/api/workspaces", status_code=status.HTTP_201_CREATED)
def create_workspace(payload: schemas.WorkspaceCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_workspace = models.Workspace(name=payload.name, created_by=current_user.id)
    db.add(new_workspace)
    db.commit()
    db.refresh(new_workspace)
    
    member_role = models.WorkspaceMember(workspace_id=new_workspace.id, user_id=current_user.id, role_in_workspace="owner")
    db.add(member_role)
    db.commit()
    return {"status": "success", "message": "Tạo Không gian làm việc thành công!", "workspace_id": new_workspace.id}

@app.post("/api/workspaces/{workspace_id}/invite")
def invite_member(workspace_id: int, payload: schemas.WorkspaceInvite, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    checker = db.query(models.WorkspaceMember).filter(models.WorkspaceMember.workspace_id == workspace_id, models.WorkspaceMember.user_id == current_user.id).first()
    if not checker or checker.role_in_workspace != "owner":
        raise HTTPException(status_code=403, detail="Mời thành viên thất bại: Bạn không có quyền quản trị nhóm!")
        
    invited_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not invited_user:
        raise HTTPException(status_code=404, detail="Mời thành viên thất bại: Không tìm thấy tài khoản người dùng với email này!")
        
    already_member = db.query(models.WorkspaceMember).filter(models.WorkspaceMember.workspace_id == workspace_id, models.WorkspaceMember.user_id == invited_user.id).first()
    if already_member:
        raise HTTPException(status_code=400, detail="Mời thành viên thất bại: Người dùng này đã tham gia nhóm!")
        
    new_member = models.WorkspaceMember(workspace_id=workspace_id, user_id=invited_user.id, role_in_workspace=payload.role_in_workspace)
    db.add(new_member)
    
    # Tạo alert mời thành viên
    alert = models.Alert(
        user_id=invited_user.id,
        link_id=None,
        short_code=None,
        type="workspace_invite",
        title="Bạn được mời vào nhóm mới",
        message=f"Người dùng {current_user.email} đã mời bạn tham gia nhóm (Workspace ID: {workspace_id}) với vai trò {payload.role_in_workspace}.",
        severity="medium"
    )
    db.add(alert)
    db.commit()
    
    create_audit_log(db, current_user.id, "invite_member", str(workspace_id), f"Mời thành viên {payload.email} vai trò {payload.role_in_workspace}")
    return {"status": "success", "message": "Mời thành viên tham gia nhóm thành công!"}

@app.get("/api/workspaces/{workspace_id}/links")
def get_workspace_links(workspace_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    is_member = db.query(models.WorkspaceMember).filter(models.WorkspaceMember.workspace_id == workspace_id, models.WorkspaceMember.user_id == current_user.id).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Từ chối truy cập không gian!")
    links = db.query(models.Link).filter(models.Link.workspace_id == workspace_id).all()
    return {"status": "success", "links": links}

@app.get("/api/workspaces/{workspace_id}/members")
def get_workspace_members(workspace_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    is_member = db.query(models.WorkspaceMember).filter(
        models.WorkspaceMember.workspace_id == workspace_id,
        models.WorkspaceMember.user_id == current_user.id
    ).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Từ chối truy cập thông tin nhóm!")
        
    members = db.query(models.WorkspaceMember, models.User).join(
        models.User, models.WorkspaceMember.user_id == models.User.id
    ).filter(models.WorkspaceMember.workspace_id == workspace_id).all()
    
    result = []
    for member, user in members:
        result.append({
            "user_id": user.id,
            "email": user.email,
            "role_in_workspace": member.role_in_workspace
        })
    return {"status": "success", "members": result}

@app.put("/api/workspaces/{workspace_id}/members/{user_id}")
def update_workspace_member_role(
    workspace_id: int,
    user_id: int,
    payload: schemas.WorkspaceMemberUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Kiểm tra xem current_user có phải là owner của không gian này không
    checker = db.query(models.WorkspaceMember).filter(
        models.WorkspaceMember.workspace_id == workspace_id,
        models.WorkspaceMember.user_id == current_user.id
    ).first()
    if not checker or checker.role_in_workspace != "owner":
        raise HTTPException(status_code=403, detail="Chỉ quản trị viên (owner) mới có quyền sửa vai trò!")

    # Tìm thành viên cần sửa
    target_member = db.query(models.WorkspaceMember).filter(
        models.WorkspaceMember.workspace_id == workspace_id,
        models.WorkspaceMember.user_id == user_id
    ).first()
    if not target_member:
        raise HTTPException(status_code=404, detail="Không tìm thấy thành viên này trong nhóm!")

    if target_member.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Bạn không thể tự sửa vai trò quản trị viên của chính mình!")

    target_member.role_in_workspace = payload.role_in_workspace
    db.commit()
    return {"status": "success", "message": "Cập nhật vai trò thành công!"}

@app.delete("/api/workspaces/{workspace_id}/members/{user_id}")
def delete_workspace_member(
    workspace_id: int,
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Kiểm tra xem current_user có phải là owner của không gian này không
    checker = db.query(models.WorkspaceMember).filter(
        models.WorkspaceMember.workspace_id == workspace_id,
        models.WorkspaceMember.user_id == current_user.id
    ).first()
    if not checker or checker.role_in_workspace != "owner":
        raise HTTPException(status_code=403, detail="Xóa người dùng thất bại: Bạn không có quyền quản trị!")

    # Tìm thành viên cần xóa
    target_member = db.query(models.WorkspaceMember).filter(
        models.WorkspaceMember.workspace_id == workspace_id,
        models.WorkspaceMember.user_id == user_id
    ).first()
    if not target_member:
        raise HTTPException(status_code=404, detail="Xóa người dùng thất bại: Không tìm thấy thành viên trong nhóm!")

    if target_member.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Xóa người dùng thất bại: Bạn không thể tự xóa bản thân khỏi nhóm!")

    db.delete(target_member)
    db.commit()
    return {"status": "success", "message": "Xóa người dùng khỏi nhóm thành công!"}

@app.get("/api/all-links")
def get_all_links(workspace_id: Optional[int] = None, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if workspace_id:
        is_member = db.query(models.WorkspaceMember).filter(
            models.WorkspaceMember.workspace_id == workspace_id,
            models.WorkspaceMember.user_id == current_user.id
        ).first()
        if not is_member:
            raise HTTPException(status_code=403, detail="Từ chối truy cập không gian!")
        links = db.query(models.Link).filter(models.Link.workspace_id == workspace_id).order_by(models.Link.id.desc()).all()
    else:
        links = db.query(models.Link).filter(
            models.Link.user_id == current_user.id,
            models.Link.workspace_id == None
        ).order_by(models.Link.id.desc()).all()

    result = []
    for link in links:
        # Tính toán trạng thái hết hạn thực tế
        computed_status = link.status
        if link.status == "active" and link.expired_at and link.expired_at < datetime.utcnow():
            computed_status = "expired"

        domain_name = None
        if link.domain_id:
            domain_obj = db.query(models.Domain).filter(models.Domain.id == link.domain_id).first()
            if domain_obj:
                domain_name = domain_obj.domain_name

        click_count = db.query(models.ClickLog).filter(models.ClickLog.link_id == link.id).count()
        remaining_clicks = (link.max_clicks - click_count) if getattr(link, 'max_clicks', None) is not None else None
        
        result.append({
          "short_code": link.short_code,
          "name": link.name,
          "original_url": link.original_url,
          "status": computed_status,
          "expired_at": link.expired_at.isoformat() if getattr(link, 'expired_at', None) else None,
          "clicks": click_count,
          "date": link.created_at.strftime('%d/%m/%Y') if hasattr(link, 'created_at') and link.created_at else "12/06/2026",
          "domain": domain_name,
          "max_clicks": link.max_clicks,
          "remaining_clicks": remaining_clicks,
          "is_click_limited": getattr(link, 'max_clicks', None) is not None,
          "utm_source": getattr(link, 'utm_source', None),
          "utm_medium": getattr(link, 'utm_medium', None),
          "utm_campaign": getattr(link, 'utm_campaign', None),
          "utm_content": getattr(link, 'utm_content', None),
          "utm_term": getattr(link, 'utm_term', None)
        })
    return result

@app.patch("/api/links/{short_code}")
def update_link(short_code: str, payload: schemas.LinkUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    link = db.query(models.Link).filter(models.Link.short_code == short_code).first()
    if not link:
        raise HTTPException(status_code=404, detail="Không tìm thấy link để cập nhật!")

    # Tính toán trạng thái thực tế hiện tại
    is_expired = link.status == "active" and link.expired_at and link.expired_at < datetime.utcnow()
    if is_expired or link.status == "expired":
        raise HTTPException(status_code=400, detail="Không được sửa liên kết đã kết thúc!")

    # Nếu link đang chạy, chỉ cho phép chỉnh sửa thời gian kết thúc link
    if link.status == "active":
        if payload.name is not None and payload.name.strip() != (link.name or ""):
            raise HTTPException(status_code=400, detail="Đối với liên kết đang hoạt động, chỉ được phép sửa thời gian kết thúc link!")
        if payload.status is not None and payload.status != link.status:
            raise HTTPException(status_code=400, detail="Đối với liên kết đang hoạt động, chỉ được phép sửa thời gian kết thúc link!")

        if payload.expired_at is not None:
            # Thời gian kết thúc phải lớn hơn ngày sửa (ngày hiện tại)
            if payload.expired_at < datetime.utcnow():
                raise HTTPException(status_code=400, detail="Thời gian kết thúc không được nhỏ hơn ngày hiện tại!")

            # Lưu lại lịch sử chỉnh sửa
            history = models.LinkEditHistory(
                link_id=link.id,
                old_expired_at=link.expired_at,
                new_expired_at=payload.expired_at,
                edited_by=current_user.id
            )
            db.add(history)
            link.expired_at = payload.expired_at

    # Đối với link đang dừng (paused), cho phép kích hoạt lại hoặc sửa expired_at
    elif link.status == "paused":
        if payload.name is not None:
            link.name = payload.name.strip() or link.name
        if payload.status is not None:
            if payload.status not in ("active", "paused"):
                raise HTTPException(status_code=400, detail="Trạng thái không hợp lệ.")
            link.status = payload.status
        if payload.expired_at is not None:
            link.expired_at = payload.expired_at

    db.commit()
    db.refresh(link)
    alert = models.Alert(
        user_id=current_user.id,
        link_id=link.id,
        short_code=short_code,
        type="link_updated",
        title="Liên kết được cập nhật",
        message=f"Đường dẫn '{short_code}' đã được cập nhật thông tin thành công.",
        severity="low"
    )
    db.add(alert)
    db.commit()
    create_audit_log(db, current_user.id, "update_link", short_code, "Cập nhật thông tin link (expired_at, status, name)")
    return {
        "status": "success",
        "message": "Cập nhật liên kết thành công!",
        "link_info": {
            "short_code": link.short_code,
            "name": link.name,
            "status": link.status,
            "expired_at": link.expired_at.isoformat() if getattr(link, 'expired_at', None) else None,
        }
    }

@app.put("/api/links/{short_code}/toggle")
def toggle_link_status(short_code: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    link = db.query(models.Link).filter(models.Link.short_code == short_code).first()
    if not link:
        raise HTTPException(status_code=404, detail="Không tìm thấy liên kết!")

    is_expired = link.status == "active" and link.expired_at and link.expired_at < datetime.utcnow()
    if is_expired or link.status == "expired":
        raise HTTPException(status_code=400, detail="Không thể thay đổi trạng thái của liên kết đã kết thúc chiến dịch!")

    if link.status == "active":
        link.status = "paused"
        message = "Đã tạm dừng liên kết!"
    else:
        # Nếu đang kích hoạt lại, đảm bảo ngày hết hạn (nếu có) phải ở tương lai
        if link.expired_at and link.expired_at < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Vui lòng cập nhật lại ngày hết hạn trước khi kích hoạt!")
        link.status = "active"
        message = "Đã kích hoạt liên kết hoạt động!"

    db.commit()
    alert = models.Alert(
        user_id=current_user.id,
        link_id=link.id,
        short_code=short_code,
        type="link_updated",
        title="Trạng thái liên kết thay đổi",
        message=f"Đường dẫn '{short_code}' đã chuyển sang trạng thái: {link.status}.",
        severity="medium" if link.status == "paused" else "low"
    )
    db.add(alert)
    db.commit()
    create_audit_log(db, current_user.id, "update_link", short_code, f"Chuyển trạng thái link sang {link.status}")
    return {"status": "success", "message": message, "new_status": link.status}

@app.delete("/api/links/{short_code}")
def delete_link(short_code: str, force: bool = False, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    link = db.query(models.Link).filter(models.Link.short_code == short_code).first()
    if not link:
        raise HTTPException(status_code=404, detail="Không tìm thấy liên kết cần xóa!")

    # Quyền xóa tương tự
    if link.workspace_id:
        is_member = db.query(models.WorkspaceMember).filter(
            models.WorkspaceMember.workspace_id == link.workspace_id,
            models.WorkspaceMember.user_id == current_user.id
        ).first()
        if not is_member:
            raise HTTPException(status_code=403, detail="Từ chối truy cập xóa liên kết này!")
    else:
        if link.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Từ chối truy cập xóa liên kết này!")

    # Tính toán xem link có đang chạy không
    is_expired = link.status == "active" and link.expired_at and link.expired_at < datetime.utcnow()
    
    # Nếu link đang chạy (status == active và chưa hết hạn)
    if link.status == "active" and not is_expired:
        if not force:
            raise HTTPException(status_code=400, detail="Link này đang chạy. Hãy kết thúc chiến dịch trước khi xóa!")

    # Xóa
    db.query(models.ClickLog).filter(models.ClickLog.link_id == link.id).delete()
    db.query(models.LinkEditHistory).filter(models.LinkEditHistory.link_id == link.id).delete()
    db.query(models.LinkPermission).filter(models.LinkPermission.link_id == link.id).delete()
    db.query(models.Alert).filter(models.Alert.link_id == link.id).delete()
    db.delete(link)
    
    alert = models.Alert(
        user_id=current_user.id,
        link_id=None,
        short_code=short_code,
        type="link_updated",
        title="Liên kết đã bị xóa",
        message=f"Đường dẫn rút gọn '{short_code}' đã bị xóa khỏi hệ thống.",
        severity="medium"
    )
    db.add(alert)
    db.commit()
    create_audit_log(db, current_user.id, "update_link", short_code, f"Xóa link (alias: {short_code})")
    return {"status": "success", "message": "Xóa liên kết rút gọn thành công!"}

# --- API QUÉT CẢNH BÁO TRAFFIC BẤT THƯỜNG (ANOMALY DETECTION - Fix ATTRIBUTE) ---
@app.get("/api/system/alerts")
def get_system_alerts(db: Session = Depends(get_db)):
    five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
    
    # Tự động dò tìm cột thời gian thực tế trong database
    time_column = models.ClickLog.id
    if hasattr(models.ClickLog, 'clicked_at'):
        time_column = models.ClickLog.clicked_at
    elif hasattr(models.ClickLog, 'created_at'):
        time_column = models.ClickLog.created_at

    high_traffic_links = db.query(
        models.ClickLog.link_id, func.count(models.ClickLog.id).label("click_count")
    ).filter(time_column >= five_minutes_ago).group_by(models.ClickLog.link_id).all()
    
    alerts = []
    for item in high_traffic_links:
        if item.click_count > 30:
            link_info = db.query(models.Link).filter(models.Link.id == item.link_id).first()
            if link_info:
                alerts.append({
                    "type": "High Traffic",
                    "short_code": link_info.short_code,
                    "message": f"Đường dẫn /{link_info.short_code} nhận {item.click_count} click trong 5 phút."
                })
    return {"status": "success", "alerts": alerts}

# --- API THỐNG KÊ TỔNG QUAN DASHBOARD VỚI BỘ LỌC ---
@app.get("/api/dashboard/analytics")
def get_dashboard_analytics(
    link_id: Optional[int] = None,
    range_type: str = "all", # today, month, year, custom
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    device_type: Optional[str] = None,
    exclude_bots: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(models.ClickLog)
    if exclude_bots:
        query = query.filter(models.ClickLog.is_bot == False)
    
    if link_id:
        query = query.filter(models.ClickLog.link_id == link_id)
        
    now = datetime.utcnow()
    if range_type == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(models.ClickLog.created_at >= start)
    elif range_type == "month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(models.ClickLog.created_at >= start)
    elif range_type == "year":
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(models.ClickLog.created_at >= start)
    elif range_type == "custom" and start_date and end_date:
        try:
            start = datetime.fromisoformat(start_date)
            end = datetime.fromisoformat(end_date) + timedelta(days=1)
            query = query.filter(models.ClickLog.created_at >= start, models.ClickLog.created_at < end)
        except ValueError:
            raise HTTPException(status_code=400, detail="Định dạng ngày không hợp lệ")

    if device_type and device_type.lower() != "all":
        if device_type.lower() == "mobile":
            query = query.filter(models.ClickLog.device_type.like("%Mobile%"))
        elif device_type.lower() == "desktop":
            query = query.filter(models.ClickLog.device_type.like("%Desktop%"))
        elif device_type.lower() == "tablet":
            query = query.filter(models.ClickLog.device_type.like("%Tablet%"))

    total_clicks = query.count()
    
    # Thống kê unique clicks sử dụng DISTINCT IP
    unique_clicks = db.query(func.count(models.ClickLog.ip_address.distinct())) \
                      .filter(models.ClickLog.id.in_(query.with_entities(models.ClickLog.id))) \
                      .scalar() or 0

    # Thống kê top 5 quốc gia
    country_query = db.query(models.ClickLog.country, func.count(models.ClickLog.id).label('clicks')) \
                      .filter(models.ClickLog.id.in_(query.with_entities(models.ClickLog.id))) \
                      .group_by(models.ClickLog.country) \
                      .order_by(text('clicks DESC')) \
                      .limit(5).all()
    top_countries = {item.country or "Unknown": item.clicks for item in country_query}
    
    # Thống kê theo ngày để vẽ biểu đồ xu hướng
    trend_stats = db.query(
        func.strftime('%Y-%m-%d', models.ClickLog.created_at).label('day'),
        func.count(models.ClickLog.id).label('count')
    ).filter(models.ClickLog.id.in_(query.with_entities(models.ClickLog.id))) \
     .group_by('day').order_by('day').all()

    return {
        "status": "success",
        "total_clicks": total_clicks,
        "unique_clicks": unique_clicks,
        "top_countries": top_countries,
        "trend": [{"date": item.day, "clicks": item.count} for item in trend_stats]
    }

# --- SYSTEM ADMIN API ENDPOINTS ---

def check_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Quyền truy cập bị từ chối! Chỉ dành cho Admin hệ thống.")
    return current_user

@app.get("/api/admin/users")
def admin_get_users(current_user: models.User = Depends(check_admin), db: Session = Depends(get_db)):
    users = db.query(models.User).order_by(models.User.id.desc()).all()
    result = []
    for user in users:
        link_count = db.query(models.Link).filter(models.Link.user_id == user.id).count()
        workspace_count = db.query(models.WorkspaceMember).filter(models.WorkspaceMember.user_id == user.id).count()
        result.append({
            "id": user.id,
            "email": user.email,
            "username": getattr(user, 'username', 'N/A'),
            "role": user.role,
            "created_at": user.created_at.strftime('%d/%m/%Y %H:%M') if user.created_at else None,
            "link_count": link_count,
            "workspace_count": workspace_count
        })
    return {"status": "success", "users": result}

@app.get("/api/admin/links")
def admin_get_links(current_user: models.User = Depends(check_admin), db: Session = Depends(get_db)):
    links = db.query(models.Link).order_by(models.Link.id.desc()).all()
    result = []
    for link in links:
        computed_status = link.status
        if link.status == "active" and link.expired_at and link.expired_at < datetime.utcnow():
            computed_status = "expired"

        owner = db.query(models.User).filter(models.User.id == link.user_id).first()
        owner_email = owner.email if owner else "System / Anonymous"

        click_count = db.query(models.ClickLog).filter(models.ClickLog.link_id == link.id).count()
        result.append({
            "id": link.id,
            "short_code": link.short_code,
            "name": link.name,
            "original_url": link.original_url,
            "status": computed_status,
            "clicks": click_count,
            "owner_email": owner_email,
            "created_at": link.created_at.strftime('%d/%m/%Y %H:%M') if link.created_at else None
        })
    return {"status": "success", "links": result}

@app.get("/api/admin/workspaces")
def admin_get_workspaces(current_user: models.User = Depends(check_admin), db: Session = Depends(get_db)):
    workspaces = db.query(models.Workspace).order_by(models.Workspace.id.desc()).all()
    result = []
    for ws in workspaces:
        owner = db.query(models.User).filter(models.User.id == ws.created_by).first()
        owner_email = owner.email if owner else "System / Anonymous"
        
        member_count = db.query(models.WorkspaceMember).filter(models.WorkspaceMember.workspace_id == ws.id).count()
        link_count = db.query(models.Link).filter(models.Link.workspace_id == ws.id).count()
        result.append({
            "id": ws.id,
            "name": ws.name,
            "owner_email": owner_email,
            "member_count": member_count,
            "link_count": link_count,
            "created_at": ws.created_at.strftime('%d/%m/%Y %H:%M') if ws.created_at else None
        })
    return {"status": "success", "workspaces": result}

# --- ADMIN CRUD - USERS ---

@app.post("/api/admin/users")
def admin_create_user(payload: schemas.AdminUserCreate, current_user: models.User = Depends(check_admin), db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email này đã được sử dụng!")
    
    hashed_pwd = utils.hash_password(payload.password)
    new_user = models.User(email=payload.email, password_hash=hashed_pwd, role=payload.role)
    if payload.username and hasattr(models.User, 'username'):
        setattr(new_user, 'username', payload.username)
        
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"status": "success", "message": "Tạo người dùng thành công!"}

@app.put("/api/admin/users/{user_id}")
def admin_update_user(user_id: int, payload: schemas.AdminUserUpdate, current_user: models.User = Depends(check_admin), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng!")
    
    if payload.username and hasattr(models.User, 'username'):
        setattr(user, 'username', payload.username)
    if payload.role:
        user.role = payload.role
    if payload.password:
        user.password_hash = utils.hash_password(payload.password)
        
    db.commit()
    return {"status": "success", "message": "Cập nhật người dùng thành công!"}

@app.delete("/api/admin/users/{user_id}")
def admin_delete_user(user_id: int, current_user: models.User = Depends(check_admin), db: Session = Depends(get_db)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Bạn không thể tự xóa tài khoản của chính mình!")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng!")
        
    db.query(models.WorkspaceMember).filter(models.WorkspaceMember.user_id == user_id).delete()
    db.query(models.Link).filter(models.Link.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {"status": "success", "message": "Xóa người dùng thành công!"}

# --- ADMIN CRUD - LINKS ---

@app.post("/api/admin/links")
def admin_create_link(payload: schemas.AdminLinkCreate, current_user: models.User = Depends(check_admin), db: Session = Depends(get_db)):
    owner_id = current_user.id
    if payload.owner_email:
        owner = db.query(models.User).filter(models.User.email == payload.owner_email).first()
        if not owner:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng sở hữu link!")
        owner_id = owner.id
        
    if payload.alias:
        existing = db.query(models.Link).filter(models.Link.short_code == payload.alias).first()
        if existing:
            raise HTTPException(status_code=400, detail="Alias đã tồn tại!")
        short_code = payload.alias
    else:
        while True:
            short_code = utils.generate_short_code()
            existing = db.query(models.Link).filter(models.Link.short_code == short_code).first()
            if not existing:
                break
                
    new_link = models.Link(
        original_url=payload.url,
        short_code=short_code,
        name=payload.name,
        user_id=owner_id,
        expired_at=payload.expired_at,
        status="active"
    )
    db.add(new_link)
    db.commit()
    return {"status": "success", "message": "Tạo liên kết thành công!"}

@app.put("/api/admin/links/{link_id}")
def admin_update_link(link_id: int, payload: schemas.AdminLinkUpdate, current_user: models.User = Depends(check_admin), db: Session = Depends(get_db)):
    link = db.query(models.Link).filter(models.Link.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Không tìm thấy liên kết!")
        
    if payload.short_code:
        if payload.short_code != link.short_code:
            existing = db.query(models.Link).filter(models.Link.short_code == payload.short_code).first()
            if existing:
                raise HTTPException(status_code=400, detail="Alias này đã được sử dụng!")
        link.short_code = payload.short_code
        
    if payload.name is not None:
        link.name = payload.name
    if payload.original_url:
        link.original_url = payload.original_url
    if payload.status:
        link.status = payload.status
    if payload.expired_at is not None:
        link.expired_at = payload.expired_at
        
    db.commit()
    return {"status": "success", "message": "Cập nhật liên kết thành công!"}

@app.delete("/api/admin/links/{link_id}")
def admin_delete_link(link_id: int, current_user: models.User = Depends(check_admin), db: Session = Depends(get_db)):
    link = db.query(models.Link).filter(models.Link.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Không tìm thấy liên kết!")
        
    db.query(models.ClickLog).filter(models.ClickLog.link_id == link_id).delete()
    db.query(models.LinkEditHistory).filter(models.LinkEditHistory.link_id == link_id).delete()
    db.delete(link)
    db.commit()
    return {"status": "success", "message": "Xóa liên kết thành công!"}

# --- ADMIN CRUD - WORKSPACES ---

@app.post("/api/admin/workspaces")
def admin_create_workspace(payload: schemas.AdminWorkspaceCreate, current_user: models.User = Depends(check_admin), db: Session = Depends(get_db)):
    owner = db.query(models.User).filter(models.User.email == payload.owner_email).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Không tìm thấy chủ sở hữu nhóm!")
        
    new_ws = models.Workspace(name=payload.name, created_by=owner.id)
    db.add(new_ws)
    db.commit()
    db.refresh(new_ws)
    
    ws_member = models.WorkspaceMember(workspace_id=new_ws.id, user_id=owner.id, role_in_workspace="owner")
    db.add(ws_member)
    db.commit()
    return {"status": "success", "message": "Tạo nhóm thành công!"}

@app.put("/api/admin/workspaces/{workspace_id}")
def admin_update_workspace(workspace_id: int, payload: schemas.AdminWorkspaceUpdate, current_user: models.User = Depends(check_admin), db: Session = Depends(get_db)):
    ws = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhóm!")
        
    ws.name = payload.name
    db.commit()
    return {"status": "success", "message": "Cập nhật nhóm thành công!"}

@app.delete("/api/admin/workspaces/{workspace_id}")
def admin_delete_workspace(workspace_id: int, current_user: models.User = Depends(check_admin), db: Session = Depends(get_db)):
    ws = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhóm!")
        
    db.query(models.WorkspaceMember).filter(models.WorkspaceMember.workspace_id == workspace_id).delete()
    db.query(models.Link).filter(models.Link.workspace_id == workspace_id).delete()
    db.delete(ws)
    db.commit()
    return {"status": "success", "message": "Xóa nhóm thành công!"}

# --- THÊM CÁC ENDPOINT MỚI ---

@app.post("/api/links/{short_code}/permissions")
def create_link_permission(
    short_code: str,
    payload: schemas.LinkPermissionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    link = db.query(models.Link).filter(models.Link.short_code == short_code).first()
    if not link:
        raise HTTPException(status_code=404, detail="Không tìm thấy link!")
        
    if link.workspace_id:
        is_owner = db.query(models.WorkspaceMember).filter(
            models.WorkspaceMember.workspace_id == link.workspace_id,
            models.WorkspaceMember.user_id == current_user.id,
            models.WorkspaceMember.role_in_workspace == "owner"
        ).first()
        if not is_owner:
            raise HTTPException(status_code=403, detail="Chỉ owner của workspace mới có quyền phân quyền link này!")
    else:
        if link.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Chỉ chủ sở hữu link mới có quyền phân quyền!")
            
    target_ws = db.query(models.Workspace).filter(models.Workspace.id == payload.workspace_id).first()
    if not target_ws:
        raise HTTPException(status_code=404, detail="Không tìm thấy workspace mục tiêu!")
        
    existing = db.query(models.LinkPermission).filter(
        models.LinkPermission.link_id == link.id,
        models.LinkPermission.workspace_id == payload.workspace_id
    ).first()
    if existing:
        existing.permission = payload.permission
        
        # Alert thay đổi quyền
        alert = models.Alert(
            user_id=current_user.id,
            link_id=link.id,
            short_code=short_code,
            type="permission_changed",
            title="Quyền truy cập thay đổi",
            message=f"Đã cập nhật quyền của nhóm '{target_ws.name}' đối với link '{short_code}' thành '{payload.permission}'.",
            severity="medium"
        )
        db.add(alert)
        db.commit()
        db.refresh(existing)
        create_audit_log(db, current_user.id, "update_permission", short_code, f"Cập nhật quyền cho nhóm {target_ws.name} thành {payload.permission}")
        return {"status": "success", "message": "Cập nhật quyền thành công!"}
        
    new_perm = models.LinkPermission(
        link_id=link.id,
        workspace_id=payload.workspace_id,
        permission=payload.permission
    )
    db.add(new_perm)
    
    # Alert gán quyền mới
    alert = models.Alert(
        user_id=current_user.id,
        link_id=link.id,
        short_code=short_code,
        type="permission_changed",
        title="Gán quyền truy cập mới",
        message=f"Đã gán quyền cho nhóm '{target_ws.name}' đối với link '{short_code}' là '{payload.permission}'.",
        severity="medium"
    )
    db.add(alert)
    db.commit()
    create_audit_log(db, current_user.id, "update_permission", short_code, f"Gán quyền cho nhóm {target_ws.name}: {payload.permission}")
    return {"status": "success", "message": "Gán quyền thành công!"}

@app.get("/api/links/{short_code}/permissions")
def get_link_permissions(
    short_code: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    link = db.query(models.Link).filter(models.Link.short_code == short_code).first()
    if not link:
        raise HTTPException(status_code=404, detail="Không tìm thấy link!")
        
    if link.workspace_id:
        is_member = db.query(models.WorkspaceMember).filter(
            models.WorkspaceMember.workspace_id == link.workspace_id,
            models.WorkspaceMember.user_id == current_user.id
        ).first()
        if not is_member:
            raise HTTPException(status_code=403, detail="Từ chối truy cập thông tin quyền!")
    else:
        if link.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Từ chối truy cập thông tin quyền!")
            
    permissions = db.query(models.LinkPermission).filter(models.LinkPermission.link_id == link.id).all()
    result = []
    for perm in permissions:
        ws = db.query(models.Workspace).filter(models.Workspace.id == perm.workspace_id).first()
        result.append({
            "id": perm.id,
            "workspace_id": perm.workspace_id,
            "workspace_name": ws.name if ws else "Nhóm đã bị xóa",
            "permission": perm.permission
        })
    return {"status": "success", "permissions": result}

@app.delete("/api/links/{short_code}/permissions/{id}")
def delete_link_permission(
    short_code: str,
    id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    link = db.query(models.Link).filter(models.Link.short_code == short_code).first()
    if not link:
        raise HTTPException(status_code=404, detail="Không tìm thấy link!")
        
    if link.workspace_id:
        is_owner = db.query(models.WorkspaceMember).filter(
            models.WorkspaceMember.workspace_id == link.workspace_id,
            models.WorkspaceMember.user_id == current_user.id,
            models.WorkspaceMember.role_in_workspace == "owner"
        ).first()
        if not is_owner:
            raise HTTPException(status_code=403, detail="Chỉ owner của workspace mới có quyền quản lý!")
    else:
        if link.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Chỉ chủ sở hữu link mới có quyền quản lý!")
            
    perm = db.query(models.LinkPermission).filter(models.LinkPermission.id == id, models.LinkPermission.link_id == link.id).first()
    if not perm:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi phân quyền!")
        
    ws = db.query(models.Workspace).filter(models.Workspace.id == perm.workspace_id).first()
    ws_name = ws.name if ws else f"ID {perm.workspace_id}"
    db.delete(perm)
    
    # Alert xóa quyền
    alert = models.Alert(
        user_id=current_user.id,
        link_id=link.id,
        short_code=short_code,
        type="permission_changed",
        title="Quyền truy cập bị xóa",
        message=f"Đã xóa quyền của nhóm '{ws_name}' đối với link '{short_code}'.",
        severity="medium"
    )
    db.add(alert)
    db.commit()
    create_audit_log(db, current_user.id, "update_permission", short_code, f"Xóa quyền của nhóm {ws_name}")
    return {"status": "success", "message": "Xóa quyền thành công!"}

@app.get("/api/links/{short_code}/check-password")
def check_link_password_requirement(short_code: str, db: Session = Depends(get_db)):
    link = db.query(models.Link).filter(models.Link.short_code == short_code, models.Link.status == "active").first()
    if not link:
        raise HTTPException(status_code=404, detail="Đường dẫn không tồn tại hoặc đã bị tạm dừng!")
    return {
        "status": "success",
        "has_password": link.password_hash is not None
    }

@app.post("/api/links/{short_code}/verify-password")
def verify_link_password(
    short_code: str,
    payload: schemas.LinkPasswordVerify,
    db: Session = Depends(get_db)
):
    link = db.query(models.Link).filter(models.Link.short_code == short_code, models.Link.status == "active").first()
    if not link:
        raise HTTPException(status_code=404, detail="Đường dẫn không tồn tại hoặc đã bị tạm dừng!")
    
    if not link.password_hash:
        return {"status": "success", "valid": True}
        
    valid = utils.verify_password(payload.password.strip(), link.password_hash)
    return {"status": "success", "valid": valid}

@app.get("/api/workspaces/{workspace_id}/domains")
def get_workspace_domains(
    workspace_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    is_member = db.query(models.WorkspaceMember).filter(
        models.WorkspaceMember.workspace_id == workspace_id,
        models.WorkspaceMember.user_id == current_user.id
    ).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Từ chối truy cập không gian!")
        
    domains = db.query(models.Domain).filter(
        or_(models.Domain.workspace_id == workspace_id, models.Domain.workspace_id == None)
    ).all()
    return {"status": "success", "domains": domains}

@app.get("/api/audit-logs")
def get_audit_logs(
    limit: int = 50,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = db.query(models.AuditLog).filter(models.AuditLog.user_id == current_user.id).order_by(models.AuditLog.created_at.desc()).limit(limit).all()
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "action": log.action,
            "target": log.target,
            "detail": log.detail,
            "created_at": log.created_at.isoformat() if log.created_at else None
        })
    return {"status": "success", "audit_logs": result}

# --- API QUẢN LÝ THÔNG BÁO (NOTIFICATION CENTER) ---

@app.get("/api/notifications")
def get_notifications(
    limit: int = 50,
    unread_only: bool = False,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Tự động quét và tạo alert cho các link sắp hết hạn trong 24 giờ
    now = datetime.utcnow()
    one_day_later = now + timedelta(hours=24)
    expiring_links = db.query(models.Link).filter(
        models.Link.user_id == current_user.id,
        models.Link.expired_at > now,
        models.Link.expired_at <= one_day_later
    ).all()
    
    for link in expiring_links:
        one_day_ago = now - timedelta(hours=24)
        recent_alert = db.query(models.Alert).filter(
            models.Alert.user_id == current_user.id,
            models.Alert.link_id == link.id,
            models.Alert.type == "link_expiring",
            models.Alert.created_at >= one_day_ago
        ).first()
        
        if not recent_alert:
            alert = models.Alert(
                user_id=current_user.id,
                link_id=link.id,
                short_code=link.short_code,
                type="link_expiring",
                title="Link sắp hết hạn",
                message=f"Đường dẫn '{link.short_code}' sẽ hết hạn vào lúc {link.expired_at.strftime('%d/%m/%Y %H:%M:%S')}.",
                severity="medium"
            )
            db.add(alert)
            db.commit()

    query = db.query(models.Alert).filter(models.Alert.user_id == current_user.id)
    if unread_only:
        query = query.filter(models.Alert.is_read == False)
        
    alerts = query.order_by(models.Alert.id.desc()).limit(limit).all()
    return [
        {
            "id": a.id,
            "type": a.type,
            "title": a.title,
            "message": a.message,
            "severity": a.severity,
            "is_read": a.is_read,
            "created_at": a.created_at.isoformat(),
            "short_code": a.short_code
        }
        for a in alerts
    ]

@app.post("/api/notifications/{id}/read")
def mark_notification_as_read(
    id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(models.Alert).filter(models.Alert.id == id, models.Alert.user_id == current_user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông báo.")
        
    alert.is_read = True
    db.commit()
    return {"status": "success", "message": "Đã đánh dấu đã đọc."}

@app.post("/api/notifications/read-all")
def mark_all_notifications_as_read(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(models.Alert).filter(
        models.Alert.user_id == current_user.id,
        models.Alert.is_read == False
    ).update({models.Alert.is_read: True}, synchronize_session=False)
    db.commit()
    return {"status": "success", "message": "Đã đánh dấu tất cả thông báo là đã đọc."}

@app.get("/api/notifications/unread-count")
def get_unread_notifications_count(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    one_day_later = now + timedelta(hours=24)
    expiring_links = db.query(models.Link).filter(
        models.Link.user_id == current_user.id,
        models.Link.expired_at > now,
        models.Link.expired_at <= one_day_later
    ).all()
    
    has_new = False
    for link in expiring_links:
        one_day_ago = now - timedelta(hours=24)
        recent_alert = db.query(models.Alert).filter(
            models.Alert.user_id == current_user.id,
            models.Alert.link_id == link.id,
            models.Alert.type == "link_expiring",
            models.Alert.created_at >= one_day_ago
        ).first()
        
        if not recent_alert:
            alert = models.Alert(
                user_id=current_user.id,
                link_id=link.id,
                short_code=link.short_code,
                type="link_expiring",
                title="Link sắp hết hạn",
                message=f"Đường dẫn '{link.short_code}' sẽ hết hạn vào lúc {link.expired_at.strftime('%d/%m/%Y %H:%M:%S')}.",
                severity="medium"
            )
            db.add(alert)
            has_new = True
            
    if has_new:
        db.commit()

    unread_count = db.query(models.Alert).filter(
        models.Alert.user_id == current_user.id,
        models.Alert.is_read == False
    ).count()
    return {"unread": unread_count}