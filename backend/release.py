import os
import glob
import tarfile
import sys

# Thử import paramiko để kết nối SSH/SFTP
try:
    import paramiko
except ImportError:
    print("Lỗi: Script này yêu cầu thư viện 'paramiko' để kết nối SSH/SFTP.")
    print("Vui lòng cài đặt bằng lệnh: pip install paramiko")
    sys.exit(1)

# === CẤU HÌNH KẾT NỐI SERVER ===
REMOTE_HOST = "your_server_ip"       # IP máy chủ của bạn
REMOTE_PORT = 22                      # Cổng SSH
REMOTE_USER = "root"                 # SSH Username
REMOTE_PASSWORD = None               # Mật khẩu SSH (để None nếu dùng Key hoặc muốn nhập tay khi chạy)
SSH_KEY_PATH = None                  # Đường dẫn tới SSH Private Key nếu có (ví dụ: "C:/Users/name/.ssh/id_rsa")

REMOTE_PATH = "/var/www/slink-backend" # Thư mục đích trên máy chủ
ARCHIVE_NAME = "deploy_package.tar.gz"

# 1. Danh sách file cần nén (Tùy biến cho Python)
source_items_raw = ['*.py', 'requirements.txt', 'ecosystem.config.js', '.env']

def build_package():
    print("=== Bước 1: Đang đóng gói ứng dụng ===")
    
    # Tìm tất cả các file khớp với pattern
    files_to_pack = []
    for pattern in source_items_raw:
        matched_files = glob.glob(pattern)
        files_to_pack.extend(matched_files)
    
    # Loại bỏ file trùng lặp
    files_to_pack = list(set(files_to_pack))
    
    if not files_to_pack:
        print("Không tìm thấy file nào khớp với cấu hình đóng gói!")
        return False
        
    print(f"Danh sách file sẽ đóng gói: {files_to_pack}")
    
    # Tạo file nén tar.gz
    try:
        with tarfile.open(ARCHIVE_NAME, "w:gz") as tar:
            for file in files_to_pack:
                tar.add(file)
        print(f"Đã đóng gói thành công: {ARCHIVE_NAME}")
        return True
    except Exception as e:
        print(f"Lỗi khi đóng gói: {e}")
        return False

def upload_and_deploy():
    print("\n=== Bước 2: Đang kết nối SSH/SFTP ===")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        # Kết nối qua SSH Key hoặc Mật khẩu
        if SSH_KEY_PATH:
            key_path = os.path.expanduser(SSH_KEY_PATH)
            private_key = paramiko.RSAKey.from_private_key_file(key_path)
            ssh.connect(hostname=REMOTE_HOST, port=REMOTE_PORT, username=REMOTE_USER, pkey=private_key)
        else:
            password = REMOTE_PASSWORD or input(f"Nhập mật khẩu SSH cho {REMOTE_USER}@{REMOTE_HOST}: ")
            ssh.connect(hostname=REMOTE_HOST, port=REMOTE_PORT, username=REMOTE_USER, password=password)
            
        print("Kết nối SSH thành công!")
        
        # Tạo thư mục đích trên server nếu chưa có
        ssh.exec_command(f"mkdir -p {REMOTE_PATH}")
        
        # Mở kết nối SFTP để tải file lên
        print("\n=== Bước 3: Tải file lên máy chủ (SFTP) ===")
        sftp = ssh.open_sftp()
        remote_file_path = os.path.join(REMOTE_PATH, ARCHIVE_NAME).replace("\\", "/")
        
        print(f"Đang tải {ARCHIVE_NAME} lên {remote_file_path}...")
        sftp.put(ARCHIVE_NAME, remote_file_path)
        sftp.close()
        print("Tải file lên thành công!")
        
        # 2. Giải nén và chạy ứng dụng trên máy chủ (Lệnh thực thi Bước 4)
        print("\n=== Bước 4: Thực thi lệnh trên máy chủ ===")
        
        full_remote_cmd = (
            f"cd {REMOTE_PATH} && "
            f"tar -xzf {ARCHIVE_NAME} && "
            f"rm {ARCHIVE_NAME} && "
            f"source venv/bin/activate && "
            f"pip install -r requirements.txt && "
            f"pm2 reload ecosystem.config.js || pm2 start ecosystem.config.js"
        )
        
        print(f"Đang chạy lệnh: {full_remote_cmd}")
        stdin, stdout, stderr = ssh.exec_command(full_remote_cmd)
        
        # Đọc output kết quả thực thi
        stdout_str = stdout.read().decode('utf-8')
        stderr_str = stderr.read().decode('utf-8')
        
        if stdout_str:
            print("\n[STDOUT]:")
            print(stdout_str)
        if stderr_str:
            print("\n[STDERR]:")
            print(stderr_str)
            
        print("\n=== Cập nhật code thành công! ===")
        
    except Exception as e:
        print(f"Lỗi xảy ra trong quá trình deploy: {e}")
    finally:
        ssh.close()
        # Dọn dẹp file nén ở máy local sau khi deploy xong
        if os.path.exists(ARCHIVE_NAME):
            os.remove(ARCHIVE_NAME)
            print(f"Đã dọn dẹp file local {ARCHIVE_NAME}")

if __name__ == "__main__":
    if build_package():
        upload_and_deploy()
