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
from typing import Optional
from PIL import Image

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

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
def generate_qrcode_stream(
    short_code: str,
    fill_color: str = "black",
    back_color: str = "white",
    logo_bytes: Optional[bytes] = None,
    format: str = "png"
) -> io.BytesIO:
    short_url = f"http://localhost:8000/{short_code}"
    
    # Chuẩn hóa mã màu hex nếu thiếu dấu #
    if len(fill_color) == 6 and all(c in "0123456789abcdefABCDEF" for c in fill_color):
        fill_color = f"#{fill_color}"
    if len(back_color) == 6 and all(c in "0123456789abcdefABCDEF" for c in back_color):
        back_color = f"#{back_color}"
        
    error_correction = qrcode.constants.ERROR_CORRECT_H if logo_bytes else qrcode.constants.ERROR_CORRECT_M
    
    if format.lower() == "svg":
        import qrcode.image.svg
        import re
        import base64
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=error_correction,
            box_size=10,
            border=4
        )
        qr.add_data(short_url)
        qr.make(fit=True)
        
        img = qr.make_image(image_factory=qrcode.image.svg.SvgPathImage)
        
        stream = io.BytesIO()
        img.save(stream)
        svg_content = stream.getvalue().decode('utf-8')
        
        # Parse viewBox to get size
        viewbox_match = re.search(r'viewBox="0 0 (\d+) (\d+)"', svg_content)
        if viewbox_match:
            width = int(viewbox_match.group(1))
            height = int(viewbox_match.group(2))
        else:
            width, height = 33, 33
            
        # Replace fill color of qr path
        svg_content = re.sub(r'id="qr-path" fill="[^"]+"', f'id="qr-path" fill="{fill_color}"', svg_content)
        
        # Insert background rect
        rect_str = f'<rect width="100%" height="100%" fill="{back_color}"/>'
        svg_content = re.sub(r'(<svg[^>]*>)', f'\\1{rect_str}', svg_content)
        
        if logo_bytes:
            logo_base64 = base64.b64encode(logo_bytes).decode('utf-8')
            logo_size = width * 0.25
            x = (width - logo_size) / 2
            y = (height - logo_size) / 2
            
            mime = "image/png"
            try:
                pil_img = Image.open(io.BytesIO(logo_bytes))
                if pil_img.format:
                    mime = f"image/{pil_img.format.lower()}"
            except Exception:
                pass
                
            image_tag = f'<image x="{x}" y="{y}" width="{logo_size}" height="{logo_size}" href="data:{mime};base64,{logo_base64}"/>'
            svg_content = svg_content.replace('</svg>', f'{image_tag}</svg>')
            
        img_byte_arr = io.BytesIO(svg_content.encode('utf-8'))
        return img_byte_arr

    # Default PNG path
    qr = qrcode.QRCode(
        version=1,
        error_correction=error_correction,
        box_size=10,
        border=4
    )
    qr.add_data(short_url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color=fill_color, back_color=back_color).convert('RGBA')
    
    if logo_bytes:
        try:
            logo = Image.open(io.BytesIO(logo_bytes)).convert('RGBA')
            qr_width, qr_height = img.size
            logo_size = int(qr_width * 0.25)
            logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
            
            pos = ((qr_width - logo_size) // 2, (qr_height - logo_size) // 2)
            img.paste(logo, pos, logo)
        except Exception as e:
            print(f"Lỗi khi chèn logo vào QR: {e}")
            
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    return img_byte_arr