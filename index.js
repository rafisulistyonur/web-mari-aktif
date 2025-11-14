require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const route = require('./api.js');
const friendshipRoute = require('./friendshipApi.js');
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

// Session middleware (tetap ada untuk backward compatibility)
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 24 jam
    }
}));

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
});