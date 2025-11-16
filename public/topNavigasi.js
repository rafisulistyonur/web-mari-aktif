// Add active state on click
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function (e) {
        // e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
    });
});

// Search functionality demo
document.querySelector('.search-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        alert('Mencari: ' + this.value);
    }
});

// Add question button
// document.querySelector('.add-btn').addEventListener('click', function () {
//     alert('Fitur tambah pertanyaan akan dibuka');
// });

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