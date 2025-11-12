// Fungsi untuk menyimpan token JWT
function saveToken(token) {
    localStorage.setItem('authToken', token);
}

// Fungsi untuk mendapatkan token JWT
function getToken() {
    return localStorage.getItem('authToken');
}

// Fungsi untuk menghapus token JWT
function removeToken() {
    localStorage.removeItem('authToken');
}

// Fungsi untuk redirect ke halaman utama
function redirectToHome() {
    window.location.href = '/';
}

// Fungsi untuk menampilkan error
function showError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

// Fungsi untuk menyembunyikan error
function hideError(elementId) {
    const errorDiv = document.getElementById(elementId);
    errorDiv.classList.add('hidden');
}

// Handle Register Form
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError('registerError');

        const username = document.getElementById('registerNama').value.trim();
        const nisn = document.getElementById('registerNisn').value.trim();
        const password = document.getElementById('registerPassword').value;

        // Validasi client-side
        if (!username || !nisn || !password) {
            showError('registerError', 'Semua field harus diisi');
            return;
        }

        if (password.length < 6) {
            showError('registerError', 'Password minimal 6 karakter');
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, nisn, password })
            });

            const data = await response.json();

            if (data.success) {
                // Simpan token dan redirect
                saveToken(data.token);
                alert('Registrasi berhasil! Selamat datang ' + data.user.username);
                redirectToHome();
            } else {
                showError('registerError', data.message || 'Registrasi gagal');
            }
        } catch (error) {
            console.error('Register error:', error);
            showError('registerError', 'Terjadi kesalahan. Silakan coba lagi.');
        }
    });

    // Handle link ke halaman login
    const goToLogin = document.getElementById('goToLogin');
    if (goToLogin) {
        goToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/login';
        });
    }
}

// Handle Login Form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError('loginError');

        const username = document.getElementById('loginNisn').value.trim();
        const password = document.getElementById('loginPassword').value;

        // Validasi client-side
        if (!username || !password) {
            showError('loginError', 'Username dan password harus diisi');
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                // Simpan token dan redirect
                saveToken(data.token);
                alert('Login berhasil! Selamat datang kembali ' + data.user.username);
                redirectToHome();
            } else {
                showError('loginError', data.message || 'Login gagal');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('loginError', 'Terjadi kesalahan. Silakan coba lagi.');
        }
    });

    // Handle link ke halaman register
    const goToRegister = document.getElementById('goToRegister');
    if (goToRegister) {
        goToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/daftar';
        });
    }
}

// Cek autentikasi saat halaman load (untuk halaman yang memerlukan login)
async function checkAuth() {
    const token = getToken();
    
    if (!token) {
        return false;
    }

    try {
        const response = await fetch('/api/check-auth', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (!data.success || !data.isAuthenticated) {
            removeToken();
            return false;
        }

        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        removeToken();
        return false;
    }
}

// Export untuk digunakan di halaman lain
window.authHelper = {
    getToken,
    removeToken,
    checkAuth,
    saveToken
};