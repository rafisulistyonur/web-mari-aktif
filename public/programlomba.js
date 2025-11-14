let lombaData = [];
let editingId = null;

// Inisialisasi - ambil data dari database
function initData() {
    loadLombaDariDatabase();
}

// Ambil data lowongan dari database
async function loadLombaDariDatabase() {
    try {
        const response = await fetch('/api/lowongan');
        const result = await response.json();
        
        if (result.success) {
            lombaData = result.lowongan;
            renderLomba();
        } else {
            console.error('Error loading lomba:', result.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderLomba() {
    const grid = document.getElementById('lombaGrid');
    const today = new Date().toISOString().split('T')[0];
    
    grid.innerHTML = lombaData.map(lomba => {
        const expiredDate = new Date(lomba.tanggalExpired).toISOString().split('T')[0];
        const isExpired = expiredDate < today;
        const statusClass = isExpired ? 'status-inactive' : 'status-active';
        const statusText = isExpired ? 'EXPIRED' : 'AKTIF';
        
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
                    <button class="btn btn-primary btn-small" onclick="editLomba('${lomba._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-small" onclick="deleteLomba('${lomba._id}')">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
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
        
        if (editingId) {
            // Update existing
            response = await fetch(`/api/lowongan/${editingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } else {
            // Create new
            response = await fetch('/api/lowongan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
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
        const response = await fetch(`/api/lowongan/${id}`, {
            method: 'DELETE'
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