const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema({
    // User yang mengirim permintaan
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // User yang menerima permintaan
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Status: pending, accepted, blocked, rejected
    status: {
        type: String,
        enum: ['pending', 'accepted', 'blocked', 'rejected'],
        default: 'pending'
    },
    // Tanggal permintaan dibuat
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Tanggal status berubah
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index untuk query yang lebih cepat
friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });
friendshipSchema.index({ recipient: 1, status: 1 });
friendshipSchema.index({ requester: 1, status: 1 });

const Friendship = mongoose.model('Friendship', friendshipSchema);

module.exports = Friendship;
