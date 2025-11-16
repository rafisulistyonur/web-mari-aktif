// Notification system untuk tag/mention
let unreadNotifications = [];

// Ambil token dari localStorage
function getToken() {
    return localStorage.getItem('authToken');
}

// Load notifikasi dari server
async function loadNotifications() {
    try {
        const token = getToken();
        if (!token) {
            console.warn('⚠️ No token found for notifications');
            return;
        }

        const response = await fetch('/api/notifications', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (data.success) {
            unreadNotifications = data.notifications.filter(n => !n.isRead);
            console.log('📬 Notifications loaded:', {
                total: data.notifications.length,
                unread: unreadNotifications.length,
                notifications: data.notifications
            });
            updateNotificationBadge();
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Update badge pada bell icon
function updateNotificationBadge() {
    const bellBtn = document.querySelector('.icon-btn:has(i.fa-bell)');
    
    // Hapus badge yang sudah ada
    const existingBadge = bellBtn?.querySelector('.notification-badge');
    if (existingBadge) {
        existingBadge.remove();
    }

    // Tambah badge baru jika ada notifikasi yang belum dibaca
    if (unreadNotifications.length > 0) {
        const badge = document.createElement('span');
        badge.className = 'notification-badge';
        badge.textContent = unreadNotifications.length;
        badge.style.cssText = `
            position: absolute;
            top: -8px;
            right: -8px;
            background: #e74c3c;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
        `;
        
        if (bellBtn) {
            bellBtn.style.position = 'relative';
            bellBtn.appendChild(badge);
        }
    }
}

// Tampilkan popup notifikasi
function showNotificationPopup() {
    // Cek apakah popup sudah ada
    let popup = document.getElementById('notificationPopup');
    
    if (popup) {
        popup.remove();
        return;
    }

    // Buat popup baru
    popup = document.createElement('div');
    popup.id = 'notificationPopup';
    popup.className = 'notification-popup';

    if (unreadNotifications.length === 0) {
        popup.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #999;">
                <i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 10px; opacity: 0.5;"></i>
                <p>Belum ada notifikasi</p>
            </div>
        `;
    } else {
        popup.innerHTML = `
            <div class="notification-header">
                <h3>Notifikasi</h3>
                ${unreadNotifications.length > 0 ? `<button class="btn-mark-all-read" onclick="markAllNotificationsRead()">Tandai semua dibaca</button>` : ''}
            </div>
            <div class="notification-list">
                ${unreadNotifications.map(notif => `
                    <div class="notification-item" onclick="handleNotificationClick('${notif._id}', '${notif.postId._id}')">
                        <div class="notification-content">
                            <div class="notification-message" id="msg-${notif._id}"></div>
                            <div class="notification-time">${getTimeAgo(notif.createdAt)}</div>
                        </div>
                        <button class="btn-close-notif" onclick="deleteNotification('${notif._id}', event)">×</button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Styling popup
    popup.style.cssText = `
        position: absolute;
        top: 60px;
        right: 15px;
        width: 350px;
        max-height: 400px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        overflow-y: auto;
        animation: slideDown 0.3s ease;
    `;

    document.body.appendChild(popup);

    // Set message HTML dengan aman
    unreadNotifications.forEach(notif => {
        const msgElement = document.getElementById(`msg-${notif._id}`);
        if (msgElement) {
            msgElement.innerHTML = notif.message;
        }
    });

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .notification-popup {
            animation: slideDown 0.3s ease;
        }
        
        .notification-header {
            padding: 15px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .notification-header h3 {
            margin: 0;
            font-size: 16px;
            color: #333;
        }
        
        .btn-mark-all-read {
            background: none;
            border: none;
            color: #2777b9;
            font-size: 12px;
            cursor: pointer;
            text-decoration: none;
        }
        
        .btn-mark-all-read:hover {
            text-decoration: underline;
        }
        
        .notification-list {
            max-height: 350px;
            overflow-y: auto;
        }
        
        .notification-item {
            padding: 12px 15px;
            border-bottom: 1px solid #f0f0f0;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            cursor: pointer;
            transition: background 0.2s;
            gap: 10px;
        }
        
        .notification-item:hover {
            background: #f9f9f9;
        }
        
        .notification-content {
            flex: 1;
            min-width: 0;
        }
        
        .notification-message {
            font-size: 13px;
            color: #333;
            margin-bottom: 4px;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        
        .notification-message strong {
            color: #2777b9;
        }
        
        .notification-time {
            font-size: 11px;
            color: #999;
        }
        
        .btn-close-notif {
            background: none;
            border: none;
            color: #999;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .btn-close-notif:hover {
            color: #333;
        }
    `;
    
    if (!document.querySelector('style[data-notification]')) {
        style.setAttribute('data-notification', 'true');
        document.head.appendChild(style);
    }
}

// Handle notification click - redirect ke post
async function handleNotificationClick(notificationId, postId) {
    try {
        console.log('🔔 Notification clicked:', { notificationId, postId });
        
        // Mark as read
        const token = getToken();
        const markReadResponse = await fetch(`/api/notifications/${notificationId}/mark-read`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const markReadData = await markReadResponse.json();
        console.log('✓ Mark-read response:', markReadData);

        // Reload notifikasi dengan delay kecil untuk memastikan server update
        await new Promise(resolve => setTimeout(resolve, 200));
        await loadNotifications();
        console.log('✓ Notifications reloaded after mark-read');

        // Scroll ke post jika ada di halaman yang sama
        const postElement = document.getElementById('post-' + postId);
        
        if (postElement) {
            // Post ada di halaman saat ini, scroll ke post
            postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Highlight post untuk beberapa detik
            const originalBackground = postElement.style.backgroundColor;
            postElement.style.backgroundColor = '#fff3cd';
            postElement.style.transition = 'background-color 0.3s ease';
            
            setTimeout(() => {
                postElement.style.backgroundColor = originalBackground;
            }, 2000);
            
            console.log('✓ Scrolled to post:', postId);
        } else {
            // Post tidak ada di halaman, reload halaman pertama untuk load posts
            console.log('Post tidak ada di halaman, loading posts...');
            
            // Coba load semua posts dari /api/post/all
            const response = await fetch('/api/post/all');
            const data = await response.json();
            
            if (data.success && data.posts) {
                // Simulasi klik di postingSystem.js untuk display posts
                if (typeof displayPosts === 'function') {
                    displayPosts(data.posts);
                    
                    // Tunggu DOM update, kemudian scroll
                    setTimeout(() => {
                        const postEl = document.getElementById('post-' + postId);
                        if (postEl) {
                            postEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            
                            // Highlight post
                            const originalBg = postEl.style.backgroundColor;
                            postEl.style.backgroundColor = '#fff3cd';
                            postEl.style.transition = 'background-color 0.3s ease';
                            
                            setTimeout(() => {
                                postEl.style.backgroundColor = originalBg;
                            }, 2000);
                            
                            console.log('✓ Post loaded and scrolled to:', postId);
                        }
                    }, 100);
                }
            }
        }
    } catch (error) {
        console.error('Error handling notification click:', error);
    }
}

// Mark semua notifikasi sebagai dibaca
async function markAllNotificationsRead() {
    try {
        const token = getToken();
        const response = await fetch('/api/notifications/mark-all-read', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            unreadNotifications = [];
            updateNotificationBadge();
            showNotificationPopup(); // Refresh popup
        }
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
}

// Delete single notification
async function deleteNotification(notificationId, event) {
    event.stopPropagation();
    
    try {
        const token = getToken();
        const response = await fetch(`/api/notifications/${notificationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            await loadNotifications();
            showNotificationPopup(); // Refresh popup
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
}

// Helper function: Get time ago
function getTimeAgo(createdAt) {
    const now = new Date();
    const date = new Date(createdAt);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'baru saja';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd';
    return date.toLocaleDateString('id-ID');
}

// Setup notification system
function setupNotificationSystem() {
    const bellBtn = document.querySelector('.icon-btn:has(i.fa-bell)');
    
    if (!bellBtn) {
        console.warn('⚠️ Bell button not found in navbar');
        return;
    }

    console.log('✓ Notification system initialized');

    // Load notifikasi pertama kali
    loadNotifications();

    // Toggle popup saat bell button diklik
    bellBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showNotificationPopup();
    });

    // Close popup saat klik di luar
    document.addEventListener('click', function(e) {
        const popup = document.getElementById('notificationPopup');
        const bellBtn = document.querySelector('.icon-btn:has(i.fa-bell)');
        
        if (popup && !popup.contains(e.target) && !bellBtn?.contains(e.target)) {
            popup.remove();
        }
    });

    // Reload notifikasi setiap 10 detik
    setInterval(loadNotifications, 10000);
}

// Initialize saat DOM ready
document.addEventListener('DOMContentLoaded', setupNotificationSystem);

// Also initialize kalau dipanggil dari script lain
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupNotificationSystem);
} else {
    setupNotificationSystem();
}
