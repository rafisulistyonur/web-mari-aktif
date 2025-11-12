require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const route = require('./api.js');
const connectDB = require('./database');
const fs = require('fs');

const app = express();
const port = 3000;

// Koneksi ke MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
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

// Middleware untuk cek autentikasi
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

app.use("/api", route);

app.get('/', (req, res) => {
    res.send(prosesHalaman('utama'));
});

app.get('/public/:file', (req, res) => {
    const file = req.params.file;
    res.sendFile(__dirname + '/public/' + file);
});

app.get("/daftar", (req, res) => {
    res.sendFile(__dirname + "/pages/daftar.html");
});

app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/pages/login page.html");
});

// Protected route - hanya bisa diakses jika sudah login
app.get("/pertemanan", (req, res) => {
    res.send(prosesHalaman('pertemanan'));
});

app.get("/lowongan", (req, res) => {
    res.send(prosesHalaman('lowongan'))
})

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});