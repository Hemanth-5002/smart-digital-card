const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? (window.location.port === "5000" ? "/api" : "http://localhost:5000/api")
    : (window.location.protocol === "file:" ? "http://localhost:5000/api" : "/api");


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
                errorDiv.innerText = "Connection error. Make sure the backend server (app.py) is running on port 5000.";
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
            library_books: document.getElementById("add-library")?.value || 'None',
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
            blood_group: document.getElementById("add-blood-group")?.value || 'N/A',
            emergency_contact: document.getElementById("add-emergency-contact")?.value || 'N/A',
            skills: JSON.stringify((document.getElementById("add-skills")?.value || "").split(',').map(s => s.trim()).filter(s => s) || []),
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

            // Try to parse JSON, if it fails, catch it and show error
            let result;
            try {
                result = await response.json();
            } catch (jsonErr) {
                console.error("JSON Parse Error:", jsonErr);
                messageDiv.className = "alert alert-danger mt-2 p-2 small";
                messageDiv.innerText = "Crucial Server Error: Received non-JSON response.";
                return;
            }

            if (response.ok) {
                messageDiv.className = "alert alert-success mt-2 p-2 small";
                messageDiv.innerText = result.message;
                addStudentForm.reset();
                delete addStudentForm.dataset.mode;
                document.getElementById("add-usn").disabled = false;
                loadStudents();
            } else {
                messageDiv.className = "alert alert-danger mt-2 p-2 small";
                messageDiv.innerText = result.error || "Server error occurred.";
                console.error("Save Error Response:", result);
            }
        } catch (error) {
            console.error("Full Save Error Object:", error);
            messageDiv.className = "alert alert-danger mt-2 p-2 small";
            messageDiv.innerText = "Connection error. Make sure the backend server (app.py) is running on port 5000.";
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
                <td>
                    ${student.name}
                    ${(student.verified_10th || student.verified_puc) ? '<span class="text-success ms-1" title="Documents Verified">✓</span>' : ''}
                </td>
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
        document.getElementById("add-blood-group").value = student.blood_group || "";
        document.getElementById("add-emergency-contact").value = student.emergency_contact || "";

        let skillsStr = "";
        try {
            if (student.skills) {
                const skillsArr = JSON.parse(student.skills);
                skillsStr = Array.isArray(skillsArr) ? skillsArr.join(", ") : student.skills;
            }
        } catch (e) {
            skillsStr = student.skills || "";
        }
        document.getElementById("add-skills").value = skillsStr;

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

// --- UNIQUE SMART FEATURES LOGIC ---

function getAchievements(student) {
    const badges = [];
    const attendance = parseInt(student.attendance) || 0;
    const marks = parseFloat(student.marks) || 0;
    let skillsArr = [];
    try {
        skillsArr = JSON.parse(student.skills || '[]');
        if (!Array.isArray(skillsArr)) skillsArr = student.skills.split(',').map(s => s.trim()).filter(s => s);
    } catch (e) { skillsArr = []; }

    if (attendance >= 90) badges.push({ icon: '🔥', title: 'ATTENDANCE WARRIOR' });
    if (marks >= 90) badges.push({ icon: '🏆', title: 'ACADEMIC ACE' });
    if (skillsArr.length >= 5) badges.push({ icon: '🚀', title: 'SKILL TITAN' });
    if (student.verified_10th && student.verified_puc) badges.push({ icon: '🛡️', title: 'VERIFIED EXPLORER' });
    if (student.github) badges.push({ icon: '💻', title: 'CODE ARCHITECT' });
    
    return badges;
}

function getPathfinderData(student) {
    let skillsArr = [];
    try {
        skillsArr = JSON.parse(student.skills || '[]');
        if (!Array.isArray(skillsArr)) skillsArr = student.skills.split(',').map(s => s.trim()).filter(s => s);
    } catch (e) { skillsArr = []; }

    const skillsStr = skillsArr.join(' ').toLowerCase();
    
    if (skillsStr.includes('python') || skillsStr.includes('data') || skillsStr.includes('ml')) {
        return [
            { step: 'Phase 1', title: 'Data Analyst', desc: 'Focus on SQL and visualization tools like Tableau.' },
            { step: 'Phase 2', title: 'ML Engineer', desc: 'Deep dive into Scikit-Learn and Neural Networks.' },
            { step: 'Goal', title: 'AI Research Scientist', desc: 'Top tier role at labs like DeepMind or OpenAI.' }
        ];
    } else if (skillsStr.includes('react') || skillsStr.includes('js') || skillsStr.includes('web')) {
        return [
            { step: 'Phase 1', title: 'Frontend Developer', desc: 'Master React, HTML/CSS, and Framer Motion.' },
            { step: 'Phase 2', title: 'Full Stack Ninja', desc: 'Add Node.js and MongoDB to your arsenal.' },
            { step: 'Goal', title: 'Product Architect', desc: 'Lead engineering teams and design scalable systems.' }
        ];
    } else {
        return [
            { step: 'Phase 1', title: 'Junior Developer', desc: 'Build a strong foundation in Data Structures.' },
            { step: 'Phase 2', title: 'Software Engineer', desc: 'Contribute to large-scale open source projects.' },
            { step: 'Goal', title: 'Tech Lead', desc: 'Drive technical vision for global products.' }
        ];
    }
}

function openPathfinder(student) {
    let overlay = document.getElementById('pathfinder-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'pathfinder-overlay';
        overlay.className = 'pathfinder-overlay';
        document.body.appendChild(overlay);
    }

    const pathData = getPathfinderData(student);
    overlay.innerHTML = `
        <button class="close-pathfinder" onclick="document.getElementById('pathfinder-overlay').classList.remove('active')">×</button>
        <div class="pathfinder-content">
            <h2 class="pathfinder-title">AI CAREER PATHFINDER</h2>
            <span class="pathfinder-subtitle">Based on your indexed skills & academic pulse</span>
            <div class="roadmap">
                ${pathData.map(node => `
                    <div class="road-node">
                        <div class="node-step">${node.step}</div>
                        <div class="node-title">${node.title}</div>
                        <div class="node-desc">${node.desc}</div>
                    </div>
                `).join('')}
            </div>
            <p class="text-center mt-4 small opacity-50" style="font-family: 'Space Mono', monospace;">AI Analysis Engine v2.0-Alpha</p>
        </div>
    `;
    overlay.classList.add('active');
}

async function loadStudentCard() {
    const urlParams = new URLSearchParams(window.location.search);
    const usn = urlParams.get('usn');

    const cardContainer = document.getElementById("id-card");
    const assemblyContainer = document.getElementById("assembly-container");

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
        const isPublic = urlParams.get('public') === 'true';

        // 1. Calculate Badges & Pulse
        const badges = getAchievements(student);
        const marksVal = parseFloat(student.marks) || 0;
        let skillsCount = 0;
        try {
            const sArr = JSON.parse(student.skills || '[]');
            skillsCount = Array.isArray(sArr) ? sArr.length : (student.skills ? student.skills.split(',').length : 0);
        } catch(e) { skillsCount = 0; }
        
        const readinessScore = Math.min(100, Math.round((marksVal * 0.4) + (parseInt(student.attendance) * 0.3) + (skillsCount * 5)));
        const strokeDashoffset = 282.7 - (282.7 * readinessScore / 100);

        // Materialize Fixed Layout Content
        cardContainer.innerHTML = `
            <div class="card-content-extreme">
                <div class="header-strip ${isPublic ? 'public-mode-hidden' : ''}">
                    <p class="college-name-small">K.L.E. S. NIJALINGAPPA COLLEGE</p>
                </div>

                <div class="achievement-badges-container">
                    ${badges.map(b => `<div class="badge-item" data-title="${b.title}">${b.icon}</div>`).join('')}
                </div>
                
                <div class="hex-dual-container">
                    <div class="ring-outer"></div>
                    <div class="ring-inner"></div>
                    <div class="hex-portrait-fixed">
                         <img src="${student.photo || 'broken'}" 
                               alt="Profile" 
                               onerror="this.onerror=null; this.outerHTML='<div class=\'fallback-avatar\'>👤</div>';">
                    </div>
                </div>

                <div class="text-center px-2">
                    <h1 class="name-shimmer-fixed">${student.name}</h1>
                    <div class="verified-pill">
                        ✦ ${isPublic ? 'PUBLIC PROFILE' : 'VERIFIED IDENTITY'} ✦
                    </div>
                </div>

                <div class="scrollable-info-zone">
                    <div class="data-chips-container">
                        <div class="data-chip-extreme">
                            <span class="chip-label d-block">DEPARTMENT</span>
                            <span class="chip-value">${student.course}</span>
                        </div>
                        <div class="data-chip-extreme ${isPublic ? 'public-mode-hidden' : ''}">
                            <span class="chip-label d-block">REGISTER NUMBER</span>
                            <span class="chip-value">${student.register_number}</span>
                        </div>
                    </div>

                    <!-- Unique Feature: Readiness Pulse -->
                    <div class="academic-pulse-container">
                        <svg class="pulse-svg" width="110" height="110">
                            <circle class="pulse-bg" cx="55" cy="55" r="45"></circle>
                            <circle class="pulse-fill" cx="55" cy="55" r="45" style="stroke-dashoffset: ${strokeDashoffset}"></circle>
                        </svg>
                        <div class="pulse-value-box">
                            ${readinessScore}<span style="font-size: 0.6rem;">%</span>
                            <span class="pulse-label">READINESS</span>
                        </div>
                    </div>

                    <button class="pathfinder-trigger" id="pathfinder-btn">AI Career Pathfinder</button>

                    ${(isFull || window.location.href.includes('full=true')) ? `
                    <div class="advanced-details-panel">
                        <div class="detail-divider"><span>ADVANCED INTEL</span></div>
                        
                        <div class="detail-sub-section">
                            <div class="detail-title">SOCIAL PROFILES</div>
                            <div class="social-links-flex">
                                ${student.linkedin ? `<a href="${student.linkedin}" target="_blank" class="intel-link">LINKEDIN</a>` : ''}
                                ${student.github ? `<a href="${student.github}" target="_blank" class="intel-link">GITHUB</a>` : ''}
                                ${student.resume ? `<a href="${student.resume}" target="_blank" class="intel-link">RESUME</a>` : ''}
                            </div>
                        </div>

                        ${!isPublic ? `
                        <div class="detail-sub-section mt-2">
                            <div class="detail-title">ACADEMIC RECORDS (CLICK TO VIEW)</div>
                            <div class="marks-flex">
                                ${student.marks_10th ? `
                                <a href="${student.marks_10th}" target="_blank" class="mark-pill intel-link-pill">
                                    <small>10TH</small> <span>View Doc</span>
                                    ${student.verified_10th ? `<div class="govt-verify-badge" title="Verified by College Admin">✓</div>` : ''}
                                </a>` : `<div class="mark-pill opacity-50"><small>10TH</small> <span>N/A</span></div>`}

                                ${student.marks_puc ? `
                                <a href="${student.marks_puc}" target="_blank" class="mark-pill intel-link-pill">
                                    <small>PUC</small> <span>View Doc</span>
                                    ${student.verified_puc ? `<div class="govt-verify-badge" title="Verified by College Admin">✓</div>` : ''}
                                </a>` : `<div class="mark-pill opacity-50"><small>PUC</small> <span>N/A</span></div>`}
                                
                                <div class="mark-pill"><small>AGG</small> <span>${student.marks || 'N/A'}</span></div>
                            </div>
                        </div>

                        <div class="detail-sub-section mt-2">
                            <div class="detail-title">CONTACT DATA</div>
                            <div class="contact-text">${student.email || 'N/A'}</div>
                            <div class="contact-text">${student.contact || 'N/A'}</div>
                        </div>

                        <div class="detail-sub-section mt-2">
                            <div class="detail-title">EMERGENCY INTEL</div>
                            <div class="contact-text">BLOOD: <span class="text-danger fw-bold">${student.blood_group || 'N/A'}</span></div>
                            <div class="contact-text">EMERGENCY: ${student.emergency_contact || 'N/A'}</div>
                        </div>
                        ` : `
                        <div class="detail-sub-section mt-2">
                            <div class="detail-title">PROFILE STATUS</div>
                            <div class="contact-text text-success">✓ IDENTITY VERIFIED BY INSTITUTION</div>
                            <div class="contact-text text-warning">⚠ PRIVATE DATA ENCRYPTED</div>
                        </div>
                        `}
                    </div>
                    ` : ''}

                    <!-- Unique Feature: Skill Hex Grid -->
                    <div class="detail-divider mt-4"><span>SKILL NEXUS</span></div>
                    <div class="skills-hex-container" id="skills-container-target">
                        <!-- Populated below -->
                    </div>
                </div>

                <div class="qr-restricted-section ${isPublic ? 'public-mode-hidden' : ''}">
                    <div class="reticle-frame-small">
                        <div class="reticle-corner corner-tl"></div>
                        <div class="reticle-corner corner-tr"></div>
                        <div class="reticle-corner corner-bl"></div>
                        <div class="reticle-corner corner-br"></div>
                        <div class="laser-sweep" style="display: block; animation: laserScan 2s infinite linear;"></div>
                        <img src="${qrImageSrc}" class="qr-img-fixed" alt="QR">
                    </div>
                    <div class="scan-text-blink mt-1">[ SCAN TO VERIFY ]</div>
                </div>
            </div>
        `;

        // Handle Pathfinder Button
        const pathBtn = document.getElementById("pathfinder-btn");
        if (pathBtn) {
            pathBtn.onclick = () => openPathfinder(student);
        }

        // Trust Ring Logic
        const attendanceVal = parseInt(student.attendance) || 0;
        const ringOuter = cardContainer.querySelector('.ring-outer');
        if (attendanceVal >= 85) ringOuter.style.borderColor = "#00ff80";
        else if (attendanceVal >= 75) ringOuter.style.borderColor = "#ffaa00";
        else ringOuter.style.borderColor = "#ff0000";

        // Render Skills Hex-Grid
        const skillsContainer = document.getElementById("skills-container-target");
        let skillsArr = [];
        try {
            skillsArr = JSON.parse(student.skills || '[]');
            if (!Array.isArray(skillsArr)) skillsArr = student.skills.split(',').map(s => s.trim()).filter(s => s);
        } catch (e) {
            if (student.skills) skillsArr = student.skills.split(',').map(s => s.trim()).filter(s => s);
        }

        if (skillsArr.length > 0) {
            skillsContainer.innerHTML = skillsArr.map(skill => `
                <div class="skill-hex">
                    <div class="skill-text">${skill.toUpperCase()}</div>
                </div>
            `).join('');
        } else {
            skillsContainer.innerHTML = '<div class="small text-muted opacity-50">NO SKILLS INDEXED</div>';
        }

        // SOS Mode Logic
        const sosBtn = document.getElementById("sos-btn");
        const sosOverlay = document.getElementById("sos-overlay");
        const sosExitBtn = document.getElementById("sos-exit-btn");
        const sosTarget = document.getElementById("sos-content-target");

        sosBtn.onclick = () => {
            document.body.classList.add('sos-active');
            sosTarget.innerHTML = `
                <div class="sos-card">
                    <div class="sos-data-row">
                        <div class="sos-label">Patient Name</div>
                        <div class="sos-value" style="color: black;">${student.name}</div>
                    </div>
                    <div class="sos-data-row">
                        <div class="sos-label">Blood Group</div>
                        <div class="sos-value">${student.blood_group || 'UNKNOWN'}</div>
                    </div>
                    <div class="sos-data-row">
                        <div class="sos-label">Emergency Contact</div>
                        <div class="sos-value">${student.emergency_contact || student.contact || 'N/A'}</div>
                    </div>
                    <div class="sos-data-row">
                        <div class="sos-label">Medical Conditions</div>
                        <div class="sos-value" style="font-size: 1rem;">NO KNOWN ALLERGIES</div>
                    </div>
                    <a href="tel:${student.emergency_contact || student.contact}" class="btn-emergency-call">
                        📞 CALL EMERGENCY CONTACT
                    </a>
                </div>
            `;
        };

        sosExitBtn.onclick = () => {
            document.body.classList.remove('sos-active');
        };

        // Start Assembly Animation
        setTimeout(() => {
            if (assemblyContainer) assemblyContainer.classList.add('assembled');
        }, 100);

        // Parallax Effect for Anti-Gravity Card
        if (assemblyContainer) {
            assemblyContainer.addEventListener("mousemove", (e) => {
                const card = document.getElementById("id-card");
                const { left, top, width, height } = assemblyContainer.getBoundingClientRect();
                const x = (e.clientX - left) / width - 0.5;
                const y = (e.clientY - top) / height - 0.5;
                // Restricted tilt to 8 degrees as per prompt
                card.style.transform = `rotateY(${x * 16}deg) rotateX(${y * -16}deg)`;
            });
            assemblyContainer.addEventListener("mouseleave", () => {
                const card = document.getElementById("id-card");
                card.style.transform = `rotateY(0deg) rotateX(0deg)`;
            });
        }

        // Download Button Implementation
        const downloadBtn = document.getElementById("download-id-btn");
        if (downloadBtn) {
            downloadBtn.onclick = () => {
                window.print();
            };
        }

        // Share Public Profile Button (New Unique Feature)
        const shareBtn = document.createElement('button');
        shareBtn.className = 'btn-extreme btn-download-extreme';
        shareBtn.style.background = 'linear-gradient(135deg, #00f5ff 0%, #0055ff 100%)';
        shareBtn.style.color = 'black';
        shareBtn.innerHTML = '<span class="me-2">🔗</span> SHARE PUBLIC';
        shareBtn.onclick = () => {
            const publicUrl = window.location.href.split('&')[0].split('?')[0] + `?usn=${usn}&full=true&public=true`;
            navigator.clipboard.writeText(publicUrl).then(() => {
                shareBtn.innerHTML = '<span class="me-2">✅</span> COPIED!';
                setTimeout(() => shareBtn.innerHTML = '<span class="me-2">🔗</span> SHARE PUBLIC', 2000);
            });
        };
        
        const actionRow = document.querySelector('.floating-actions-fixed');
        if (actionRow && !isPublic) {
            actionRow.insertBefore(shareBtn, actionRow.firstChild);
        }

    } catch (error) {
        console.error("Student Card Load Error:", error);
        cardContainer.innerHTML = `<div class="p-4 text-center text-danger">
            <strong>Server Connection Error</strong><br>
            <small>Could not connect to the database. Make sure app.py is running.</small>
        </div>`;
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

// Particle Generation for Space Background
function createParticles() {
    const particleContainer = document.querySelector('.particles');
    if (!particleContainer) return;

    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle-dot';

        // Random positions
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const size = Math.random() * 3 + 1;
        const duration = Math.random() * 20 + 20;
        const delay = Math.random() * 20;

        particle.style.cssText = `
            position: absolute;
            top: ${y}%;
            left: ${x}%;
            width: ${size}px;
            height: ${size}px;
            background: white;
            border-radius: 50%;
            opacity: ${Math.random() * 0.4 + 0.1};
            filter: blur(1px);
            animation: drift ${duration}s linear infinite;
            animation-delay: -${delay}s;
        `;
        particleContainer.appendChild(particle);
    }
}

// Add drift animation to document styles
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes drift {
        0% { transform: translate(0, 0); opacity: 0; }
        10% { opacity: 0.3; }
        90% { opacity: 0.3; }
        100% { transform: translate(100px, -100px); opacity: 0; }
    }
`;
document.head.appendChild(styleSheet);

document.addEventListener("DOMContentLoaded", () => {
    createParticles();
    if (document.getElementById("students-list")) loadStudents();
    if (document.getElementById("id-card")) loadStudentCard();
});

