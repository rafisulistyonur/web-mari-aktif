const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username harus diisi'],
        unique: true,
        trim: true,
        minlength: [3, 'Username minimal 3 karakter']
    },
    nisn: {
        type: String,
        required: [true, 'NISN harus diisi'],
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password harus diisi'],
        minlength: [6, 'Password minimal 6 karakter']
    },
    role: {
        type: String,
        enum: ['user', 'developer', 'admin'],
        default: 'user'
    },
    savedCompetitions: [{
        competitionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lowongan'
        },
        savedAt: {
            type: Date,
            default: Date.now
        }
    }],
    notifications: [{
        type: {
            type: String,
            enum: ['tag', 'comment', 'like'],
            default: 'tag'
        },
        fromUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        fromUsername: {
            type: String,
            required: true
        },
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
            required: true
        },
        message: {
            type: String,
            required: true
        },
        isRead: {
            type: Boolean,
            default: false
        },
        markedReadAt: {
            type: Date,
            default: null
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true // Menambahkan createdAt dan updatedAt otomatis
});

// Hash password sebelum disimpan
userSchema.pre('save', async function(next) {
    // Hanya hash password jika password baru atau diubah
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method untuk membandingkan password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

const User = mongoose.model('User', userSchema);

module.exports = User;