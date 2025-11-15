const mongoose = require('mongoose');

const lowonganSchema = new mongoose.Schema({
    nama: {
        type: String,
        required: [true, 'Nama lomba harus diisi'],
        trim: true
    },
    deskripsi: {
        type: String,
        required: [true, 'Deskripsi harus diisi']
    },
    penyelenggara: {
        type: String,
        required: [true, 'Penyelenggara harus diisi'],
        trim: true
    },
    lokasi: {
        type: String,
        required: [true, 'Lokasi harus diisi'],
        trim: true
    },
    tanggalExpired: {
        type: Date,
        required: [true, 'Tanggal expired harus diisi']
    },
    kategori: {
        type: String,
        enum: ['Matematika', 'Fisika', 'Bahasa Indonesia', 'Desain', 'Teknologi', 'Seni', 'Olahraga', 'Lainnya'],
        required: [true, 'Kategori harus dipilih']
    },
    hadiah: {
        type: String,
        required: [true, 'Hadiah harus diisi']
    },
    persyaratan: {
        type: String,
        required: [true, 'Persyaratan harus diisi']
    },
    linkKontak: {
        type: String,
        required: [true, 'Link kontak harus diisi']
    },
    linkPendaftaran: {
        type: String,
        required: [true, 'Link pendaftaran harus diisi']
    },
    status: {
        type: String,
        enum: ['aktif', 'expired', 'ditutup'],
        default: 'aktif'
    },
    jumlahPeserta: {
        type: Number,
        default: 0
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Middleware untuk update status berdasarkan tanggal expired
lowonganSchema.pre('save', function(next) {
    if (this.tanggalExpired < new Date()) {
        this.status = 'expired';
    }
    next();
});

const Lowongan = mongoose.model('Lowongan', lowonganSchema);

module.exports = Lowongan;
