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

// ================= 1. AUTHENTICATION & LOGIN PAGE (LIQUID GLASS STYLE) =================
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SDG 9 - Liquid Glass Portal</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; }
            @keyframes aurora {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            .aurora-bg {
                background: linear-gradient(-45deg, #0f172a, #1e1b4b, #064e3b, #311042, #02233b);
                background-size: 400% 400%;
                animation: aurora 15s ease infinite;
            }
            .glass-card {
                background: rgba(15, 23, 42, 0.45);
                backdrop-filter: blur(25px);
                -webkit-backdrop-filter: blur(25px);
                border: 1px solid rgba(255, 255, 255, 0.12);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.15);
            }
            .glass-input {
                background: rgba(2, 6, 23, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
            }
            .glass-input:focus {
                border-color: rgba(16, 185, 129, 0.8);
                box-shadow: 0 0 20px rgba(16, 185, 129, 0.25);
            }
        </style>
    </head>
    <body class="aurora-bg text-slate-100 min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        
        <!-- Floating Ambient Light Blobs -->
        <div class="absolute top-10 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
        <div class="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

        <div class="max-w-md w-full glass-card p-8 md:p-10 rounded-[2.5rem] relative z-10 transition-all duration-500">
            
            <!-- Branding Header -->
            <div class="text-center mb-8">
                <div class="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold px-4 py-1.5 rounded-full mb-3 shadow-inner">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>UN SDG 9 Liquid Glass UI</span>
                </div>
                <h1 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-emerald-400 tracking-tight">Login</h1>
                <p class="text-xs text-slate-400 mt-1 font-medium">Welcome back, please sign in to continue</p>
            </div>

            <!-- Mode Selector Tabs -->
            <div id="tab-container" class="grid grid-cols-2 bg-slate-950/60 p-1.5 rounded-2xl mb-6 border border-white/5">
                <button onclick="switchTab('login')" id="login-tab" class="py-2.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg transition-all">Sign In</button>
                <button onclick="switchTab('register')" id="register-tab" class="py-2.5 text-xs font-bold rounded-xl text-slate-400 hover:text-white transition-all">Register</button>
            </div>

            <!-- Login Form -->
            <form id="login-form" class="space-y-4">
                <div>
                    <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                    <input type="email" id="login-email" required class="w-full px-4.5 py-3.5 glass-input rounded-2xl text-sm text-white outline-none transition placeholder:text-slate-600" placeholder="name@example.com">
                </div>
                <div>
                    <div class="flex justify-between items-center mb-1.5">
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Password</label>
                        <button type="button" onclick="switchTab('forgot')" class="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition">Forgot Password?</button>
                    </div>
                    <input type="password" id="login-password" required class="w-full px-4.5 py-3.5 glass-input rounded-2xl text-sm text-white outline-none transition placeholder:text-slate-600" placeholder="••••••••">
                </div>
                <button type="submit" class="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold p-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-emerald-600/30 active:scale-[0.98] mt-2">Login</button>
                <p id="login-error" class="text-xs text-rose-400 text-center font-bold pt-2"></p>
            </form>

            <!-- Registration Form -->
            <form id="register-form" class="space-y-4 hidden">
                <div>
                    <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                    <input type="text" id="reg-name" required class="w-full px-4.5 py-3.5 glass-input rounded-2xl text-sm text-white outline-none transition placeholder:text-slate-600" placeholder="Jane Doe">
                </div>
                <div>
                    <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Valid Email (Gmail, Yahoo, iCloud)</label>
                    <input type="email" id="reg-email" required class="w-full px-4.5 py-3.5 glass-input rounded-2xl text-sm text-white outline-none transition placeholder:text-slate-600" placeholder="jane@gmail.com">
                </div>
                <div>
                    <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
                    <input type="password" id="reg-password" required class="w-full px-4.5 py-3.5 glass-input rounded-2xl text-sm text-white outline-none transition placeholder:text-slate-600" placeholder="Create secure password">
                </div>
                <div>
                    <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Account Role</label>
                    <select id="reg-role" required class="w-full px-4.5 py-3.5 glass-input rounded-2xl text-sm text-white outline-none transition">
                        <option value="user" class="bg-slate-900">Attendee (Browse & Register)</option>
                        <option value="admin" class="bg-slate-900">Administrator (Manage Events)</option>
                    </select>
                </div>
                <button type="submit" class="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold p-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-blue-600/30 active:scale-[0.98] mt-2">Sign Up</button>
                <p id="reg-msg" class="text-xs text-center font-bold pt-2"></p>
            </form>

            <!-- Forgot Password Form -->
            <form id="forgot-form" class="space-y-4 hidden">
                <div>
                    <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Registered Email</label>
                    <input type="email" id="forgot-email" required class="w-full px-4.5 py-3.5 glass-input rounded-2xl text-sm text-white outline-none transition placeholder:text-slate-600" placeholder="name@example.com">
                </div>
                <div>
                    <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">New Password</label>
                    <input type="password" id="new-password" required class="w-full px-4.5 py-3.5 glass-input rounded-2xl text-sm text-white outline-none transition placeholder:text-slate-600" placeholder="Enter new password">
                </div>
                <button type="submit" class="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold p-3.5 rounded-2xl text-sm transition-all shadow-lg active:scale-[0.98] mt-2">Reset Password</button>
                <button type="button" onclick="switchTab('login')" class="w-full bg-slate-950/80 hover:bg-slate-900 text-slate-300 font-bold p-3 rounded-2xl text-xs transition border border-white/5">Back to Login</button>
                <p id="forgot-msg" class="text-xs text-center font-bold pt-2"></p>
            </form>
        </div>

        <script>
            function switchTab(mode) {
                const loginTab = document.getElementById('login-tab');
                const regTab = document.getElementById('register-tab');
                const loginForm = document.getElementById('login-form');
                const regForm = document.getElementById('register-form');
                const forgotForm = document.getElementById('forgot-form');
                const tabContainer = document.getElementById('tab-container');

                if (mode === 'login') {
                    tabContainer.classList.remove('hidden');
                    loginTab.className = "py-2.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg transition-all";
                    regTab.className = "py-2.5 text-xs font-bold rounded-xl text-slate-400 hover:text-white transition-all";
                    loginForm.classList.remove('hidden');
                    regForm.classList.add('hidden');
                    forgotForm.classList.add('hidden');
                } else if (mode === 'register') {
                    tabContainer.classList.remove('hidden');
                    regTab.className = "py-2.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transition-all";
                    loginTab.className = "py-2.5 text-xs font-bold rounded-xl text-slate-400 hover:text-white transition-all";
                    regForm.classList.remove('hidden');
                    loginForm.classList.add('hidden');
                    forgotForm.classList.add('hidden');
                } else if (mode === 'forgot') {
                    tabContainer.classList.add('hidden');
                    loginForm.classList.add('hidden');
                    regForm.classList.add('hidden');
                    forgotForm.classList.remove('hidden');
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
                    msg.className = "text-xs text-center font-bold text-emerald-400 animate-pulse";
                    msg.textContent = data.message;
                    setTimeout(() => switchTab('login'), 1500);
                } else {
                    msg.className = "text-xs text-center font-bold text-rose-400";
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
                    msg.className = "text-xs text-center font-bold text-emerald-400";
                    msg.textContent = data.message;
                    setTimeout(() => switchTab('login'), 1500);
                } else {
                    msg.className = "text-xs text-center font-bold text-rose-400";
                    msg.textContent = data.error;
                }
            });
        </script>
    </body>
    </html>
    `);
});

// ================= 2. ATTENDEE EVENTS PORTAL =================
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
            @keyframes aurora {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            .aurora-bg {
                background: linear-gradient(-45deg, #0f172a, #1e1b4b, #064e3b, #311042, #02233b);
                background-size: 400% 400%;
                animation: aurora 15s ease infinite;
            }
            .glass-card {
                background: rgba(15, 23, 42, 0.5);
                backdrop-filter: blur(25px);
                -webkit-backdrop-filter: blur(25px);
                border: 1px solid rgba(255, 255, 255, 0.12);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
            }
        </style>
    </head>
    <body class="aurora-bg text-slate-100 min-h-screen p-6 md:p-12 relative overflow-x-hidden">
        
        <div class="max-w-5xl mx-auto relative z-10">
            <!-- Hero Banner -->
            <div class="relative glass-card p-8 md:p-10 rounded-[3rem] mb-10 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden">
                <div class="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
                <div>
                    <span class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold px-4 py-2 rounded-full inline-block mb-3">🌱 UN SDG 9 Attendee Hub</span>
                    <h1 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-emerald-400 tracking-tight">Innovation Events Portal</h1>
                    <p class="text-xs text-slate-400 mt-1.5 font-medium">Active Session: <span id="welcome-name" class="text-emerald-400 font-bold"></span></p>
                </div>
                <div class="flex items-center gap-3 relative z-10">
                    <button onclick="deleteAccount()" class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs px-4.5 py-3 rounded-2xl font-bold transition shadow-sm active:scale-95">Delete Account</button>
                    <button onclick="logout()" class="bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs px-5 py-3 rounded-2xl font-bold transition shadow-sm border border-white/10 active:scale-95">Logout</button>
                </div>
            </div>

            <!-- Events Grid -->
            <div id="events-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="col-span-2 text-center py-20 text-slate-400 font-semibold text-sm animate-pulse">Loading available innovation events...</div>
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
                    grid.innerHTML = \`<div class="col-span-2 glass-card p-16 rounded-[3rem] text-center text-slate-400 font-semibold text-sm">No innovation events published yet. Check back soon!</div>\`;
                    return;
                }

                grid.innerHTML = events.map(ev => {
                    const isFull = ev.registered_count >= ev.capacity;
                    return \`
                        <div class="glass-card p-7 rounded-[3rem] shadow-2xl flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-[0_10px_40px_rgba(16,185,129,0.2)] hover:-translate-y-1.5 transition-all duration-300 group">
                            <div>
                                <div class="flex justify-between items-center mb-4">
                                    <span class="text-xs font-extrabold bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full border border-emerald-500/20 shadow-inner">🏢 \${ev.organisation}</span>
                                    <span class="text-xs font-extrabold px-3.5 py-1.5 rounded-full \${isFull ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}">
                                        \${isFull ? 'Capacity Full' : \`Slots Left: \${ev.capacity - ev.registered_count}/\${ev.capacity}\`}
                                    </span>
                                </div>
                                <h3 class="font-extrabold text-xl text-white group-hover:text-emerald-400 transition tracking-tight">\${ev.title}</h3>
                                <p class="text-xs text-slate-300 mt-2.5 leading-relaxed font-medium">\${ev.description}</p>
                                <div class="flex gap-4 mt-5 text-xs text-slate-200 font-bold bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                                    <span>📅 \${ev.date}</span>
                                    <span>⏰ \${ev.time}</span>
                                </div>
                            </div>
                            <div class="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                                <span class="text-[11px] text-slate-400 font-medium">Attendee: <b class="text-slate-200">\${userName}</b></span>
                                \${isFull ? 
                                    '<span class="text-xs font-extrabold text-rose-400 uppercase tracking-wider">Closed</span>' :
                                    \`<button onclick="registerEvent(\${ev.id})" class="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs px-5.5 py-3 rounded-2xl font-extrabold transition-all shadow-lg shadow-emerald-600/30 active:scale-95">Register Now</button>\`
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

// ================= 3. ADMIN DASHBOARD =================
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
            @keyframes aurora {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            .aurora-bg {
                background: linear-gradient(-45deg, #0f172a, #1e1b4b, #064e3b, #311042, #02233b);
                background-size: 400% 400%;
                animation: aurora 15s ease infinite;
            }
            .glass-card {
                background: rgba(15, 23, 42, 0.5);
                backdrop-filter: blur(25px);
                -webkit-backdrop-filter: blur(25px);
                border: 1px solid rgba(255, 255, 255, 0.12);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
            }
            .glass-input {
                background: rgba(2, 6, 23, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
            }
            .glass-input:focus {
                border-color: rgba(16, 185, 129, 0.8);
                box-shadow: 0 0 20px rgba(16, 185, 129, 0.25);
            }
        </style>
    </head>
    <body class="aurora-bg text-slate-100 min-h-screen p-6 md:p-12 relative overflow-x-hidden">
        
        <div class="max-w-5xl mx-auto relative z-10">
            <!-- Header -->
            <div class="relative glass-card p-8 md:p-10 rounded-[3rem] mb-10 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden">
                <div class="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
                <div>
                    <span class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold px-4 py-2 rounded-full inline-block mb-3">🛡️ Admin Control Panel</span>
                    <h1 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-emerald-400 tracking-tight">Event Management Hub</h1>
                </div>
                <div class="flex items-center gap-3 relative z-10">
                    <button onclick="deleteAccount()" class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs px-4.5 py-3 rounded-2xl font-bold transition shadow-sm active:scale-95">Delete Admin Acc</button>
                    <button onclick="logout()" class="bg-rose-600 hover:bg-rose-500 text-white text-xs px-5 py-3 rounded-2xl font-bold transition shadow-lg shadow-rose-600/30 active:scale-95">Logout Admin</button>
                </div>
            </div>

            <!-- Create Event Form -->
            <div class="glass-card p-8 md:p-10 rounded-[3rem] mb-10 shadow-2xl">
                <h2 class="text-lg font-extrabold mb-6 text-emerald-400 flex items-center gap-3">
                    <span class="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-sm">✨</span> 
                    Publish New SDG 9 Event
                </h2>
                <form id="create-event-form" class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Event Title</label>
                        <input type="text" id="title" required class="w-full px-4.5 py-3.5 glass-input rounded-2xl text-sm text-white outline-none transition placeholder:text-slate-600" placeholder="Green Tech Expo">
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Organisation Name</label>
                        <input type="text" id="organisation" required class="w-full px-4.5 py-3.5 glass-input rounded-2xl text-sm text-white outline-none transition placeholder:text-slate-600" placeholder="EcoInnovate Labs">
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Description</label>
                        <textarea id="description" rows="2" required class="w-full px-4.5 py-3.5 glass-input rounded-2xl text-sm text-white outline-none transition placeholder:text-slate-600" placeholder="Brief summary of the innovation event..."></textarea>
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Date (Dropdown Calendar)</label>
                        <input type="date" id="date" required class="w-full px-4.5 py-3.5 glass-input rounded-2xl text-sm text-white outline-none transition [color-scheme:dark]">
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Time</label>
                        <input type="time" id="time" required class="w-full px-4.5 py-3.5 glass-input rounded-2xl text-sm text-white outline-none transition">
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Maximum Capacity</label>
                        <input type="number" id="capacity" min="1" required class="w-full px-4.5 py-3.5 glass-input rounded-2xl text-sm text-white outline-none transition placeholder:text-slate-600" placeholder="50">
                    </div>
                    <div class="flex items-end">
                        <button type="submit" class="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold p-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-emerald-600/30 active:scale-[0.98]">Publish Event</button>
                    </div>
                </form>
                <p id="event-msg" class="text-center text-xs font-bold mt-4"></p>
            </div>

            <!-- Active Events List -->
            <div class="glass-card rounded-[3rem] overflow-hidden shadow-2xl mb-10">
                <div class="p-6 md:p-8 border-b border-white/10 font-extrabold text-white text-base">Active Events Management</div>
                <div id="admin-events-list" class="p-6 md:p-8 grid gap-4">
                    <p class="text-slate-400 text-xs text-center py-4 font-medium">Loading active events...</p>
                </div>
            </div>

            <!-- Registrations Table -->
            <div class="glass-card rounded-[3rem] overflow-hidden shadow-2xl">
                <div class="p-6 md:p-8 border-b border-white/10 font-extrabold text-white text-base">Registered Attendees List</div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-950/60 text-[11px] text-slate-400 uppercase tracking-wider border-b border-white/10">
                                <th class="p-4 md:p-5">Reg ID</th>
                                <th class="p-4 md:p-5">Attendee Name</th>
                                <th class="p-4 md:p-5">Email</th>
                                <th class="p-4 md:p-5">Event Title</th>
                                <th class="p-4 md:p-5">Organisation</th>
                                <th class="p-4 md:p-5">Local Timestamp</th>
                            </tr>
                        </thead>
                        <tbody id="reg-table-body" class="text-xs divide-y divide-white/5">
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
                    msg.className = "text-center text-xs font-bold mt-4 text-emerald-400 animate-pulse";
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
                    <div class="bg-slate-950/60 backdrop-blur-md p-5 rounded-2xl border border-white/10 flex justify-between items-center gap-4 hover:border-emerald-500/50 transition shadow-lg">
                        <div>
                            <div class="flex items-center gap-2.5">
                                <span class="font-bold text-white text-sm">\${ev.title}</span>
                                <span class="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold">🏢 \${ev.organisation}</span>
                            </div>
                            <p class="text-[11px] text-slate-400 mt-1.5 font-medium">📅 \${ev.date} | ⏰ \${ev.time} | 👥 Registrations: <b class="text-slate-200">\${ev.registered_count}/\${ev.capacity}</b></p>
                        </div>
                        <button onclick="deleteEvent(\${ev.id})" class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs px-4 py-2.5 rounded-xl font-bold transition whitespace-nowrap active:scale-95">Delete</button>
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
                        <tr class="hover:bg-white/5 transition">
                            <td class="p-4 md:p-5 font-mono text-emerald-400 font-bold">#\${reg.id}</td>
                            <td class="p-4 md:p-5 font-bold text-white">\${reg.name}</td>
                            <td class="p-4 md:p-5 text-slate-300">\${reg.email}</td>
                            <td class="p-4 md:p-5 font-semibold text-slate-200">\${reg.event_title}</td>
                            <td class="p-4 md:p-5 text-emerald-400 font-medium">\${reg.organisation}</td>
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