(async function() {
    // Fungsi untuk mendapatkan token
    function getToken() {
        return localStorage.getItem('authToken');
    }

    // Fungsi untuk cek autentikasi
    async function checkAuth() {
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

            return data.user;
        } catch (error) {
            console.error('Auth check error:', error);
            localStorage.removeItem('authToken');
            window.location.href = '/login';
            return null;
        }
    }

    // Cek autentikasi saat halaman load
    const user = await checkAuth();
    
    if (user) {
        console.log('User authenticated:', user.username);
        
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
            window.location.href = '/login';
        });
    }

    // Export helper functions ke global scope
    window.authUser = user;
    window.getAuthToken = getToken;
})();