// Konfigurasi kategori dengan icon Font Awesome dan warna
const CATEGORY_CONFIG = {
    'matematika': {
        name: 'Matematika',
        icon: 'fas fa-calculator',
        color: '#3b82f6',
        shortCode: 'mtk'
    },
    'fisika': {
        name: 'Fisika',
        icon: 'fas fa-atom',
        color: '#06b6d4',
        shortCode: 'fsk'
    },
    'kimia': {
        name: 'Kimia',
        icon: 'fas fa-flask',
        color: '#8b5cf6',
        shortCode: 'kmy'
    },
    'biologi': {
        name: 'Biologi',
        icon: 'fas fa-dna',
        color: '#10b981',
        shortCode: 'bio'
    },
    'bahasa-indonesia': {
        name: 'Bahasa Indonesia',
        icon: 'fas fa-book',
        color: '#f59e0b',
        shortCode: 'bid'
    },
    'bahasa-inggris': {
        name: 'Bahasa Inggris',
        icon: 'fas fa-language',
        color: '#ec4899',
        shortCode: 'big'
    },
    'ekonomi': {
        name: 'Seni',
        icon: 'fas fa-palette',
        color: '#ec4899',
        shortCode: 'sni'
    },
    'geografi': {
        name: 'Olahraga',
        icon: 'fas fa-football-ball',
        color: '#f59e0b',
        shortCode: 'olh'
    },
    'sejarah': {
        name: 'Sejarah',
        icon: 'fas fa-hourglass-end',
        color: '#a16207',
        shortCode: 'sjr'
    },
    'informatika': {
        name: 'Informatika',
        icon: 'fas fa-laptop-code',
        color: '#1e40af',
        shortCode: 'inf'
    },
    'lainnya': {
        name: 'Lainnya',
        icon: 'fas fa-star',
        color: '#6b7280',
        shortCode: 'lain'
    }
};

/**
 * Get category config by filter name
 */
function getCategoryConfig(filterName) {
    return CATEGORY_CONFIG[filterName] || CATEGORY_CONFIG['lainnya'];
}

/**
 * Get all categories array
 */
function getAllCategories() {
    return Object.entries(CATEGORY_CONFIG).map(([key, value]) => ({
        filter: key,
        ...value
    }));
}

/**
 * Normalize kategori dari database ke filter key
 */
function normalizeCategoryToFilter(categoryName) {
    if (!categoryName) return 'lainnya';
    
    const normalized = categoryName.toLowerCase().trim();
    
    // Check direct match
    if (CATEGORY_CONFIG[normalized]) {
        return normalized;
    }
    
    // Check partial match
    for (const [key, config] of Object.entries(CATEGORY_CONFIG)) {
        if (config.name.toLowerCase() === normalized) {
            return key;
        }
        // Check if the category name contains this filter name
        if (normalized.includes(key.replace('-', ' ')) || 
            key.replace('-', ' ').split(' ').some(word => normalized.includes(word))) {
            return key;
        }
    }
    
    return 'lainnya';
}

/**
 * Generate icon HTML untuk kategori
 */
function getCategoryIconHtml(filterName) {
    const config = getCategoryConfig(filterName);
    return `<i class="${config.icon}" style="font-size: 24px;"></i>`;
}

/**
 * Generate filter chips HTML
 */
function generateFilterChips() {
    const chips = document.getElementById('filterChips');
    if (!chips) return;
    
    chips.innerHTML = '';
    
    const categories = getAllCategories();
    
    // Add "Semua" first
    const semuaBtn = document.createElement('button');
    semuaBtn.className = 'filter-chip active';
    semuaBtn.textContent = 'Semua';
    semuaBtn.onclick = () => toggleFilter('semua');
    chips.appendChild(semuaBtn);
    
    // Add other categories
    categories.forEach(cat => {
        if (cat.filter !== 'lainnya') {
            const btn = document.createElement('button');
            btn.className = 'filter-chip';
            btn.innerHTML = `<i class="${cat.icon}"></i> ${cat.name}`;
            btn.style.gap = '6px';
            btn.onclick = () => toggleFilter(cat.filter);
            chips.appendChild(btn);
        }
    });
    
    // Add "Lainnya" at the end
    const lainnyaBtn = document.createElement('button');
    lainnyaBtn.className = 'filter-chip';
    lainnyaBtn.innerHTML = `<i class="${CATEGORY_CONFIG['lainnya'].icon}"></i> ${CATEGORY_CONFIG['lainnya'].name}`;
    lainnyaBtn.style.gap = '6px';
    lainnyaBtn.onclick = () => toggleFilter('lainnya');
    chips.appendChild(lainnyaBtn);
}
