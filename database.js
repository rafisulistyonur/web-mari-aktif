const mongoose = require('mongoose');
const User = require('./skema/user.js');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
        
        // Auto-create developer account jika belum ada
        await initializeDeveloperAccount();
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Bikin developer account otomatis
async function initializeDeveloperAccount() {
    try {
        const developerExists = await User.findOne({ username: 'developer' });
        
        if (!developerExists) {
            const developer = new User({
                username: 'developer',
                nisn: '9999999999',
                password: 'Dev@2024!SecurePass', // Akan di-hash otomatis
                role: 'developer'
            });
            
            await developer.save();
            console.log('Developer account created: username=developer, password=Dev@2024!SecurePass');
        } else {
            console.log('Developer account already exists');
        }
    } catch (error) {
        console.error('Error creating developer account:', error);
    }
}

// Function untuk reset developer account (untuk case jika developer account error)
async function resetDeveloperAccount() {
    try {
        // Hapus akun developer lama
        await User.deleteOne({ username: 'developer' });
        console.log('Old developer account deleted');
        
        // Buat akun developer baru
        const developer = new User({
            username: 'developer',
            nisn: '9999999999',
            password: 'Dev@2024!SecurePass', // Akan di-hash otomatis
            role: 'developer'
        });
        
        await developer.save();
        console.log('✓ Developer account reset successfully!');
        console.log('Username: developer');
        console.log('Password: Dev@2024!SecurePass');
    } catch (error) {
        console.error('Error resetting developer account:', error);
    }
}

module.exports = connectDB;
module.exports.resetDeveloperAccount = resetDeveloperAccount;

module.exports = connectDB;