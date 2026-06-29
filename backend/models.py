from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from database import Base

# Bảng 1: Quản lý người dùng
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False) # Mã hóa mật khẩu bằng bcrypt
    role = Column(String, default="member") # admin, member, guest
    reset_otp = Column(String, nullable=True)
    reset_otp_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())

# Bảng 2: Quản lý Nhóm / Đội ngũ (Workspace)
class Workspace(Base):
    __tablename__ = "workspaces"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False) # Ví dụ: "Marketing Team"
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())

# Bảng 3: Trung gian phân quyền thành viên trong Nhóm
class WorkspaceMember(Base):
    __tablename__ = "workspace_members"
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role_in_workspace = Column(String, default="viewer") # owner, editor, viewer

# Bảng 4: Quản lý đa tên miền (Custom Domain)
class Domain(Base):
    __tablename__ = "domains"
    id = Column(Integer, primary_key=True, index=True)
    domain_name = Column(String, unique=True, nullable=False) # Ví dụ: slinktrack.io, brand.vn
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True) # Domain chung hoặc của nhóm nào
    created_at = Column(DateTime, default=func.now())

# Bảng 5: Quản lý thông tin Link rút gọn
class Link(Base):
    __tablename__ = "links"
    id = Column(Integer, primary_key=True, index=True)
    original_url = Column(Text, nullable=False) # URL gốc dài
    short_code = Column(String, unique=True, index=True, nullable=False) # Hậu tố rút gọn (alias)
    domain_id = Column(Integer, ForeignKey("domains.id"), nullable=True) # Khớp với custom domain
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True) # Thuộc nhóm nào quản lý
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Người tạo ra link này
    name = Column(String, nullable=True) # Tên link để hiển thị thay cho shortlink
    status = Column(String, default="active") # active, paused
    password_hash = Column(String, nullable=True) # Mật khẩu bảo vệ link nếu có
    params = Column(Text, nullable=True) # URL params để đính kèm thêm vào original_url
    expired_at = Column(DateTime, nullable=True) # Ngày hết hạn link
    created_at = Column(DateTime, default=func.now())

# Bảng 6: Lưu trữ log tracking chi tiết phục vụ biểu đồ Analytics
class ClickLog(Base):
    __tablename__ = "click_logs"
    id = Column(Integer, primary_key=True, index=True)
    link_id = Column(Integer, ForeignKey("links.id"), nullable=False)
    ip_address = Column(String)
    country = Column(String, default="Unknown")
    city = Column(String, default="Unknown")
    device_type = Column(String, default="Unknown") # Desktop, Mobile, Tablet
    os = Column(String, default="Unknown") # Windows, iOS, Android
    browser = Column(String, default="Unknown") # Chrome, Safari
    traffic_source = Column(String, default="Direct (Trực tiếp)") # Facebook, Google, YouTube, Direct
    referer = Column(Text)
    created_at = Column(DateTime, default=func.now()) # Mốc thời gian cốt lõi để làm bộ lọc Ngày/Giờ/Tháng

# Bảng 7: Lưu lịch sử chỉnh sửa thời gian hết hạn của link
class LinkEditHistory(Base):
    __tablename__ = "link_edit_histories"
    id = Column(Integer, primary_key=True, index=True)
    link_id = Column(Integer, ForeignKey("links.id"), nullable=False)
    old_expired_at = Column(DateTime, nullable=True)
    new_expired_at = Column(DateTime, nullable=True)
    edited_at = Column(DateTime, default=func.now())
    edited_by = Column(Integer, ForeignKey("users.id"), nullable=True)