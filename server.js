const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(express.json());

// 1. Initialize Database
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Database error: ', err.message);
    else console.log('Connected to SQLite database.');
});

// Helper function to validate real domain emails
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(email);
}

// Create Database Schema
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        organisation TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        capacity INTEGER NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
    )`);
});

// ================= 1. AUTHENTICATION & LOGIN PAGE (MOUNTAINS + HANDS + ORIGINAL HEADINGS) =================
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SDG 9 - Event Portal</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; }
            .mountain-bg {
                background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80');
                background-size: cover;
                background-position: center;
            }
        </style>
    </head>
    <body class="mountain-bg text-slate-100 min-h-screen flex flex-col justify-between p-6 relative overflow-x-hidden">
        
        <!-- Top Navbar -->
        <header class="max-w-7xl w-full mx-auto flex justify-between items-center py-4 px-8 bg-slate-950/40 backdrop-blur-md rounded-2xl border border-white/10">
            <div class="flex items-center gap-3">
                <span class="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></span>
                <span class="font-extrabold text-white text-lg tracking-tight">SDG 9 Portal</span>
            </div>
            <nav class="hidden md:flex items-center gap-8 text-xs font-bold text-slate-300">
                <span class="hover:text-white cursor-pointer transition">Home</span>
                <span class="hover:text-white cursor-pointer transition">Portfolio</span>
                <span class="hover:text-white cursor-pointer transition">Courses</span>
                <span class="hover:text-white cursor-pointer transition">About us</span>
                <span class="hover:text-white cursor-pointer transition">Contact us</span>
            </nav>
            <button onclick="switchTab('login')" class="bg-white text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg hover:bg-slate-200 transition">LOG IN</button>
        </header>

        <!-- Centered Modal Box matching reference image -->
        <main class="flex-grow flex items-center justify-center p-4">
            <div class="max-w-4xl w-full bg-white text-slate-900 rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.8)] grid grid-cols-1 md:grid-cols-2 overflow-hidden relative">
                
                <!-- Left Side: Welcome Panel with Laptop/Hands Image -->
                <div class="relative bg-slate-950 p-10 flex flex-col justify-end text-white min-h-[380px]">
                    <div class="absolute inset-0 opacity-40 bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80')"></div>
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
                    <div class="relative z-10">
                        <h2 class="text-3xl font-extrabold tracking-tight mb-2">Welcome Back</h2>
                        <p class="text-xs text-slate-300 leading-relaxed font-medium">Please log in using your personal information to stay connected with us.</p>
                    </div>
                </div>

                <!-- Right Side: Original Forms & Headings -->
                <div class="p-8 md:p-10 flex flex-col justify-center bg-white relative">
                    
                    <!-- Login Form -->
                    <form id="login-form" class="space-y-4">
                        <div class="text-center mb-6">
                            <h3 class="text-2xl font-black text-slate-900 tracking-wider">LOGIN</h3>
                        </div>
                        <div>
                            <input type="email" id="login-email" required class="w-full px-4.5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-cyan-500 outline-none transition placeholder:text-slate-400" placeholder="Email">
                        </div>
                        <div>
                            <input type="password" id="login-password" required class="w-full px-4.5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-cyan-500 outline-none transition placeholder:text-slate-400" placeholder="Password">
                        </div>
                        <div class="flex justify-between items-center text-xs">
                            <label class="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
                                <input type="checkbox" class="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"> Remember me
                            </label>
                            <button type="button" onclick="switchTab('forgot')" class="text-cyan-600 hover:underline font-bold">Forgot password?</button>
                        </div>
                        <button type="submit" class="w-full bg-[#00bcd4] hover:bg-[#00acc1] text-white font-bold p-3.5 rounded-xl text-sm transition shadow-md shadow-cyan-500/25 active:scale-[0.98]">Log In</button>
                        <p class="text-xs text-center text-slate-500 font-medium pt-2">Don't have an account? <button type="button" onclick="switchTab('register')" class="text-cyan-600 font-bold hover:underline">Signup</button></p>
                        <p id="login-error" class="text-xs text-rose-500 text-center font-bold pt-1"></p>
                    </form>

                    <!-- Registration Form -->
                    <form id="register-form" class="space-y-3.5 hidden">
                        <div class="text-center mb-4">
                            <h3 class="text-2xl font-black text-slate-900 tracking-wider">SIGN UP</h3>
                        </div>
                        <div>
                            <input type="text" id="reg-name" required class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-cyan-500 outline-none transition placeholder:text-slate-400" placeholder="Full Name">
                        </div>
                        <div>
                            <input type="email" id="reg-email" required class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-cyan-500 outline-none transition placeholder:text-slate-400" placeholder="Email (Gmail, Yahoo, iCloud)">
                        </div>
                        <div>
                            <input type="password" id="reg-password" required class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-cyan-500 outline-none transition placeholder:text-slate-400" placeholder="Password">
                        </div>
                        <div>
                            <select id="reg-role" required class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-cyan-500 outline-none transition">
                                <option value="user">Attendee (Browse & Register)</option>
                                <option value="admin">Administrator (Manage Events)</option>
                            </select>
                        </div>
                        <button type="submit" class="w-full bg-[#00bcd4] hover:bg-[#00acc1] text-white font-bold p-3.5 rounded-xl text-sm transition shadow-md shadow-cyan-500/25 active:scale-[0.98]">Create Account</button>
                        <p class="text-xs text-center text-slate-500 font-medium pt-1">Already have an account? <button type="button" onclick="switchTab('login')" class="text-cyan-600 font-bold hover:underline">Log In</button></p>
                        <p id="reg-msg" class="text-xs text-center font-bold pt-1"></p>
                    </form>

                    <!-- Forgot Password Form -->
                    <form id="forgot-form" class="space-y-4 hidden">
                        <div class="text-center mb-4">
                            <h3 class="text-xl font-black text-slate-900 tracking-wider">RESET PASSWORD</h3>
                        </div>
                        <div>
                            <input type="email" id="forgot-email" required class="w-full px-4.5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-cyan-500 outline-none transition placeholder:text-slate-400" placeholder="Registered Email">
                        </div>
                        <div>
                            <input type="password" id="new-password" required class="w-full px-4.5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-cyan-500 outline-none transition placeholder:text-slate-400" placeholder="New Password">
                        </div>
                        <button type="submit" class="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold p-3.5 rounded-xl text-sm transition shadow-md active:scale-[0.98]">Reset Password</button>
                        <button type="button" onclick="switchTab('login')" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-3 rounded-xl text-xs transition">Back to Log In</button>
                        <p id="forgot-msg" class="text-xs text-center font-bold pt-1"></p>
                    </form>

                </div>

            </div>
        </main>

        <footer class="text-center text-xs text-slate-300 py-2 font-medium">
            © 2026 SDG 9 Innovation Portal. All rights reserved.
        </footer>

        <script>
            function switchTab(mode) {
                const loginForm = document.getElementById('login-form');
                const regForm = document.getElementById('register-form');
                const forgotForm = document.getElementById('forgot-form');

                if (mode === 'login') {
                    loginForm.classList.remove('hidden');
                    regForm.classList.add('hidden');
                    forgotForm.classList.add('hidden');
                } else if (mode === 'register') {
                    regForm.classList.remove('hidden');
                    loginForm.classList.add('hidden');
                    forgotForm.classList.add('hidden');
                } else if (mode === 'forgot') {
                    forgotForm.classList.remove('hidden');
                    loginForm.classList.add('hidden');
                    regForm.classList.add('hidden');
                }
            }

            document.getElementById('register-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('reg-name').value;
                const email = document.getElementById('reg-email').value;
                const password = document.getElementById('reg-password').value;
                const role = document.getElementById('reg-role').value;

                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, role })
                });

                const data = await res.json();
                const msg = document.getElementById('reg-msg');
                if (res.ok) {
                    msg.className = "text-xs text-center font-bold text-emerald-600";
                    msg.textContent = data.message;
                    setTimeout(() => switchTab('login'), 1500);
                } else {
                    msg.className = "text-xs text-center font-bold text-rose-500";
                    msg.textContent = data.error;
                }
            });

            document.getElementById('login-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;

                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();
                const errorEl = document.getElementById('login-error');
                if (res.ok) {
                    localStorage.setItem('sdg_user_name', data.user.name);
                    localStorage.setItem('sdg_user_email', data.user.email);
                    localStorage.setItem('sdg_user_role', data.user.role);

                    if (data.user.role === 'admin') {
                        window.location.href = '/admin-dashboard';
                    } else {
                        window.location.href = '/events';
                    }
                } else {
                    errorEl.textContent = data.error;
                }
            });

            document.getElementById('forgot-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('forgot-email').value;
                const newPassword = document.getElementById('new-password').value;

                const res = await fetch('/api/auth/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, newPassword })
                });

                const data = await res.json();
                const msg = document.getElementById('forgot-msg');
                if (res.ok) {
                    msg.className = "text-xs text-center font-bold text-emerald-600";
                    msg.textContent = data.message;
                    setTimeout(() => switchTab('login'), 1500);
                } else {
                    msg.className = "text-xs text-center font-bold text-rose-500";
                    msg.textContent = data.error;
                }
            });
        </script>
    </body>
    </html>
    `);
});

// ================= 2. ATTENDEE EVENTS PORTAL (WITH GRADIENTS) =================
app.get('/events', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Attendee Portal - SDG 9</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; }
            .gradient-bg {
                background: linear-gradient(135deg, #09090b 0%, #1e1b4b 50%, #064e3b 100%);
            }
            .gradient-card {
                background: linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(30, 27, 75, 0.6));
                backdrop-filter: blur(20px);
                border: 1px solid rgba(139, 92, 246, 0.3);
            }
        </style>
    </head>
    <body class="gradient-bg text-slate-100 min-h-screen p-6 md:p-12">
        
        <div class="max-w-5xl mx-auto">
            <!-- Hero Banner -->
            <div class="relative bg-gradient-to-r from-purple-900/80 via-slate-900 to-emerald-900/80 border border-purple-500/30 p-8 md:p-10 rounded-[2.5rem] mb-10 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden">
                <div class="absolute -right-20 -bottom-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>
                <div>
                    <span class="bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-extrabold px-4 py-2 rounded-full inline-block mb-3 shadow-sm">🌱 UN SDG 9 Attendee Hub</span>
                    <h1 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-emerald-400 tracking-tight">Innovation Events Portal</h1>
                    <p class="text-xs text-slate-300 mt-1.5 font-medium">Active Session: <span id="welcome-name" class="text-cyan-400 font-bold"></span></p>
                </div>
                <div class="flex items-center gap-3 relative z-10">
                    <button onclick="deleteAccount()" class="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs px-4 py-3 rounded-2xl font-bold transition shadow-sm">Delete Account</button>
                    <button onclick="logout()" class="bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs px-5 py-3 rounded-2xl font-bold transition shadow-sm border border-slate-700">Logout</button>
                </div>
            </div>

            <!-- Events Grid -->
            <div id="events-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="col-span-2 text-center py-16 text-slate-400 font-medium text-sm animate-pulse">Loading available innovation events...</div>
            </div>
        </div>

        <script>
            const userName = localStorage.getItem('sdg_user_name');
            const userEmail = localStorage.getItem('sdg_user_email');
            if (!userName) { window.location.href = '/'; }
            document.getElementById('welcome-name').textContent = userName + ' (' + userEmail + ')';

            function logout() {
                localStorage.clear();
                window.location.href = '/';
            }

            async function deleteAccount() {
                if (!confirm("Are you sure you want to delete your account? Your registrations will also be removed.")) return;
                
                const res = await fetch('/api/auth/delete-account', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: userEmail })
                });

                const data = await res.json();
                if (res.ok) {
                    alert(data.message);
                    logout();
                } else {
                    alert(data.error);
                }
            }

            async function fetchEvents() {
                const res = await fetch('/api/events-with-counts');
                const events = await res.json();
                const grid = document.getElementById('events-grid');
                
                if (events.length === 0) {
                    grid.innerHTML = \`<div class="col-span-2 gradient-card p-16 rounded-[2.5rem] text-center text-slate-400 font-semibold text-sm">No innovation events published yet. Check back soon!</div>\`;
                    return;
                }

                grid.innerHTML = events.map(ev => {
                    const isFull = ev.registered_count >= ev.capacity;
                    return \`
                        <div class="gradient-card p-7 rounded-[2.5rem] shadow-2xl flex flex-col justify-between hover:border-cyan-500/60 hover:shadow-[0_10px_30px_rgba(6,182,212,0.2)] hover:-translate-y-1 transition-all duration-300 group">
                            <div>
                                <div class="flex justify-between items-center mb-4">
                                    <span class="text-xs font-extrabold bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-cyan-300 px-3.5 py-1.5 rounded-full border border-cyan-500/30">🏢 \${ev.organisation}</span>
                                    <span class="text-xs font-bold px-3 py-1.5 rounded-full \${isFull ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'}">
                                        \${isFull ? 'Capacity Full' : \`Slots Left: \${ev.capacity - ev.registered_count}/\${ev.capacity}\`}
                                    </span>
                                </div>
                                <h3 class="font-extrabold text-xl text-white group-hover:text-cyan-300 transition tracking-tight">\${ev.title}</h3>
                                <p class="text-xs text-slate-300 mt-2 leading-relaxed font-medium">\${ev.description}</p>
                                <div class="flex gap-4 mt-5 text-xs text-slate-200 font-bold bg-slate-950/60 p-3.5 rounded-2xl border border-purple-900/40">
                                    <span>📅 \${ev.date}</span>
                                    <span>⏰ \${ev.time}</span>
                                </div>
                            </div>
                            <div class="mt-6 pt-4 border-t border-purple-900/40 flex justify-between items-center">
                                <span class="text-[11px] text-slate-400 font-medium">Attendee: <b class="text-slate-200">\${userName}</b></span>
                                \${isFull ? 
                                    '<span class="text-xs font-extrabold text-rose-400 uppercase tracking-wider">Closed</span>' :
                                    \`<button onclick="registerEvent(\${ev.id})" class="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 text-xs px-5 py-3 rounded-2xl font-extrabold transition-all shadow-lg shadow-cyan-500/30 active:scale-95">Register Now</button>\`
                                }
                            </div>
                        </div>
                    \`;
                }).join('');
            }

            async function registerEvent(eventId) {
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event_id: eventId, name: userName, email: userEmail })
                });
                const data = await res.json();
                if (res.ok) {
                    alert(data.message);
                    fetchEvents();
                } else {
                    alert(data.error);
                }
            }

            fetchEvents();
        </script>
    </body>
    </html>
    `);
});

// ================= 3. ADMIN DASHBOARD (WITH GRADIENTS) =================
app.get('/admin-dashboard', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Dashboard - SDG 9</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; }
            .gradient-bg {
                background: linear-gradient(135deg, #09090b 0%, #1e1b4b 50%, #064e3b 100%);
            }
            .gradient-card {
                background: linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(30, 27, 75, 0.6));
                backdrop-filter: blur(20px);
                border: 1px solid rgba(139, 92, 246, 0.3);
            }
            .gradient-input {
                background: rgba(3, 7, 18, 0.8);
                border: 1px solid rgba(139, 92, 246, 0.3);
            }
            .gradient-input:focus {
                border-color: #06b6d4;
                box-shadow: 0 0 15px rgba(6, 182, 212, 0.3);
            }
        </style>
    </head>
    <body class="gradient-bg text-slate-100 min-h-screen p-6 md:p-12">
        <div class="max-w-5xl mx-auto">
            <!-- Header -->
            <div class="relative bg-gradient-to-r from-purple-900/80 via-slate-900 to-emerald-900/80 border border-purple-500/30 p-8 md:p-10 rounded-[2.5rem] mb-10 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden">
                <div class="absolute -right-20 -bottom-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>
                <div>
                    <span class="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/40 text-purple-300 text-xs font-extrabold px-4 py-2 rounded-full inline-block mb-3 shadow-sm">🛡️ Admin Control Panel</span>
                    <h1 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-cyan-400 tracking-tight">Event Management Hub</h1>
                </div>
                <div class="flex items-center gap-3 relative z-10">
                    <button onclick="deleteAccount()" class="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs px-4 py-3 rounded-2xl font-bold transition shadow-sm">Delete Admin Acc</button>
                    <button onclick="logout()" class="bg-rose-600 hover:bg-rose-500 text-white text-xs px-5 py-3 rounded-2xl font-bold transition shadow-lg shadow-rose-600/30">Logout Admin</button>
                </div>
            </div>

            <!-- Create Event Form -->
            <div class="gradient-card p-8 md:p-10 rounded-[2.5rem] mb-10 shadow-2xl">
                <h2 class="text-lg font-extrabold mb-6 text-cyan-300 flex items-center gap-3">
                    <span class="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-sm shadow-inner">✨</span> 
                    Publish New SDG 9 Event
                </h2>
                <form id="create-event-form" class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-purple-300 mb-1.5">Event Title</label>
                        <input type="text" id="title" required class="w-full px-4.5 py-3.5 gradient-input rounded-2xl text-sm text-white outline-none transition placeholder:text-slate-600" placeholder="Green Tech Expo">
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-purple-300 mb-1.5">Organisation Name</label>
                        <input type="text" id="organisation" required class="w-full px-4.5 py-3.5 gradient-input rounded-2xl text-sm text-white outline-none transition placeholder:text-slate-600" placeholder="EcoInnovate Labs">
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-purple-300 mb-1.5">Description</label>
                        <textarea id="description" rows="2" required class="w-full px-4.5 py-3.5 gradient-input rounded-2xl text-sm text-white outline-none transition placeholder:text-slate-600" placeholder="Brief summary of the innovation event..."></textarea>
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-purple-300 mb-1.5">Date (Dropdown Calendar)</label>
                        <input type="date" id="date" required class="w-full px-4.5 py-3.5 gradient-input rounded-2xl text-sm text-white outline-none transition [color-scheme:dark]">
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-purple-300 mb-1.5">Time</label>
                        <input type="time" id="time" required class="w-full px-4.5 py-3.5 gradient-input rounded-2xl text-sm text-white outline-none transition">
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-purple-300 mb-1.5">Maximum Capacity</label>
                        <input type="number" id="capacity" min="1" required class="w-full px-4.5 py-3.5 gradient-input rounded-2xl text-sm text-white outline-none transition placeholder:text-slate-600" placeholder="50">
                    </div>
                    <div class="flex items-end">
                        <button type="submit" class="w-full bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-600 hover:from-teal-300 hover:to-blue-500 text-slate-950 font-extrabold p-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-cyan-500/25 active:scale-[0.98]">Publish Event</button>
                    </div>
                </form>
                <p id="event-msg" class="text-center text-xs font-bold mt-4"></p>
            </div>

            <!-- Active Events List -->
            <div class="gradient-card rounded-[2.5rem] overflow-hidden shadow-2xl mb-10">
                <div class="p-6 md:p-8 border-b border-purple-900/40 font-extrabold text-white text-base">Active Events Management</div>
                <div id="admin-events-list" class="p-6 md:p-8 grid gap-4">
                    <p class="text-slate-400 text-xs text-center py-4 font-medium">Loading active events...</p>
                </div>
            </div>

            <!-- Registrations Table -->
            <div class="gradient-card rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div class="p-6 md:p-8 border-b border-purple-900/40 font-extrabold text-white text-base">Registered Attendees List</div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-950/80 text-[11px] text-slate-400 uppercase tracking-wider border-b border-purple-900/40">
                                <th class="p-4 md:p-5">Reg ID</th>
                                <th class="p-4 md:p-5">Attendee Name</th>
                                <th class="p-4 md:p-5">Email</th>
                                <th class="p-4 md:p-5">Event Title</th>
                                <th class="p-4 md:p-5">Organisation</th>
                                <th class="p-4 md:p-5">Local Timestamp</th>
                            </tr>
                        </thead>
                        <tbody id="reg-table-body" class="text-xs divide-y divide-purple-900/30">
                            <tr><td colspan="6" class="p-8 text-center text-slate-400 font-medium">Loading registrations...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <script>
            const userRole = localStorage.getItem('sdg_user_role');
            const adminEmail = localStorage.getItem('sdg_user_email');
            if (userRole !== 'admin') { window.location.href = '/'; }

            function logout() {
                localStorage.clear();
                window.location.href = '/';
            }

            async function deleteAccount() {
                if (!confirm("Are you sure you want to delete your Admin account?")) return;
                
                const res = await fetch('/api/auth/delete-account', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: adminEmail })
                });

                const data = await res.json();
                if (res.ok) {
                    alert(data.message);
                    logout();
                } else {
                    alert(data.error);
                }
            }

            document.getElementById('create-event-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const body = {
                    title: document.getElementById('title').value,
                    organisation: document.getElementById('organisation').value,
                    description: document.getElementById('description').value,
                    date: document.getElementById('date').value,
                    time: document.getElementById('time').value,
                    capacity: document.getElementById('capacity').value
                };

                const res = await fetch('/api/events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const data = await res.json();
                const msg = document.getElementById('event-msg');
                if (res.ok) {
                    msg.className = "text-center text-xs font-bold mt-4 text-cyan-300 animate-pulse";
                    msg.textContent = "Event published successfully!";
                    document.getElementById('create-event-form').reset();
                    loadAdminEvents();
                    loadRegistrations();
                } else {
                    msg.className = "text-center text-xs font-bold mt-4 text-rose-400";
                    msg.textContent = data.error;
                }
            });

            async function loadAdminEvents() {
                const res = await fetch('/api/events-with-counts');
                const events = await res.json();
                const container = document.getElementById('admin-events-list');

                if (events.length === 0) {
                    container.innerHTML = \`<p class="text-slate-400 text-xs text-center py-4 font-medium">No active events found.</p>\`;
                    return;
                }

                container.innerHTML = events.map(ev => \`
                    <div class="bg-slate-950/80 backdrop-blur-md p-5 rounded-2xl border border-purple-900/40 flex justify-between items-center gap-4 hover:border-cyan-500/50 transition shadow-lg">
                        <div>
                            <div class="flex items-center gap-2.5">
                                <span class="font-bold text-white text-sm">\${ev.title}</span>
                                <span class="text-[10px] bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-500/30 font-bold">🏢 \${ev.organisation}</span>
                            </div>
                            <p class="text-[11px] text-slate-400 mt-1.5 font-medium">📅 \${ev.date} | ⏰ \${ev.time} | 👥 Registrations: <b class="text-slate-200">\${ev.registered_count}/\${ev.capacity}</b></p>
                        </div>
                        <button onclick="deleteEvent(\${ev.id})" class="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs px-4 py-2.5 rounded-xl font-bold transition whitespace-nowrap active:scale-95">Delete</button>
                    </div>
                \`).join('');
            }

            async function deleteEvent(eventId) {
                if (!confirm("Delete this event? Registrations associated with it will also be cleared.")) return;
                
                const res = await fetch('/api/events/' + eventId, { method: 'DELETE' });
                const data = await res.json();
                if (res.ok) {
                    alert(data.message);
                    loadAdminEvents();
                    loadRegistrations();
                } else {
                    alert(data.error);
                }
            }

            async function loadRegistrations() {
                const res = await fetch('/api/registrations');
                const data = await res.json();
                const tbody = document.getElementById('reg-table-body');
                
                if (data.length === 0) {
                    tbody.innerHTML = \`<tr><td colspan="6" class="p-8 text-center text-slate-400 font-medium">No registrations found yet.</td></tr>\`;
                    return;
                }

                tbody.innerHTML = data.map(reg => {
                    const utcDate = new Date(reg.registered_at + ' UTC');
                    const localTimeStr = utcDate.toLocaleString();

                    return \`
                        <tr class="hover:bg-purple-950/30 transition">
                            <td class="p-4 md:p-5 font-mono text-cyan-300 font-bold">#\${reg.id}</td>
                            <td class="p-4 md:p-5 font-bold text-white">\${reg.name}</td>
                            <td class="p-4 md:p-5 text-slate-300">\${reg.email}</td>
                            <td class="p-4 md:p-5 font-semibold text-slate-200">\${reg.event_title}</td>
                            <td class="p-4 md:p-5 text-cyan-300 font-medium">\${reg.organisation}</td>
                            <td class="p-4 md:p-5 text-slate-400 text-[11px] font-semibold">\${localTimeStr}</td>
                        </tr>
                    \`;
                }).join('');
            }

            loadAdminEvents();
            loadRegistrations();
        </script>
    </body>
    </html>
    `);
});

// ================= API ENDPOINTS =================

// 1. Register User/Admin with strict email validation
app.post('/api/auth/register', (req, res) => {
    let { name, email, password, role } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required!" });
    
    email = email.trim().toLowerCase();
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Please enter a valid email address (e.g. gmail, yahoo, icloud)." });
    }

    db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, 
    [name, email, password, role], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: "Email is already registered! Please log in." });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Account created successfully! Switching to Login..." });
    });
});

// 2. Login User/Admin
app.post('/api/auth/login', (req, res) => {
    let { email, password } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required!" });

    email = email.trim().toLowerCase();
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Please enter a valid email address." });
    }

    db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: "Invalid email or password!" });

        res.json({
            message: "Login successful!",
            user: { name: user.name, email: user.email, role: user.role }
        });
    });
});

// 3. Reset Password
app.post('/api/auth/reset-password', (req, res) => {
    let { email, newPassword } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required!" });

    email = email.trim().toLowerCase();
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Please enter a valid email address." });
    }
    
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: "No account found with this email!" });

        db.run(`UPDATE users SET password = ? WHERE email = ?`, [newPassword, email], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Password updated successfully! Please Login." });
        });
    });
});

// 4. Delete Account
app.post('/api/auth/delete-account', (req, res) => {
    let { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required!" });

    email = email.trim().toLowerCase();
    db.run(`DELETE FROM registrations WHERE email = ?`, [email], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        db.run(`DELETE FROM users WHERE email = ?`, [email], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Account deleted successfully." });
        });
    });
});

// 5. Get events with counts
app.get('/api/events-with-counts', (req, res) => {
    const query = `
        SELECT events.*, 
        (SELECT COUNT(*) FROM registrations WHERE registrations.event_id = events.id) as registered_count 
        FROM events
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 6. Create Event (Admin)
app.post('/api/events', (req, res) => {
    const { title, description, organisation, date, time, capacity } = req.body;
    const query = `INSERT INTO events (title, description, organisation, date, time, capacity) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(query, [title, description, organisation, date, time, capacity], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Event published successfully!", eventId: this.lastID });
    });
});

// 7. Delete Event (Admin)
app.delete('/api/events/:id', (req, res) => {
    const eventId = req.params.id;
    db.run("DELETE FROM registrations WHERE event_id = ?", [eventId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.run("DELETE FROM events WHERE id = ?", [eventId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Event deleted successfully!" });
        });
    });
});

// 8. Register for Event (User)
app.post('/api/register', (req, res) => {
    let { event_id, name, email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required!" });

    email = email.trim().toLowerCase();
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Please provide a valid email address." });
    }

    db.get("SELECT * FROM registrations WHERE event_id = ? AND email = ?", [event_id, email], (err, existingReg) => {
        if (err) return res.status(500).json({ error: err.message });
        if (existingReg) {
            return res.status(400).json({ error: "You are already registered for this event!" });
        }

        db.get("SELECT capacity FROM events WHERE id = ?", [event_id], (err, event) => {
            if (err || !event) return res.status(404).json({ error: "Event not found." });

            db.get("SELECT COUNT(*) as count FROM registrations WHERE event_id = ?", [event_id], (err, reg) => {
                if (err) return res.status(500).json({ error: err.message });

                if (reg.count >= event.capacity) {
                    return res.status(400).json({ error: "Event capacity full!" });
                }

                db.run("INSERT INTO registrations (event_id, name, email) VALUES (?, ?, ?)", [event_id, name, email], function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: "Successfully registered for the event!" });
                });
            });
        });
    });
});

// 9. Registrations List (Admin)
app.get('/api/registrations', (req, res) => {
    const query = `
        SELECT registrations.id, registrations.name, registrations.email, registrations.registered_at, 
               events.title as event_title, events.organisation 
        FROM registrations 
        JOIN events ON registrations.event_id = events.id 
        ORDER BY registrations.id DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});