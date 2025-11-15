let competitions = {};
let activeFilter = 'semua';
let selectedCompId = null;
let allCompetitions = [];
let lastClickTime = 0;
let lastClickedId = null;

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
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#a855f7'];
    const icons = ['🎓', '🔬', '📝', '🎨', '💻', '📐', '✍️', '🏆'];
    
    allCompetitions.forEach((comp, index) => {
        // Hitung status berdasarkan tanggal expired
        const today = new Date();
        const expiredDate = new Date(comp.tanggalExpired);
        const isExpired = expiredDate < today;
        const statusBadge = isExpired ? 'EXPIRED' : 'AKTIF';
        const statusClass = isExpired ? 'expired' : 'aktif';
        
        competitions[comp._id] = {
            id: comp._id,
            title: comp.nama,
            organizer: comp.penyelenggara,
            logo: icons[index % icons.length],
            logoColor: colors[index % colors.length],
            location: comp.lokasi,
            category: comp.kategori,
            categoryFilter: comp.kategori.toLowerCase().replace(/\s+/g, '-'),
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
                <button class="close-btn" onclick="event.stopPropagation()">×</button>
                <div class="card-content">
                    <div class="logo" style="background: ${comp.logoColor};">${comp.logo}</div>
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
    document.getElementById('detailLogo').innerHTML = comp.logo;
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
    const applyButtons = document.querySelectorAll('.btn-primary');
    const messageButtons = document.querySelectorAll('.btn-secondary');
    
    applyButtons.forEach(btn => {
        btn.onclick = () => {
            window.open(comp.linkPendaftaran, '_blank');
        };
        btn.textContent = '📝 Melamar Mudah';
    });
    
    messageButtons.forEach(btn => {
        if (btn.textContent.includes('Pesan') || btn.textContent.includes('Simpan')) {
            btn.onclick = () => {
                window.open(comp.linkKontak, '_blank');
            };
            btn.textContent = '📞 Pesan';
        }
    });
}

// Load data saat halaman dimuat
loadCompetitionsFromDatabase();

// Update filter chips berdasarkan kategori yang tersedia
document.addEventListener('DOMContentLoaded', function() {
    loadCompetitionsFromDatabase();
    
    // Check if there's an ID parameter in URL (from search)
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    
    if (idParam) {
        // Delay untuk memastikan data sudah loaded
        setTimeout(() => {
            if (competitions[idParam]) {
                showDetail(idParam);
            }
        }, 500);
    }
});