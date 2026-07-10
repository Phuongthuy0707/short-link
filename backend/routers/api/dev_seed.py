import os
import sys
import random
import string

# Add parent directory to sys.path to find database, models, and utils
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from faker import Faker

from database import get_db
import models
import utils

router = APIRouter(prefix="/api/dev", tags=["dev_seed"])

# Pre-generate hash for performance since bcrypt hashing is CPU-heavy
TEST_PASSWORD_HASH = utils.hash_password("123456")

async def verify_seed_token(x_seed_token: Optional[str] = Header(None)):
    expected_token = os.getenv("SEED_TOKEN")
    if not expected_token or x_seed_token != expected_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Quyền truy cập bị từ chối! Sai hoặc thiếu X-Seed-Token."
        )

@router.post("/seed-data", dependencies=[Depends(verify_seed_token)])
def seed_data(
    payload: dict,
    db: Session = Depends(get_db)
):
    users_count = int(payload.get("users_count", 0))
    workspaces_count = int(payload.get("workspaces_count", 0))
    links_per_user = int(payload.get("links_per_user", 0))
    clicks_per_link = int(payload.get("clicks_per_link", 0))
    notifications_count = int(payload.get("notifications_count", 0))

    faker = Faker()
    created_users = []
    created_workspaces = []
    created_links = []
    created_clicks_count = 0
    created_notifications_count = 0

    # 1. Tạo Users giả
    for _ in range(users_count):
        while True:
            email = f"{faker.user_name()}_{random.randint(1000, 9999)}@test.local".lower()
            existing = db.query(models.User).filter(models.User.email == email).first()
            if not existing:
                break
        
        user = models.User(
            email=email,
            password_hash=TEST_PASSWORD_HASH,
            role="member"
        )
        if hasattr(models.User, 'username'):
            setattr(user, 'username', email.split('@')[0])
            
        db.add(user)
        db.flush()
        created_users.append(user)

    # Lấy danh sách users test phục vụ gán liên kết
    test_users = created_users
    if not test_users:
        test_users = db.query(models.User).filter(models.User.email.like("%@test.local")).all()
    if not test_users:
        test_users = db.query(models.User).limit(5).all()

    if not test_users:
        raise HTTPException(status_code=400, detail="Không có tài khoản nào hoạt động để gán dữ liệu test.")

    # 2. Tạo Workspace giả
    for _ in range(workspaces_count):
        owner = random.choice(test_users)
        ws_name = f"[TEST] {faker.company()} Workspace"
        workspace = models.Workspace(
            name=ws_name,
            created_by=owner.id
        )
        db.add(workspace)
        db.flush()
        created_workspaces.append(workspace)

        # Thêm thành viên workspace_members
        member = models.WorkspaceMember(
            workspace_id=workspace.id,
            user_id=owner.id,
            role_in_workspace="owner"
        )
        db.add(member)
        
        # Mời một số thành viên test khác ngẫu nhiên
        other_users = [u for u in test_users if u.id != owner.id]
        if other_users:
            selected_others = random.sample(other_users, min(len(other_users), 3))
            for additional_user in selected_others:
                add_member = models.WorkspaceMember(
                    workspace_id=workspace.id,
                    user_id=additional_user.id,
                    role_in_workspace=random.choice(["editor", "viewer"])
                )
                db.add(add_member)

    test_workspaces = created_workspaces
    if not test_workspaces:
        test_workspaces = db.query(models.Workspace).filter(models.Workspace.name.like("[TEST]%")).all()

    # 3. Tạo Link giả
    for user in test_users:
        for _ in range(links_per_user):
            while True:
                code = "test_" + "".join(random.choices(string.ascii_lowercase + string.digits, k=6))
                existing = db.query(models.Link).filter(models.Link.short_code == code).first()
                if not existing:
                    break
            
            ws_id = None
            if test_workspaces and random.random() > 0.4:
                ws_id = random.choice(test_workspaces).id

            link = models.Link(
                original_url=f"https://example.com/test/{faker.slug()}",
                short_code=code,
                user_id=user.id,
                workspace_id=ws_id,
                name=f"[TEST] {faker.catch_phrase()}",
                status="active",
                created_at=faker.date_time_between(start_date="-30d", end_date="now")
            )
            db.add(link)
            db.flush()
            created_links.append(link)

    # 4. Tạo Click Analytics giả
    test_links = created_links
    if not test_links:
        test_links = db.query(models.Link).filter(models.Link.name.like("[TEST]%")).all()

    if test_links and clicks_per_link > 0:
        device_types = ['Desktop', 'Mobile', 'Tablet']
        os_options = ['Windows', 'MacOS', 'iOS', 'Android', 'Linux']
        browsers = ['Chrome', 'Safari', 'Firefox', 'Edge']
        sources = ['Direct (Trực tiếp)', 'Facebook', 'Google', 'YouTube', 'Email']
        countries_cities = [
            ("Vietnam", "Hanoi"), ("Vietnam", "Ho Chi Minh City"), ("Vietnam", "Da Nang"),
            ("United States", "New York"), ("United States", "San Francisco"),
            ("Singapore", "Singapore"), ("Japan", "Tokyo"), ("South Korea", "Seoul")
        ]

        for link in test_links:
            for _ in range(clicks_per_link):
                country, city = random.choice(countries_cities)
                click = models.ClickLog(
                    link_id=link.id,
                    ip_address=faker.ipv4(),
                    country=country,
                    city=city,
                    device_type=random.choice(device_types),
                    os=random.choice(os_options),
                    browser=random.choice(browsers),
                    traffic_source=random.choice(sources),
                    referer=faker.url(),
                    is_bot=random.choice([True, False, False, False, False, False, False, False, False, False]),
                    created_at=faker.date_time_between(start_date=link.created_at, end_date="now")
                )
                db.add(click)
                created_clicks_count += 1

    # 5. Tạo Notification (Alert) giả
    if notifications_count > 0:
        alert_types = ['high_traffic', 'bot_spike', 'suspicious_country', 'suspicious_ip', 'link_expiring']
        severities = ['low', 'medium', 'high']
        for _ in range(notifications_count):
            target_user = random.choice(test_users)
            user_links = [l for l in test_links if l.user_id == target_user.id]
            target_link = random.choice(user_links) if user_links else None
            
            alert = models.Alert(
                user_id=target_user.id,
                link_id=target_link.id if target_link else None,
                short_code=target_link.short_code if target_link else None,
                type=random.choice(alert_types),
                title=f"[TEST] Cảnh báo truy cập bất thường",
                message=f"Hệ thống phát hiện hoạt động đáng ngờ trên link của bạn. [TEST DATA]",
                severity=random.choice(severities),
                is_read=random.choice([True, False]),
                created_at=faker.date_time_between(start_date="-7d", end_date="now")
            )
            db.add(alert)
            created_notifications_count += 1

    db.commit()

    return {
        "message": "Seed data created successfully",
        "created": {
            "users": len(created_users),
            "workspaces": len(created_workspaces),
            "links": len(created_links),
            "clicks": created_clicks_count,
            "notifications": created_notifications_count
        }
    }

@router.delete("/seed-data", dependencies=[Depends(verify_seed_token)])
def clean_seed_data(db: Session = Depends(get_db)):
    deleted_clicks = 0
    deleted_alerts = 0
    deleted_links = 0
    deleted_members = 0
    deleted_workspaces = 0
    deleted_users = 0

    # 1. Xóa click logs của link test
    test_links = db.query(models.Link).filter(
        or_(models.Link.name.like("[TEST]%"), models.Link.original_url.like("%/test/%"))
    ).all()
    test_link_ids = [l.id for l in test_links]

    if test_link_ids:
        deleted_clicks = db.query(models.ClickLog).filter(models.ClickLog.link_id.in_(test_link_ids)).delete(synchronize_session=False)
        db.query(models.LinkEditHistory).filter(models.LinkEditHistory.link_id.in_(test_link_ids)).delete(synchronize_session=False)
        db.query(models.LinkPermission).filter(models.LinkPermission.link_id.in_(test_link_ids)).delete(synchronize_session=False)

    # 2. Xóa alerts test
    test_users = db.query(models.User).filter(models.User.email.like("%@test.local")).all()
    test_user_ids = [u.id for u in test_users]

    deleted_alerts = db.query(models.Alert).filter(
        or_(
            models.Alert.title.like("[TEST]%"),
            models.Alert.message.like("%[TEST DATA]%"),
            models.Alert.user_id.in_(test_user_ids) if test_user_ids else False
        )
    ).delete(synchronize_session=False)

    # 3. Xóa links test
    if test_link_ids:
        deleted_links = db.query(models.Link).filter(models.Link.id.in_(test_link_ids)).delete(synchronize_session=False)

    # 4. Xóa workspace members & workspaces
    test_workspaces = db.query(models.Workspace).filter(models.Workspace.name.like("[TEST]%")).all()
    test_workspace_ids = [w.id for w in test_workspaces]

    if test_workspace_ids:
        deleted_members = db.query(models.WorkspaceMember).filter(models.WorkspaceMember.workspace_id.in_(test_workspace_ids)).delete(synchronize_session=False)
        deleted_workspaces = db.query(models.Workspace).filter(models.Workspace.id.in_(test_workspace_ids)).delete(synchronize_session=False)

    if test_user_ids:
        deleted_members += db.query(models.WorkspaceMember).filter(models.WorkspaceMember.user_id.in_(test_user_ids)).delete(synchronize_session=False)

    # 5. Xóa users test
    if test_user_ids:
        deleted_users = db.query(models.User).filter(models.User.id.in_(test_user_ids)).delete(synchronize_session=False)

    db.commit()

    return {
        "message": "Seed data cleaned successfully",
        "cleaned": {
            "users": deleted_users,
            "workspaces": deleted_workspaces,
            "workspace_members": deleted_members,
            "links": deleted_links,
            "clicks": deleted_clicks,
            "notifications": deleted_alerts
        }
    }
