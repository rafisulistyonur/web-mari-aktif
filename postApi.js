const express = require("express");
const jwt = require("jsonwebtoken");
const Post = require("./skema/post.js");
const User = require("./skema/user.js");

const postRoute = express.Router();

// Secret key untuk JWT
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

// ============ POST ROUTES ============

// Buat postingan baru
postRoute.post("/create", verifyToken, async (req, res) => {
    try {
        const { content } = req.body;

        // Validasi input
        if (!content || content.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: "Konten postingan tidak boleh kosong" 
            });
        }

        // Buat postingan baru
        const post = new Post({
            author: req.userId,
            authorUsername: req.username,
            content: content.trim()
        });

        await post.save();

        // Populate author info
        await post.populate('author', '-password');

        // Detect @mention dan buat notifikasi (hanya untuk teman)
        const Friendship = require('./skema/friendship.js');
        const mentionRegex = /@([^\s@]+(?:\s+[^\s@]+)*)/g;
        let match;
        const mentionedUsernames = new Set();

        while ((match = mentionRegex.exec(content)) !== null) {
            mentionedUsernames.add(match[1]);
        }

        console.log('Detected mentions:', Array.from(mentionedUsernames));

        // Buat notifikasi untuk setiap user yang di-tag (hanya jika sudah berteman)
        for (const username of mentionedUsernames) {
            try {
                // Cari user berdasarkan username (jangan tag diri sendiri)
                if (username.toLowerCase() !== req.username.toLowerCase()) {
                    const taggedUser = await User.findOne({ username: new RegExp('^' + username + '$', 'i') });
                    
                    if (taggedUser) {
                        // Check apakah sudah berteman
                        const isFriend = await Friendship.findOne({
                            $or: [
                                { requester: req.userId, recipient: taggedUser._id, status: 'accepted' },
                                { requester: taggedUser._id, recipient: req.userId, status: 'accepted' }
                            ]
                        });

                        if (isFriend) {
                            // Check apakah sudah ada notification untuk post ini dari user ini
                            const existingNotif = taggedUser.notifications.find(n => 
                                n.postId.toString() === post._id.toString() && 
                                n.fromUser.toString() === req.userId.toString()
                            );

                            if (!existingNotif) {
                                // Tambah notifikasi (hanya jika belum ada)
                                taggedUser.notifications.push({
                                    type: 'tag',
                                    fromUser: req.userId,
                                    fromUsername: req.username,
                                    postId: post._id,
                                    message: `<strong style="color: #2777b9;">@${req.username}</strong> mentioned you in a post`,
                                    isRead: false
                                });

                                await taggedUser.save();
                                console.log(`✓ Notification sent to @${username} (friend)`);
                            } else {
                                console.log(`ℹ️ Notification already exists for @${username}`);
                            }
                        } else {
                            console.log(`⚠️ Cannot tag @${username} - not a friend yet`);
                        }
                    } else {
                        console.log(`⚠️ User @${username} not found`);
                    }
                } else {
                    console.log(`⚠️ Skipped tagging self: @${username}`);
                }
            } catch (error) {
                console.error(`Error creating notification for @${username}:`, error);
            }
        }

        res.status(201).json({ 
            success: true, 
            message: "Postingan berhasil dibuat",
            post: {
                _id: post._id,
                author: {
                    _id: post.author._id,
                    username: post.author.username
                },
                authorUsername: post.authorUsername,
                content: post.content,
                likes: post.likes,
                dislikes: post.dislikes,
                comments: post.comments,
                createdAt: post.createdAt
            }
        });

    } catch (error) {
        console.error('Buat postingan error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server",
            error: error.message
        });
    }
});

// Ambil semua postingan
postRoute.get("/all", async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate('author', '-password')
            .populate('likes', 'username')
            .populate('dislikes', 'username')
            .populate('comments.author', 'username');

        res.json({ 
            success: true, 
            posts,
            total: posts.length
        });

    } catch (error) {
        console.error('Ambil postingan error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// Ambil postingan berdasarkan ID
postRoute.get("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', '-password')
            .populate('likes', 'username')
            .populate('dislikes', 'username')
            .populate('comments.author', 'username');

        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: "Postingan tidak ditemukan" 
            });
        }

        res.json({ 
            success: true, 
            post
        });

    } catch (error) {
        console.error('Ambil detail postingan error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// Like postingan
postRoute.post("/:id/like", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: "Postingan tidak ditemukan" 
            });
        }

        // Cek apakah user sudah like
        const hasLiked = post.likes.includes(req.userId);
        const hasDisliked = post.dislikes.includes(req.userId);

        if (hasLiked) {
            // Unlike postingan
            post.likes = post.likes.filter(id => id.toString() !== req.userId.toString());
        } else {
            // Like postingan
            post.likes.push(req.userId);
            // Jika sudah dislike, hapus dislike
            if (hasDisliked) {
                post.dislikes = post.dislikes.filter(id => id.toString() !== req.userId.toString());
            }
        }

        await post.save();

        res.json({ 
            success: true, 
            message: hasLiked ? "Unlike berhasil" : "Like berhasil",
            post: {
                _id: post._id,
                likes: post.likes,
                dislikes: post.dislikes
            }
        });

    } catch (error) {
        console.error('Like postingan error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// Dislike postingan
postRoute.post("/:id/dislike", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: "Postingan tidak ditemukan" 
            });
        }

        // Cek apakah user sudah dislike
        const hasDisliked = post.dislikes.includes(req.userId);
        const hasLiked = post.likes.includes(req.userId);

        if (hasDisliked) {
            // Buka dislike postingan
            post.dislikes = post.dislikes.filter(id => id.toString() !== req.userId.toString());
        } else {
            // Dislike postingan
            post.dislikes.push(req.userId);
            // Jika sudah like, hapus like
            if (hasLiked) {
                post.likes = post.likes.filter(id => id.toString() !== req.userId.toString());
            }
        }

        await post.save();

        res.json({ 
            success: true, 
            message: hasDisliked ? "Buka dislike berhasil" : "Dislike berhasil",
            post: {
                _id: post._id,
                likes: post.likes,
                dislikes: post.dislikes
            }
        });

    } catch (error) {
        console.error('Dislike postingan error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// Tambah komentar
postRoute.post("/:id/comment", verifyToken, async (req, res) => {
    try {
        const { content } = req.body;

        // Validasi input
        if (!content || content.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: "Komentar tidak boleh kosong" 
            });
        }

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: "Postingan tidak ditemukan" 
            });
        }

        // Tambah komentar
        post.comments.push({
            author: req.userId,
            authorUsername: req.username,
            content: content.trim()
        });

        await post.save();
        await post.populate('comments.author', 'username');

        res.status(201).json({ 
            success: true, 
            message: "Komentar berhasil ditambahkan",
            comments: post.comments
        });

    } catch (error) {
        console.error('Tambah komentar error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// Hapus komentar
postRoute.delete("/:id/comment/:commentId", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: "Postingan tidak ditemukan" 
            });
        }

        const comment = post.comments.id(req.params.commentId);

        if (!comment) {
            return res.status(404).json({ 
                success: false, 
                message: "Komentar tidak ditemukan" 
            });
        }

        // Cek apakah user adalah pembuat komentar
        if (comment.author.toString() !== req.userId.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: "Anda tidak bisa menghapus komentar orang lain" 
            });
        }

        post.comments.id(req.params.commentId).remove();
        await post.save();

        res.json({ 
            success: true, 
            message: "Komentar berhasil dihapus"
        });

    } catch (error) {
        console.error('Hapus komentar error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// Hapus postingan
postRoute.delete("/:id", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: "Postingan tidak ditemukan" 
            });
        }

        // Cek apakah user adalah pembuat postingan
        if (post.author.toString() !== req.userId.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: "Anda tidak bisa menghapus postingan orang lain" 
            });
        }

        await Post.findByIdAndDelete(req.params.id);

        res.json({ 
            success: true, 
            message: "Postingan berhasil dihapus" 
        });

    } catch (error) {
        console.error('Hapus postingan error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

// Update postingan
postRoute.put("/:id", verifyToken, async (req, res) => {
    try {
        const { content } = req.body;

        // Validasi input
        if (!content || content.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: "Konten postingan tidak boleh kosong" 
            });
        }

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: "Postingan tidak ditemukan" 
            });
        }

        // Cek apakah user adalah pembuat postingan
        if (post.author.toString() !== req.userId.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: "Anda tidak bisa mengubah postingan orang lain" 
            });
        }

        post.content = content.trim();
        post.updatedAt = new Date();
        await post.save();

        res.json({ 
            success: true, 
            message: "Postingan berhasil diupdate",
            post
        });

    } catch (error) {
        console.error('Update postingan error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server" 
        });
    }
});

module.exports = postRoute;
