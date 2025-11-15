// Search functionality untuk navbar
let searchTimeout;

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-input');
    const searchBox = document.querySelector('.search-box');

    if (!searchInput) return;

    // Create dropdown untuk hasil pencarian
    const searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    searchResults.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        max-height: 400px;
        overflow-y: auto;
        display: none;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        margin-top: 5px;
    `;
    searchBox.style.position = 'relative';
    searchBox.appendChild(searchResults);

    // Event listener untuk input
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();

        // Clear previous timeout
        clearTimeout(searchTimeout);

        if (!query) {
            searchResults.style.display = 'none';
            return;
        }

        // Debounce search
        searchTimeout = setTimeout(() => {
            performSearch(query, searchResults);
        }, 300);
    });

    // Close dropdown ketika klik di luar
    document.addEventListener('click', function(e) {
        if (!searchBox.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });

    // Focus event
    searchInput.addEventListener('focus', function() {
        if (searchInput.value.trim() && searchResults.children.length > 0) {
            searchResults.style.display = 'block';
        }
    });
});

async function performSearch(query, resultsContainer) {
    try {
        const response = await fetch(`/api/search/lowongan?query=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.success && data.results.length > 0) {
            displaySearchResults(data.results, resultsContainer);
            resultsContainer.style.display = 'block';
        } else {
            resultsContainer.innerHTML = `
                <div style="padding: 15px; color: #999; text-align: center;">
                    Tidak ada hasil untuk "${query}"
                </div>
            `;
            resultsContainer.style.display = 'block';
        }
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = `
            <div style="padding: 15px; color: #d32f2f; text-align: center;">
                Terjadi kesalahan saat mencari
            </div>
        `;
        resultsContainer.style.display = 'block';
    }
}

function displaySearchResults(results, resultsContainer) {
    const categories = ['Matematika', 'Fisika', 'Bahasa Indonesia', 'Desain', 'Teknologi', 'Seni', 'Olahraga', 'Lainnya'];
    const categoryColors = {
        'Matematika': '#3b82f6',
        'Fisika': '#8b5cf6',
        'Bahasa Indonesia': '#10b981',
        'Desain': '#f59e0b',
        'Teknologi': '#ef4444',
        'Seni': '#06b6d4',
        'Olahraga': '#84cc16',
        'Lainnya': '#a855f7'
    };

    resultsContainer.innerHTML = results.map(result => {
        const color = categoryColors[result.kategori] || '#6b7280';
        const isExpired = new Date(result.tanggalExpired) < new Date();
        
        return `
            <div style="
                padding: 12px 15px;
                border-bottom: 1px solid #f0f0f0;
                cursor: pointer;
                transition: background-color 0.2s;
                display: flex;
                gap: 12px;
                align-items: center;
            " onmouseover="this.style.backgroundColor='#f9f9f9'" onmouseout="this.style.backgroundColor='transparent'" onclick="goToLowonganDetail('${result._id}')">
                <div style="
                    width: 40px;
                    height: 40px;
                    background: ${color};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 18px;
                    flex-shrink: 0;
                ">
                    🎯
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; font-size: 14px; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${result.nama}
                    </div>
                    <div style="font-size: 12px; color: #666;">
                        ${result.penyelenggara}
                    </div>
                    <div style="font-size: 11px; color: #999; margin-top: 2px;">
                        ${result.kategori} ${isExpired ? '• Expired' : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function goToLowonganDetail(id) {
    // Redirect ke halaman lowongan dengan highlight item tertentu
    window.location.href = `/lowongan?id=${id}`;
}
