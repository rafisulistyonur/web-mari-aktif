let competitions = {};
let activeFilter = 'semua';
let selectedCompId = null;
let allCompetitions = [];
let lastClickTime = 0;
let lastClickedId = null;
let lastSaveClickTime = 0;
let lastSaveClickId = null;
let savingInProgress = false; // ✅ Prevent double save
let savedCompetitionsMap = {}; // ✅ Track saved state dengan flag

// Load data dari database saat halaman dimuat
async function loadCompetitionsFromDatabase() {
    try {
        const response = await fetch('/api/lowongan');
        const result = await response.json();
        
        if (result.success) {
            allCompetitions = result.lowongan;
            buildCompetitionsObject();
            renderCompetitions();
        } else {
            console.error('Error loading competitions:', result.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Konversi data dari database ke format yang sesuai
function buildCompetitionsObject() {
    competitions = {};
    
    allCompetitions.forEach((comp, index) => {
        // Hitung status berdasarkan tanggal expired
        const today = new Date();
        const expiredDate = new Date(comp.tanggalExpired);
        const isExpired = expiredDate < today;
        const statusBadge = isExpired ? 'EXPIRED' : 'AKTIF';
        const statusClass = isExpired ? 'expired' : 'aktif';
        
        // Normalize kategori ke filter
        const categoryFilter = normalizeCategoryToFilter(comp.kategori);
        const categoryConfig = getCategoryConfig(categoryFilter);
        
        competitions[comp._id] = {
            id: comp._id,
            title: comp.nama,
            organizer: comp.penyelenggara,
            icon: categoryConfig.icon,
            logoColor: categoryConfig.color,
            location: comp.lokasi,
            category: comp.kategori,
            categoryFilter: categoryFilter,
            prize: comp.hadiah || 'Tidak ada hadiah',
            description: comp.deskripsi,
            requirements: comp.persyaratan,
            linkKontak: comp.linkKontak,
            linkPendaftaran: comp.linkPendaftaran,
            deadline: formatDeadline(comp.tanggalExpired),
            status: comp.status,
            statusBadge: statusBadge,
            statusClass: statusClass,
            expiredDate: comp.tanggalExpired
        };
    });
}

// Format deadline
function formatDeadline(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) {
        return `Expired ${Math.abs(days)} hari lalu`;
    } else if (days === 0) {
        return 'Hari ini deadline';
    } else if (days === 1) {
        return 'Besok deadline';
    } else {
        return `${days} hari lagi`;
    }
}

function renderCompetitions() {
    const container = document.getElementById('competitionList');
    container.innerHTML = '';
    
    // Ambil role dari localStorage
    const userRole = localStorage.getItem('userRole');
    const isDeveloper = userRole === 'developer';
    
    let count = 0;
    for (const [id, comp] of Object.entries(competitions)) {
        if (activeFilter === 'semua' || comp.categoryFilter === activeFilter) {
            count++;
            const card = document.createElement('div');
            card.className = 'competition-card';
            if (selectedCompId === id) {
                card.classList.add('selected');
            }
            card.onclick = () => showDetail(id);
            
            card.innerHTML = `
                <div class="developer-actions" id="devActions-${id}" style="display: ${isDeveloper ? 'flex' : 'none'}; position: absolute; top: 10px; right: 40px; gap: 8px; z-index: 10;">
                    <button class="dev-action-btn delete-btn" title="Hapus Lomba" onclick="event.stopPropagation(); deleteCompetition('${id}')">🗑️</button>
                </div>
                <div class="card-content">
                    <div class="logo" style="background: ${comp.logoColor};"><i class="${comp.icon}"></i></div>
                    <div class="card-info">
                        <div class="card-title">${comp.title}</div>
                        <div class="organizer">${comp.organizer}</div>
                        <div class="location">${comp.location}</div>
                        <div class="deadline">${comp.deadline}</div>
                        <div class="status-badge ${comp.statusClass}">${comp.statusBadge}</div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        }
    }
    
    document.getElementById('resultsCount').textContent = `${count} hasil`;
}

function toggleFilter(filter) {
    activeFilter = filter;
    
    // Update chip styles
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Close detail panel if filtered out
    if (selectedCompId && competitions[selectedCompId].categoryFilter !== filter && filter !== 'semua') {
        document.getElementById('leftPanel').classList.remove('shrink');
        document.getElementById('rightPanel').classList.remove('show');
        selectedCompId = null;
    }
    
    renderCompetitions();
}

function showDetail(id) {
    // Detect double click
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;
    
    // Jika double click (klik 2x dalam 300ms) dan id yang sama, tutup detail
    if (timeDiff < 300 && lastClickedId === id && selectedCompId === id) {
        // Close detail panel
        document.getElementById('leftPanel').classList.remove('shrink');
        document.getElementById('rightPanel').classList.remove('show');
        selectedCompId = null;
        renderCompetitions();
        lastClickTime = 0;
        lastClickedId = null;
        return;
    }
    
    // Update tracking untuk double click detection
    lastClickTime = currentTime;
    lastClickedId = id;
    
    selectedCompId = id;
    const comp = competitions[id];
    const leftPanel = document.getElementById('leftPanel');
    const rightPanel = document.getElementById('rightPanel');
    
    // Show right panel
    leftPanel.classList.add('shrink');
    rightPanel.classList.add('show');
    
    // Re-render to update selected state
    renderCompetitions();
    
    // Update detail content
    document.getElementById('detailLogo').innerHTML = `<i class="${comp.icon}"></i>`;
    document.getElementById('detailLogo').style.background = comp.logoColor;
    document.getElementById('detailOrganizer').textContent = comp.organizer;
    document.getElementById('detailTitle').textContent = comp.title;
    document.getElementById('detailLocation').textContent = comp.location;
    document.getElementById('detailDeadline').textContent = comp.deadline;
    document.getElementById('detailApplicants').textContent = '';
    document.getElementById('detailCategory').textContent = comp.category;
    document.getElementById('detailPrize').textContent = comp.prize;
    
    // Update status dengan styling
    const statusElement = document.getElementById('detailStatus');
    statusElement.innerHTML = `<span class="status-badge ${comp.statusClass}">${comp.statusBadge}</span>`;
    statusElement.style.display = 'block';
    
    const recruiterBox = document.getElementById('recruiterBox');
    recruiterBox.style.display = 'none';
    
    document.getElementById('detailDescription').textContent = comp.description;
    
    // Update persyaratan dari database
    document.getElementById('detailRequirements').textContent = comp.requirements || 'Persyaratan tidak tersedia';
    
    // Update buttons dengan link yang benar
    const applyButtons = document.querySelectorAll('#applyBtn, #applyBtnBottom');
    const saveButtons = document.querySelectorAll('#saveBtn');
    const messageButtons = document.querySelectorAll('#messageBtnBottom');
    
    applyButtons.forEach(btn => {
        btn.onclick = () => {
            window.open(comp.linkPendaftaran, '_blank');
        };
        btn.textContent = '📝 Ikuti Lomba';
    });
    
    messageButtons.forEach(btn => {
        btn.onclick = () => {
            window.open(comp.linkKontak, '_blank');
        };
        btn.textContent = '📞 Pesan';
    });
    
    saveButtons.forEach(btn => {
        btn.onclick = saveCompetition;
        
        // Check if already saved from server
        const token = localStorage.getItem('authToken');
        if (token) {
            fetch('/api/user/saved-competitions', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(res => {
                // ✅ Check HTTP status dulu
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                if (data.success && data.savedCompetitions) {
                    // ✅ Convert ID to string untuk comparison
                    const isAlreadySaved = data.savedCompetitions.some(
                        item => item.id.toString() === selectedCompId.toString()
                    );
                    
                    // ✅ Update flag state
                    savedCompetitionsMap[selectedCompId] = isAlreadySaved;
                    
                    if (isAlreadySaved) {
                        btn.classList.remove('btn-primary');
                        btn.classList.add('btn-secondary');
                        btn.textContent = '💾 Sudah Disimpan (klik untuk hapus)';
                    } else {
                        btn.classList.add('btn-primary');
                        btn.classList.remove('btn-secondary');
                        btn.textContent = '💾 Simpan';
                    }
                }
            })
            .catch(err => {
                console.error('Error checking saved status:', err);
                // ✅ Default ke belum disimpan jika error
                savedCompetitionsMap[selectedCompId] = false;
                btn.classList.add('btn-primary');
                btn.classList.remove('btn-secondary');
                btn.textContent = '💾 Simpan';
            });
        } else {
            // ✅ Set flag ke false jika tidak ada token
            savedCompetitionsMap[selectedCompId] = false;
            btn.classList.add('btn-primary');
            btn.classList.remove('btn-secondary');
            btn.textContent = '💾 Simpan';
        }
    });
}

// Load data saat halaman dimuat
loadCompetitionsFromDatabase();

// Test localStorage
console.log('Testing localStorage...');
try {
    localStorage.setItem('test', 'value');
    console.log('localStorage write: OK');
    const testValue = localStorage.getItem('test');
    console.log('localStorage read:', testValue);
    localStorage.removeItem('test');
} catch (e) {
    console.error('localStorage error:', e);
}

// Simpan kompetisi ke server (per user)
function saveCompetition() {
    console.log('saveCompetition called, selectedCompId:', selectedCompId);
    
    if (!selectedCompId) {
        alert('Pilih kompetisi terlebih dahulu');
        return;
    }
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('Silakan login terlebih dahulu');
        return;
    }
    
    // ✅ Gunakan flag state instead of text check
    const isSaved = savedCompetitionsMap[selectedCompId];
    
    // Jika sudah disimpan, delete saat di-click
    if (isSaved) {
        deleteCompetitionFromServer(selectedCompId, token);
        return;
    }
    
    // Jika belum disimpan, save saat di-click
    checkAndSaveCompetition(selectedCompId, token);
}

// Cek dan save ke server
async function checkAndSaveCompetition(competitionId, token) {
    // ✅ Prevent double save dengan flag
    if (savingInProgress) {
        console.warn('Save sudah dalam proses, mencegah double save');
        return;
    }
    
    savingInProgress = true;
    
    try {
        const response = await fetch('/api/user/save-competition', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ competitionId })
        });

        // ✅ Check HTTP status dulu sebelum parse JSON
        if (!response.ok) {
            if (response.status === 401) {
                alert('❌ Token sudah expired, silakan login ulang');
                localStorage.removeItem('authToken');
                window.location.href = '/login';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            alert('✅ Kompetisi berhasil disimpan!');
            
            // ✅ Update flag state
            savedCompetitionsMap[competitionId] = true;
            
            // Update button state
            const saveBtn = document.getElementById('saveBtn');
            if (saveBtn) {
                saveBtn.classList.remove('btn-primary');
                saveBtn.classList.add('btn-secondary');
                saveBtn.textContent = '💾 Sudah Disimpan (klik untuk hapus)';
            }
            
            // Update sidebar
            updateSavedItemsInSidebar();
        } else {
            alert(data.message || 'Gagal menyimpan kompetisi');
        }
    } catch (error) {
        console.error('Save competition error:', error);
        alert('❌ Terjadi kesalahan saat menyimpan kompetisi: ' + error.message);
    } finally {
        // ✅ Always reset flag
        savingInProgress = false;
    }
}

// Hapus dari server
async function deleteCompetitionFromServer(competitionId, token) {
    console.log('deleteCompetitionFromServer called with competitionId:', competitionId);
    
    // ✅ Prevent double delete dengan flag
    if (savingInProgress) {
        console.warn('Delete sudah dalam proses, mencegah double delete');
        return;
    }
    
    savingInProgress = true;
    
    try {
        const response = await fetch('/api/user/unsave-competition', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ competitionId })
        });

        console.log('Delete response status:', response.status);
        
        // ✅ Check HTTP status dulu
        if (!response.ok) {
            if (response.status === 401) {
                alert('❌ Token sudah expired, silakan login ulang');
                localStorage.removeItem('authToken');
                window.location.href = '/login';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Delete response data:', data);

        if (data.success) {
            alert('❌ Kompetisi dihapus dari simpanan');
            
            // ✅ Update flag state
            savedCompetitionsMap[competitionId] = false;
            
            // Reset button
            const saveBtn = document.getElementById('saveBtn');
            if (saveBtn) {
                saveBtn.classList.remove('btn-secondary');
                saveBtn.classList.add('btn-primary');
                saveBtn.textContent = '💾 Simpan';
            }
            
            // Update sidebar
            updateSavedItemsInSidebar();
        } else {
            alert(data.message || 'Gagal menghapus kompetisi');
        }
    } catch (error) {
        console.error('Delete competition error:', error);
        alert('❌ Terjadi kesalahan saat menghapus kompetisi: ' + error.message);
    } finally {
        // ✅ Always reset flag
        savingInProgress = false;
    }
}

// Update saved items di sidebar halaman utama
function updateSavedItemsInSidebar() {
    // Ini akan dipanggil dari halaman utama
    if (window.parent && window.parent !== window) {
        window.parent.updateSavedItems();
    }
}

// Update filter chips berdasarkan kategori yang tersedia
document.addEventListener('DOMContentLoaded', function() {
    // Generate filter chips
    generateFilterChips();
    
    loadCompetitionsFromDatabase();
    
    // Tampilkan tombol sesuai role
    const userRole = localStorage.getItem('userRole');
    const devPanelBtn = document.getElementById('devPanelBtn');
    const adminPanelBtn = document.getElementById('adminPanelBtn');
    
    if (userRole === 'developer') {
        if (devPanelBtn) devPanelBtn.style.display = 'block';
        if (adminPanelBtn) adminPanelBtn.style.display = 'none';
    } else {
        if (devPanelBtn) devPanelBtn.style.display = 'none';
        if (adminPanelBtn) adminPanelBtn.style.display = 'block';
    }
    
    // Check if there's an ID parameter in URL (from hashtag click)
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    
    if (idParam) {
        console.log('ID param found in URL:', idParam);
        // Delay untuk memastikan data sudah loaded
        setTimeout(() => {
            console.log('Available competitions:', Object.keys(competitions));
            if (competitions[idParam]) {
                console.log('Found competition, showing detail');
                showDetail(idParam);
            } else {
                console.log('Competition not found, waiting longer');
                // Jika tidak ditemukan, tunggu lebih lama
                setTimeout(() => {
                    if (competitions[idParam]) {
                        showDetail(idParam);
                    }
                }, 1000);
            }
        }, 500);
    }
});

// Fungsi untuk edit kompetisi (untuk developer)
// Fungsi untuk delete kompetisi (untuk developer)
async function deleteCompetition(competitionId) {
    const userRole = localStorage.getItem('userRole');
    
    if (userRole !== 'developer') {
        alert('Hanya developer yang dapat menghapus kompetisi!');
        return;
    }
    
    if (!confirm('Apakah Anda yakin ingin menghapus kompetisi ini?')) {
        return;
    }
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('Silakan login terlebih dahulu');
        return;
    }
    
    try {
        const response = await fetch('/api/lowongan/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ competitionId })
        });
        
        console.log('Delete response status:', response.status);
        const data = await response.json();
        console.log('Delete response data:', data);
        
        if (data.success) {
            alert('✅ Kompetisi berhasil dihapus!');
            // Reload data
            loadCompetitionsFromDatabase();
            // Close detail panel
            document.getElementById('leftPanel').classList.remove('shrink');
            document.getElementById('rightPanel').classList.remove('show');
            selectedCompId = null;
        } else {
            alert('❌ ' + (data.message || 'Gagal menghapus kompetisi'));
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('❌ Terjadi kesalahan saat menghapus kompetisi: ' + error.message);
    }
}