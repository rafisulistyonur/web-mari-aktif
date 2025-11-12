const competitions = {
    1: {
        title: "Olimpiade Matematika Nasional",
        organizer: "Universitas Indonesia",
        logo: "🔢",
        logoColor: "#3b82f6",
        location: "Jakarta (Online)",
        deadline: "2 minggu yang lalu",
        applicants: "150+ peserta",
        category: "Matematika",
        categoryFilter: "matematika",
        prize: "Total hadiah IDR 15.000.000",
        status: "",
        recruiter: null
    },
    2: {
        title: "Kompetisi Fisika Tingkat Nasional",
        organizer: "Kementerian Pendidikan",
        logo: "⚛️",
        logoColor: "#8b5cf6",
        location: "Area Jawa Barat (Di Kampus)",
        deadline: "1 minggu yang lalu",
        applicants: "200+ peserta",
        category: "Fisika",
        categoryFilter: "fisika",
        prize: "Total hadiah IDR 25.000.000",
        status: "Meninjau peserta secara aktif",
        recruiter: {
            name: "Dr. Ahmad Fauzi",
            title: "Koordinator Lomba"
        }
    },
    3: {
        title: "Lomba Karya Tulis Bahasa Indonesia",
        organizer: "Institut Teknologi Bandung",
        logo: "📝",
        logoColor: "#10b981",
        location: "Bandung, Jawa Barat (Di Kampus)",
        deadline: "3 hari yang lalu",
        applicants: "80+ peserta",
        category: "Bahasa Indonesia",
        categoryFilter: "bahasa-indonesia",
        prize: "Total hadiah IDR 10.000.000",
        status: "",
        recruiter: {
            name: "Prof. Siti Nurhaliza",
            title: "Ketua Panitia"
        }
    },
    4: {
        title: "Lomba Desain Poster Nasional",
        organizer: "StartupHub Indonesia",
        logo: "🎨",
        logoColor: "#f59e0b",
        location: "Jakarta (Hybrid)",
        deadline: "Dipromosikan",
        applicants: "300+ peserta",
        category: "Desain",
        categoryFilter: "desain",
        prize: "Total hadiah IDR 50.000.000",
        status: "Meninjau peserta secara aktif",
        recruiter: null
    },
    5: {
        title: "Hackathon & Coding Competition",
        organizer: "TechCorp Indonesia",
        logo: "💻",
        logoColor: "#ef4444",
        location: "Area DKI Jakarta (Di Kantor)",
        deadline: "5 hari yang lalu",
        applicants: "250+ peserta",
        category: "Teknologi",
        categoryFilter: "teknologi",
        prize: "Total hadiah IDR 30.000.000",
        status: "",
        recruiter: null
    },
    6: {
        title: "Olimpiade Matematika SMA",
        organizer: "Direktorat Pendidikan",
        logo: "📐",
        logoColor: "#06b6d4",
        location: "Surabaya (Di Kampus)",
        deadline: "1 bulan yang lalu",
        applicants: "180+ peserta",
        category: "Matematika",
        categoryFilter: "matematika",
        prize: "Total hadiah IDR 20.000.000",
        status: "Meninjau peserta secara aktif",
        recruiter: null
    },
    7: {
        title: "Kompetisi Esai Bahasa Indonesia",
        organizer: "Kemendikbud",
        logo: "✍️",
        logoColor: "#84cc16",
        location: "Online",
        deadline: "2 minggu yang lalu",
        applicants: "120+ peserta",
        category: "Bahasa Indonesia",
        categoryFilter: "bahasa-indonesia",
        prize: "Total hadiah IDR 12.000.000",
        status: "",
        recruiter: null
    },
    8: {
        title: "Lomba Eksperimen Fisika",
        organizer: "ITS Surabaya",
        logo: "🔬",
        logoColor: "#a855f7",
        location: "Surabaya (Di Laboratorium)",
        deadline: "5 hari yang lalu",
        applicants: "90+ peserta",
        category: "Fisika",
        categoryFilter: "fisika",
        prize: "Total hadiah IDR 18.000.000",
        status: "",
        recruiter: {
            name: "Dr. Budi Santoso",
            title: "Kepala Laboratorium"
        }
    }
};

let activeFilter = 'semua';
let selectedCompId = null;

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
                        ${comp.status ? `<div class="status">📝 ${comp.status}</div>` : ''}
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
    document.getElementById('detailApplicants').textContent = comp.applicants;
    document.getElementById('detailCategory').textContent = comp.category;
    document.getElementById('detailPrize').textContent = comp.prize;
    
    if (comp.status) {
        document.getElementById('detailStatus').textContent = 
            `Dipromosikan oleh pembuka lomba • ${comp.status}`;
        document.getElementById('detailStatus').style.display = 'block';
    } else {
        document.getElementById('detailStatus').style.display = 'none';
    }
    
    const recruiterBox = document.getElementById('recruiterBox');
    if (comp.recruiter) {
        document.getElementById('recruiterName').textContent = comp.recruiter.name;
        document.getElementById('recruiterTitle').textContent = comp.recruiter.title;
        recruiterBox.style.display = 'block';
    } else {
        recruiterBox.style.display = 'none';
    }
    
    document.getElementById('detailDescription').textContent = 
        `${comp.organizer} adalah salah satu penyelenggara lomba terkemuka di Indonesia yang 
        memberdayakan ribuan peserta untuk berkompetisi, belajar, dan berkembang dalam lingkungan 
        yang terpercaya. Kami mencari peserta yang kreatif, berorientasi pada detail, dan mampu 
        memberikan karya terbaik mereka melalui pengalaman yang bermakna.`;
}

// Initialize
renderCompetitions();