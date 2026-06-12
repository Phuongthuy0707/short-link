from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Định nghĩa file Database SQLite sẽ tự động sinh ra
SQLALCHEMY_DATABASE_URL = "sqlite:///./shortlink.db"

# Khởi tạo Engine kết nối (check_same_thread=False bắt buộc cho SQLite để chạy đa luồng async)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

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