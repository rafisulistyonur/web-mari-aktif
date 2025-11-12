const express = require("express");
const User = require("./skema/user.js");

const route = express.Router();

// Route test
route.get("/", (req, res) => {
    res.send("API is working");
});

// Register user baru
route.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validasi input
        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "Semua field harus diisi" 
            });
        }

        // Cek apakah user sudah ada
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: "Username atau email sudah digunakan" 
            });
        }

        // Buat user baru
        const user = new User({
            username,
            email,
            password
        });

        await user.save();

        res.status(201).json({ 
            success: true, 
            message: "Registrasi berhasil",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
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

        // Cari user berdasarkan username atau email
        const user = await User.findOne({
            $or: [{ username }, { email: username }]
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

        // Simpan session
        req.session.userId = user._id;
        req.session.username = user.username;

        res.json({ 
            success: true, 
            message: "Login berhasil",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
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

// Logout user
route.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: "Gagal logout" 
            });
        }
        res.json({ 
            success: true, 
            message: "Logout berhasil" 
        });
    });
});

// Cek status login
route.get("/check-auth", (req, res) => {
    if (req.session.userId) {
        res.json({ 
            success: true, 
            isAuthenticated: true,
            user: {
                id: req.session.userId,
                username: req.session.username
            }
        });
    } else {
        res.json({ 
            success: true, 
            isAuthenticated: false 
        });
    }
});

module.exports = route; 