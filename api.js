const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
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

// ============ STATISTICS ROUTES (FOR DEVELOPER PANEL) ============

// Ambil statistik total users (aktif dan total), competitions, dan posts
route.get("/stats", verifyToken, async (req, res) => {
    try {
        // Import Post model
        const Post = require('./skema/post.js');

        // Hitung total users keseluruhan (tidak termasuk developer dan admin)
        const totalUsersAll = await User.countDocuments({ role: 'user' });

        // Hitung users aktif (yang login/update dalam 24 jam terakhir)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const activeUsers = await User.countDocuments({ 
            role: 'user',
            updatedAt: { $gte: oneDayAgo } 
        });

        // Hitung total competitions (hanya yang approved)
        const totalCompetitions = await Lowongan.countDocuments({ 
            approvalStatus: 'approved' 
        });

        // Hitung total posts
        const totalPosts = await Post.countDocuments({});

        res.json({
            success: true,
            totalUsers: `${activeUsers}/${totalUsersAll}`, // Format: aktif/total
            activeUsers: activeUsers,
            totalUsersAll: totalUsersAll,
            totalCompetitions,
            totalPosts,
            serverStatus: 'online'
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server",
            error: error.message
        });
    }
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
        // Generate JWT token dengan role
        const token = jwt.sign(
            { 
                userId: user._id, 
                username: user.username,
                nisn: user.nisn,
                role: user.role
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
                nisn: user.nisn,
                role: user.role
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

        // Generate JWT token dengan role
        const token = jwt.sign(
            { 
                userId: user._id, 
                username: user.username,
                nisn: user.nisn,
                role: user.role
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
                nisn: user.nisn,
                role: user.role
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
                nisn: user.nisn,
                role: user.role
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

// Get saved competitions untuk user
route.get("/user/saved-competitions", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('savedCompetitions.competitionId');
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User tidak ditemukan" 
            });
        }

        const savedCompetitions = user.savedCompetitions.map(item => ({
            id: item.competitionId._id,
            title: item.competitionId.nama,
            organizer: item.competitionId.penyelenggara,
            category: item.competitionId.kategori,
            savedAt: item.savedAt
        }));

        res.json({ 
            success: true, 
            savedCompetitions 
        });

    } catch (error) {
        console.error('Get saved competitions error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// Save competition untuk user
route.post("/user/save-competition", verifyToken, async (req, res) => {
    try {
        const { competitionId } = req.body;

        if (!competitionId) {
            return res.status(400).json({ 
                success: false, 
                message: "Competition ID harus diisi" 
            });
        }

        // Validasi format ObjectId
        if (!mongoose.Types.ObjectId.isValid(competitionId)) {
            return res.status(400).json({ 
                success: false, 
                message: "Format Competition ID tidak valid" 
            });
        }

        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User tidak ditemukan" 
            });
        }

        // Cek apakah sudah disimpan
        const isAlreadySaved = user.savedCompetitions.some(
            item => item.competitionId.toString() === competitionId
        );

        if (isAlreadySaved) {
            return res.status(400).json({ 
                success: false, 
                message: "Kompetisi ini sudah disimpan" 
            });
        }

        // Tambah ke saved competitions
        user.savedCompetitions.push({ competitionId });
        await user.save();

        res.json({ 
            success: true, 
            message: "Kompetisi berhasil disimpan" 
        });

    } catch (error) {
        console.error('Save competition error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// Delete saved competition untuk user
route.post("/user/unsave-competition", verifyToken, async (req, res) => {
    try {
        const { competitionId } = req.body;

        if (!competitionId) {
            return res.status(400).json({ 
                success: false, 
                message: "Competition ID harus diisi" 
            });
        }

        // Validasi format ObjectId
        if (!mongoose.Types.ObjectId.isValid(competitionId)) {
            return res.status(400).json({ 
                success: false, 
                message: "Format Competition ID tidak valid" 
            });
        }

        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User tidak ditemukan" 
            });
        }

        // Hapus dari saved competitions
        user.savedCompetitions = user.savedCompetitions.filter(
            item => item.competitionId.toString() !== competitionId
        );
        await user.save();

        res.json({ 
            success: true, 
            message: "Kompetisi dihapus dari simpanan" 
        });

    } catch (error) {
        console.error('Unsave competition error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// Delete lowongan (hanya developer/admin yang bisa delete)
route.post("/lowongan/delete", verifyToken, async (req, res) => {
    try {
        const { competitionId } = req.body;
        const user = await User.findById(req.userId);

        // Cek apakah user adalah developer atau admin
        if (user.role !== 'developer' && user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: "Anda tidak memiliki izin untuk menghapus kompetisi" 
            });
        }

        // Validasi ObjectId
        if (!mongoose.Types.ObjectId.isValid(competitionId)) {
            return res.status(400).json({ 
                success: false, 
                message: "Format Kompetisi ID tidak valid" 
            });
        }

        // Cek lowongan ada atau tidak
        const lowongan = await Lowongan.findById(competitionId);
        
        if (!lowongan) {
            return res.status(404).json({ 
                success: false, 
                message: "Kompetisi tidak ditemukan" 
            });
        }

        // Hapus lowongan
        await Lowongan.findByIdAndDelete(competitionId);

        res.json({ 
            success: true, 
            message: "Kompetisi berhasil dihapus" 
        });

    } catch (error) {
        console.error('Delete lowongan error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// ============ NOTIFICATION ROUTES ============

// Ambil semua notifikasi user
route.get("/notifications", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .populate('notifications.fromUser', 'username')
            .populate('notifications.postId', '_id content');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        // Sort by createdAt descending (terbaru di atas)
        const notifications = user.notifications.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        res.json({
            success: true,
            notifications,
            unreadCount: notifications.filter(n => !n.isRead).length
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
});

// Tandai notifikasi sebagai sudah dibaca
route.post("/notifications/:notificationId/mark-read", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        // Cari dan tandai notifikasi
        const notification = user.notifications.id(req.params.notificationId);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notifikasi tidak ditemukan"
            });
        }

        notification.isRead = true;
        notification.markedReadAt = new Date();
        await user.save();

        res.json({
            success: true,
            message: "Notifikasi sudah ditandai dibaca"
        });

    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
});

// Tandai semua notifikasi sebagai sudah dibaca
route.post("/notifications/mark-all-read", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        // Tandai semua notifikasi sebagai sudah dibaca
        user.notifications.forEach(notification => {
            if (!notification.isRead) {
                notification.isRead = true;
                notification.markedReadAt = new Date();
            }
        });

        await user.save();

        res.json({
            success: true,
            message: "Semua notifikasi sudah ditandai dibaca"
        });

    } catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
});

// Hapus notifikasi
route.delete("/notifications/:notificationId", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        // Hapus notifikasi
        user.notifications.id(req.params.notificationId).remove();
        await user.save();

        res.json({
            success: true,
            message: "Notifikasi berhasil dihapus"
        });

    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
});

// Hapus semua notifikasi
route.delete("/notifications", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        // Hapus semua notifikasi
        user.notifications = [];
        await user.save();

        res.json({
            success: true,
            message: "Semua notifikasi berhasil dihapus"
        });

    } catch (error) {
        console.error('Delete all notifications error:', error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
});

// ============ USERS ROUTES (FOR MENTION AUTOCOMPLETE) ============

// Ambil daftar teman users (untuk mention autocomplete) - hanya user yang sudah menjadi teman
route.get("/users/list", verifyToken, async (req, res) => {
    try {
        const Friendship = require('./skema/friendship.js');
        
        // Cari semua friendship yang accepted dengan user saat ini
        const friendships = await Friendship.find({
            $or: [
                { requester: req.userId, status: 'accepted' },
                { recipient: req.userId, status: 'accepted' }
            ]
        }).select('requester recipient');

        // Extract user IDs yang menjadi teman
        const friendUserIds = friendships.map(f => {
            if (f.requester.toString() === req.userId) {
                return f.recipient;
            } else {
                return f.requester;
            }
        });

        // Ambil data user teman
        const friends = await User.find({
            _id: { $in: friendUserIds }
        }).select('username').sort({ username: 1 });

        const usernames = friends.map(u => u.username);

        res.json({
            success: true,
            users: usernames,
            total: usernames.length
        });

    } catch (error) {
        console.error('Get friends list error:', error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
});

// ============ NOTIFICATION AUTO-CLEANUP ============

// Auto-cleanup notifications yang sudah dibaca 1 hari lalu
route.post("/notifications/cleanup", async (req, res) => {
    try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        // Update semua users: hapus notifikasi yang sudah dibaca > 1 hari
        // PENTING: HANYA hapus jika markedReadAt ada DAN lebih lama dari 24 jam
        const result = await User.updateMany(
            {
                'notifications': {
                    $elemMatch: {
                        isRead: true,
                        markedReadAt: { $ne: null, $lt: oneDayAgo }
                    }
                }
            },
            {
                $pull: {
                    notifications: {
                        isRead: true,
                        markedReadAt: { $ne: null, $lt: oneDayAgo }
                    }
                }
            }
        );

        console.log(`🧹 Notification cleanup complete:`, {
            modifiedCount: result.modifiedCount,
            timestamp: new Date().toISOString(),
            oneDayAgoLimit: oneDayAgo.toISOString()
        });

        res.json({
            success: true,
            message: "Notifications cleaned up",
            modifiedUsers: result.modifiedCount
        });

    } catch (error) {
        console.error('Notification cleanup error:', error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
});

module.exports = route;