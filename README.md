# Smart Digital Card for Students

A web-based application for managing and displaying digital ID cards for students. Features include student registration, QR code generation, and mobile-friendly card display.

## Features

- **Student Management**: Add, edit, and delete student records
- **Digital ID Cards**: Display student information in a professional card format
- **QR Code Generation**: Automatic QR code generation for each student linking to their card
- **Admin Dashboard**: Manage all student information and records
- **Mobile Responsive**: Fully responsive design that works on all devices
- **Database Support**: SQLite database for secure data storage

## Tech Stack

- **Backend**: Python Flask with CORS support
- **Frontend**: HTML5, CSS3, JavaScript
- **Styling**: Bootstrap 5
- **Database**: SQLite3
- **QR Code**: Python qrcode library

## Installation

### Prerequisites
- Python 3.7+
- pip package manager

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd "Smart Digital Card for Students"
```

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Start the Flask server:
```bash
python app.py
```

4. Open your browser and navigate to:
```
http://localhost:5000
```

## Project Structure

```
├── backend/
│   ├── app.py              # Flask application and API routes
│   ├── requirements.txt     # Python dependencies
│   └── students_db.db      # SQLite database (auto-created)
├── frontend/
│   ├── index.html          # Home page with login
│   ├── admin.html          # Admin dashboard
│   ├── student.html        # Student ID card view
│   ├── script.js           # Frontend JavaScript logic
│   └── style.css           # Custom styles
└── README.md
```

## API Endpoints

### Student Management
- `GET /api/students` - Get all students
- `POST /api/students` - Add a new student
- `GET /api/students/<register_number>` - Get specific student
- `PUT /api/students/<register_number>` - Update student information
- `DELETE /api/students/<register_number>` - Delete a student

## Usage

### Student View
1. Go to the home page
2. Enter your Register Number (USN)
3. Click "View My ID Card" to see your digital ID card and QR code

### Admin Dashboard
1. Click "Admin Login" from the home page
2. Add new students using the form on the left
3. View all students in the table on the right
4. Edit or delete student records
5. Click on a student's card to view their full ID card

## Mobile Responsiveness

The application is fully mobile-responsive with optimizations for:
- Small screens (< 600px)
- Tablets (600px - 768px)
- Desktop screens (768px+)

Features include:
- Touch-friendly button sizes
- Responsive grid layout
- Scrollable tables on mobile
- Optimized font sizes
- Proper padding and spacing

## Database Schema

### Students Table
- `id` - Primary key
- `name` - Student name
- `register_number` - Unique register number (USN)
- `course` - Course name
- `attendance` - Attendance percentage
- `fees_status` - Payment status
- `library_books` - Library records
- `contact` - Phone number
- `email` - Email address
- `dob` - Date of birth
- `marks` - CGPA/Marks
- `linkedin` - LinkedIn profile URL
- `photo` - Base64 encoded student photo
- `qr_code` - Generated QR code

## Development

For development with auto-reload enabled:
```bash
python app.py
```

The Flask development server runs with debug mode enabled and will auto-reload on code changes.

## License

This project is open source and available under the MIT License.

## Author

Created as a Smart Digital Card system for student management.
