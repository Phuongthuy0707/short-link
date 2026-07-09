from fastapi import FastAPI, Depends, HTTPException, status, Form, Request, Response, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, RedirectResponse, HTMLResponse
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
from database import engine, get_db, SessionLocal

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
        print("Tài khoản Admin cố định đã được tạo thành công!")
finally:
    db_init.close()

app = FastAPI(title="Hệ thống Shortlink & Analytics nâng cao", root_path="/slink")

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

# --- TEMPORARY API FOR DB SEEDING ---
@app.get("/api/admin/temp-seed-db")
def temp_seed_db(db: Session = Depends(get_db)):
    import random
    from datetime import datetime, timedelta
    
    # 1. Find user ID for phun111@gmail.com
    user = db.query(models.User).filter(models.User.email == 'phun111@gmail.com').first()
    if not user:
        hashed_pwd = utils.hash_password("123456")
        user = models.User(email='phun111@gmail.com', password_hash=hashed_pwd, role="member")
        if hasattr(models.User, 'username'):
            setattr(user, 'username', 'phun111')
        db.add(user)
        db.commit()
        db.refresh(user)
    user_id = user.id

    # 2. Update creation date of all links belonging to phun111@gmail.com
    db.query(models.Link).filter(models.Link.user_id == user_id).update({
        models.Link.created_at: datetime(2026, 6, 25, 10, 0, 0)
    })
    db.commit()

    # 3. Create domains / links if they don't exist
    # Domain baohn
    domain = db.query(models.Domain).filter(models.Domain.domain_name == "baohn").first()
    if not domain:
        domain = models.Domain(domain_name="baohn", workspace_id=None, created_at=datetime(2026, 6, 25, 10, 0, 0))
        db.add(domain)
        db.commit()
        db.refresh(domain)
    domain_id = domain.id

    # List of all links we want to manage: short_code, original_url, name, is_new
    links_info = [
        {"short_code": "Obr6aK", "url": "https://google.com", "name": "Link Obr6aK", "domain_id": None},
        {"short_code": "kND4Wr", "url": "https://google.com", "name": "Link kND4Wr", "domain_id": None},
        {"short_code": "pXTSbx", "url": "https://google.com", "name": "Link pXTSbx", "domain_id": None},
        {"short_code": "baodulich", "url": "https://baodulich.vn", "name": "Báo Du Lịch", "domain_id": domain_id},
        {"short_code": "hanoi", "url": "https://hanoi.gov.vn", "name": "Hà Nội", "domain_id": domain_id},
        {"short_code": "td101", "url": "https://baobacninhtv.vn/trung-doan-101-tham-gia-hoi-thi-doanh-trai-chinh-quy-xanh-sach-dep--postid449633.bbg", "name": "Trung Đoàn 101", "domain_id": None},
        {"short_code": "doanh-trai", "url": "https://baobacninhtv.vn/trung-doan-101-tham-gia-hoi-thi-doanh-trai-chinh-quy-xanh-sach-dep--postid449633.bbg", "name": "Doanh Trại", "domain_id": None},
        {"short_code": "baobacninh", "url": "https://baobacninhtv.vn/trung-doan-101-tham-gia-hoi-thi-doanh-trai-chinh-quy-xanh-sach-dep--postid449633.bbg", "name": "Báo Bắc Ninh", "domain_id": None}
    ]

    link_ids = {}
    for l_info in links_info:
        code = l_info["short_code"]
        link = db.query(models.Link).filter(models.Link.short_code == code, models.Link.domain_id == l_info["domain_id"]).first()
        if not link:
            link = models.Link(
                original_url=l_info["url"],
                short_code=code,
                domain_id=l_info["domain_id"],
                workspace_id=None,
                status="active",
                password_hash=None,
                expired_at=None,
                created_at=datetime(2026, 6, 25, 10, 0, 0),
                params=None,
                name=l_info["name"],
                user_id=user_id
            )
            db.add(link)
            db.commit()
            db.refresh(link)
        else:
            link.user_id = user_id
            link.created_at = datetime(2026, 6, 25, 10, 0, 0)
            db.commit()
        link_ids[code] = link.id

    # 4. Seed data for all these 8 links for days from 2026-06-25 to 2026-07-09.
    for code, lid in link_ids.items():
        db.query(models.ClickLog).filter(models.ClickLog.link_id == lid).delete()
    db.commit()

    start_date = datetime(2026, 6, 25)
    end_date = datetime(2026, 7, 9)
    current_day = start_date

    countries = ['Vietnam', 'USA', 'Singapore', 'Korea', 'Japan']
    country_weights = [0.60, 0.15, 0.10, 0.10, 0.05]

    cities = {
        'Vietnam': ['Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Can Tho', 'Hai Phong', 'Bac Ninh'],
        'USA': ['New York', 'San Francisco'],
        'Singapore': ['Singapore'],
        'Korea': ['Seoul'],
        'Japan': ['Tokyo']
    }

    devices = ['Desktop (Máy tính)', 'Mobile (Điện thoại)', 'Tablet (Máy tính bảng)']
    device_weights = [0.40, 0.50, 0.10]

    oses = ['Windows', 'macOS', 'Android', 'iOS', 'Linux']
    os_weights = [0.30, 0.15, 0.35, 0.15, 0.05]

    browsers = ['Chrome', 'Edge', 'Safari', 'Firefox', 'Samsung Browser']
    browser_weights = [0.50, 0.15, 0.15, 0.10, 0.10]

    sources = ['Direct (Trực tiếp)', 'Zalo', 'YouTube', 'TikTok', 'Facebook', 'Google Search']
    source_weights = [0.30, 0.20, 0.10, 0.15, 0.20, 0.05]

    referers = {
        'Facebook': 'https://m.facebook.com/',
        'Google Search': 'https://www.google.com/',
        'TikTok': 'https://www.tiktok.com/',
        'YouTube': 'https://www.youtube.com/',
        'Zalo': 'https://zalo.me/'
    }

    total_inserted = 0

    while current_day <= end_date:
        for code, lid in link_ids.items():
            if random.random() < 0.20:
                continue
            clicks = random.randint(5, 30)

            for _ in range(clicks):
                hour = random.randint(0, 23)
                minute = random.randint(0, 59)
                second = random.randint(0, 59)
                timestamp = current_day.replace(hour=hour, minute=minute, second=second)

                country = random.choices(countries, weights=country_weights)[0]
                city = random.choice(cities[country])
                device = random.choices(devices, weights=device_weights)[0]
                os_val = random.choices(oses, weights=os_weights)[0]
                browser = random.choices(browsers, weights=browser_weights)[0]
                source = random.choices(sources, weights=source_weights)[0]
                referer = referers.get(source, None)
                ip = f"{random.randint(1, 223)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"

                new_log = models.ClickLog(
                    link_id=lid,
                    ip_address=ip,
                    country=country,
                    city=city,
                    device_type=device,
                    os=os_val,
                    browser=browser,
                    traffic_source=source,
                    referer=referer,
                    created_at=timestamp
                )
                db.add(new_log)
                total_inserted += 1

        current_day += timedelta(days=1)

    db.commit()

    # ==========================================
    # SEEDING FOR NEW TEST ACCOUNT (testuser@gmail.com)
    # ==========================================
    # 1. Create testuser@gmail.com
    test_email = 'testuser@gmail.com'
    test_user = db.query(models.User).filter(models.User.email == test_email).first()
    if not test_user:
        hashed_pwd = utils.hash_password("123456")
        test_user = models.User(email=test_email, password_hash=hashed_pwd, role="member")
        if hasattr(models.User, 'username'):
            setattr(test_user, 'username', 'testuser')
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
    else:
        # Reset password to 123456
        test_user.password_hash = utils.hash_password("123456")
        db.commit()
    
    # 2. Create member1@gmail.com and member2@gmail.com
    m1_email = 'member1@gmail.com'
    m1_user = db.query(models.User).filter(models.User.email == m1_email).first()
    if not m1_user:
        m1_user = models.User(email=m1_email, password_hash=utils.hash_password("123456"), role="member")
        if hasattr(models.User, 'username'):
            setattr(m1_user, 'username', 'member1')
        db.add(m1_user)
    else:
        m1_user.password_hash = utils.hash_password("123456")

    m2_email = 'member2@gmail.com'
    m2_user = db.query(models.User).filter(models.User.email == m2_email).first()
    if not m2_user:
        m2_user = models.User(email=m2_email, password_hash=utils.hash_password("123456"), role="member")
        if hasattr(models.User, 'username'):
            setattr(m2_user, 'username', 'member2')
        db.add(m2_user)
    else:
        m2_user.password_hash = utils.hash_password("123456")
    db.commit()
    db.refresh(m1_user)
    db.refresh(m2_user)

    # 3. Create workspace owned by testuser@gmail.com
    ws_name = "Nhóm Tin Tức Hà Nội"
    workspace = db.query(models.Workspace).filter(models.Workspace.name == ws_name, models.Workspace.created_by == test_user.id).first()
    if not workspace:
        workspace = models.Workspace(name=ws_name, created_by=test_user.id, created_at=datetime(2026, 6, 25, 10, 0, 0))
        db.add(workspace)
        db.commit()
        db.refresh(workspace)
    
    # Add members to workspace
    m1_member = db.query(models.WorkspaceMember).filter(
        models.WorkspaceMember.workspace_id == workspace.id,
        models.WorkspaceMember.user_id == m1_user.id
    ).first()
    if not m1_member:
        m1_member = models.WorkspaceMember(workspace_id=workspace.id, user_id=m1_user.id, role_in_workspace="editor")
        db.add(m1_member)
    
    m2_member = db.query(models.WorkspaceMember).filter(
        models.WorkspaceMember.workspace_id == workspace.id,
        models.WorkspaceMember.user_id == m2_user.id
    ).first()
    if not m2_member:
        m2_member = models.WorkspaceMember(workspace_id=workspace.id, user_id=m2_user.id, role_in_workspace="viewer")
        db.add(m2_member)
    db.commit()

    # 4. Create links for testuser@gmail.com inside workspace
    test_links_info = [
        {"short_code": "hn-express", "url": "https://vnexpress.net", "name": "VnExpress Hà Nội", "workspace_id": workspace.id},
        {"short_code": "hn-travel", "url": "https://vietnamtourism.gov.vn", "name": "Du Lịch Hà Nội", "workspace_id": workspace.id},
        {"short_code": "hn-weather", "url": "https://nchmf.gov.vn", "name": "Thời Tiết Hà Nội", "workspace_id": workspace.id},
        {"short_code": "hn-food", "url": "https://foody.vn", "name": "Ẩm Thực Hà Nội", "workspace_id": workspace.id},
        {"short_code": "td101-bbn", "url": "https://baobacninhtv.vn/trung-doan-101-tham-gia-hoi-thi-doanh-trai-chinh-quy-xanh-sach-dep--postid449633.bbg", "name": "Báo Bắc Ninh - Trung Đoàn 101", "workspace_id": workspace.id},
        {"short_code": "nhandan-vungcam", "url": "https://nhandan.vn/bao-dam-su-nghiem-minh-cua-phap-luat-khong-co-vung-cam-khong-co-ngoai-le-post974494.html", "name": "Báo Nhân Dân - Không Vùng Cấm", "workspace_id": workspace.id},
        {"short_code": "baocamau-dansinh", "url": "https://baocamau.vn/nhieu-kien-nghi-dan-sinh-duoc-cu-tri-gui-den-dai-bieu-hdnd-tinh-a130464.html", "name": "Báo Cà Mau - Kiến Nghị Dân Sinh", "workspace_id": workspace.id},
        {"short_code": "hanoimoi-dulich", "url": "https://hanoimoi.vn/du-lich", "name": "Hà Nội Mới - Du Lịch", "workspace_id": workspace.id}
    ]

    test_link_ids = {}
    for tl in test_links_info:
        code = tl["short_code"]
        link = db.query(models.Link).filter(models.Link.short_code == code, models.Link.workspace_id == workspace.id).first()
        if not link:
            link = models.Link(
                original_url=tl["url"],
                short_code=code,
                domain_id=None,
                workspace_id=workspace.id,
                status="active",
                password_hash=None,
                expired_at=None,
                created_at=datetime(2026, 6, 25, 10, 0, 0),
                params=None,
                name=tl["name"],
                user_id=test_user.id
            )
            db.add(link)
            db.commit()
            db.refresh(link)
        else:
            link.user_id = test_user.id
            link.created_at = datetime(2026, 6, 25, 10, 0, 0)
            db.commit()
        test_link_ids[code] = link.id

    # 5. Delete and seed click logs for test links
    for code, lid in test_link_ids.items():
        db.query(models.ClickLog).filter(models.ClickLog.link_id == lid).delete()
    db.commit()

    current_day = start_date
    test_total_inserted = 0
    while current_day <= end_date:
        for code, lid in test_link_ids.items():
            if random.random() < 0.20:
                continue
            clicks = random.randint(5, 30)

            for _ in range(clicks):
                hour = random.randint(0, 23)
                minute = random.randint(0, 59)
                second = random.randint(0, 59)
                timestamp = current_day.replace(hour=hour, minute=minute, second=second)

                country = random.choices(countries, weights=country_weights)[0]
                city = random.choice(cities[country])
                device = random.choices(devices, weights=device_weights)[0]
                os_val = random.choices(oses, weights=os_weights)[0]
                browser = random.choices(browsers, weights=browser_weights)[0]
                source = random.choices(sources, weights=source_weights)[0]
                referer = referers.get(source, None)
                ip = f"{random.randint(1, 223)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"

                new_log = models.ClickLog(
                    link_id=lid,
                    ip_address=ip,
                    country=country,
                    city=city,
                    device_type=device,
                    os=os_val,
                    browser=browser,
                    traffic_source=source,
                    referer=referer,
                    created_at=timestamp
                )
                db.add(new_log)
                test_total_inserted += 1

        current_day += timedelta(days=1)
    
    db.commit()

    return {
        "status": "success",
        "message": f"Database seeded! Clicks added: {total_inserted} for phun111, {test_total_inserted} for testuser.",
        "test_user": {
            "email": test_email,
            "password": "123456",
            "workspace": ws_name,
            "members": [m1_email, m2_email],
            "links": list(test_link_ids.keys())
        }
    }

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
def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
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

    link_pwd_hash = None
    if getattr(payload, 'password', None) and payload.password.strip():
        link_pwd_hash = utils.hash_password(payload.password.strip())

    new_link = models.Link(
        original_url=payload.url,
        name=payload.name.strip() if getattr(payload, 'name', None) else None,
        short_code=short_code,
        domain_id=domain_id,
        workspace_id=payload.workspace_id if getattr(payload, 'workspace_id', None) else None,
        user_id=current_user.id if current_user else None,
        params=params_value,
        expired_at=payload.expired_at,
        password_hash=link_pwd_hash,
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

def perform_tracking_and_redirect(link: models.Link, request: Request, db: Session):
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

# --- API ĐIỀU HƯỚNG LINK & QUÉT ANALYTICS NGẦM ---
@app.get("/{short_code}")
def redirect_and_track(short_code: str, request: Request, db: Session = Depends(get_db)):
    link = db.query(models.Link).filter(models.Link.short_code == short_code, models.Link.status == "active").first()
    if not link:
        raise HTTPException(status_code=404, detail="Đường dẫn không tồn tại hoặc đã bị tạm dừng!")

    if getattr(link, 'expired_at', None) and link.expired_at < datetime.utcnow():
        raise HTTPException(status_code=404, detail="Đường dẫn đã hết hạn.")

    if link.password_hash:
        return HTMLResponse(content=get_password_prompt_html(short_code), status_code=200)

    return perform_tracking_and_redirect(link, request, db)

@app.post("/{short_code}")
def verify_password_and_redirect(short_code: str, request: Request, password: str = Form(...), db: Session = Depends(get_db)):
    link = db.query(models.Link).filter(models.Link.short_code == short_code, models.Link.status == "active").first()
    if not link:
        raise HTTPException(status_code=404, detail="Đường dẫn không tồn tại hoặc đã bị tạm dừng!")

    if getattr(link, 'expired_at', None) and link.expired_at < datetime.utcnow():
        raise HTTPException(status_code=404, detail="Đường dẫn đã hết hạn.")

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

        domain_name = None
        if link.domain_id:
            domain_obj = db.query(models.Domain).filter(models.Domain.id == link.domain_id).first()
            if domain_obj:
                domain_name = domain_obj.domain_name

        click_count = db.query(models.ClickLog).filter(models.ClickLog.link_id == link.id).count()
        result.append({
          "short_code": link.short_code,
          "name": link.name,
          "original_url": link.original_url,
          "status": computed_status,
          "expired_at": link.expired_at.isoformat() if getattr(link, 'expired_at', None) else None,
          "clicks": click_count,
          "date": link.created_at.strftime('%d/%m/%Y') if hasattr(link, 'created_at') and link.created_at else "12/06/2026",
          "domain": domain_name
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