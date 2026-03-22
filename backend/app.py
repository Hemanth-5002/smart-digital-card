from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import sqlite3
import qrcode
import os
from io import BytesIO
import base64
import socket

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

frontend_path = os.path.join(os.path.dirname(__file__), '..', 'frontend')
app = Flask(__name__, static_folder=frontend_path, static_url_path='')
CORS(app)

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_frontend(path):
    return send_from_directory(app.static_folder, path)

DB_FILE = 'students_db.db'

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            register_number TEXT UNIQUE NOT NULL,
            course TEXT NOT NULL,
            attendance TEXT NOT NULL,
            fees_status TEXT NOT NULL,
            library_books TEXT,
            contact TEXT,
            email TEXT,
            dob TEXT,
            marks TEXT,
            linkedin TEXT,
            photo TEXT,
            qr_code TEXT
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/api/students', methods=['GET'])
def get_students():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM students')
    students = [dict(row) for row in c.fetchall()]
    conn.close()
    return jsonify(students)

@app.route('/api/students', methods=['POST'])
def add_student():
    data = request.json
    name = data.get('name')
    register_number = data.get('register_number')
    course = data.get('course')
    attendance = data.get('attendance', '0%')
    fees_status = data.get('fees_status', 'Pending')
    contact = data.get('contact', 'N/A')
    library_books = data.get('library_books', 'None')
    email = data.get('email', 'N/A')
    dob = data.get('dob', 'N/A')
    marks = data.get('marks', 'N/A')
    linkedin = data.get('linkedin', 'N/A')
    photo = data.get('photo', '')
    
    # Generate QR Code
    local_ip = get_local_ip()
    port = request.host.split(':')[-1] if ':' in request.host else '5000'
    base_url = f"http://{local_ip}:{port}"
    qr_data = f"{base_url}/student.html?usn={register_number}&full=true"
    qr = qrcode.QRCode(version=1, box_size=6, border=4)
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill='black', back_color='white')
    
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    qr_code_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
    
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('''
            INSERT INTO students (name, register_number, course, attendance, fees_status, library_books, contact, email, dob, marks, linkedin, photo, qr_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (name, register_number, course, attendance, fees_status, library_books, contact, email, dob, marks, linkedin, photo, qr_code_base64))
        conn.commit()
        conn.close()
        return jsonify({"message": "Student added successfully!"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Register number already exists!"}), 400

@app.route('/api/students/<register_number>', methods=['PUT'])
def update_student(register_number):
    data = request.json
    name = data.get('name')
    course = data.get('course')
    attendance = data.get('attendance', '0%')
    fees_status = data.get('fees_status', 'Pending')
    library_books = data.get('library_books', 'None')
    contact = data.get('contact', 'N/A')
    email = data.get('email', 'N/A')
    dob = data.get('dob', 'N/A')
    marks = data.get('marks', 'N/A')
    linkedin = data.get('linkedin', 'N/A')
    photo = data.get('photo', '')

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    if photo:
        c.execute('''
            UPDATE students SET name=?, course=?, attendance=?, fees_status=?, library_books=?, contact=?, email=?, dob=?, marks=?, linkedin=?, photo=?
            WHERE register_number=?
        ''', (name, course, attendance, fees_status, library_books, contact, email, dob, marks, linkedin, photo, register_number))
    else:
        c.execute('''
            UPDATE students SET name=?, course=?, attendance=?, fees_status=?, library_books=?, contact=?, email=?, dob=?, marks=?, linkedin=?
            WHERE register_number=?
        ''', (name, course, attendance, fees_status, library_books, contact, email, dob, marks, linkedin, register_number))
        
    conn.commit()
    conn.close()
    return jsonify({"message": "Student updated successfully!"}), 200

@app.route('/api/students/<register_number>', methods=['GET'])
def get_student(register_number):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM students WHERE register_number = ?', (register_number,))
    student = c.fetchone()
    conn.close()
    
    if student:
        return jsonify(dict(student))
    else:
        return jsonify({"error": "Student not found!"}), 404

@app.route('/api/students/<register_number>', methods=['DELETE'])
def delete_student(register_number):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('DELETE FROM students WHERE register_number = ?', (register_number,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Student deleted successfully!"}), 200

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', debug=False, port=port)
