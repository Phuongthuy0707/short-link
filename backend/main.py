from fastapi import FastAPI, Depends, HTTPException, status, Form, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, RedirectResponse
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

import models, schemas, utils
from database import engine, get_db

# Tự động khởi tạo cấu trúc bảng trong cơ sở dữ liệu SQLite nếu chưa có
models.Base.metadata.create_all(bind=engine)
for alter_sql in [
    "ALTER TABLE links ADD COLUMN params TEXT",
    "ALTER TABLE links ADD COLUMN name TEXT"
]:
    try:
        with engine.connect() as conn:
            conn.execute(text(alter_sql))
    except OperationalError:
        pass

app = FastAPI(title="Hệ thống Shortlink & Analytics nâng cao")

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
    # Kiểm tra an toàn: Nếu bảng User có trường username thì lọc theo username, ngược lại lọc theo email
    if hasattr(models.User, 'username'):
        existing_username = db.query(models.User).filter(models.User.username == payload.username).first()
        if existing_username:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tên tài khoản này đã được đăng ký sử dụng!")
    
    existing_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email này đã được đăng ký sử dụng!")
    
    hashed_pwd = utils.hash_password(payload.password)
    
    # Khởi tạo đối tượng User linh hoạt theo cấu trúc DB
    new_user = models.User(email=payload.email, password_hash=hashed_pwd)
    if hasattr(models.User, 'username'):
        setattr(new_user, 'username', payload.username)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"status": "success", "message": "Đăng ký tài khoản thành công!", "user_id": new_user.id}

# --- API ĐĂNG NHẬP (Fix ATTRIBUTE) ---
@app.post("/api/auth/token")
def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    # Tìm kiếm linh hoạt: nếu model có `username` thì dò cả `username` hoặc `email`.
    # Nếu model không có `username`, dò theo `email`.
    if hasattr(models.User, 'username'):
        user = db.query(models.User).filter(or_(models.User.username == username, models.User.email == username)).first()
    else:
        user = db.query(models.User).filter(models.User.email == username).first()
        
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
        "token_type": "bearer"
    }


@app.post("/api/auth/forgot")
def forgot_password(payload: schemas.ForgotPassword, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        return {"status": "success", "message": "Nếu tài khoản tồn tại, mã OTP đặt lại mật khẩu đã được gửi."}

    # Sinh mã OTP gồm 6 chữ số ngẫu nhiên
    import random
    otp = f"{random.randint(100000, 999999)}"
    
    # Lưu OTP và thời gian hết hạn (5 phút) vào DB
    user.reset_otp = otp
    user.reset_otp_expires_at = datetime.utcnow() + timedelta(minutes=5)
    db.commit()

    email_sent = True
    error_msg = ""
    try:
        email_body = (
            f"Xin chào,\n\n"
            f"Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản này.\n"
            f"Mã OTP xác thực đặt lại mật khẩu của bạn là:\n\n"
            f"          {otp}\n\n"
            f"Mã OTP này có hiệu lực trong vòng 5 phút.\n"
            f"Nếu bạn không yêu cầu, vui lòng bỏ qua email này.\n\n"
            f"Trân trọng,\nSLinkTrack Team"
        )
        utils.send_email(
            subject="[SLinkTrack] Mã OTP đặt lại mật khẩu",
            body=email_body,
            to_email=user.email
        )
    except Exception as err:
        email_sent = False
        error_msg = str(err)
        print(f"SMTP Error occurred (OTP generated: {otp}): {err}")

    if email_sent:
        response = {"status": "success", "message": "Đã gửi mã OTP đặt lại mật khẩu. Vui lòng kiểm tra hộp thư."}
    else:
        response = {
            "status": "success", 
            "message": f"Đã tạo OTP thành công nhưng không thể gửi email do lỗi SMTP. Dùng mã OTP: {otp} để đặt lại mật khẩu."
        }
    
    # Luôn luôn trả về OTP trong payload phản hồi để hỗ trợ môi trường chạy thử (dev/test)
    response["otp"] = otp
    return response


@app.post("/api/auth/reset")
def reset_password(payload: schemas.ResetPassword, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
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
def shorten_url(payload: schemas.ShortenRequest, current_user: Optional[models.User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
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
        domain_id = selected_domain.id
        final_domain_name = selected_domain.domain_name
    elif getattr(payload, 'domain', None):
        domain_name = payload.domain.strip()
        if domain_name.startswith("http://") or domain_name.startswith("https://"):
            domain_name = domain_name.split("://", 1)[1]
        domain_name = domain_name.rstrip("/")
        if domain_name:
            selected_domain = db.query(models.Domain).filter(models.Domain.domain_name == domain_name).first()
            if not selected_domain:
                selected_domain = models.Domain(domain_name=domain_name, workspace_id=payload.workspace_id if getattr(payload, 'workspace_id', None) else None)
                db.add(selected_domain)
                db.commit()
                db.refresh(selected_domain)
            domain_id = selected_domain.id
            final_domain_name = selected_domain.domain_name

    params_value = payload.params.strip() if getattr(payload, 'params', None) else None
    if params_value == "":
        params_value = None

    new_link = models.Link(
        original_url=payload.url,
        name=payload.name.strip() if getattr(payload, 'name', None) else None,
        short_code=short_code,
        domain_id=domain_id,
        workspace_id=payload.workspace_id if getattr(payload, 'workspace_id', None) else None,
        user_id=current_user.id if current_user else None,
        params=params_value,
        expired_at=payload.expired_at,
        status="active"
    )
    db.add(new_link)
    db.commit()
    db.refresh(new_link)

    short_url = f"https://{final_domain_name}/{short_code}" if final_domain_name else f"http://localhost:8000/{short_code}"
    return {
        "status": "success",
        "message": "Tạo liên kết rút gọn thành công!",
        "short_code": short_code,
        "name": new_link.name,
        "short_url": short_url
    }

# --- API TỰ ĐỘNG XUẤX FILE ẢNH QR CODE ĐỘNG ---
@app.get("/api/qrcode/{short_code}")
def get_qr_code(short_code: str, db: Session = Depends(get_db)):
    link = db.query(models.Link).filter(models.Link.short_code == short_code).first()
    if not link:
        raise HTTPException(status_code=404, detail="Không tìm thấy đường dẫn tương ứng để tạo QR!")
        
    qr_stream = utils.generate_qrcode_stream(short_code)
    return StreamingResponse(qr_stream, media_type="image/png")

# --- API ĐIỀU HƯỚNG LINK & QUÉT ANALYTICS NGẦM ---
@app.get("/{short_code}")
def redirect_and_track(short_code: str, request: Request, db: Session = Depends(get_db)):
    link = db.query(models.Link).filter(models.Link.short_code == short_code, models.Link.status == "active").first()
    if not link:
        raise HTTPException(status_code=404, detail="Đường dẫn không tồn tại hoặc đã bị tạm dừng!")

    if link.status != "active":
        raise HTTPException(status_code=404, detail="Đường dẫn hiện không hoạt động.")
    if getattr(link, 'expired_at', None) and link.expired_at < datetime.utcnow():
        raise HTTPException(status_code=404, detail="Đường dẫn đã hết hạn.")

    ip_address = request.client.host if request.client else "127.0.0.1"
    user_agent_string = request.headers.get("user-agent", "")
    user_agent = parse(user_agent_string)
    
    if user_agent.is_mobile:
        device_type = "Mobile (Điện thoại)"
    elif user_agent.is_tablet:
        device_type = "Tablet (Máy tính bảng)"
    else:
        device_type = "Desktop (Máy tính vuông)"

    os_name = user_agent.os.family       
    browser_name = user_agent.browser.family 

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
        device_type=device_type,
        os=os_name,
        browser=browser_name,
        traffic_source=traffic_source,
        referer=referer if referer else None
    )
    db.add(new_log)
    db.commit()

    target_url = link.original_url
    if getattr(link, 'params', None):
        params = link.params.strip()
        if params.startswith("?") or params.startswith("&"):
            params = params[1:]
        if params:
            connector = "&" if "?" in target_url else "?"
            target_url = f"{target_url}{connector}{params}"

    return RedirectResponse(url=target_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

# --- API LẤY THỐNG KÊ ANALYTICS CHI TIẾT CỦA MỘT LINK ---
@app.get("/api/analytics/{short_code}")
def get_link_analytics(
    short_code: str,
    period: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    workspace_id: Optional[int] = None,
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
        if link.workspace_id:
            is_member = db.query(models.WorkspaceMember).filter(
                models.WorkspaceMember.workspace_id == link.workspace_id,
                models.WorkspaceMember.user_id == current_user.id
            ).first()
            if not is_member:
                raise HTTPException(status_code=403, detail="Từ chối truy cập thống kê link này!")
        else:
            if link.user_id != current_user.id:
                raise HTTPException(status_code=403, detail="Từ chối truy cập thống kê link này!")
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
                "total_clicks": 0
            },
            "charts": {
                "devices": {},
                "operating_systems": {},
                "browsers": {},
                "traffic_sources": {},
                "clicks_over_time": {}
            },
            "click_rows": []
        }

    # Truy vấn dữ liệu click logs
    query = db.query(models.ClickLog).filter(models.ClickLog.link_id.in_(link_ids))
    if filter_start:
        query = query.filter(models.ClickLog.created_at >= filter_start)
    if filter_end:
        query = query.filter(models.ClickLog.created_at <= filter_end)
        
    click_logs = query.order_by(models.ClickLog.created_at.desc()).all()
    total_clicks = len(click_logs)

    # Thống kê phân loại và theo thời gian (clicks_over_time)
    device_stats = {}
    os_stats = {}
    browser_stats = {}
    source_stats = {}
    clicks_over_time = {}

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

    sorted_clicks_over_time = dict(sorted(clicks_over_time.items()))

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
            "total_clicks": total_clicks
        },
        "charts": {
            "devices": device_stats,
            "operating_systems": os_stats,
            "browsers": browser_stats,
            "traffic_sources": source_stats,
            "clicks_over_time": sorted_clicks_over_time
        },
        "click_rows": click_rows,
        "edit_history": edit_history_list
    }

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
    db.commit()
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

        click_count = db.query(models.ClickLog).filter(models.ClickLog.link_id == link.id).count()
        result.append({
          "short_code": link.short_code,
          "name": link.name,
          "original_url": link.original_url,
          "status": computed_status,
          "expired_at": link.expired_at.isoformat() if getattr(link, 'expired_at', None) else None,
          "clicks": click_count,
          "date": link.created_at.strftime('%d/%m/%Y') if hasattr(link, 'created_at') and link.created_at else "12/06/2026"
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
    db.delete(link)
    db.commit()
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
    db: Session = Depends(get_db)
):
    query = db.query(models.ClickLog)
    
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

    total_clicks = query.count()
    
    # Thống kê theo ngày để vẽ biểu đồ xu hướng
    trend_stats = db.query(
        func.strftime('%Y-%m-%d', models.ClickLog.created_at).label('day'),
        func.count(models.ClickLog.id).label('count')
    ).filter(models.ClickLog.id.in_(query.with_entities(models.ClickLog.id))) \
     .group_by('day').order_by('day').all()

    return {
        "status": "success",
        "total_clicks": total_clicks,
        "trend": [{"date": item.day, "clicks": item.count} for item in trend_stats]
    }