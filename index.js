require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const route = require('./api.js');
const friendshipRoute = require('./friendshipApi.js');
const postRoute = require('./postApi.js');
const connectDB = require('./database');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Koneksi ke MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "data:", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"]
        }
    }
}));
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Trust proxy for HTTPS (important for deployment)
app.set('trust proxy', 1);

// Session middleware (tetap ada untuk backward compatibility)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 jam
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true, // Prevent XSS attacks
        sameSite: 'strict' // CSRF protection
    }
}));

// ============ NOTIFICATION CLEANUP SCHEDULER ============
// Auto cleanup old notifications setiap jam
const scheduleNotificationCleanup = () => {
    // Jalankan cleanup setiap 1 jam (3600000 ms)
    const cleanupInterval = setInterval(async () => {
        try {
            const User = require('./skema/user.js');
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            
            const result = await User.updateMany(
                { 'notifications': { $elemMatch: { isRead: true, markedReadAt: { $lt: oneDayAgo } } } },
                { $pull: { notifications: { isRead: true, markedReadAt: { $lt: oneDayAgo } } } }
            );
            
            if (result.modifiedCount > 0) {
                console.log(`[${new Date().toISOString()}] ✓ Notification cleanup: Removed old notifications from ${result.modifiedCount} users`);
            }
        } catch (error) {
            console.error(`[${new Date().toISOString()}] ✗ Notification cleanup error:`, error.message);
        }
    }, 60 * 60 * 1000); // Setiap 1 jam
    
    console.log('✓ Notification cleanup scheduler started (runs every hour)');
    return cleanupInterval;
};

// ============ HTTPS REDIRECT MIDDLEWARE ============
// Redirect HTTP ke HTTPS di production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}

// Start scheduler setelah server siap
let cleanupScheduler;

function prosesHalaman(file) {
    let data = fs.readFileSync(__dirname + '/pages/' + file + '.html', { encoding: 'utf8' });
    
    if (data.toString().includes('<komponen navbar></komponen>')) {
        data = data.replaceAll('<komponen navbar></komponen>', fs.readFileSync(__dirname+'/pages/komponen/navbar.komponen.html', { encoding: 'utf8' }));
    }

    return data;
}

// Middleware untuk inject script autentikasi ke halaman yang memerlukan login
function injectAuthScript(html) {
    // Inject script sebelum closing </body> tag
    const scriptTag = '<script src="/public/protected-page.js"></script>';
    if (html.includes('</body>')) {
        return html.replace('</body>', `${scriptTag}</body>`);
    }
    return html + scriptTag;
}

// API routes
app.use("/api", route);
app.use("/api/friendship", friendshipRoute);
app.use("/api/post", postRoute);

// Public files
app.get('/public/:file', (req, res) => {
    const file = req.params.file;
    const filePath = path.join(__dirname, 'public', file);
    
    // Cek apakah file ada
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

// Pages files (untuk direct access ke halaman)
app.get('/pages/:file', (req, res) => {
    const file = req.params.file;
    const filePath = path.join(__dirname, 'pages', file);
    
    // Cek apakah file ada
    if (fs.existsSync(filePath)) {
        const html = fs.readFileSync(filePath, { encoding: 'utf8' });
        res.send(injectAuthScript(html));
    } else {
        res.status(404).send('Halaman tidak ditemukan');
    }
});

// Halaman publik (tidak perlu login)
app.get("/daftar", (req, res) => {
    res.sendFile(__dirname + "/pages/daftar.html");
});

app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/pages/login page.html");
});

// Halaman utama (protected - akan dicek di client-side dengan JWT)
app.get('/', (req, res) => {
    const html = prosesHalaman('utama');
    res.send(injectAuthScript(html));
});

// Protected routes - akan dicek di client-side dengan JWT
app.get("/pertemanan", (req, res) => {
    const html = prosesHalaman('pertemanan');
    res.send(injectAuthScript(html));
});

app.get("/lowongan", (req, res) => {
    const html = prosesHalaman('lowongan');
    res.send(injectAuthScript(html));
});

app.get("/admin", (req, res) => {
    const html = prosesHalaman('AdminHTML');
    res.send(injectAuthScript(html));
});

app.get("/developer", (req, res) => {
    const html = prosesHalaman('developerPanel');
    res.send(injectAuthScript(html));
});

// 404 handler
app.use((req, res) => {
    res.status(404).send('Halaman tidak ditemukan');
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Terjadi kesalahan server');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Start notification cleanup scheduler
    cleanupScheduler = scheduleNotificationCleanup();
});