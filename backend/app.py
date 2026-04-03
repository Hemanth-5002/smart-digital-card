from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import sqlite3
import qrcode
import os
from io import BytesIO
import base64
import socket

# --- SETTINGS ---
NGROK_URL = None # Ngrok disabled as per user preference

def get_local_ip():
    try:
        # Standard way to find the primary IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # Using 8.8.8.8 (Google DNS) as a dummy destination.
        # It won't actually send any data.
        s.connect(('8.8.8.8', 80))
        IP = s.getsockname()[0]
    except Exception:
        try:
            # Fallback for offline environments
            IP = socket.gethostbyname(socket.gethostname())
        except Exception:
            IP = '127.0.0.1'
    finally:
        s.close()
    return IP

frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))
app = Flask(__name__, static_folder=frontend_path, static_url_path='')
CORS(app)

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_frontend(path):
    return send_from_directory(app.static_folder, path)

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'students_db.db')

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
            qr_code TEXT,
            password TEXT NOT NULL DEFAULT '123456',
            resume TEXT,
            github TEXT,
            marks_10th TEXT,
            marks_puc TEXT,
            blood_group TEXT,
            emergency_contact TEXT,
            skills TEXT
        )
    ''')
    # Migrations for existing tables
    columns = [
        "password TEXT NOT NULL DEFAULT '123456'", 
        "resume TEXT", 
        "github TEXT", 
        "marks_10th TEXT", 
        "marks_puc TEXT",
        "blood_group TEXT",
        "emergency_contact TEXT",
        "skills TEXT"
    ]
    for col in columns:
        try:
            c.execute(f'ALTER TABLE students ADD COLUMN {col}')
        except sqlite3.OperationalError:
            pass
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
    library_books = data.get('library_books', 'N/A')
    email = data.get('email', 'N/A')
    dob = data.get('dob', 'N/A')
    marks = data.get('marks', 'N/A')
    linkedin = data.get('linkedin', 'N/A')
    photo = data.get('photo', '')
    password = data.get('password', '123456')
    resume = data.get('resume', '')
    github = data.get('github', '')
    marks_10th = data.get('marks_10th', '')
    marks_puc = data.get('marks_puc', '')
    blood_group = data.get('blood_group', 'N/A')
    emergency_contact = data.get('emergency_contact', 'N/A')
    skills = data.get('skills', '[]')
    
    # Generate QR Code URL - Smart detection for local vs production
    host = request.host.split(':')[0]
    if host in ['localhost', '127.0.0.1']:
        base_url = f"http://{get_local_ip()}:{request.host.split(':')[-1] if ':' in request.host else '5000'}"
    else:
        base_url = request.host_url.rstrip('/')
        
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
            INSERT INTO students (name, register_number, course, attendance, fees_status, library_books, contact, email, dob, marks, linkedin, photo, qr_code, password, resume, github, marks_10th, marks_puc, blood_group, emergency_contact, skills)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (name, register_number, course, attendance, fees_status, library_books, contact, email, dob, marks, linkedin, photo, qr_code_base64, password, resume, github, marks_10th, marks_puc, blood_group, emergency_contact, skills))
        conn.commit()
        conn.close()
        return jsonify({"message": "Student added successfully!"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Register number already exists!"}), 400
    except Exception as e:
        print(f"ADD ERROR: {str(e)}")
        return jsonify({"error": f"Database Error: {str(e)}"}), 500

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
    password = data.get('password')
    resume = data.get('resume')
    github = data.get('github')
    marks_10th = data.get('marks_10th', '')
    marks_puc = data.get('marks_puc', '')
    blood_group = data.get('blood_group')
    emergency_contact = data.get('emergency_contact')
    skills = data.get('skills')

    # Update QR Code with current host URL - Smart detection
    host = request.host.split(':')[0]
    if host in ['localhost', '127.0.0.1']:
        base_url = f"http://{get_local_ip()}:{request.host.split(':')[-1] if ':' in request.host else '5000'}"
    else:
        base_url = request.host_url.rstrip('/')
    
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
        
        base_query = 'UPDATE students SET name=?, course=?, attendance=?, fees_status=?, library_books=?, contact=?, email=?, dob=?, marks=?, linkedin=?, qr_code=?, resume=?, github=?, marks_10th=?, marks_puc=?'
        params = [name, course, attendance, fees_status, library_books, contact, email, dob, marks, linkedin, qr_code_base64, resume, github, marks_10th, marks_puc]

        if blood_group:
            base_query += ', blood_group=?'
            params.append(blood_group)
        if emergency_contact:
            base_query += ', emergency_contact=?'
            params.append(emergency_contact)
        if skills:
            base_query += ', skills=?'
            params.append(skills)
        if photo:
            base_query += ', photo=?'
            params.append(photo)
        if password:
            base_query += ', password=?'
            params.append(password)
            
        base_query += ' WHERE register_number=?'
        params.append(register_number)
        
        c.execute(base_query, tuple(params))
        conn.commit()
        conn.close()
        return jsonify({"message": "Student updated successfully!"}), 200
    except Exception as e:
        print(f"UPDATE ERROR: {str(e)}")
        return jsonify({"error": f"Database Update Error: {str(e)}"}), 500

@app.route('/api/students/refresh-qrs', methods=['POST'])
def refresh_all_qrs():
    # Refresh all QR codes with current host URL - Smart detection
    host = request.host.split(':')[0]
    if host in ['localhost', '127.0.0.1']:
        base_url = f"http://{get_local_ip()}:{request.host.split(':')[-1] if ':' in request.host else '5000'}"
    else:
        base_url = request.host_url.rstrip('/')
    
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT register_number FROM students')
    students = c.fetchall()
    
    for s in students:
        usn = s['register_number']
        qr_data = f"{base_url}/student.html?usn={usn}&full=true"
        qr = qrcode.QRCode(version=1, box_size=6, border=4)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill='black', back_color='white')
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        qr_code_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        c.execute('UPDATE students SET qr_code=? WHERE register_number=?', (qr_code_base64, usn))
    
    conn.commit()
    conn.close()
    return jsonify({"message": f"Successfully refreshed all QR codes using {base_url}!"}), 200

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
    return jsonify({"error": "Student not found!"}), 404

@app.route('/api/login', methods=['POST'])
def student_login():
    data = request.json
    usn = data.get('usn')
    password = data.get('password')
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM students WHERE register_number = ? AND password = ?', (usn, password))
    student = c.fetchone()
    conn.close()
    if student:
        return jsonify({"success": True, "message": "Login successful!"})
    return jsonify({"success": False, "error": "Invalid USN or Password!"}), 401

@app.route('/api/students/<register_number>', methods=['DELETE'])
def delete_student(register_number):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('DELETE FROM students WHERE register_number = ?', (register_number,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Student deleted successfully!"}), 200

init_db()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
