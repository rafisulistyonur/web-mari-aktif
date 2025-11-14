const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("./skema/user.js");
const Friendship = require("./skema/friendship.js");

const friendshipRoute = express.Router();

// Secret key untuk JWT
const JWT_SECRET = process.env.JWT_SECRET || "lomba-secret-key-change-this-in-production";

// Middleware untuk verifikasi JWT
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
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

// ============ SEARCH & BROWSE TEMAN ============

// Cari teman berdasarkan nama/username
friendshipRoute.get("/search", verifyToken, async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Query pencarian tidak boleh kosong"
            });
        }

        // Cari user yang cocok dengan nama/username (exclude diri sendiri)
        const users = await User.find({
            $and: [
                {
                    $or: [
                        { username: { $regex: query, $options: 'i' } },
                        { nisn: { $regex: query, $options: 'i' } }
                    ]
                },
                { _id: { $ne: req.userId } }
            ]
        }).select('_id username nisn createdAt').limit(20);

        // Untuk setiap user, check status pertemanan
        const usersWithFriendshipStatus = await Promise.all(users.map(async (user) => {
            // Cek apakah sudah berteman atau ada permintaan pending
            const friendship = await Friendship.findOne({
                $or: [
                    { requester: req.userId, recipient: user._id },
                    { requester: user._id, recipient: req.userId }
                ]
            });

            let friendshipStatus = 'none'; // none, pending, accepted, blocked

            if (!friendship) {
                friendshipStatus = 'none';
            } else if (friendship.status === 'accepted') {
                friendshipStatus = 'accepted';
            } else if (friendship.status === 'pending') {
                if (friendship.requester.toString() === req.userId) {
                    friendshipStatus = 'pending-sent';
                } else {
                    friendshipStatus = 'pending-received';
                }
            } else if (friendship.status === 'blocked') {
                friendshipStatus = 'blocked';
            }

            return {
                id: user._id,
                username: user.username,
                nisn: user.nisn,
                createdAt: user.createdAt,
                friendshipStatus
            };
        }));

        res.json({
            success: true,
            users: usersWithFriendshipStatus,
            total: usersWithFriendshipStatus.length
        });

    } catch (error) {
        console.error('Search user error:', error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
});

// ============ KIRIM PERMINTAAN PERTEMANAN ============

// Kirim permintaan pertemanan
friendshipRoute.post("/request", verifyToken, async (req, res) => {
    try {
        const { recipientId } = req.body;

        if (!recipientId) {
            return res.status(400).json({
                success: false,
                message: "Recipient ID harus diisi"
            });
        }

        // Pastikan tidak menambahi diri sendiri
        if (recipientId === req.userId) {
            return res.status(400).json({
                success: false,
                message: "Anda tidak bisa menambahi diri sendiri sebagai teman"
            });
        }

        // Cek apakah user tujuan ada
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        // Cek apakah sudah ada relasi pertemanan
        const existingFriendship = await Friendship.findOne({
            $or: [
                { requester: req.userId, recipient: recipientId },
                { requester: recipientId, recipient: req.userId }
            ]
        });

        if (existingFriendship) {
            if (existingFriendship.status === 'accepted') {
                return res.status(400).json({
                    success: false,
                    message: "Anda sudah berteman dengan user ini"
                });
            } else if (existingFriendship.status === 'pending') {
                return res.status(400).json({
                    success: false,
                    message: "Permintaan pertemanan masih pending"
                });
            } else if (existingFriendship.status === 'blocked') {
                return res.status(400).json({
                    success: false,
                    message: "Anda telah memblokir user ini"
                });
            }
        }

        // Buat permintaan pertemanan baru
        const friendship = new Friendship({
            requester: req.userId,
            recipient: recipientId,
            status: 'pending'
        });

        await friendship.save();

        res.status(201).json({
            success: true,
            message: "Permintaan pertemanan berhasil dikirim",
            friendship
        });

    } catch (error) {
        console.error('Send friend request error:', error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
});

// ============ KELOLA PERMINTAAN PERTEMANAN ============

// Ambil daftar permintaan pertemanan yang masuk
friendshipRoute.get("/requests/incoming", verifyToken, async (req, res) => {
    try {
        const requests = await Friendship.find({
            recipient: req.userId,
            status: 'pending'
        }).populate('requester', 'username nisn createdAt').sort({ createdAt: -1 });

        res.json({
            success: true,
            requests,
            total: requests.length
        });

    } catch (error) {
        console.error('Get incoming requests error:', error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
});

// Ambil daftar permintaan pertemanan yang dikirim
friendshipRoute.get("/requests/outgoing", verifyToken, async (req, res) => {
    try {
        const requests = await Friendship.find({
            requester: req.userId,
            status: 'pending'
        }).populate('recipient', 'username nisn createdAt').sort({ createdAt: -1 });

        res.json({
            success: true,
            requests,
            total: requests.length
        });

    } catch (error) {
        console.error('Get outgoing requests error:', error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
});

// Terima permintaan pertemanan
friendshipRoute.put("/requests/:friendshipId/accept", verifyToken, async (req, res) => {
    try {
        const { friendshipId } = req.params;

        const friendship = await Friendship.findById(friendshipId);

        if (!friendship) {
            return res.status(404).json({
                success: false,
                message: "Permintaan pertemanan tidak ditemukan"
            });
        }

        // Pastikan user adalah recipient
        if (friendship.recipient.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "Anda tidak berhak menerima permintaan ini"
            });
        }

        // Cek status
        if (friendship.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Permintaan sudah ${friendship.status}`
            });
        }

        friendship.status = 'accepted';
        await friendship.save();

        const populatedFriendship = await Friendship.findById(friendshipId)
            .populate('requester', 'username nisn')
            .populate('recipient', 'username nisn');

        res.json({
            success: true,
            message: "Permintaan pertemanan diterima",
            friendship: populatedFriendship
        });

    } catch (error) {
        console.error('Accept friend request error:', error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
});

// Tolak permintaan pertemanan
friendshipRoute.put("/requests/:friendshipId/reject", verifyToken, async (req, res) => {
    try {
        const { friendshipId } = req.params;

        const friendship = await Friendship.findById(friendshipId);

        if (!friendship) {
            return res.status(404).json({
                success: false,
                message: "Permintaan pertemanan tidak ditemukan"
            });
        }

        // Pastikan user adalah recipient
        if (friendship.recipient.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "Anda tidak berhak menolak permintaan ini"
            });
        }

        // Cek status
        if (friendship.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Permintaan sudah ${friendship.status}`
            });
        }

        friendship.status = 'rejected';
        await friendship.save();

        res.json({
            success: true,
            message: "Permintaan pertemanan ditolak"
        });

    } catch (error) {
        console.error('Reject friend request error:', error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
});

// ============ DAFTAR TEMAN ============

// Ambil daftar semua teman (status accepted)
friendshipRoute.get("/list", verifyToken, async (req, res) => {
    try {
        const friendships = await Friendship.find({
            $or: [
                { requester: req.userId, status: 'accepted' },
                { recipient: req.userId, status: 'accepted' }
            ]
        }).populate([
            { path: 'requester', select: 'username nisn' },
            { path: 'recipient', select: 'username nisn' }
        ]).sort({ updatedAt: -1 });

        // Normalize data - ambil teman dari kedua sisi relasi dan include friendship ID
        const friends = friendships.map(friendship => {
            const friendUser = friendship.requester._id.toString() === req.userId 
                ? friendship.recipient 
                : friendship.requester;
            
            return {
                ...friendUser.toObject(),
                friendshipId: friendship._id
            };
        });

        res.json({
            success: true,
            friends,
            total: friends.length
        });

    } catch (error) {
        console.error('Get friends list error:', error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
});

// ============ HAPUS TEMAN ============

// Hapus teman berdasarkan userId
friendshipRoute.delete("/user/:userId", verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Cek apakah user tujuan ada
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        // Cari friendship dari kedua sisi
        const friendship = await Friendship.findOne({
            $or: [
                { requester: req.userId, recipient: userId, status: 'accepted' },
                { requester: userId, recipient: req.userId, status: 'accepted' }
            ]
        });

        if (!friendship) {
            return res.status(404).json({
                success: false,
                message: "Pertemanan tidak ditemukan"
            });
        }

        await Friendship.findByIdAndDelete(friendship._id);

        res.json({
            success: true,
            message: "Teman berhasil dihapus"
        });

    } catch (error) {
        console.error('Delete friend error:', error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
});

module.exports = friendshipRoute;
