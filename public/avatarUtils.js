// Utility untuk membuat avatar berdasarkan inisial nama

/**
 * Generate inisial dari nama
 * Rayhan Nurindra -> RN
 * Rayhan -> R
 * Nur Muhammad -> NM
 */
function getInitials(name) {
    if (!name || typeof name !== 'string') return '?';
    
    const words = name.trim().split(/\s+/);
    
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0][0].toUpperCase();
    
    // Ambil inisial dari kata pertama dan kedua
    return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Generate warna konsisten berdasarkan nama
 * Warna yang sama akan dihasilkan untuk nama yang sama
 */
function getAvatarColor(name) {
    // Array warna yang menarik dan beragam
    const colors = [
        '#3b82f6', // Biru
        '#ef4444', // Merah
        '#10b981', // Hijau
        '#f59e0b', // Amber
        '#8b5cf6', // Purple
        '#ec4899', // Pink
        '#06b6d4', // Cyan
        '#84cc16', // Lime
        '#f97316', // Orange
        '#6366f1', // Indigo
    ];
    
    if (!name || typeof name !== 'string') return colors[0];
    
    // Hash nama untuk mendapatkan index warna yang konsisten
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        const char = name.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
}

/**
 * Buat HTML untuk avatar dengan inisial
 * @param {string} name - Nama user
 * @param {string} size - 'small' (48px), 'large' (80px)
 * @returns {string} HTML string untuk avatar
 */
function createAvatarHTML(name, size = 'small') {
    const initials = getInitials(name);
    const color = getAvatarColor(name);
    const fontSize = size === 'large' ? '32px' : '18px';
    
    return `<span style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        font-weight: 600;
        font-size: ${fontSize};
        color: white;
        background: ${color};
        border-radius: 50%;
    ">${initials}</span>`;
}

/**
 * Update avatar element dengan inisial
 * @param {Element} element - DOM element untuk di-update
 * @param {string} name - Nama user
 */
function updateAvatarWithInitials(element, name) {
    if (!element) return;
    
    const initials = getInitials(name);
    const color = getAvatarColor(name);
    
    element.style.backgroundColor = color;
    element.textContent = initials;
    element.style.fontSize = getComputedStyle(element).fontSize;
    element.style.fontWeight = '600';
    element.style.color = 'white';
}
