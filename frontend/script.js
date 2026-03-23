const API_BASE = (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? "http://127.0.0.1:5000/api"
    : window.location.origin + "/api";

const loginForm = document.getElementById("student-login-form");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const usn = document.getElementById("login-usn").value.trim();
        const password = document.getElementById("login-password").value.trim();
        const errorDiv = document.getElementById("login-message");

        if (usn && password) {
            try {
                const response = await fetch(`${API_BASE}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usn, password })
                });
                const result = await response.json();

                if (response.ok && result.success) {
                    window.location.href = `student.html?usn=${usn}`;
                } else {
                    errorDiv.innerText = result.error || "Invalid USN or Password";
                }
            } catch (error) {
                console.error("Login error", error);
                errorDiv.innerText = "Connection error. Make sure backend is running.";
            }
        }
    });
}

const addStudentForm = document.getElementById("add-student-form");
if (addStudentForm) {
    addStudentForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const messageDiv = document.getElementById("add-message");

        const toBase64 = file => new Promise((resolve, reject) => {
            if (!file) resolve("");
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });

        const photoFile = document.getElementById("add-photo").files[0];
        const photo = await toBase64(photoFile);

        const data = {
            name: document.getElementById("add-name").value,
            register_number: document.getElementById("add-usn").value,
            course: document.getElementById("add-course").value,
            attendance: document.getElementById("add-attendance").value,
            fees_status: document.getElementById("add-fees").value,
            contact: document.getElementById("add-contact").value,
            email: document.getElementById("add-email").value,
            dob: document.getElementById("add-dob").value,
            marks: document.getElementById("add-marks").value,
            linkedin: document.getElementById("add-linkedin").value,
            password: document.getElementById("add-password").value,
            resume: document.getElementById("add-resume").value,
            github: document.getElementById("add-github").value,
            marks_10th: document.getElementById("add-marks-10th").value,
            marks_puc: document.getElementById("add-marks-puc").value,
            photo: photo
        };

        const isEdit = addStudentForm.dataset.mode === "edit";
        const url = isEdit ? `${API_BASE}/students/${data.register_number}` : `${API_BASE}/students`;
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();

            if (response.ok) {
                messageDiv.className = "alert alert-success mt-2 p-2 small";
                messageDiv.innerText = result.message;
                addStudentForm.reset();
                delete addStudentForm.dataset.mode;
                document.getElementById("add-usn").disabled = false;
                loadStudents();
            } else {
                messageDiv.className = "alert alert-danger mt-2 p-2 small";
                messageDiv.innerText = result.error;
            }
        } catch (error) {
            messageDiv.className = "alert alert-danger mt-2 p-2 small";
            messageDiv.innerText = "Error saving student.";
        }
    });
}

async function loadStudents() {
    const list = document.getElementById("students-list");
    if (!list) return;

    try {
        const response = await fetch(`${API_BASE}/students`);
        const students = await response.json();
        list.innerHTML = "";
        students.forEach(student => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${student.register_number}</td>
                <td>${student.name}</td>
                <td>${student.course}</td>
                <td class="fw-bold text-primary">${student.password}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editStudent('${student.register_number}')">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteStudent('${student.register_number}')">Del</button>
                </td>
            `;
            list.appendChild(tr);
        });
    } catch (error) {
        console.error("Error loading students", error);
    }
}

async function editStudent(usn) {
    try {
        const response = await fetch(`${API_BASE}/students/${usn}`);
        const student = await response.json();
        
        document.getElementById("add-name").value = student.name;
        document.getElementById("add-usn").value = student.register_number;
        document.getElementById("add-usn").disabled = true;
        document.getElementById("add-course").value = student.course;
        document.getElementById("add-attendance").value = student.attendance;
        document.getElementById("add-fees").value = student.fees_status;
        document.getElementById("add-contact").value = student.contact;
        document.getElementById("add-email").value = student.email;
        document.getElementById("add-dob").value = student.dob;
        document.getElementById("add-marks").value = student.marks;
        document.getElementById("add-linkedin").value = student.linkedin;
        document.getElementById("add-password").value = student.password || "123456";
        document.getElementById("add-resume").value = student.resume || "";
        document.getElementById("add-github").value = student.github || "";
        document.getElementById("add-marks-10th").value = student.marks_10th || "";
        document.getElementById("add-marks-puc").value = student.marks_puc || "";

        addStudentForm.dataset.mode = "edit";
        window.scrollTo(0, 0);
    } catch (e) {
        console.error("Error editing student", e);
    }
}

async function deleteStudent(usn) {
    if (!confirm("Are you sure you want to delete this student?")) return;
    try {
        const response = await fetch(`${API_BASE}/students/${usn}`, { method: 'DELETE' });
        if (response.ok) loadStudents();
    } catch (e) {
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

        const cleanLink = (url) => {
          if (!url) return '';
          return url.match(/^https?:\/\//i) ? url : `https://${url}`;
        };

        const linkedinUrl = cleanLink(student.linkedin);
        const githubUrl = cleanLink(student.github);
        const resumeUrl = cleanLink(student.resume);
        const marks10thUrl = cleanLink(student.marks_10th);
        const marksPucUrl = cleanLink(student.marks_puc);

        const attendanceValue = parseInt(student.attendance) || 0;
        let attendanceColor = 'bg-success';
        if (attendanceValue < 75) attendanceColor = 'bg-warning';
        if (attendanceValue < 50) attendanceColor = 'bg-danger';
        
        const badgeHTML = isFull ? `<span class="position-absolute top-50 end-0 translate-middle-y me-3 badge bg-success border border-light rounded-pill animation-pulse" style="font-size: 0.6rem; animation: pulse 2s infinite;">✔️ VERIFIED</span>` : '';

        let detailsHTML = `<div class="d-flex justify-content-between border-bottom pb-1 mb-1"><span>Department:</span> <strong>${student.course}</strong></div>`;
        
        if (isFull) {
            detailsHTML += `
                <div class="d-flex justify-content-between border-bottom pb-1 mb-1"><span>DOB:</span> <strong>${student.dob || 'N/A'}</strong></div>
                <div class="d-flex justify-content-between border-bottom pb-1 mb-1"><span>Contact:</span> <strong>${student.contact || 'N/A'}</strong></div>
                <div class="d-flex justify-content-between border-bottom pb-1 mb-1"><span>Email:</span> <strong>${student.email || 'N/A'}</strong></div>
                <div class="d-flex justify-content-between border-bottom pb-1 mb-1"><span>Marks:</span> <strong>${student.marks || 'N/A'}</strong></div>
                <div class="d-flex justify-content-between border-bottom pb-1 mb-1"><span>Fees:</span> <span class="badge ${student.fees_status === 'Paid' ? 'bg-success' : 'bg-danger'}">${student.fees_status}</span></div>
                
                <div class="mt-3 text-start px-2">
                    <small class="text-muted d-block mb-1 fw-bold border-bottom">🌐 SOCIAL PROFILES</small>
                    <div class="d-flex flex-column gap-1 align-items-start">
                       ${linkedinUrl ? `<a href="${linkedinUrl}" target="_blank" class="badge bg-primary text-decoration-none w-100 text-start">LinkedIn Profile</a>` : ''}
                       ${githubUrl ? `<a href="${githubUrl}" target="_blank" class="badge bg-dark text-decoration-none w-100 text-start">GitHub Profile</a>` : ''}
                       ${resumeUrl ? `<a href="${resumeUrl}" target="_blank" class="badge bg-secondary text-decoration-none w-100 text-start">Resume / Portfolio</a>` : ''}
                    </div>
                </div>

                <div class="mt-3 text-start px-2">
                    <small class="text-muted d-block mb-1 fw-bold border-bottom">🎓 ACADEMIC RECORDS</small>
                    <div class="d-flex flex-column gap-1 align-items-start">
                       ${marks10thUrl ? `<a href="${marks10thUrl}" target="_blank" class="badge bg-info text-dark text-decoration-none w-100 text-start">10th Marks Card</a>` : ''}
                       ${marksPucUrl ? `<a href="${marksPucUrl}" target="_blank" class="badge bg-info text-dark text-decoration-none w-100 text-start">PUC Marks Card</a>` : ''}
                    </div>
                </div>

                <div class="mt-4">
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
                K.L.E. SOCIETY’S S. NIJALINGAPPA COLLEGE
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
                ${!isFull ? `<div class="qr-container mt-3"><img src="${qrImageSrc}" alt="QR"><p class="small text-muted mb-0 mt-1">Scan for verification</p></div>` : ''}
            </div>
        `;

    } catch (error) {
        cardContainer.innerHTML = `<div class="p-4 text-center text-danger">Server connection error.</div>`;
    }
}

const refreshQrsBtn = document.getElementById("refresh-qrs-btn");
if (refreshQrsBtn) {
    refreshQrsBtn.addEventListener("click", async () => {
        if (!confirm("This will update all QR codes so they work on phone. Continue?")) return;
        
        refreshQrsBtn.disabled = true;
        refreshQrsBtn.innerText = "Fixing...";
        
        try {
            const response = await fetch(`${API_BASE}/students/refresh-qrs`, { method: "POST" });
            const result = await response.json();
            alert(result.message || "QR Codes refreshed!");
            if (typeof loadStudents === "function") loadStudents();
        } catch (error) {
            alert("Failed to refresh QR codes. Is the server running?");
        } finally {
            refreshQrsBtn.disabled = false;
            refreshQrsBtn.innerText = "Fix QR Codes";
        }
    });
}

if (document.getElementById("students-list")) loadStudents();
if (document.getElementById("id-card")) loadStudentCard();
