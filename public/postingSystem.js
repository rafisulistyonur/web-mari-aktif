// Ambil token dari localStorage
function getToken() {
    const token = localStorage.getItem('authToken');
    console.log('Token dari localStorage:', token ? 'Ada' : 'Tidak ada');
    return token;
}

// Store kompetisi dan users untuk autocomplete
let allCompetitions = [];
let allUsers = [];

// Load semua users untuk mention autocomplete
async function loadUsersForMention() {
    try {
        const token = getToken();
        if (!token) {
            console.warn('⚠️ No token found for loading users');
            return;
        }
        
        // Ambil dari endpoint backend yang mengembalikan list users (exclude current user)
        const response = await fetch('/api/users/list', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            allUsers = data.users || [];
            console.log('✓ Users loaded for mention from backend:', allUsers);
            console.log('Total available users:', allUsers.length);
        } else {
            console.error('Failed to load users:', data.message);
            allUsers = [];
        }
    } catch (error) {
        console.error('Error loading users for mention:', error);
        allUsers = []; // Reset ke array kosong jika ada error
    }
}

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

// Setup autocomplete untuk hashtag dan mention
function setupHashtagAutocomplete() {
    const textarea = document.getElementById('postContent');
    if (!textarea) return;
    
    textarea.addEventListener('input', function(e) {
        const text = this.value;
        
        // Cek mention (@)
        const lastMentionIndex = text.lastIndexOf('@');
        const lastHashtagIndex = text.lastIndexOf('#');
        
        // Prioritas: jika ada @ lebih dekat ke cursor, handle mention
        if (lastMentionIndex > lastHashtagIndex && lastMentionIndex !== -1) {
            handleMentionAutocomplete(text, lastMentionIndex);
            return;
        }
        
        // Else, handle hashtag
        if (lastHashtagIndex === -1) {
            hideHashtagSuggestions();
            hideMentionSuggestions();
            return;
        }
        
        // Cek apakah ada spasi atau newline setelah # (jika ada, close suggestions)
        const afterHashtag = text.substring(lastHashtagIndex + 1);
        if (afterHashtag.includes(' ') || afterHashtag.includes('\n')) {
            hideHashtagSuggestions();
            hideMentionSuggestions();
            return;
        }
        
        // Dapatkan text setelah #
        const searchText = afterHashtag.toLowerCase();
        
        if (searchText.length === 0) {
            hideHashtagSuggestions();
            hideMentionSuggestions();
            return;
        }
        
        // Filter kompetisi
        const suggestions = allCompetitions.filter(comp => 
            comp.nama.toLowerCase().includes(searchText)
        ).slice(0, 5); // Limit 5 suggestions
        
        if (suggestions.length > 0) {
            showHashtagSuggestions(suggestions, lastHashtagIndex);
            hideMentionSuggestions();
        } else {
            hideHashtagSuggestions();
            hideMentionSuggestions();
        }
    });
    
    // Close suggestions saat klik di luar
    document.addEventListener('click', function(e) {
        if (e.target !== textarea && !e.target.closest('.hashtag-suggestions') && !e.target.closest('.mention-suggestions')) {
            hideHashtagSuggestions();
            hideMentionSuggestions();
        }
    });
}

// Handle mention autocomplete
function handleMentionAutocomplete(text, mentionIndex) {
    // Cek apakah ada spasi atau newline setelah @ (jika ada, close suggestions)
    const afterMention = text.substring(mentionIndex + 1);
    if (afterMention.includes(' ') || afterMention.includes('\n')) {
        hideMentionSuggestions();
        return;
    }
    
    // Dapatkan text setelah @
    const searchText = afterMention.toLowerCase();
    
    if (searchText.length === 0) {
        // Show all users saat @ pertama kali ditekan
        console.log('@ pressed - showing all users:', allUsers);
        if (allUsers.length > 0) {
            showMentionSuggestions(allUsers.slice(0, 5), mentionIndex);
        } else {
            console.warn('⚠️ No users available for mention suggestions');
            hideMentionSuggestions();
        }
        return;
    }
    
    // Filter users berdasarkan search text
    const suggestions = allUsers.filter(username => 
        username.toLowerCase().includes(searchText)
    ).slice(0, 5); // Limit 5 suggestions
    
    console.log(`📝 Searching for: "@${searchText}" - Found:`, suggestions);
    
    if (suggestions.length > 0) {
        showMentionSuggestions(suggestions, mentionIndex);
        hideHashtagSuggestions();
    } else {
        console.log(`ℹ️ No users found matching "@${searchText}"`);
        hideMentionSuggestions();
        hideHashtagSuggestions();
    }
}

// Tampilkan mention suggestion list
function showMentionSuggestions(suggestions, mentionIndex) {
    let suggestionBox = document.getElementById('mentionSuggestionsBox');
    
    if (!suggestionBox) {
        suggestionBox = document.createElement('div');
        suggestionBox.id = 'mentionSuggestionsBox';
        const textarea = document.getElementById('postContent');
        textarea.parentNode.appendChild(suggestionBox);
    }
    
    suggestionBox.className = 'mention-suggestions';
    suggestionBox.innerHTML = suggestions.map((username) => `
        <div class="mention-suggestion-item" onclick="selectMentionSuggestion('${username}')" style="padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #eee; transition: background 0.2s; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-user" style="color: #2777b9; width: 16px;"></i>
            <div style="font-weight: 600; color: #2777b9; font-size: 13px;">@${username}</div>
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

// Pilih mention suggestion dan insert ke textarea
function selectMentionSuggestion(username) {
    const textarea = document.getElementById('postContent');
    const text = textarea.value;
    const lastMentionIndex = text.lastIndexOf('@');
    
    if (lastMentionIndex === -1) return;
    
    const beforeMention = text.substring(0, lastMentionIndex);
    const afterMention = text.substring(lastMentionIndex + 1);
    const afterSpaceIndex = afterMention.indexOf(' ');
    const afterNewlineIndex = afterMention.indexOf('\n');
    
    let insertPoint = afterMention.length;
    
    if (afterSpaceIndex !== -1) {
        insertPoint = afterSpaceIndex;
    } else if (afterNewlineIndex !== -1) {
        insertPoint = afterNewlineIndex;
    }
    
    const afterCompletion = afterMention.substring(insertPoint);
    const newText = beforeMention + '@' + username + ' ' + afterCompletion;
    
    textarea.value = newText;
    textarea.focus();
    
    // Set cursor position after inserted text
    const newCursorPos = beforeMention.length + username.length + 2;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    
    hideMentionSuggestions();
}

// Sembunyikan mention suggestions
function hideMentionSuggestions() {
    const suggestionBox = document.getElementById('mentionSuggestionsBox');
    if (suggestionBox) {
        suggestionBox.remove();
    }
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
    
    console.log('📝 Opening post modal - Loading users for mention...');
    
    // Load kompetisi dan users, setup autocomplete
    if (allCompetitions.length === 0) {
        loadCompetitionsForAutocomplete();
    }
    
    // Always reload users untuk memastikan data terbaru
    loadUsersForMention();
    
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

    // Validate mentions - hanya bisa mention teman
    const mentionRegex = /@([^\s@]+(?:\s+[^\s@]+)*)/g;
    let match;
    const mentionedUsernames = [];
    
    while ((match = mentionRegex.exec(content)) !== null) {
        mentionedUsernames.push(match[1]);
    }
    
    // Check apakah semua mentioned users ada di allUsers (teman) - case insensitive
    const allUsersLowercase = allUsers.map(u => u.toLowerCase());
    const invalidMentions = mentionedUsernames.filter(username => 
        !allUsersLowercase.includes(username.toLowerCase())
    );
    
    if (invalidMentions.length > 0) {
        alert(`❌ Anda hanya bisa mention teman yang sudah ditambahkan.\n\nUser tidak valid: @${invalidMentions.join(', @')}\n\nTambahkan mereka sebagai teman terlebih dahulu.`);
        return;
    }

    try {
        console.log('📤 Creating post with content:', content);
        console.log('✓ All mentions are valid friends:', mentionedUsernames);
        
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
            console.log('✅ Post created successfully:', data);
            document.getElementById('postContent').value = '';
            closePostModal();
            // Refresh posts
            loadPosts();
            alert('✅ Postingan berhasil dibuat!\n\nNotifikasi sudah dikirim ke teman yang di-tag.');
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

// Parse hashtag dan mention - jadikan link biru yang tampilkan detail
function parseContentWithHashtags(content) {
    if (!content || typeof content !== 'string') {
        return escapeHtml(content);
    }
    
    let htmlContent = escapeHtml(content);
    
    // Parse manual untuk handle multi-word hashtags dan mentions
    let result = '';
    let i = 0;
    
    while (i < htmlContent.length) {
        // Cari tanda # atau @
        const hashIndex = htmlContent.indexOf('#', i);
        const mentionIndex = htmlContent.indexOf('@', i);
        
        let nextSymbolIndex = -1;
        let symbol = '';
        
        if (hashIndex !== -1 && mentionIndex !== -1) {
            if (hashIndex < mentionIndex) {
                nextSymbolIndex = hashIndex;
                symbol = '#';
            } else {
                nextSymbolIndex = mentionIndex;
                symbol = '@';
            }
        } else if (hashIndex !== -1) {
            nextSymbolIndex = hashIndex;
            symbol = '#';
        } else if (mentionIndex !== -1) {
            nextSymbolIndex = mentionIndex;
            symbol = '@';
        }
        
        if (nextSymbolIndex === -1) {
            // Tidak ada # atau @ lagi, tambah sisa string
            result += htmlContent.substring(i);
            break;
        }
        
        // Tambah text sebelum symbol
        result += htmlContent.substring(i, nextSymbolIndex);
        
        // Ambil text setelah symbol sampai double space atau end of string
        let j = nextSymbolIndex + 1;
        let tagText = '';
        let spaceCount = 0;
        
        // Collect semua character sampai double space atau newline atau end
        while (j < htmlContent.length) {
            const char = htmlContent[j];
            
            // Stop di newline
            if (char === '\n' || char === '\r') {
                break;
            }
            
            // Track consecutive spaces
            if (char === ' ') {
                spaceCount++;
                if (spaceCount >= 2) {
                    // Double space found, stop collecting
                    break;
                }
            } else {
                spaceCount = 0;
            }
            
            // Stop jika ketemu karakter special yang bukan bagian tag
            if (char === '<' || char === '>') {
                break;
            }
            
            tagText += char;
            j++;
        }
        
        tagText = tagText.trim();
        
        if (tagText) {
            // Buat link berdasarkan symbol
            if (symbol === '#') {
                const escapedTag = tagText.replace(/'/g, "\\'");
                result += `<a href="javascript:void(0)" onclick="showCompetitionDetail('${escapedTag}')" style="color: #2777b9; text-decoration: none; font-weight: 600; cursor: pointer;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">#${tagText}</a>`;
            } else if (symbol === '@') {
                // Mention: hanya text biasa, bukan link (no profile feature)
                result += `<span style="color: #2777b9; font-weight: 600;">@${tagText}</span>`;
            }
            i = j;
        } else {
            // Jika tidak ada text setelah symbol, tambah symbol biasa
            result += symbol;
            i = nextSymbolIndex + 1;
        }
    }
    
    return result;
}

// Tampilkan detail kompetisi - langsung redirect ke lowongan
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
        
        // Langsung redirect ke halaman lowongan dengan ID kompetisi
        window.location.href = `/lowongan?id=${comp._id}`;
        
    } catch (error) {
        console.error('Error loading competition detail:', error);
        alert('Terjadi kesalahan saat memuat detail kompetisi');
    }
}

// Tampilkan user profile (untuk sekarang hanya menampilkan nama)
function showUserProfile(username) {
    // Anda bisa membuat halaman profile atau menampilkan modal dengan info user
    alert(`User: @${username}\n\n(Fitur profile belum tersedia)`);
    // Di masa depan, Anda bisa menambahkan halaman profile atau modal
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
                <div class="post-author-avatar" style="font-size: 20px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: ${getAvatarColor(post.authorUsername)} !important;">
                    ${getInitials(post.authorUsername)}
                </div>
                <div class="post-author-details">
                    <h3>${post.authorUsername}</h3>
                    <div class="post-author-meta">${timeAgo}</div>
                </div>
            </div>
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

// Helper function: Get username dari token
function getUsername() {
    try {
        const token = getToken();
        if (!token) return '';
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return decoded.username;
    } catch (error) {
        return '';
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
