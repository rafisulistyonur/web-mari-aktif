let lombaData = [];
let editingId = null;
let currentUserId = null;
let token = null;

// Dapatkan token dari localStorage
function getToken() {
    return localStorage.getItem('authToken');
}

// Dapatkan user info dari localStorage
function getUserInfo() {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return window.authUser; // Fallback ke window.authUser jika ada
        }
    }
    return window.authUser; // Fallback ke window.authUser
}

// Inisialisasi - ambil data dari database
function initData() {
    token = getToken();
    const user = getUserInfo();
    if (user) {
        currentUserId = user.id;
        console.log('Current user ID:', currentUserId);
    }
    
    if (!token) {
        console.log('No token found, user needs to login');
        alert('Silakan login terlebih dahulu');
        window.location.href = '/login';
        return;
    }
    
    loadLombaDariDatabase();
}

// Ambil data lowongan milik user dari database
async function loadLombaDariDatabase() {
    try {
        const headers = {
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch('/api/lowongan/my', { headers });
        const result = await response.json();
        
        if (result.success) {
            lombaData = result.lowongan;
            renderLomba();
        } else {
            console.error('Error loading lomba:', result.message);
            // Jika token tidak valid atau lainnya
            if (result.message.includes('Token')) {
                alert('Sesi Anda telah berakhir, silakan login kembali');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading data');
    }
}

function renderLomba() {
    const grid = document.getElementById('lombaGrid');
    const today = new Date().toISOString().split('T')[0];
    
    if (lombaData.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>Belum ada lomba yang Anda submit. Buat yang baru dengan klik tombol "Tambah Lomba Baru"</p></div>';
        document.getElementById('totalLomba').textContent = 0;
        return;
    }
    
    grid.innerHTML = lombaData.map(lomba => {
        const expiredDate = new Date(lomba.tanggalExpired).toISOString().split('T')[0];
        const isExpired = expiredDate < today;
        const statusClass = isExpired ? 'status-inactive' : 'status-active';
        const statusText = isExpired ? 'EXPIRED' : 'AKTIF';
        
        // Cek apakah user adalah pemilik lomba ini
        const submittedById = lomba.submittedBy?._id || lomba.submittedBy;
        const isOwner = currentUserId && submittedById && 
                       (submittedById.toString() === currentUserId.toString());
        
        console.log('Lomba:', lomba.nama, 'submittedBy:', submittedById, 'currentUserId:', currentUserId, 'isOwner:', isOwner);
        
        return `
            <div class="lomba-card">
                <div class="lomba-card-header">
                    <h3>${lomba.nama}</h3>
                    <div class="lomba-card-kategori">${lomba.kategori}</div>
                </div>
                
                <div class="lomba-card-body">
                    <div class="lomba-info">
                        <div class="lomba-info-label">Penyelenggara</div>
                        <div class="lomba-info-value">${lomba.penyelenggara}</div>
                    </div>
                    
                    <div class="lomba-info">
                        <div class="lomba-info-label">Lokasi</div>
                        <div class="lomba-info-value">${lomba.lokasi}</div>
                    </div>
                    
                    <div class="lomba-info">
                        <div class="lomba-info-label">Deskripsi</div>
                        <div class="lomba-info-value">${lomba.deskripsi}</div>
                    </div>
                    
                    <div class="lomba-info">
                        <div class="lomba-info-label">Tanggal Expired</div>
                        <div class="lomba-info-value">${formatDate(lomba.tanggalExpired)}</div>
                    </div>
                    
                    <div class="lomba-info">
                        <div class="lomba-info-label">Status</div>
                        <div class="lomba-info-value">
                            <span class="status-badge ${statusClass}">${statusText}</span>
                        </div>
                    </div>
                </div>
                
                <div class="lomba-card-footer">
                    ${isOwner ? `
                        <button class="btn btn-primary btn-small" onclick="editLomba('${lomba._id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-small" onclick="deleteLomba('${lomba._id}')">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    ` : `
                        <div style="color: #999; font-size: 12px;">Anda bukan pemilik lomba ini</div>
                    `}
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('totalLomba').textContent = lombaData.length;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

function openModal() {
    editingId = null;
    document.getElementById('lombaForm').reset();
    document.getElementById('modalTitle').textContent = 'Tambah Lomba Baru';
    document.getElementById('lombaModal').classList.add('active');
}

function closeModal() {
    document.getElementById('lombaModal').classList.remove('active');
    editingId = null;
}

function editLomba(id) {
    const lomba = lombaData.find(l => l._id === id);
    if (!lomba) return;

    editingId = id;
    document.getElementById('modalTitle').textContent = 'Edit Lomba';
    
    const form = document.getElementById('lombaForm');
    form.nama.value = lomba.nama;
    form.deskripsi.value = lomba.deskripsi;
    form.penyelenggara.value = lomba.penyelenggara;
    form.lokasi.value = lomba.lokasi;
    form.tanggalExpired.value = new Date(lomba.tanggalExpired).toISOString().split('T')[0];
    form.kategori.value = lomba.kategori;
    form.hadiah.value = lomba.hadiah;
    form.persyaratan.value = lomba.persyaratan;
    form.linkKontak.value = lomba.linkKontak;
    form.linkPendaftaran.value = lomba.linkPendaftaran;

    document.getElementById('lombaModal').classList.add('active');
}

function deleteLomba(id) {
    if (confirm('Apakah Anda yakin ingin menghapus lomba ini?')) {
        deleteFromDatabase(id);
    }
}

document.getElementById('lombaForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        let response;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        
        if (editingId) {
            // Update existing
            response = await fetch(`/api/lowongan/${editingId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(data)
            });
        } else {
            // Create new
            response = await fetch('/api/lowongan', {
                method: 'POST',
                headers,
                body: JSON.stringify(data)
            });
        }

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            loadLombaDariDatabase();
            closeModal();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat menyimpan');
    }
});

// Fungsi untuk menghapus dari database
async function deleteFromDatabase(id) {
    try {
        const headers = {
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch(`/api/lowongan/${id}`, {
            method: 'DELETE',
            headers
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            loadLombaDariDatabase();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat menghapus');
    }
}

// Inisialisasi saat halaman dimuat
initData();