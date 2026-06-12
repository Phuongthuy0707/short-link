import sqlite3

# Kết nối thẳng tới file database cứng
conn = sqlite3.connect("shortlink.db")
cursor = conn.cursor()

try:
    cursor.execute("SELECT id, username, email, hashed_password FROM users;")
    rows = cursor.fetchall()
    
    print("\n=== DANH SÁCH TÀI KHOẢN TRONG SQLITE ===")
    for row in rows:
        print(f"ID: {row[0]} | User: {row[1]} | Email: {row[2]} | Password mã hóa: {row[3]}")
    print("=========================================\n")
except sqlite3.OperationalError:
    print("❌ Bảng 'users' chưa được khởi tạo hoặc file DB trống!")

conn.close()