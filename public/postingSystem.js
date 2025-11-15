// Ambil token dari localStorage
function getToken() {
    const token = localStorage.getItem('authToken');
    console.log('Token dari localStorage:', token ? 'Ada' : 'Tidak ada');
    return token;
}

// Load semua lomba untuk hashtag lookup
let allCompetitions = {};
async function loadCompetitionsForHashtag() {
    try {
        const response = await fetch('/api/lowongan');
        const result = await response.json();
        
        if (result.success) {
            // Buat mapping hashtag dari nama lomba
            result.lowongan.forEach(comp => {
                const hashtag = '#' + comp.nama.toUpperCase().replace(/\s+/g, '');
                allCompetitions[hashtag] = {
                    id: comp._id,
                    nama: comp.nama,
                    penyelenggara: comp.penyelenggara,
                    lokasi: comp.lokasi,
                    kategori: comp.kategori
                };
            });
        }
    } catch (error) {
        console.error('Load competitions error:', error);
    }
}

// Buka modal untuk membuat posting
function openPostModal() {
    const modal = document.getElementById('postModal');
    modal.classList.add('active');
    
    // Setup autocomplete untuk textarea
    const textarea = document.getElementById('postContent');
    if (textarea) {
        textarea.addEventListener('input', handleHashtagInput);
        textarea.addEventListener('keydown', handleHashtagKeydown);
    }
}

// Tutup modal
function closePostModal() {
    const modal = document.getElementById('postModal');
    modal.classList.remove('active');
    document.getElementById('postContent').value = '';
    closeHashtagAutocomplete(); // Tutup autocomplete jika masih terbuka
}

// Buat postingan
async function createPost() {
    const content = document.getElementById('postContent').value;
    const token = getToken();

    if (!content.trim()) {
        alert('Konten postingan tidak boleh kosong');
        return;
    }

    if (!token) {
        alert('Silakan login terlebih dahulu. Token tidak ditemukan.');
        console.error('Token missing:', {
            authToken: localStorage.getItem('authToken'),
            allKeys: Object.keys(localStorage)
        });
        return;
    }

    try {
        const response = await fetch('/api/post/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('postContent').value = '';
            closePostModal();
            // Refresh posts
            loadPosts();
            alert('Postingan berhasil dibuat');
        } else {
            alert('Error: ' + data.message);
            console.error('Create post failed:', data);
        }
    } catch (error) {
        console.error('Buat postingan error:', error);
        alert('Terjadi kesalahan saat membuat postingan');
    }
}

// Muat semua postingan
async function loadPosts() {
    try {
        const response = await fetch('/api/post/all');
        const data = await response.json();

        if (data.success) {
            displayPosts(data.posts);
        } else {
            console.error('Error loading posts:', data.message);
        }
    } catch (error) {
        console.error('Load posts error:', error);
    }
}

// Tampilkan postingan
function displayPosts(posts) {
    const container = document.getElementById('postsContainer');
    const token = getToken();
    
    // Hapus contoh postingan jika ada
    const existingPosts = container.querySelectorAll('.post-card');
    existingPosts.forEach(post => post.remove());

    if (posts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Tidak ada postingan</p>';
        return;
    }

    posts.forEach(post => {
        const postCard = createPostCard(post, token);
        container.appendChild(postCard);
    });
}

// Parse hashtag dari konten dan buat clickable
function parseContentWithHashtags(content) {
    const hashtagRegex = /#(\w+)/g;
    let htmlContent = escapeHtml(content);
    
    htmlContent = htmlContent.replace(hashtagRegex, (match, hashtag) => {
        // Cari lomba yang cocok dengan hashtag
        const searchQuery = hashtag.toLowerCase();
        const matchedCompetitions = findCompetitionsByKeyword(searchQuery);
        
        if (matchedCompetitions.length > 0) {
            // Ambil kompetisi pertama yang match
            const firstComp = matchedCompetitions[0];
            // onclick untuk menampilkan detail atau navigate
            return `<a href="#" class="hashtag-link" onclick="handleHashtagClick('${firstComp.id}'); return false;" title="Lihat lomba: ${searchQuery}">${match}</a>`;
        }
        return match;
    });
    
    return htmlContent;
}

// Handle klik hashtag - tampilkan detail atau navigate
function handleHashtagClick(compId) {
    // Jika sedang di halaman lowongan dan fungsi showDetail tersedia
    if (typeof showDetail === 'function') {
        showDetail(compId);
        // Scroll ke atas untuk fokus ke detail panel
        document.querySelector('.right-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        // Jika di halaman lain, navigate ke lowongan dengan ID
        window.location.href = '/lowongan?id=' + compId;
    }
}

// Cari lomba berdasarkan keyword (awal huruf per kata)
function findCompetitionsByKeyword(keyword) {
    const keyword_lower = keyword.toLowerCase();
    const results = [];
    
    for (const [hashtag, comp] of Object.entries(allCompetitions)) {
        const nama_lower = comp.nama.toLowerCase();
        const hashtag_lower = hashtag.toLowerCase();
        
        // Cek apakah nama atau hashtag dimulai dengan keyword
        if (nama_lower.startsWith(keyword_lower) || hashtag_lower.includes('#' + keyword_lower)) {
            results.push(comp);
        }
    }
    
    return results.slice(0, 10); // Limit 10 hasil
}

// Tampilkan modal search dari hashtag
// ===== AUTOCOMPLETE HASHTAG SAAT MENGETIK =====

let currentHashtagSuggestions = [];
let selectedSuggestionIndex = -1;

// Handle input saat user mengetik
function handleHashtagInput(e) {
    const textarea = e.target;
    let text = textarea.value;
    let cursorPos = textarea.selectionStart;
    
    // Prevent multiple ## - jika ada ##, replace dengan #
    const hashtagCount = (text.match(/#/g) || []).length;
    if (hashtagCount > 1) {
        // Ada lebih dari 1 hashtag, hapus yang extra
        let hashtagIndices = [];
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '#') {
                hashtagIndices.push(i);
            }
        }
        
        // Jika ada multiple ## bersebelahan, remove duplikat
        if (hashtagIndices.length > 1) {
            for (let i = hashtagIndices.length - 1; i > 0; i--) {
                if (hashtagIndices[i] === hashtagIndices[i-1] + 1) {
                    // ## ditemukan, remove yang ke-2
                    text = text.substring(0, hashtagIndices[i]) + text.substring(hashtagIndices[i] + 1);
                    if (cursorPos > hashtagIndices[i]) {
                        cursorPos--;
                    }
                }
            }
            textarea.value = text;
            textarea.setSelectionRange(cursorPos, cursorPos);
        }
    }
    
    // Cari hashtag yang sedang diketik
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastHashtagMatch = textBeforeCursor.match(/#(\w*)$/);
    
    if (lastHashtagMatch) {
        const searchText = lastHashtagMatch[1];
        
        if (searchText.length >= 0) {
            // Tampilkan suggestions
            showHashtagSuggestions(searchText, textarea);
        }
    } else {
        closeHashtagAutocomplete();
    }
}

// Handle keyboard input (arrow keys, enter)
function handleHashtagKeydown(e) {
    const suggestionList = document.getElementById('hashtagSuggestionList');
    if (!suggestionList || suggestionList.style.display === 'none') {
        return;
    }
    
    const items = suggestionList.querySelectorAll('.hashtag-suggestion-item');
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, items.length - 1);
        updateSuggestionSelection(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
        updateSuggestionSelection(items);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
        e.preventDefault();
        items[selectedSuggestionIndex].click();
    } else if (e.key === 'Escape') {
        closeHashtagAutocomplete();
    }
}

// Update visual selection di suggestion list
function updateSuggestionSelection(items) {
    items.forEach((item, index) => {
        if (index === selectedSuggestionIndex) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

// Tampilkan suggestions
function showHashtagSuggestions(searchText, textarea) {
    const suggestions = searchCompetitionsByPrefix(searchText);
    currentHashtagSuggestions = suggestions;
    selectedSuggestionIndex = -1;
    
    // Hapus suggestion list lama jika ada
    closeHashtagAutocomplete();
    
    if (suggestions.length === 0) {
        return;
    }
    
    // Buat suggestion list
    const suggestionList = document.createElement('div');
    suggestionList.id = 'hashtagSuggestionList';
    suggestionList.className = 'hashtag-suggestion-list';
    
    suggestionList.innerHTML = suggestions.map((comp, index) => `
        <div class="hashtag-suggestion-item" onclick="selectHashtagSuggestion('${comp.nama}')">
            <div class="hashtag-suggestion-content">
                <div class="hashtag-suggestion-name">${comp.nama}</div>
                <div class="hashtag-suggestion-meta">${comp.kategori}</div>
            </div>
        </div>
    `).join('');
    
    // Position suggestion list di bawah textarea
    const rect = textarea.getBoundingClientRect();
    suggestionList.style.position = 'fixed';
    suggestionList.style.top = (rect.bottom + 5) + 'px';
    suggestionList.style.left = rect.left + 'px';
    suggestionList.style.width = rect.width + 'px';
    
    document.body.appendChild(suggestionList);
}

// Cari kompetisi berdasarkan prefix
function searchCompetitionsByPrefix(prefix) {
    const prefix_lower = prefix.toLowerCase();
    const results = [];
    
    // Jika prefix kosong, tampilkan semua
    if (prefix_lower === '') {
        for (const [hashtag, comp] of Object.entries(allCompetitions)) {
            results.push(comp);
        }
        return results.slice(0, 5);
    }
    
    for (const [hashtag, comp] of Object.entries(allCompetitions)) {
        const nama_lower = comp.nama.toLowerCase();
        
        // Cek apakah nama dimulai dengan prefix
        if (nama_lower.startsWith(prefix_lower)) {
            results.push(comp);
        }
    }
    
    return results.slice(0, 5); // Limit 5 suggestions
}

// Pilih suggestion
function selectHashtagSuggestion(competitionName) {
    const textarea = document.getElementById('postContent');
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;
    
    // Cari hashtag yang sedang diketik
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastHashtagMatch = textBeforeCursor.match(/#(\w*)$/);
    
    if (lastHashtagMatch) {
        // hashtagStart harus include '#', jadi kurangi 1
        const hashtagStart = cursorPos - lastHashtagMatch[1].length - 1;
        const beforeHashtag = text.substring(0, hashtagStart);
        const afterCursor = text.substring(cursorPos);
        
        // Buat hashtag dari nama kompetisi
        const hashtag = '#' + competitionName.toUpperCase().replace(/\s+/g, '');
        
        // Replace teks
        textarea.value = beforeHashtag + hashtag + ' ' + afterCursor;
        textarea.focus();
        textarea.setSelectionRange(beforeHashtag.length + hashtag.length + 1, beforeHashtag.length + hashtag.length + 1);
    }
    
    closeHashtagAutocomplete();
}

// Tutup autocomplete
function closeHashtagAutocomplete() {
    const suggestionList = document.getElementById('hashtagSuggestionList');
    if (suggestionList) {
        suggestionList.remove();
    }
    selectedSuggestionIndex = -1;
}

// Buat elemen post card
function createPostCard(post, token) {
    const card = document.createElement('div');
    card.className = 'post-card';
    card.id = 'post-' + post._id;

    const hasLiked = token && post.likes.some(like => like._id === getUserIdFromToken(token));
    const hasDisliked = token && post.dislikes.some(dislike => dislike._id === getUserIdFromToken(token));

    const timeAgo = getTimeAgo(post.createdAt);

    card.innerHTML = `
        <div class="post-header">
            <div class="post-author-info">
                <div class="post-author-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="post-author-details">
                    <h3>${post.authorUsername}</h3>
                    <div class="post-author-meta">${timeAgo}</div>
                </div>
            </div>
            <button class="post-menu-btn" onclick="openPostMenu('${post._id}')">
                <i class="fas fa-ellipsis-h"></i>
            </button>
        </div>
        <div class="post-content">
            <p>${parseContentWithHashtags(post.content)}</p>
        </div>
        <div class="post-stats" style="display: flex; justify-content: space-between; padding: 10px 20px; font-size: 13px; color: #666; border-top: 1px solid #e0e0e0;">
            <span>${post.likes.length} Suka</span>
            <span>${post.dislikes.length} Tidak Suka</span>
            <span>${post.comments.length} Komentar</span>
        </div>
        <div class="post-actions-bar">
            <button class="post-action ${hasLiked ? 'liked' : ''}" onclick="likePost('${post._id}')">
                <i class="fas fa-thumbs-up"></i>
                <span>Suka</span>
            </button>
            <button class="post-action ${hasDisliked ? 'disliked' : ''}" onclick="dislikePost('${post._id}')">
                <i class="fas fa-thumbs-down"></i>
                <span>Tidak Suka</span>
            </button>
            <button class="post-action" onclick="toggleCommentSection('${post._id}')">
                <i class="fas fa-comment"></i>
                <span>Komentar</span>
            </button>
        </div>
        <div class="post-comments-section" id="comments-${post._id}" style="display: none; padding: 15px 20px; background: #f9f9f9; border-top: 1px solid #e0e0e0;">
            <div id="comments-list-${post._id}" class="comments-list"></div>
            ${token ? `
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <input type="text" class="comment-input" id="comment-input-${post._id}" placeholder="Tulis komentar..." style="flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;">
                    <button onclick="addComment('${post._id}')" style="background: #2777b9; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-size: 13px;">Posting</button>
                </div>
            ` : `
                <p style="color: #999; font-size: 13px;">Silakan <a href="/login" style="color: #2777b9;">login</a> untuk berkomentar</p>
            `}
        </div>
    `;

    // Tambah komentar yang sudah ada
    setTimeout(() => {
        const commentsList = card.querySelector(`#comments-list-${post._id}`);
        if (post.comments.length > 0) {
            post.comments.forEach(comment => {
                const commentEl = document.createElement('div');
                commentEl.className = 'comment-item';
                commentEl.style.cssText = 'margin-bottom: 10px; padding: 8px; background: white; border-radius: 4px;';
                commentEl.innerHTML = `
                    <div style="display: flex; justify-content: space-between;">
                        <strong style="font-size: 12px;">${comment.authorUsername}</strong>
                        ${token && comment.author._id === getUserIdFromToken(token) ? `
                            <button onclick="deleteComment('${post._id}', '${comment._id}')" style="background: none; border: none; color: #999; cursor: pointer; font-size: 12px;">×</button>
                        ` : ''}
                    </div>
                    <p style="font-size: 13px; margin: 3px 0; color: #333;">${escapeHtml(comment.content)}</p>
                    <small style="color: #999; font-size: 11px;">${getTimeAgo(comment.createdAt)}</small>
                `;
                commentsList.appendChild(commentEl);
            });
        } else {
            commentsList.innerHTML = '<p style="color: #999; font-size: 13px;">Belum ada komentar</p>';
        }
    }, 0);

    return card;
}

// Like postingan
async function likePost(postId) {
    const token = getToken();

    if (!token) {
        alert('Silakan login terlebih dahulu');
        console.error('Token not found for like operation');
        return;
    }

    try {
        const response = await fetch(`/api/post/${postId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            loadPosts();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Like error:', error);
        alert('Terjadi kesalahan');
    }
}

// Dislike postingan
async function dislikePost(postId) {
    const token = getToken();

    if (!token) {
        alert('Silakan login terlebih dahulu');
        console.error('Token not found for dislike operation');
        return;
    }

    try {
        const response = await fetch(`/api/post/${postId}/dislike`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            loadPosts();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Dislike error:', error);
        alert('Terjadi kesalahan');
    }
}

// Toggle comment section
function toggleCommentSection(postId) {
    const section = document.getElementById(`comments-${postId}`);
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
}

// Tambah komentar
async function addComment(postId) {
    const content = document.getElementById(`comment-input-${postId}`).value;
    const token = getToken();

    if (!content.trim()) {
        alert('Komentar tidak boleh kosong');
        return;
    }

    if (!token) {
        alert('Silakan login terlebih dahulu');
        console.error('Token not found for comment operation');
        return;
    }

    try {
        const response = await fetch(`/api/post/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById(`comment-input-${postId}`).value = '';
            loadPosts();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Add comment error:', error);
        alert('Terjadi kesalahan');
    }
}

// Hapus komentar
async function deleteComment(postId, commentId) {
    if (!confirm('Hapus komentar ini?')) return;

    const token = getToken();

    if (!token) {
        alert('Silakan login terlebih dahulu');
        console.error('Token not found for delete comment operation');
        return;
    }

    try {
        const response = await fetch(`/api/post/${postId}/comment/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            loadPosts();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Delete comment error:', error);
        alert('Terjadi kesalahan');
    }
}

// Helper function: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper function: Get time ago
function getTimeAgo(createdAt) {
    const now = new Date();
    const postDate = new Date(createdAt);
    const seconds = Math.floor((now - postDate) / 1000);

    if (seconds < 60) return 'baru saja';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' menit lalu';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' jam lalu';
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' hari lalu';
    return postDate.toLocaleDateString('id-ID');
}

// Helper function: Get user ID dari token
function getUserIdFromToken(token) {
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return decoded.userId;
    } catch (error) {
        return null;
    }
}

// Open post menu
function openPostMenu(postId) {
    const token = getToken();
    if (!token) return;

    // Di sini Anda bisa menambahkan menu untuk edit/delete postingan
    console.log('Menu untuk postingan:', postId);
}

// Load posts ketika halaman pertama kali dimuat
document.addEventListener('DOMContentLoaded', function() {
    loadCompetitionsForHashtag(); // Load kompetisi untuk hashtag
    loadPosts();

    // Trigger modal ketika post input diklik
    const postInputTrigger = document.getElementById('postInputTrigger');
    if (postInputTrigger) {
        postInputTrigger.addEventListener('click', openPostModal);
    }
});

// Add style untuk liked/disliked button dan hashtag link
const style = document.createElement('style');
style.textContent = `
    .post-action.liked {
        color: #2777b9;
    }
    
    .post-action.disliked {
        color: #e74c3c;
    }
    
    .hashtag-link {
        color: #2777b9;
        text-decoration: none;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .hashtag-link:hover {
        text-decoration: underline;
        color: #1e5f8c;
    }
    
    /* Hashtag Search Modal */
    /* Hashtag Autocomplete */
    .hashtag-suggestion-list {
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-height: 250px;
        overflow-y: auto;
        z-index: 9999;
    }
    
    .hashtag-suggestion-item {
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        transition: all 0.2s;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .hashtag-suggestion-item:last-child {
        border-bottom: none;
    }
    
    .hashtag-suggestion-item:hover,
    .hashtag-suggestion-item.selected {
        background: #f9f9f9;
    }
    
    .hashtag-suggestion-content {
        flex: 1;
        min-width: 0;
    }
    
    .hashtag-suggestion-name {
        font-weight: 600;
        color: #333;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .hashtag-suggestion-meta {
        font-size: 12px;
        color: #999;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
`;
document.head.appendChild(style);
