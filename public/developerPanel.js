// ===== Developer Panel Main Functions =====

let currentTab = 'overview';

// Switch between tabs
function switchTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Mark button as active
    event.target.closest('.tab-btn').classList.add('active');
    
    currentTab = tabName;
    
    // Load data for the tab
    if (tabName === 'overview') {
        loadOverviewData();
    } else if (tabName === 'approval') {
        loadApprovalData();
    }
}

// ===== OVERVIEW TAB =====

async function loadOverviewData() {
    try {
        const token = getToken();
        
        // Fetch statistics
        const statsResponse = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            // Tampilkan format aktif/total untuk users
            document.getElementById('totalUsers').textContent = stats.totalUsers || '0/0';
            document.getElementById('totalComps').textContent = stats.totalCompetitions || 0;
            document.getElementById('totalPosts').textContent = stats.totalPosts || 0;
        }
    } catch (error) {
        console.error('Error loading overview data:', error);
    }
}

// ===== APPROVAL TAB =====

async function loadApprovalData() {
    try {
        const token = getToken();
        const response = await fetch('/api/lowongan-pending-approval', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            const pendingLowongan = result.lowongan;
            document.getElementById('approvalCount').textContent = pendingLowongan.length;
            
            const contentDiv = document.getElementById('approvalContent');
            
            if (pendingLowongan.length === 0) {
                contentDiv.innerHTML = '<div style="background: white; border-radius: 8px; padding: 60px 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08);"><p style="color: #999; font-size: 16px;">✓ Tidak ada lomba yang menunggu persetujuan</p></div>';
                return;
            }
            
            contentDiv.innerHTML = pendingLowongan.map(lomba => `
                <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                        <div>
                            <h3 style="margin: 0 0 5px 0; color: #333; font-size: 18px;">${lomba.nama}</h3>
                            <p style="margin: 0; color: #666; font-size: 13px;">Kategori: <strong>${lomba.kategori}</strong></p>
                        </div>
                        <span style="background: #fff3cd; color: #856404; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">⏳ Pending</span>
                    </div>
                    
                    <!-- Informasi Dasar -->
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                        <h4 style="margin: 0 0 12px 0; color: #333; font-size: 14px;">📋 Informasi Dasar</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 13px;">
                            <div>
                                <span style="color: #666;">Penyelenggara:</span>
                                <p style="margin: 3px 0 0 0; color: #333;"><strong>${lomba.penyelenggara}</strong></p>
                            </div>
                            <div>
                                <span style="color: #666;">Lokasi:</span>
                                <p style="margin: 3px 0 0 0; color: #333;"><strong>${lomba.lokasi}</strong></p>
                            </div>
                            <div>
                                <span style="color: #666;">Submitted By:</span>
                                <p style="margin: 3px 0 0 0; color: #333;"><strong>${lomba.submittedBy?.username || 'Unknown'}</strong></p>
                            </div>
                            <div>
                                <span style="color: #666;">Tanggal Expired:</span>
                                <p style="margin: 3px 0 0 0; color: #333;"><strong>${new Date(lomba.tanggalExpired).toLocaleDateString('id-ID')}</strong></p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Deskripsi -->
                    <div style="background: #f9f9f9; padding: 12px; border-radius: 6px; margin-bottom: 15px;">
                        <p style="margin: 0 0 8px 0; color: #666; font-size: 13px; font-weight: 600;">📝 Deskripsi:</p>
                        <p style="margin: 0; color: #333; font-size: 13px; line-height: 1.6;">${lomba.deskripsi}</p>
                    </div>
                    
                    <!-- Hadiah -->
                    <div style="background: #f9f9f9; padding: 12px; border-radius: 6px; margin-bottom: 15px;">
                        <p style="margin: 0 0 8px 0; color: #666; font-size: 13px; font-weight: 600;">🏆 Hadiah:</p>
                        <p style="margin: 0; color: #333; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">${lomba.hadiah}</p>
                    </div>
                    
                    <!-- Persyaratan -->
                    <div style="background: #f9f9f9; padding: 12px; border-radius: 6px; margin-bottom: 15px;">
                        <p style="margin: 0 0 8px 0; color: #666; font-size: 13px; font-weight: 600;">✓ Persyaratan:</p>
                        <p style="margin: 0; color: #333; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">${lomba.persyaratan}</p>
                    </div>
                    
                    <!-- Link -->
                    <div style="background: #eff3f8; padding: 12px; border-radius: 6px; margin-bottom: 15px;">
                        <p style="margin: 0 0 8px 0; color: #666; font-size: 13px; font-weight: 600;">🔗 Link:</p>
                        <div style="font-size: 13px;">
                            <p style="margin: 5px 0; color: #333;"><strong>Kontak:</strong> <a href="${lomba.linkKontak}" target="_blank" style="color: #2777b9; text-decoration: none;">${lomba.linkKontak}</a></p>
                            <p style="margin: 5px 0; color: #333;"><strong>Pendaftaran:</strong> <a href="${lomba.linkPendaftaran}" target="_blank" style="color: #2777b9; text-decoration: none;">${lomba.linkPendaftaran}</a></p>
                        </div>
                    </div>
                    
                    <!-- Tombol Action -->
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-success" onclick="approveLomba('${lomba._id}')" style="flex: 1;">
                            <i class="fas fa-check"></i> Setujui
                        </button>
                        <button class="btn btn-danger" onclick="rejectLombaPrompt('${lomba._id}')" style="flex: 1;">
                            <i class="fas fa-times"></i> Tolak
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading approval data:', error);
        document.getElementById('approvalContent').innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 40px;">Error loading pending competitions</p>';
    }
}

// Approve lomba
async function approveLomba(lombaId) {
    if (!confirm('Apakah Anda yakin ingin menyetujui lomba ini?')) return;
    
    try {
        const token = getToken();
        const response = await fetch(`/api/lowongan/${lombaId}/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            alert('✓ Lomba berhasil disetujui!');
            loadApprovalData();
        } else {
            alert('Error approving competition');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error approving competition');
    }
}

// Reject lomba dengan alasan
function rejectLombaPrompt(lombaId) {
    const reason = prompt('Berikan alasan penolakan:');
    if (reason && reason.trim()) {
        rejectLomba(lombaId, reason);
    }
}

// Reject lomba
async function rejectLomba(lombaId, reason) {
    try {
        const token = getToken();
        const response = await fetch(`/api/lowongan/${lombaId}/reject`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });
        
        if (response.ok) {
            alert('✓ Lomba berhasil ditolak!');
            loadApprovalData();
        } else {
            alert('Error rejecting competition');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error rejecting competition');
    }
}

// ===== UTILITY FUNCTIONS =====

function getToken() {
    return localStorage.getItem('authToken');
}

// ===== LOGOUT =====

document.getElementById('logoutBtn').addEventListener('click', function() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        window.location.href = '/login';
    }
});

// Load overview data on page load
window.addEventListener('load', function() {
    loadOverviewData();
});
