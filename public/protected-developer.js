(async function() {
    // Fungsi untuk mendapatkan token
    function getToken() {
        return localStorage.getItem('authToken');
    }

    // Fungsi untuk cek autentikasi dan role developer
    async function checkDeveloperAuth() {
        const token = getToken();
        
        if (!token) {
            // Tidak ada token, redirect ke login
            window.location.href = '/login';
            return null;
        }

        try {
            const response = await fetch('/api/check-auth', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            
            if (!data.success || !data.isAuthenticated) {
                // Token tidak valid, hapus dan redirect ke login
                localStorage.removeItem('authToken');
                window.location.href = '/login';
                return null;
            }

            const user = data.user;

            // Cek apakah user adalah developer
            if (user.role !== 'developer' && user.role !== 'admin') {
                // User bukan developer, redirect ke beranda
                alert('Akses ditolak! Hanya developer yang dapat mengakses panel ini.');
                window.location.href = '/';
                return null;
            }

            return user;
        } catch (error) {
            console.error('Auth check error:', error);
            localStorage.removeItem('authToken');
            window.location.href = '/login';
            return null;
        }
    }

    // Cek developer auth saat halaman load
    const user = await checkDeveloperAuth();
    
    if (user) {
        console.log('Developer authenticated:', user.username);
        
        // Simpan user info ke localStorage
        localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            username: user.username,
            nisn: user.nisn,
            role: user.role
        }));
        
        localStorage.setItem('userRole', user.role);
        
        // Update UI dengan info user jika diperlukan
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = user.username;
        }

        const nisnElement = document.getElementById('userNisn');
        if (nisnElement) {
            nisnElement.textContent = user.nisn;
        }
    }

    // Handle logout button jika ada
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                const token = getToken();
                await fetch('/api/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
            
            // Hapus token dan redirect ke login
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
            window.location.href = '/login';
        });
    }

    // Export helper functions ke global scope
    window.authUser = user;
    window.getAuthToken = getToken;
})();
