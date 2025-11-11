// Data Storage
    const users = JSON.parse(localStorage.getItem('lombaUsers') || '[]');
    const lombas = JSON.parse(localStorage.getItem('lombaList') || '[]');
    let currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');

    // Pages
    const loginPage = document.getElementById('loginPage');
    const registerPage = document.getElementById('registerPage');
    const dashboardPage = document.getElementById('dashboardPage');

    // Show initial page
    if (currentUser) {
      showDashboard();
    } else {
      showLogin();
    }

    // Navigation
    document.getElementById('goToRegister').onclick = (e) => {
      e.preventDefault();
      showRegister();
    };

    document.getElementById('goToLogin').onclick = (e) => {
      e.preventDefault();
      showLogin();
    };

    // Login
    document.getElementById('loginForm').onsubmit = (e) => {
      e.preventDefault();
      const nisn = document.getElementById('loginNisn').value;
      const password = document.getElementById('loginPassword').value;
      
      const user = users.find(u => u.nisn === nisn);
      if (!user) {
        showError('loginError', 'NISN tidak ditemukan');
        return;
      }
      
      if (user.password !== password) {
        showError('loginError', 'Password salah');
        return;
      }
      
      currentUser = user;
      sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
      showDashboard();
    };

    // Register
    document.getElementById('registerForm').onsubmit = (e) => {
      e.preventDefault();
      const nama = document.getElementById('registerNama').value;
      const nisn = document.getElementById('registerNisn').value;
      const password = document.getElementById('registerPassword').value;
      
      if (password.length < 6) {
        showError('registerError', 'Password minimal 6 karakter');
        return;
      }
      
      if (users.find(u => u.nisn === nisn)) {
        showError('registerError', 'NISN sudah terdaftar');
        return;
      }
      
      users.push({ nama, nisn, password });
      localStorage.setItem('lombaUsers', JSON.stringify(users));
      showLogin();
      document.getElementById('registerForm').reset();
    };

    // Add Lomba
    document.getElementById('addLombaForm').onsubmit = (e) => {
      e.preventDefault();
      const namaLomba = document.getElementById('namaLomba').value;
      const deskripsi = document.getElementById('deskripsi').value;
      const link = document.getElementById('link').value;
      
      lombas.unshift({
        namaLomba,
        deskripsi,
        link,
        createdBy: currentUser.nisn,
        createdAt: new Date().toISOString()
      });
      
      localStorage.setItem('lombaList', JSON.stringify(lombas));
      document.getElementById('addLombaForm').reset();
      renderLombas();
    };

    // Logout
    document.getElementById('logoutBtn').onclick = (e) => {
      e.preventDefault();
      currentUser = null;
      sessionStorage.removeItem('currentUser');
      showLogin();
    };

    // Functions
    function showLogin() {
      loginPage.classList.remove('hidden');
      registerPage.classList.add('hidden');
      dashboardPage.classList.add('hidden');
      document.getElementById('loginError').classList.add('hidden');
    }

    function showRegister() {
      loginPage.classList.add('hidden');
      registerPage.classList.remove('hidden');
      dashboardPage.classList.add('hidden');
      document.getElementById('registerError').classList.add('hidden');
    }

    function showDashboard() {
      loginPage.classList.add('hidden');
      registerPage.classList.add('hidden');
      dashboardPage.classList.remove('hidden');
      
      const firstName = currentUser.nama.split(' ')[0];
      document.getElementById('userName').textContent = firstName;
      renderLombas();
    }

    function showError(elementId, message) {
      const el = document.getElementById(elementId);
      el.textContent = message;
      el.classList.remove('hidden');
    }

    function renderLombas() {
      const feed = document.getElementById('lombaFeed');
      
      if (lombas.length === 0) {
        feed.innerHTML = '<div class="empty">Belum ada lomba. Tambahkan yang pertama!</div>';
        return;
      }
      
      feed.innerHTML = lombas.map(l => `
        <article class="card">
          <div class="card-body">
            <h3>${l.namaLomba}</h3>
            <p class="muted small">${new Date(l.createdAt).toLocaleString('id-ID')}</p>
            <p>${l.deskripsi}</p>
            <a class="btn link" href="${l.link}" target="_blank" rel="noopener">Buka Pendaftaran</a>
          </div>
        </article>
      `).join('');
    }