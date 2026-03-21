const API_BASE = (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? "http://127.0.0.1:5000/api"
    : window.location.origin + "/api";

const loginForm = document.getElementById("student-login-form");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const usn = document.getElementById("login-usn").value.trim();
        if (usn) {
            window.location.href = `student.html?usn=${usn}`;
        }
    });
}

const addStudentForm = document.getElementById("add-student-form");
if (addStudentForm) {
    addStudentForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const messageDiv = document.getElementById("add-message");

        const photoInput = document.getElementById("add-photo");
        let photoBase64 = "";
        if (photoInput && photoInput.files.length > 0) {
            photoBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(photoInput.files[0]);
            });
        }

        const data = {
            name: document.getElementById("add-name").value.trim(),
            register_number: document.getElementById("add-usn").value.trim(),
            course: document.getElementById("add-course").value.trim(),
            attendance: document.getElementById("add-attendance").value.trim(),
            fees_status: document.getElementById("add-fees").value,
            library_books: document.getElementById("add-library").value.trim(),
            contact: document.getElementById("add-contact").value.trim(),
            email: document.getElementById("add-email").value.trim(),
            dob: document.getElementById("add-dob").value.trim(),
            marks: document.getElementById("add-marks").value.trim(),
            linkedin: document.getElementById("add-linkedin").value.trim(),
            photo: photoBase64
        };

        const mode = document.getElementById("form-mode").value;
        const method = mode === "edit" ? "PUT" : "POST";
        const url = mode === "edit" ? `${API_BASE}/students/${data.register_number}` : `${API_BASE}/students`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            const result = await response.json();

            if (response.ok) {
                messageDiv.className = "mt-2 text-center text-success";
                messageDiv.innerText = mode === "edit" ? "Student updated successfully!" : "Student added successfully!";
                addStudentForm.reset();
                
                // Reset edit mode
                document.getElementById("form-mode").value = "add";
                document.getElementById("add-usn").disabled = false;
                document.querySelector("#add-student-form button[type='submit']").innerText = "Add Student";
                document.querySelector(".card-header.bg-primary").innerText = "Add New Student";
                
                loadStudents();
            } else {
                messageDiv.className = "mt-2 text-center text-danger";
                messageDiv.innerText = result.error || "Failed to add student.";
            }
        } catch (error) {
            messageDiv.className = "mt-2 text-center text-danger";
            messageDiv.innerText = "Server connection error.";
        }
    });
}

async function loadStudents() {
    const listBody = document.getElementById("students-list");
    if (!listBody) return;

    try {
        const response = await fetch(`${API_BASE}/students`);
        const students = await response.json();

        listBody.innerHTML = "";
        students.forEach(s => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${s.register_number}</td>
                <td>${s.name}</td>
                <td>${s.course}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-1" onclick="editStudent('${s.register_number}')">Edit</button>
                    <button class="btn btn-sm btn-danger me-1" onclick="deleteStudent('${s.register_number}')">Del</button>
                    <a href="student.html?usn=${s.register_number}" class="btn btn-sm btn-info" target="_blank">Card</a>
                </td>
            `;
            listBody.appendChild(tr);
        });
    } catch (error) {
        console.error("Failed to load students", error);
    }
}

window.editStudent = async function(usn) {
    try {
        const response = await fetch(`${API_BASE}/students/${usn}`);
        if(response.ok) {
            const s = await response.json();
            document.getElementById("form-mode").value = "edit";
            document.getElementById("add-usn").value = s.register_number;
            document.getElementById("add-usn").disabled = true;
            document.getElementById("add-name").value = s.name;
            document.getElementById("add-course").value = s.course;
            document.getElementById("add-attendance").value = s.attendance;
            document.getElementById("add-library").value = s.library_books;
            document.getElementById("add-contact").value = s.contact;
            document.getElementById("add-email").value = s.email;
            document.getElementById("add-dob").value = s.dob;
            document.getElementById("add-marks").value = s.marks;
            document.getElementById("add-linkedin").value = s.linkedin;
            document.getElementById("add-fees").value = s.fees_status;
            
            document.querySelector("#add-student-form button[type='submit']").innerText = "Update Student";
            document.querySelector(".card-header.bg-primary").innerText = "Edit Student";
            window.scrollTo(0,0);
        }
    } catch(e) {
        console.error("Failed to load student for edit", e);
    }
}

window.deleteStudent = async function(usn) {
    if(!confirm(`Are you absolutely sure you want to permanently delete student ${usn}?`)) return;
    try {
        const response = await fetch(`${API_BASE}/students/${usn}`, { method: 'DELETE' });
        if(response.ok) {
            loadStudents();
        } else {
            alert("Failed to delete student!");
        }
    } catch(e) {
        console.error("Failed to delete student", e);
    }
}

async function loadStudentCard() {
    const urlParams = new URLSearchParams(window.location.search);
    const usn = urlParams.get('usn');
    const cardContainer = document.getElementById("id-card");

    if (!usn) {
        cardContainer.innerHTML = `<div class="p-4 text-center text-danger">Invalid Request. No USN provided.</div>`;
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/students/${usn}`);
        if (!response.ok) {
            cardContainer.innerHTML = `<div class="p-4 text-center text-danger">Student not found!</div>`;
            return;
        }

        const student = await response.json();
        const qrImageSrc = `data:image/png;base64,${student.qr_code}`;
        const isFull = urlParams.get('full') === 'true';

        const attendanceValue = parseInt(student.attendance) || 0;
        let attendanceColor = 'bg-success';
        if (attendanceValue < 75) attendanceColor = 'bg-warning';
        if (attendanceValue < 50) attendanceColor = 'bg-danger';
        
        const badgeHTML = isFull ? `<span class="position-absolute top-50 end-0 translate-middle-y me-3 badge bg-success border border-light rounded-pill animation-pulse" style="font-size: 0.6rem; animation: pulse 2s infinite;">✔️ VERIFIED</span>` : '';
        const clockHTML = isFull ? `<div class="text-center mt-3 border-top pt-2"><small id="live-clock" class="text-muted fw-bold" style="font-family: monospace; font-size: 0.75rem;"></small></div>` : '';

        let detailsHTML = `<div class="d-flex justify-content-between border-bottom pb-1 mb-1"><span>Course:</span> <strong>${student.course}</strong></div>`;
        
        if (isFull) {
            detailsHTML += `
                <div class="d-flex justify-content-between border-bottom pb-1 mb-1"><span>DOB:</span> <strong>${student.dob || 'N/A'}</strong></div>
                <div class="d-flex justify-content-between border-bottom pb-1 mb-1"><span>Contact:</span> <strong>${student.contact || 'N/A'}</strong></div>
                <div class="d-flex justify-content-between border-bottom pb-1 mb-1"><span>Email:</span> <strong>${student.email || 'N/A'}</strong></div>
                <div class="d-flex justify-content-between border-bottom pb-1 mb-1"><span>Marks:</span> <strong>${student.marks || 'N/A'}</strong></div>
                <div class="d-flex justify-content-between border-bottom pb-1 mb-1"><span>Fees:</span> <span class="badge ${student.fees_status === 'Paid' ? 'bg-success' : 'bg-danger'}">${student.fees_status}</span></div>
                <div class="d-flex justify-content-between border-bottom pb-1 mb-1"><span>Library:</span> <strong>${student.library_books}</strong></div>
                <div class="d-flex justify-content-between border-bottom pb-1 mb-1"><span>LinkedIn:</span> <a href="${student.linkedin || '#'}" target="_blank" class="badge bg-primary text-decoration-none">View Profile</a></div>
                
                <div class="mt-3">
                    <div class="d-flex justify-content-between small fw-bold text-muted mb-1">
                        <span>Attendance Progress</span>
                        <span>${student.attendance}</span>
                    </div>
                    <div class="progress shadow-sm" style="height: 10px; border-radius: 10px;">
                        <div class="progress-bar ${attendanceColor} progress-bar-striped progress-bar-animated" role="progressbar" style="width: ${attendanceValue}%" aria-valuenow="${attendanceValue}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                </div>
            `;
        }

        cardContainer.innerHTML = `
            <div class="id-card-header position-relative">
                SMART COLLEGE
                ${badgeHTML}
            </div>
            <div class="id-card-body" style="background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px);">
                <div class="id-card-photo shadow-sm" style="background-image: url('${student.photo || ''}'); background-size: cover; background-position: center; border-radius: 50%; width: 100px; height: 100px; margin: 0 auto; border: 4px solid #0d6efd;">
                    ${!student.photo ? '👤' : ''}
                </div>
                <div class="text-center mt-2 mb-3">
                    <h5 class="mb-0 text-primary fw-bold">${student.name}</h5>
                    <small class="text-muted fw-bold">${student.register_number}</small>
                </div>
                <div class="id-card-details">
                    ${detailsHTML}
                </div>
                ${!isFull ? `
                <div class="qr-container" style="text-align: center; margin-top: 20px; padding-bottom: 5px;">
                    <img src="${qrImageSrc}" alt="QR Code" style="width: 100%; max-width: 180px; height: auto; border: 3px solid #0d6efd; border-radius: 12px; padding: 10px; image-rendering: pixelated; image-rendering: -webkit-optimize-contrast; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                </div>` : ''}
                ${clockHTML}
            </div>
        `;
        
        if (isFull) {
            setInterval(() => {
                const clock = document.getElementById('live-clock');
                if (clock) clock.innerText = "Verified at: " + new Date().toLocaleString();
            }, 1000);
        }
    } catch (error) {
        cardContainer.innerHTML = `<div class="p-4 text-center text-danger">Server connection error.</div>`;
    }
}
