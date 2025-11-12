const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("./skema/user.js");

const route = express.Router();

// Secret key untuk JWT (sebaiknya di environment variable)
const JWT_SECRET = process.env.JWT_SECRET || "lomba-secret-key-change-this-in-production";

// Middleware untuk verifikasi JWT
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: "Token tidak ditemukan" 
        });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.username = decoded.username;
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: "Token tidak valid" 
        });
    }
};

// Route test
route.get("/", (req, res) => {
    res.send("API is working");
});

// Register user baru
route.post("/register", async (req, res) => {
    try {
        const { username, nisn, password } = req.body;

        // Validasi input
        if (!username || !nisn || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "Semua field harus diisi" 
            });
        }

        // Validasi panjang password
        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: "Password minimal 6 karakter" 
            });
        }

        // Cek apakah user sudah ada
        const existingUser = await User.findOne({ 
            $or: [{ nisn }, { username }] 
        });

        
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: "Username atau NISN sudah digunakan" 
            });
        }
        
        
        // Buat user baru
        const user = new User({
            username,
            nisn,
            password
        });
        
        await user.save();
        console.log("buat user baru");
        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id, 
                username: user.username,
                nisn: user.nisn
            }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.status(201).json({ 
            success: true, 
            message: "Registrasi berhasil",
            token,
            user: {
                id: user._id,
                username: user.username,
                nisn: user.nisn
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// Login user
route.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validasi input
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "Username dan password harus diisi" 
            });
        }

        // Cari user berdasarkan username atau nisn
        const user = await User.findOne({
            $or: [{ username }, { nisn: username }]
        });

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "Username atau password salah" 
            });
        }

        // Cek password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: "Username atau password salah" 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id, 
                username: user.username,
                nisn: user.nisn
            }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.json({ 
            success: true, 
            message: "Login berhasil",
            token,
            user: {
                id: user._id,
                username: user.username,
                nisn: user.nisn
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// Logout user (client-side akan menghapus token)
route.post("/logout", (req, res) => {
    res.json({ 
        success: true, 
        message: "Logout berhasil" 
    });
});

// Cek status login dengan JWT
route.get("/check-auth", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                isAuthenticated: false,
                message: "User tidak ditemukan"
            });
        }

        res.json({ 
            success: true, 
            isAuthenticated: true,
            user: {
                id: user._id,
                username: user.username,
                nisn: user.nisn
            }
        });
    } catch (error) {
        console.error('Check auth error:', error);
        res.status(500).json({ 
            success: false, 
            isAuthenticated: false,
            message: "Terjadi kesalahan server" 
        });
    }
});

// Get user profile (contoh protected route)
route.get("/profile", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User tidak ditemukan" 
            });
        }

        res.json({ 
            success: true, 
            user: {
                id: user._id,
                username: user.username,
                nisn: user.nisn
            }
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// Logout user (client-side akan menghapus token)
route.post("/logout", (req, res) => {
    res.json({ 
        success: true, 
        message: "Logout berhasil" 
    });
});

module.exports = route;