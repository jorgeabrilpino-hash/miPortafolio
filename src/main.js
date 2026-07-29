import './style.css';

const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api'
  : '/api';

document.addEventListener('DOMContentLoaded', async () => {
  const views = {
    portfolio: document.getElementById('frame-portfolio'),
    dashboard: document.getElementById('frame-dashboard'),
    web: document.getElementById('frame-web'),
    mobile: document.getElementById('frame-mobile'),
    software: document.getElementById('frame-software')
  };

  const sidebar = document.getElementById('main-sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  
  // Modals & Triggers
  const modalConnect = document.getElementById('modal-connect');
  const modalClose = document.getElementById('modal-close');
  const btnConnect = document.getElementById('btn-connect');
  const connectForm = document.getElementById('connect-form');
  
  const modalLogin = document.getElementById('modal-login');
  const modalLoginClose = document.getElementById('modal-login-close');
  const btnOpenLogin = document.getElementById('btn-open-login');
  const btnLogout = document.getElementById('btn-logout');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const ownerProfileBadge = document.getElementById('owner-profile-badge');

  const searchInput = document.getElementById('global-search-input');

  let currentView = 'portfolio'; // Default for all visitors so they can see Portfolio
  let sidebarCollapsed = false;
  let currentUser = null; // { id, email, name, role }

  // -------------------------------------------------------------
  // 1. AUTHENTICATION & ROLE MANAGEMENT (JWT)
  // -------------------------------------------------------------
  async function initAuth() {
    const token = localStorage.getItem('quantum_jwt');
    if (!token) {
      applyRoleUI(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        currentUser = data.user;
        applyRoleUI(currentUser);
      } else {
        localStorage.removeItem('quantum_jwt');
        applyRoleUI(null);
      }
    } catch (error) {
      console.warn('[Auth] No se pudo conectar con el backend. Ejecutando en modo desconectado.', error);
      applyRoleUI(null);
    }
  }

  function applyRoleUI(user) {
    const isOwner = user && user.role === 'owner';

    if (isOwner) {
      // OWNER MODE: Full access including sidebar and admin dashboard
      if (sidebarToggle) sidebarToggle.classList.remove('hidden');
      if (btnOpenLogin) btnOpenLogin.classList.add('hidden');
      if (ownerProfileBadge) {
        ownerProfileBadge.classList.remove('hidden');
        ownerProfileBadge.classList.add('flex');
      }

      // Show all top nav tabs (including Plataforma)
      document.querySelectorAll('[data-role-req="owner"]').forEach(tab => {
        tab.style.display = '';
      });

      switchView(currentView || 'portfolio');
    } else {
      // GUEST MODE: Sidebar & Dashboard hidden, Portfolio & Projects accessible
      if (sidebarToggle) sidebarToggle.classList.add('hidden');
      if (sidebar) {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('flex');
      }
      if (btnOpenLogin) btnOpenLogin.classList.remove('hidden');
      if (ownerProfileBadge) {
        ownerProfileBadge.classList.add('hidden');
        ownerProfileBadge.classList.remove('flex');
      }

      // Hide tabs reserved strictly for owner (Plataforma/Dashboard)
      document.querySelectorAll('[data-role-req="owner"]').forEach(tab => {
        tab.style.display = 'none';
      });

      // Force view to portfolio if trying to visit restricted dashboard
      if (currentView === 'dashboard') {
        switchView('portfolio');
      } else {
        switchView(currentView || 'portfolio');
      }
    }
  }

  // Handle Login Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginError.classList.add('hidden');
      loginError.textContent = '';

      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok && data.token) {
          localStorage.setItem('quantum_jwt', data.token);
          currentUser = data.user;
          applyRoleUI(currentUser);
          closeLoginModal();
          alert(`¡Bienvenido de nuevo, ${currentUser.name}! Acceso completo concedido.`);
        } else {
          loginError.textContent = data.message || 'Error al iniciar sesión.';
          loginError.classList.remove('hidden');
        }
      } catch (err) {
        loginError.textContent = 'No se pudo conectar con el servidor backend. Verifique que esté ejecutándose en el puerto 5000.';
        loginError.classList.remove('hidden');
      }
    });
  }

  // Handle Logout
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('quantum_jwt');
      currentUser = null;
      applyRoleUI(null);
      alert('Sesión cerrada. Ha vuelto a la vista de invitado.');
    });
  }

  // Modals open / close logic
  const openLoginModal = () => {
    if (modalLogin) {
      modalLogin.classList.remove('hidden');
      modalLogin.classList.add('flex');
    }
  };

  const closeLoginModal = () => {
    if (modalLogin) {
      modalLogin.classList.add('hidden');
      modalLogin.classList.remove('flex');
    }
  };

  if (btnOpenLogin) btnOpenLogin.addEventListener('click', openLoginModal);
  if (modalLoginClose) modalLoginClose.addEventListener('click', closeLoginModal);
  if (modalLogin) {
    modalLogin.addEventListener('click', (e) => {
      if (e.target === modalLogin) closeLoginModal();
    });
  }

  // -------------------------------------------------------------
  // 2. VIEW SWITCHER
  // -------------------------------------------------------------
  function switchView(targetView) {
    const isOwner = currentUser && currentUser.role === 'owner';

    // Restrict guest users from visiting owner internal dashboard
    if (!isOwner && targetView === 'dashboard') {
      targetView = 'portfolio';
    }

    if (!views[targetView]) return;
    currentView = targetView;

    // Update frame visibility
    Object.keys(views).forEach(key => {
      if (key === targetView) {
        views[key].classList.remove('hidden-frame');
        views[key].classList.add('active-frame');
      } else {
        views[key].classList.remove('active-frame');
        views[key].classList.add('hidden-frame');
      }
    });

    // Update active nav styles (top tabs)
    document.querySelectorAll('.nav-tab').forEach(tab => {
      const target = tab.getAttribute('data-target-view');
      if (target === targetView) {
        tab.classList.add('bg-primary', 'text-on-primary', 'font-bold', 'shadow-glow-violet');
        tab.classList.remove('text-on-surface-variant');
      } else {
        tab.classList.remove('bg-primary', 'text-on-primary', 'font-bold', 'shadow-glow-violet');
        tab.classList.add('text-on-surface-variant');
      }
    });

    // Update sidebar nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      const target = btn.getAttribute('data-target-view');
      if (target === targetView) {
        btn.classList.add('bg-secondary-container/40', 'text-on-secondary-container', 'border-r-2', 'border-primary', 'active-glow');
        btn.classList.remove('text-on-surface-variant');
      } else {
        btn.classList.remove('bg-secondary-container/40', 'text-on-secondary-container', 'border-r-2', 'border-primary', 'active-glow');
        btn.classList.add('text-on-surface-variant');
      }
    });

    // Sidebar visibility: Only allowed for owner
    if (!isOwner) {
      if (sidebar) {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('flex');
      }
    } else {
      if (targetView === 'portfolio') {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('flex');
      } else {
        if (!sidebarCollapsed) {
          sidebar.classList.remove('hidden');
          sidebar.classList.add('flex');
        }
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Event Listeners for Nav Triggers
  document.querySelectorAll('[data-target-view]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const target = trigger.getAttribute('data-target-view');
      switchView(target);
    });
  });

  // Sidebar Toggle (Owner only)
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      if (!currentUser || currentUser.role !== 'owner') return;

      if (sidebar.classList.contains('hidden')) {
        sidebar.classList.remove('hidden');
        sidebar.classList.add('flex');
        sidebarCollapsed = false;
      } else {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('flex');
        sidebarCollapsed = true;
      }
    });
  }

  // -------------------------------------------------------------
  // 3. MODAL CONNECT & FORM SUBMISSION
  // -------------------------------------------------------------
  const openModal = () => {
    if (modalConnect) {
      modalConnect.classList.remove('hidden');
      modalConnect.classList.add('flex');
    }
  };

  const closeModal = () => {
    if (modalConnect) {
      modalConnect.classList.add('hidden');
      modalConnect.classList.remove('flex');
    }
  };

  const btnHeroContact = document.getElementById('btn-hero-contact');
  if (btnConnect) btnConnect.addEventListener('click', openModal);
  if (btnHeroContact) btnHeroContact.addEventListener('click', openModal);
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalConnect) {
    modalConnect.addEventListener('click', (e) => {
      if (e.target === modalConnect) closeModal();
    });
  }

  if (connectForm) {
    connectForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const inputs = connectForm.querySelectorAll('input, textarea');
      const name = inputs[0] ? inputs[0].value : 'Invitado';
      const message = inputs[1] ? inputs[1].value : '';

      try {
        await fetch(`${API_BASE_URL}/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email: 'contacto@web.io', message })
        });
      } catch (err) {
        console.warn('Contact API submission warning:', err);
      }

      alert('¡Gracias! Mensaje recibido. Jorge Fabrissio se comunicará contigo pronto.');
      closeModal();
      connectForm.reset();
    });
  }

  // -------------------------------------------------------------
  // 4. WEB PAGES FILTERING & GLOBAL SEARCH
  // -------------------------------------------------------------
  const filterBtnsWeb = document.querySelectorAll('.filter-btn-web');
  const webCards = document.querySelectorAll('.web-card');

  filterBtnsWeb.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');

      filterBtnsWeb.forEach(b => {
        b.classList.remove('bg-primary', 'text-on-primary', 'font-bold', 'shadow-glow-violet');
        b.classList.add('text-on-surface-variant', 'hover:bg-surface-variant/50');
      });
      btn.classList.add('bg-primary', 'text-on-primary', 'font-bold', 'shadow-glow-violet');

      webCards.forEach(card => {
        const category = card.getAttribute('data-category') || '';
        if (filter === 'all' || category.includes(filter)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const allCards = document.querySelectorAll('article, .glass-panel');

      if (!query) {
        allCards.forEach(card => card.style.display = '');
        return;
      }

      allCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(query)) {
          card.style.display = '';
        } else if (card.classList.contains('group')) {
          card.style.display = 'none';
        }
      });
    });
  }

  // Initialize Auth Check
  await initAuth();
});
