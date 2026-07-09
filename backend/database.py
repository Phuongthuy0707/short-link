import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

# Định nghĩa Database URL
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./shortlink.db")

# Khởi tạo Engine kết nối
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Tạo SessionLocal: Nơi cấp phát các phiên Đọc/Ghi dữ liệu xuống DB
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Lớp nền tảng để các bảng dữ liệu sau này kế thừa và tự map thành bảng trong DB
Base = declarative_base()

# Hàm phụ trợ dùng để mở và tự động đóng phiên kết nối DB sau khi API gọi xong
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()