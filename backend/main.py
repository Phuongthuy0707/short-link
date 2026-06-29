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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tài khoản hoặc mật khẩu không chính xác!")
    
    is_password_correct = utils.verify_password(password, user.password_hash)
    if not is_password_correct:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tài khoản hoặc mật khẩu không chính xác!")
    
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
        # Không tiết lộ thông tin người dùng, trả về thành công chung
        return {"status": "success", "message": "Nếu tài khoản tồn tại, đường dẫn đặt lại mật khẩu sẽ được gửi."}

    token = utils.create_password_reset_token({"user_id": user.id, "email": user.email})
    reset_link = f"{utils.FRONTEND_URL}/reset-password?token={token}"

    try:
        email_body = (
            f"Xin chào,\n\n"
            f"Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản này.\n"
            f"Vui lòng nhấn vào liên kết sau để đặt lại mật khẩu (hoặc dán vào trình duyệt):\n\n"
            f"{reset_link}\n\n"
            f"Nếu bạn không yêu cầu, vui lòng bỏ qua email này.\n\n"
            f"Trân trọng,\nShortlink Team"
        )
        utils.send_email(
            subject="[Shortlink] Đặt lại mật khẩu",
            body=email_body,
            to_email=user.email
        )
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Không thể gửi email: {err}")

    response = {"status": "success", "message": "Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư."}
    if utils.SEND_RESET_LINK_IN_RESPONSE:
        response["reset_link"] = reset_link
    return response


@app.post("/api/auth/reset")
def reset_password(payload: schemas.ResetPassword, db: Session = Depends(get_db)):
    try:
        data = utils.verify_password_reset_token(payload.token)
    except Exception:
        raise HTTPException(status_code=400, detail="Token không hợp lệ hoặc đã hết hạn")

    user = db.query(models.User).filter(models.User.id == data.get("user_id")).first()
    if not user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")

    user.password_hash = utils.hash_password(payload.new_password)
    db.commit()
    return {"status": "success", "message": "Mật khẩu đã được cập nhật thành công."}

# --- API TẠO ĐƯỜNG DẪN RÚT GỌN MỚI ---
@app.post("/api/shorten")
def shorten_url(payload: schemas.ShortenRequest, db: Session = Depends(get_db)):
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
        params=params_value,
        status="active"
    )
    db.add(new_link)
    db.commit()
    db.refresh(new_link)

    short_url = f"https://{final_domain_name}/{short_code}" if final_domain_name else f"http://localhost:8000/{short_code}"
    return {
        "status": "success",
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
        if "facebook.com" in referer or "fb.me" in referer:
            traffic_source = "Facebook"
        elif "youtube.com" in referer:
            traffic_source = "YouTube"
        elif "linkedin.com" in referer:
            traffic_source = "LinkedIn"
        elif "google.com" in referer:
            traffic_source = "Google Search"

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
def get_link_analytics(short_code: str, db: Session = Depends(get_db)):
    link = db.query(models.Link).filter(models.Link.short_code == short_code).first()
    if not link:
        raise HTTPException(status_code=404, detail="Không tìm thấy đường dẫn để xem thống kê!")

    total_clicks = db.query(models.ClickLog).filter(models.ClickLog.link_id == link.id).count()

    device_stats = db.query(models.ClickLog.device_type, func.count(models.ClickLog.id).label("count")).filter(models.ClickLog.link_id == link.id).group_by(models.ClickLog.device_type).all()
    os_stats = db.query(models.ClickLog.os, func.count(models.ClickLog.id).label("count")).filter(models.ClickLog.link_id == link.id).group_by(models.ClickLog.os).all()
    browser_stats = db.query(models.ClickLog.browser, func.count(models.ClickLog.id).label("count")).filter(models.ClickLog.link_id == link.id).group_by(models.ClickLog.browser).all()
    source_stats = db.query(models.ClickLog.traffic_source, func.count(models.ClickLog.id).label("count")).filter(models.ClickLog.link_id == link.id).group_by(models.ClickLog.traffic_source).all()
    click_logs = db.query(models.ClickLog).filter(models.ClickLog.link_id == link.id).order_by(models.ClickLog.created_at.desc() if hasattr(models.ClickLog, 'created_at') else models.ClickLog.id.desc()).all()

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
        for click in click_logs
    ]

    return {
        "status": "success",
        "link_info": {
            "short_code": link.short_code,
            "name": link.name,
            "original_url": link.original_url,
            "status": link.status,
            "expired_at": link.expired_at.isoformat() if getattr(link, 'expired_at', None) else None,
            "created_at": link.created_at if hasattr(link, 'created_at') else None
        },
        "summary": {
            "total_clicks": total_clicks
        },
        "charts": {
            "devices": {item.device_type: item.count for item in device_stats},
            "operating_systems": {item.os: item.count for item in os_stats},
            "browsers": {item.browser: item.count for item in browser_stats},
            "traffic_sources": {item.traffic_source: item.count for item in source_stats}
        },
        "click_rows": click_rows
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
        raise HTTPException(status_code=403, detail="Bạn không có quyền mời thành viên!")
        
    invited_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not invited_user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng!")
        
    already_member = db.query(models.WorkspaceMember).filter(models.WorkspaceMember.workspace_id == workspace_id, models.WorkspaceMember.user_id == invited_user.id).first()
    if already_member:
        raise HTTPException(status_code=400, detail="Người dùng này đã là thành viên!")
        
    new_member = models.WorkspaceMember(workspace_id=workspace_id, user_id=invited_user.id, role_in_workspace=payload.role_in_workspace)
    db.add(new_member)
    db.commit()
    return {"status": "success", "message": "Mời thành công!"}

@app.get("/api/workspaces/{workspace_id}/links")
def get_workspace_links(workspace_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    is_member = db.query(models.WorkspaceMember).filter(models.WorkspaceMember.workspace_id == workspace_id, models.WorkspaceMember.user_id == current_user.id).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Từ chối truy cập không gian!")
    links = db.query(models.Link).filter(models.Link.workspace_id == workspace_id).all()
    return {"status": "success", "links": links}

@app.get("/api/all-links")
def get_all_links(db: Session = Depends(get_db)):
    links = db.query(models.Link).order_by(models.Link.id.desc()).all()
    result = []
    for link in links:
        click_count = db.query(models.ClickLog).filter(models.ClickLog.link_id == link.id).count()
        result.append({
          "short_code": link.short_code,
          "name": link.name,
          "original_url": link.original_url,
          "status": link.status,
          "expired_at": link.expired_at.isoformat() if getattr(link, 'expired_at', None) else None,
          "clicks": click_count,
          "date": link.created_at.strftime('%d/%m/%Y') if hasattr(link, 'created_at') and link.created_at else "12/06/2026"
        })
    return result

@app.patch("/api/links/{short_code}")
def update_link(short_code: str, payload: schemas.LinkUpdate, db: Session = Depends(get_db)):
    link = db.query(models.Link).filter(models.Link.short_code == short_code).first()
    if not link:
        raise HTTPException(status_code=404, detail="Không tìm thấy link để cập nhật!")
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
        "link_info": {
            "short_code": link.short_code,
            "name": link.name,
            "status": link.status,
            "expired_at": link.expired_at.isoformat() if getattr(link, 'expired_at', None) else None,
        }
    }

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