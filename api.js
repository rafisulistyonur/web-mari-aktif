const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("./skema/user.js");
const Lowongan = require("./skema/lowongan.js");

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

// ============ LOWONGAN ROUTES ============

// Tambah lowongan baru (protected - hanya user yang login)
route.post("/lowongan", verifyToken, async (req, res) => {
    try {
        const { nama, deskripsi, penyelenggara, lokasi, tanggalExpired, kategori, hadiah, persyaratan, linkKontak, linkPendaftaran } = req.body;

        // Validasi input
        if (!nama || !deskripsi || !penyelenggara || !lokasi || !tanggalExpired || !kategori || !hadiah || !persyaratan || !linkKontak || !linkPendaftaran) {
            return res.status(400).json({ 
                success: false, 
                message: "Semua field harus diisi" 
            });
        }

        // Buat lowongan baru dengan submittedBy = user yang login
        const lowongan = new Lowongan({
            nama,
            deskripsi,
            penyelenggara,
            lokasi,
            tanggalExpired: new Date(tanggalExpired),
            kategori,
            hadiah,
            persyaratan,
            linkKontak,
            linkPendaftaran,
            submittedBy: req.userId
        });

        await lowongan.save();
        await lowongan.populate('submittedBy', 'username');

        res.status(201).json({ 
            success: true, 
            message: "Lowongan berhasil ditambahkan",
            lowongan
        });

    } catch (error) {
        console.error('Tambah lowongan error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server",
            error: error.message
        });
    }
});

// Ambil semua lowongan
route.get("/lowongan", async (req, res) => {
    try {
        // Hanya tampilkan lowongan yang sudah diapprove
        const lowongan = await Lowongan.find({ approvalStatus: 'approved' })
            .sort({ createdAt: -1 })
            .populate('submittedBy', 'username');

        res.json({ 
            success: true, 
            lowongan,
            total: lowongan.length
        });

    } catch (error) {
        console.error('Ambil lowongan error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// Ambil lowongan milik user (untuk admin panel)
route.get("/lowongan/my", verifyToken, async (req, res) => {
    try {
        const lowongan = await Lowongan.find({ submittedBy: req.userId })
            .sort({ createdAt: -1 })
            .populate('submittedBy', 'username');

        res.json({ 
            success: true, 
            lowongan,
            total: lowongan.length
        });

    } catch (error) {
        console.error('Ambil lowongan user error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// Ambil lowongan berdasarkan kategori
route.get("/lowongan/kategori/:kategori", async (req, res) => {
    try {
        const { kategori } = req.params;
        
        // Jika kategori adalah 'semua', ambil semua lowongan yang diapprove
        let lowongan;
        if (kategori.toLowerCase() === 'semua') {
            lowongan = await Lowongan.find({ approvalStatus: 'approved' })
                .sort({ createdAt: -1 })
                .populate('submittedBy', 'username');
        } else {
            lowongan = await Lowongan.find({ 
                kategori: kategori,
                approvalStatus: 'approved'
            })
                .sort({ createdAt: -1 })
                .populate('submittedBy', 'username');
        }

        res.json({ 
            success: true, 
            lowongan,
            total: lowongan.length,
            kategori
        });

    } catch (error) {
        console.error('Ambil lowongan kategori error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// Ambil detail lowongan berdasarkan ID
route.get("/lowongan/:id", async (req, res) => {
    try {
        const lowongan = await Lowongan.findById(req.params.id)
            .populate('submittedBy', 'username');

        if (!lowongan) {
            return res.status(404).json({ 
                success: false, 
                message: "Lowongan tidak ditemukan" 
            });
        }

        res.json({ 
            success: true, 
            lowongan
        });

    } catch (error) {
        console.error('Ambil detail lowongan error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// Update lowongan (hanya pemilik yang bisa update)
route.put("/lowongan/:id", verifyToken, async (req, res) => {
    try {
        const { nama, deskripsi, penyelenggara, lokasi, tanggalExpired, kategori, hadiah, persyaratan, linkKontak, linkPendaftaran, status } = req.body;

        // Cek apakah lomba ada dan user adalah pemiliknya
        const lowongan = await Lowongan.findById(req.params.id);

        if (!lowongan) {
            return res.status(404).json({ 
                success: false, 
                message: "Lowongan tidak ditemukan" 
            });
        }

        if (lowongan.submittedBy.toString() !== req.userId.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: "Anda tidak memiliki izin untuk mengubah lowongan ini" 
            });
        }

        // Update lowongan
        const updatedLowongan = await Lowongan.findByIdAndUpdate(
            req.params.id,
            {
                nama,
                deskripsi,
                penyelenggara,
                lokasi,
                tanggalExpired: new Date(tanggalExpired),
                kategori,
                hadiah,
                persyaratan,
                linkKontak,
                linkPendaftaran,
                status
            },
            { new: true, runValidators: true }
        ).populate('submittedBy', 'username');

        res.json({ 
            success: true, 
            message: "Lowongan berhasil diupdate",
            lowongan: updatedLowongan
        });

    } catch (error) {
        console.error('Update lowongan error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server",
            error: error.message
        });
    }
});

// Hapus lowongan (hanya pemilik yang bisa hapus)
route.delete("/lowongan/:id", verifyToken, async (req, res) => {
    try {
        const lowongan = await Lowongan.findById(req.params.id);

        if (!lowongan) {
            return res.status(404).json({ 
                success: false, 
                message: "Lowongan tidak ditemukan" 
            });
        }

        if (lowongan.submittedBy.toString() !== req.userId.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: "Anda tidak memiliki izin untuk menghapus lowongan ini" 
            });
        }

        await Lowongan.findByIdAndDelete(req.params.id);

        res.json({ 
            success: true, 
            message: "Lowongan berhasil dihapus"
        });

    } catch (error) {
        console.error('Hapus lowongan error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// ============ SEARCH ROUTES ============

// Search lomba berdasarkan nama, kategori, atau penyelenggara
route.get("/search/lowongan", async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: "Query tidak boleh kosong" 
            });
        }

        // Cari di nama, kategori, penyelenggara, dan deskripsi
        const results = await Lowongan.find({
            $or: [
                { nama: { $regex: query, $options: 'i' } },
                { kategori: { $regex: query, $options: 'i' } },
                { penyelenggara: { $regex: query, $options: 'i' } },
                { deskripsi: { $regex: query, $options: 'i' } }
            ]
        }).limit(10);

        res.json({ 
            success: true, 
            results,
            total: results.length
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// Ambil semua lowongan untuk hashtag autocomplete (hanya yang approved)
route.get("/lowongan-for-hashtags", async (req, res) => {
    try {
        // Ambil semua lowongan yang sudah diapprove (untuk hashtag suggestions)
        const lowongan = await Lowongan.find({ 
            approvalStatus: 'approved'
        })
            .select('_id nama kategori penyelenggara lokasi deskripsi')
            .sort({ createdAt: -1 });

        res.json({ 
            success: true, 
            lowongan,
            total: lowongan.length
        });

    } catch (error) {
        console.error('Ambil lowongan untuk hashtag error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// ============ APPROVAL ROUTES ============

// Ambil semua lowongan yang perlu approval (untuk developer panel)
route.get("/lowongan-pending-approval", verifyToken, async (req, res) => {
    try {
        const pendingLowongan = await Lowongan.find({ approvalStatus: 'pending' })
            .sort({ createdAt: -1 })
            .populate('submittedBy', 'username nisn')
            .populate('approvedBy', 'username');

        res.json({ 
            success: true, 
            lowongan: pendingLowongan,
            total: pendingLowongan.length
        });

    } catch (error) {
        console.error('Ambil pending lowongan error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// Approve lowongan (hanya admin/developer yang bisa approve)
route.put("/lowongan/:id/approve", verifyToken, async (req, res) => {
    try {
        const lowongan = await Lowongan.findById(req.params.id);

        if (!lowongan) {
            return res.status(404).json({ 
                success: false, 
                message: "Lowongan tidak ditemukan" 
            });
        }

        // Update status menjadi approved
        const approvedLowongan = await Lowongan.findByIdAndUpdate(
            req.params.id,
            {
                approvalStatus: 'approved',
                approvedBy: req.userId,
                approvedAt: new Date()
            },
            { new: true }
        ).populate('submittedBy', 'username').populate('approvedBy', 'username');

        res.json({ 
            success: true, 
            message: "Lowongan berhasil disetujui",
            lowongan: approvedLowongan
        });

    } catch (error) {
        console.error('Approve lowongan error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// Reject lowongan (hanya admin/developer yang bisa reject)
route.put("/lowongan/:id/reject", verifyToken, async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ 
                success: false, 
                message: "Alasan penolakan harus diisi" 
            });
        }

        const lowongan = await Lowongan.findById(req.params.id);

        if (!lowongan) {
            return res.status(404).json({ 
                success: false, 
                message: "Lowongan tidak ditemukan" 
            });
        }

        // Update status menjadi rejected
        const rejectedLowongan = await Lowongan.findByIdAndUpdate(
            req.params.id,
            {
                approvalStatus: 'rejected',
                approvedBy: req.userId,
                rejectionReason: reason,
                approvedAt: new Date()
            },
            { new: true }
        ).populate('submittedBy', 'username').populate('approvedBy', 'username');

        res.json({ 
            success: true, 
            message: "Lowongan berhasil ditolak",
            lowongan: rejectedLowongan
        });

    } catch (error) {
        console.error('Reject lowongan error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

module.exports = route;