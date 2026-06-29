import string
import random
import bcrypt
from datetime import datetime, timedelta
import jwt
import io
import qrcode
import os
import ssl
import smtplib
from email.message import EmailMessage

# SMTP / email cấu hình
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "no-reply@slinktrack.local")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
SEND_RESET_LINK_IN_RESPONSE = os.getenv("SEND_RESET_LINK_IN_RESPONSE", "false").lower() in ("1", "true", "yes")

# 1. Hàm sinh mã rút gọn ngẫu nhiên (6 ký tự) nếu người dùng không điền alias
def generate_short_code(length: int = 6) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(random.choice(chars) for _ in range(length))

# 2. Hàm mã hóa mật khẩu (Hash password) trước khi lưu xuống Database
def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

# 3. Hàm kiểm tra mật khẩu Frontend gửi lên có khớp với mật khẩu đã mã hóa trong DB không
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# Cấu hình chuỗi khóa bí mật để ký token
SECRET_KEY = "Sieu_Mat_Khau_Do_An_Tot_Nghiep_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 # Token có hiệu lực trong 60 phút

# 4. Hàm tạo mã JWT Token khi người dùng nhập đúng tài khoản
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Tạo token đặt lại mật khẩu (sử dụng JWT, thời hạn ngắn)
def create_password_reset_token(data: dict, expires_minutes: int = 15) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_password_reset_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

def send_email(subject: str, body: str, to_email: str, from_email: str = None) -> None:
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = from_email or EMAIL_FROM
    message["To"] = to_email
    message.set_content(body)
    message.add_alternative(body.replace("\n", "<br />"), subtype="html")

    if SMTP_PORT == 465:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, context=context) as server:
            if SMTP_USERNAME and SMTP_PASSWORD:
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(message)
    else:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls(context=ssl.create_default_context())
            if SMTP_USERNAME and SMTP_PASSWORD:
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(message)

# 5. Hàm tạo mã QR Code dưới dạng luồng dữ liệu Bytes (Mới bổ sung)
def generate_qrcode_stream(short_code: str) -> io.BytesIO:
    short_url = f"http://localhost:8000/{short_code}"
    
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(short_url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    return img_byte_arr