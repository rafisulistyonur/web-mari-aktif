// Fungsi untuk get token dari localStorage
function getToken() {
    return localStorage.getItem('authToken');
}

// Fungsi untuk get current user ID
function getCurrentUserId() {
    return localStorage.getItem('userId');
}

// Fungsi untuk mencari teman
async function searchFriends() {
    const searchInput = document.getElementById('friendSearchInput');
    const query = searchInput.value.trim();

    if (!query) {
        showAlert('Masukkan nama atau NISN untuk dicari', 'warning');
        return;
    }

    try {
        const token = getToken();
        if (!token) {
            showAlert('Session Anda telah berakhir. Silakan login kembali.', 'error');
            window.location.href = '/login';
            return;
        }

        const response = await fetch(`/api/friendship/search?query=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            showAlert('Session Anda telah berakhir. Silakan login kembali.', 'error');
            localStorage.removeItem('authToken');
            window.location.href = '/login';
            return;
        }

        if (!response.ok) {
            const error = await response.json();
            showAlert(error.message || 'Gagal mencari teman', 'error');
            return;
        }

        const data = await response.json();
        displaySearchResults(data.users);
    } catch (error) {
        console.error('Search friends error:', error);
        showAlert('Terjadi kesalahan saat mencari teman', 'error');
    }
}

// Tampilkan hasil pencarian
function displaySearchResults(users) {
    const resultsContainer = document.getElementById('searchResultsContainer');
    
    if (!users || users.length === 0) {
        resultsContainer.innerHTML = `
            <div class="empty-search-state">
                <i class="fas fa-search"></i>
                <p>Tidak ada hasil pencarian</p>
            </div>
        `;
        return;
    }

    resultsContainer.innerHTML = users.map(user => `
        <div class="friend-card">
            <div class="friend-info">
                <div class="friend-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="friend-details">
                    <h3 class="friend-username">${escapeHtml(user.username)}</h3>
                    <p class="friend-nisn">NISN: ${escapeHtml(user.nisn)}</p>
                </div>
            </div>
            <div class="friend-action">
                ${getFriendshipActionButton(user.friendshipStatus, user.id)}
            </div>
        </div>
    `).join('');
}

// Get action button berdasarkan status pertemanan
function getFriendshipActionButton(status, userId) {
    switch (status) {
        case 'none':
            return `<button class="btn btn-add" onclick="sendFriendRequest('${userId}')">
                <i class="fas fa-user-plus"></i> Tambah Teman
            </button>`;
        case 'pending-sent':
            return `<button class="btn btn-pending" disabled>
                <i class="fas fa-clock"></i> Pending
            </button>`;
        case 'pending-received':
            return `<button class="btn btn-received" onclick="showFriendRequest('${userId}')">
                <i class="fas fa-check"></i> Lihat Permintaan
            </button>`;
        case 'accepted':
            return `<button class="btn btn-friend" disabled>
                <i class="fas fa-check-circle"></i> Teman
            </button>`;
        case 'blocked':
            return `<button class="btn btn-blocked" disabled>
                <i class="fas fa-ban"></i> Diblokir
            </button>`;
        default:
            return '';
    }
}

// Kirim permintaan pertemanan
async function sendFriendRequest(recipientId) {
    if (!confirm('Kirim permintaan pertemanan ke user ini?')) {
        return;
    }

    try {
        const token = getToken();
        if (!token) {
            showAlert('Session Anda telah berakhir. Silakan login kembali.', 'error');
            window.location.href = '/login';
            return;
        }

        const response = await fetch('/api/friendship/request', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                recipientId: recipientId
            })
        });

        if (response.status === 401) {
            showAlert('Session Anda telah berakhir. Silakan login kembali.', 'error');
            localStorage.removeItem('authToken');
            window.location.href = '/login';
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            showAlert(data.message || 'Gagal mengirim permintaan', 'error');
            return;
        }

        showAlert('Permintaan pertemanan berhasil dikirim', 'success');
        // Refresh halaman untuk update status
        setTimeout(() => location.reload(), 1500);
    } catch (error) {
        console.error('Send friend request error:', error);
        showAlert('Terjadi kesalahan saat mengirim permintaan', 'error');
    }
}

// Load permintaan pertemanan yang masuk
async function loadIncomingRequests() {
    try {
        const token = getToken();
        if (!token) {
            showAlert('Session Anda telah berakhir. Silakan login kembali.', 'error');
            window.location.href = '/login';
            return;
        }

        const response = await fetch('/api/friendship/requests/incoming', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            showAlert('Session Anda telah berakhir. Silakan login kembali.', 'error');
            localStorage.removeItem('authToken');
            window.location.href = '/login';
            return;
        }

        if (!response.ok) {
            throw new Error(`Failed to load incoming requests: ${response.status}`);
        }

        const data = await response.json();
        displayIncomingRequests(data.requests);
    } catch (error) {
        console.error('Load incoming requests error:', error);
        // Jangan tampilkan error message jika ini adalah kesalahan saat fetch awal
        // Hanya tampilkan empty state
    }
}

// Tampilkan permintaan yang masuk
function displayIncomingRequests(requests) {
    const container = document.getElementById('incomingRequestsContainer');
    
    if (!requests || requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-user-friends"></i>
                </div>
                <h2 class="empty-state-title">Belum Ada Permintaan Pertemanan</h2>
                <p class="empty-state-text">
                    Saat seseorang mengirimkan permintaan pertemanan kepada Anda,<br>
                    permintaan tersebut akan muncul di sini.
                </p>
                <button class="empty-state-btn" onclick="switchTab('find-friends')">
                    <i class="fas fa-search"></i> Temukan Teman
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = requests.map(req => `
        <div class="request-card">
            <div class="request-info">
                <div class="friend-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="request-details">
                    <h3>${escapeHtml(req.requester.username)}</h3>
                    <p class="text-muted">NISN: ${escapeHtml(req.requester.nisn)}</p>
                    <p class="text-muted text-small">${formatDate(req.createdAt)}</p>
                </div>
            </div>
            <div class="request-actions">
                <button class="btn btn-success" onclick="acceptFriendRequest('${req._id}')">
                    <i class="fas fa-check"></i> Terima
                </button>
                <button class="btn btn-danger" onclick="rejectFriendRequest('${req._id}')">
                    <i class="fas fa-times"></i> Tolak
                </button>
            </div>
        </div>
    `).join('');
}

// Terima permintaan pertemanan
async function acceptFriendRequest(friendshipId) {
    try {
        const token = getToken();
        if (!token) {
            showAlert('Session Anda telah berakhir. Silakan login kembali.', 'error');
            window.location.href = '/login';
            return;
        }

        const response = await fetch(`/api/friendship/requests/${friendshipId}/accept`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            showAlert('Session Anda telah berakhir. Silakan login kembali.', 'error');
            localStorage.removeItem('authToken');
            window.location.href = '/login';
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            showAlert(data.message || 'Gagal menerima permintaan', 'error');
            return;
        }

        showAlert('Permintaan pertemanan diterima', 'success');
        loadIncomingRequests();
    } catch (error) {
        console.error('Accept friend request error:', error);
        showAlert('Terjadi kesalahan', 'error');
    }
}

// Tolak permintaan pertemanan
async function rejectFriendRequest(friendshipId) {
    if (!confirm('Tolak permintaan pertemanan ini?')) {
        return;
    }

    try {
        const token = getToken();
        if (!token) {
            showAlert('Session Anda telah berakhir. Silakan login kembali.', 'error');
            window.location.href = '/login';
            return;
        }

        const response = await fetch(`/api/friendship/requests/${friendshipId}/reject`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            showAlert('Session Anda telah berakhir. Silakan login kembali.', 'error');
            localStorage.removeItem('authToken');
            window.location.href = '/login';
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            showAlert(data.message || 'Gagal menolak permintaan', 'error');
            return;
        }

        showAlert('Permintaan pertemanan ditolak', 'success');
        loadIncomingRequests();
    } catch (error) {
        console.error('Reject friend request error:', error);
        showAlert('Terjadi kesalahan', 'error');
    }
}

// Load daftar teman
async function loadFriendsList() {
    try {
        const token = getToken();
        if (!token) {
            showAlert('Session Anda telah berakhir. Silakan login kembali.', 'error');
            window.location.href = '/login';
            return;
        }

        const response = await fetch('/api/friendship/list', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            showAlert('Session Anda telah berakhir. Silakan login kembali.', 'error');
            localStorage.removeItem('authToken');
            window.location.href = '/login';
            return;
        }

        if (!response.ok) {
            throw new Error('Failed to load friends list');
        }

        const data = await response.json();
        displayFriendsList(data.friends);
    } catch (error) {
        console.error('Load friends list error:', error);
        // Tampilkan empty state, bukan error message
    }
}

// Tampilkan daftar teman
function displayFriendsList(friends) {
    const container = document.getElementById('friendsListContainer');
    
    if (!friends || friends.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-users"></i>
                </div>
                <h2 class="empty-state-title">Belum Ada Teman</h2>
                <p class="empty-state-text">
                    Mulai temukan teman dan bangun jaringan Anda di Mari Aktif!
                </p>
                <button class="empty-state-btn" onclick="switchTab('find-friends')">
                    <i class="fas fa-search"></i> Temukan Teman
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = friends.map(friend => `
        <div class="friend-card">
            <div class="friend-info">
                <div class="friend-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="friend-details">
                    <h3 class="friend-username">${escapeHtml(friend.username)}</h3>
                    <p class="friend-nisn">NISN: ${escapeHtml(friend.nisn)}</p>
                </div>
            </div>
            <div class="friend-action">
                <button class="btn btn-small btn-danger" onclick="removeFriend('${friend._id}', '${friend.friendshipId}')">
                    <i class="fas fa-user-minus"></i> Hapus
                </button>
            </div>
        </div>
    `).join('');
}

// Hapus teman
async function removeFriend(userId, friendshipId) {
    if (!confirm('Hapus teman ini? Aksi ini tidak bisa dibatalkan.')) {
        return;
    }

    try {
        const token = getToken();
        if (!token) {
            showAlert('Session Anda telah berakhir. Silakan login kembali.', 'error');
            window.location.href = '/login';
            return;
        }

        const response = await fetch(`/api/friendship/user/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            showAlert('Session Anda telah berakhir. Silakan login kembali.', 'error');
            localStorage.removeItem('authToken');
            window.location.href = '/login';
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            showAlert(data.message || 'Gagal menghapus teman', 'error');
            return;
        }

        showAlert('Teman berhasil dihapus', 'success');
        loadFriendsList();
    } catch (error) {
        console.error('Remove friend error:', error);
        showAlert('Terjadi kesalahan saat menghapus teman', 'error');
    }
}

// Switch tab
function switchTab(tabName) {
    // Hide semua tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class dari semua tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show tab yang dipilih
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active class ke button yang dipilih
    event.target.classList.add('active');

    // Load data sesuai tab
    if (tabName === 'find-friends') {
        document.getElementById('friendSearchInput').focus();
    } else if (tabName === 'requests') {
        loadIncomingRequests();
    } else if (tabName === 'friends') {
        loadFriendsList();
    }
}

// Format tanggal
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return `Hari ini pukul ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
        return `Kemarin pukul ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    }
}

// Escape HTML untuk security
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Alert helper dengan toast
function showAlert(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Buat toast container jika belum ada
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        document.body.appendChild(toastContainer);
    }

    // Buat toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-info-circle';
    switch(type) {
        case 'success':
            icon = 'fa-check-circle';
            break;
        case 'error':
            icon = 'fa-exclamation-circle';
            break;
        case 'warning':
            icon = 'fa-exclamation-triangle';
            break;
    }
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${escapeHtml(message)}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Init ketika halaman load
document.addEventListener('DOMContentLoaded', function() {
    // Load incoming requests saat halaman load
    loadIncomingRequests();
    
    // Setup search dengan Enter key
    const searchInput = document.getElementById('friendSearchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchFriends();
            }
        });
    }
});

// Find friends shortcut (dari empty state)
function findFriends() {
    switchTab('find-friends');
}
