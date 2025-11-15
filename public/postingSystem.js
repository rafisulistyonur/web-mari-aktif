// Ambil token dari localStorage
function getToken() {
    const token = localStorage.getItem('authToken');
    console.log('Token dari localStorage:', token ? 'Ada' : 'Tidak ada');
    return token;
}

// Store kompetisi untuk autocomplete
let allCompetitions = [];

// Load semua kompetisi saat halaman load
async function loadCompetitionsForAutocomplete() {
    try {
        const response = await fetch('/api/lowongan');
        const data = await response.json();
        if (data.success && data.lowongan) {
            allCompetitions = data.lowongan;
        }
    } catch (error) {
        console.error('Error loading competitions for autocomplete:', error);
    }
}

// Setup autocomplete untuk hashtag
function setupHashtagAutocomplete() {
    const textarea = document.getElementById('postContent');
    if (!textarea) return;
    
    textarea.addEventListener('input', function(e) {
        const text = this.value;
        const lastHashtagIndex = text.lastIndexOf('#');
        
        if (lastHashtagIndex === -1) {
            hideHashtagSuggestions();
            return;
        }
        
        // Cek apakah ada spasi atau newline setelah # (jika ada, close suggestions)
        const afterHashtag = text.substring(lastHashtagIndex + 1);
        if (afterHashtag.includes(' ') || afterHashtag.includes('\n')) {
            hideHashtagSuggestions();
            return;
        }
        
        // Dapatkan text setelah #
        const searchText = afterHashtag.toLowerCase();
        
        if (searchText.length === 0) {
            hideHashtagSuggestions();
            return;
        }
        
        // Filter kompetisi
        const suggestions = allCompetitions.filter(comp => 
            comp.nama.toLowerCase().includes(searchText)
        ).slice(0, 5); // Limit 5 suggestions
        
        if (suggestions.length > 0) {
            showHashtagSuggestions(suggestions, lastHashtagIndex);
        } else {
            hideHashtagSuggestions();
        }
    });
    
    // Close suggestions saat klik di luar
    document.addEventListener('click', function(e) {
        if (e.target !== textarea && !e.target.closest('.hashtag-suggestions')) {
            hideHashtagSuggestions();
        }
    });
}

// Tampilkan suggestion list
function showHashtagSuggestions(suggestions, hashtagIndex) {
    let suggestionBox = document.getElementById('hashtagSuggestionsBox');
    
    if (!suggestionBox) {
        suggestionBox = document.createElement('div');
        suggestionBox.id = 'hashtagSuggestionsBox';
        const textarea = document.getElementById('postContent');
        textarea.parentNode.appendChild(suggestionBox);
    }
    
    suggestionBox.className = 'hashtag-suggestions';
    suggestionBox.innerHTML = suggestions.map((comp, index) => `
        <div class="hashtag-suggestion-item" onclick="selectHashtagSuggestion('${comp.nama}')" style="padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #eee; transition: background 0.2s;">
            <div style="font-weight: 600; color: #2777b9; font-size: 13px;">#${comp.nama}</div>
            <div style="font-size: 12px; color: #999; margin-top: 2px;">${comp.kategori || 'Kompetisi'}</div>
        </div>
    `).join('');
    
    suggestionBox.style.cssText = `
        position: absolute;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        max-height: 250px;
        overflow-y: auto;
        z-index: 100;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        top: 100%;
        left: 0;
        right: 0;
        margin: 4px 0 0 0;
        width: 100%;
    `;
}

// Pilih suggestion dan insert ke textarea
function selectHashtagSuggestion(competitionName) {
    const textarea = document.getElementById('postContent');
    const text = textarea.value;
    const lastHashtagIndex = text.lastIndexOf('#');
    
    if (lastHashtagIndex === -1) return;
    
    const beforeHashtag = text.substring(0, lastHashtagIndex);
    const afterHashtag = text.substring(lastHashtagIndex + 1);
    const afterSpaceIndex = afterHashtag.indexOf(' ');
    const afterNewlineIndex = afterHashtag.indexOf('\n');
    
    let insertPoint = afterHashtag.length;
    
    if (afterSpaceIndex !== -1) {
        insertPoint = afterSpaceIndex;
    } else if (afterNewlineIndex !== -1) {
        insertPoint = afterNewlineIndex;
    }
    
    const afterCompletion = afterHashtag.substring(insertPoint);
    const newText = beforeHashtag + '#' + competitionName + ' ' + afterCompletion;
    
    textarea.value = newText;
    textarea.focus();
    
    // Set cursor position after inserted text
    const newCursorPos = beforeHashtag.length + competitionName.length + 2;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    
    hideHashtagSuggestions();
}

// Sembunyikan suggestions
function hideHashtagSuggestions() {
    const suggestionBox = document.getElementById('hashtagSuggestionsBox');
    if (suggestionBox) {
        suggestionBox.remove();
    }
}

// Buka modal untuk membuat posting
function openPostModal() {
    const modal = document.getElementById('postModal');
    modal.classList.add('active');
    
    // Load kompetisi dan setup autocomplete
    if (allCompetitions.length === 0) {
        loadCompetitionsForAutocomplete();
    }
    
    setTimeout(() => {
        setupHashtagAutocomplete();
    }, 100);
}

// Tutup modal
function closePostModal() {
    const modal = document.getElementById('postModal');
    modal.classList.remove('active');
    document.getElementById('postContent').value = '';
    hideHashtagSuggestions();
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

// Parse hashtag - jadikan link biru yang tampilkan modal detail kompetisi
function parseContentWithHashtags(content) {
    if (!content || typeof content !== 'string') {
        return escapeHtml(content);
    }
    
    let htmlContent = escapeHtml(content);
    
    // Parse manual untuk handle multi-word hashtags
    let result = '';
    let i = 0;
    
    while (i < htmlContent.length) {
        // Cari tanda #
        const hashIndex = htmlContent.indexOf('#', i);
        
        if (hashIndex === -1) {
            // Tidak ada # lagi, tambah sisa string
            result += htmlContent.substring(i);
            break;
        }
        
        // Tambah text sebelum #
        result += htmlContent.substring(i, hashIndex);
        
        // Ambil text setelah # sampai double space atau end of string
        let j = hashIndex + 1;
        let hashtagText = '';
        
        // Collect semua character sampai double space atau newline atau end
        while (j < htmlContent.length) {
            const char = htmlContent[j];
            
            // Stop di double space atau newline
            if ((char === ' ' && htmlContent[j + 1] === ' ') || 
                char === '\n' || 
                char === '\r') {
                break;
            }
            
            // Stop jika ketemu karakter special yang bukan bagian hashtag
            if (char === '<' || char === '>') {
                break;
            }
            
            hashtagText += char;
            j++;
        }
        
        hashtagText = hashtagText.trim();
        
        if (hashtagText) {
            // Buat link
            const escapedHashtag = hashtagText.replace(/'/g, "\\'");
            result += `<a href="javascript:void(0)" onclick="showCompetitionDetail('${escapedHashtag}')" style="color: #2777b9; text-decoration: none; font-weight: 600; cursor: pointer;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">#${hashtagText}</a>`;
            i = j;
        } else {
            // Jika tidak ada text setelah #, tambah # biasa
            result += '#';
            i = hashIndex + 1;
        }
    }
    
    return result;
}

// Tampilkan detail kompetisi dalam modal
async function showCompetitionDetail(competitionName) {
    try {
        // Fetch semua approved competitions
        const response = await fetch('/api/lowongan');
        const data = await response.json();
        
        if (!data.success || !data.lowongan) {
            alert('Tidak ada data kompetisi');
            return;
        }
        
        // Cari kompetisi yang cocok dengan nama (case-insensitive)
        const comp = data.lowongan.find(c => 
            c.nama.toLowerCase().includes(competitionName.toLowerCase()) ||
            competitionName.toLowerCase().includes(c.nama.toLowerCase())
        );
        
        if (!comp) {
            alert(`Kompetisi "${competitionName}" tidak ditemukan`);
            return;
        }
        
        // Buat modal HTML
        const modalHTML = `
            <div class="competition-modal-overlay" onclick="closeCompetitionModal()" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div class="competition-modal" onclick="event.stopPropagation()" style="background: white; border-radius: 8px; padding: 30px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                        <div>
                            <h2 style="margin: 0; color: #333; font-size: 24px;">${comp.nama || 'Kompetisi'}</h2>
                            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Oleh: ${comp.penyelenggara || 'Penyelenggara'}</p>
                        </div>
                        <button onclick="closeCompetitionModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">&times;</button>
                    </div>
                    
                    <div style="border-top: 1px solid #eee; padding-top: 20px;">
                        <div style="margin-bottom: 15px;">
                            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 14px; font-weight: 600;">KATEGORI</h3>
                            <p style="margin: 0; color: #666;">${comp.kategori || '-'}</p>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 14px; font-weight: 600;">LOKASI</h3>
                            <p style="margin: 0; color: #666;">${comp.lokasi || '-'}</p>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 14px; font-weight: 600;">BATAS PENDAFTARAN</h3>
                            <p style="margin: 0; color: #666;">${comp.batasPendaftaran ? new Date(comp.batasPendaftaran).toLocaleDateString('id-ID') : '-'}</p>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 14px; font-weight: 600;">HADIAH</h3>
                            <p style="margin: 0; color: #666;">${comp.hadiah || '-'}</p>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 14px; font-weight: 600;">DESKRIPSI</h3>
                            <p style="margin: 0; color: #666; line-height: 1.5; white-space: pre-wrap;">${comp.deskripsi || '-'}</p>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 14px; font-weight: 600;">PERSYARATAN</h3>
                            <p style="margin: 0; color: #666; line-height: 1.5; white-space: pre-wrap;">${comp.persyaratan || '-'}</p>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
                        <button onclick="window.location.href='/lowongan?id=${comp._id}'" style="flex: 1; background: #2777b9; color: white; border: none; padding: 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px;">Lihat di Lowongan</button>
                        <button onclick="closeCompetitionModal()" style="flex: 1; background: #f0f0f0; color: #333; border: none; padding: 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px;">Tutup</button>
                    </div>
                </div>
            </div>
        `;
        
        // Hapus modal yang sudah ada
        const existingModal = document.querySelector('.competition-modal-overlay');
        if (existingModal) existingModal.remove();
        
        // Tambah modal ke body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error loading competition detail:', error);
        alert('Terjadi kesalahan saat memuat detail kompetisi');
    }
}

// Tutup modal detail kompetisi
function closeCompetitionModal() {
    const modal = document.querySelector('.competition-modal-overlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// Buat elemen post card
function createPostCard(post, token) {
    const card = document.createElement('div');
    card.className = 'post-card';
    card.id = 'post-' + post._id;

    const hasLiked = token && post.likes.some(like => like._id === getUserIdFromToken(token));
    const hasDisliked = token && post.dislikes.some(dislike => dislike._id === getUserIdFromToken(token));

    const timeAgo = getTimeAgo(post.createdAt);
    
    // Parse hashtags jadi links
    const parsedContent = parseContentWithHashtags(post.content);

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
            <p>${parsedContent}</p>
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
    loadPosts();

    // Trigger modal ketika post input diklik
    const postInputTrigger = document.getElementById('postInputTrigger');
    if (postInputTrigger) {
        postInputTrigger.addEventListener('click', openPostModal);
    }
});

// Add style untuk liked/disliked button
const style = document.createElement('style');
style.textContent = `
    .post-action.liked {
        color: #2777b9;
    }
    
    .post-action.disliked {
        color: #e74c3c;
    }
`;
document.head.appendChild(style);
