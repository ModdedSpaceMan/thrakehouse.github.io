// ui.js

// ------------------ Exports for other modules ------------------
export let role = localStorage.getItem('role') || '';
export let username = localStorage.getItem('username') || '';

// ------------------ Toast Utility ------------------
export function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ------------------ Modal Controls ------------------
export function openModal(modal) {
  if (modal) modal.setAttribute('aria-hidden', 'false');
}

export function closeModal(modal) {
  if (modal) modal.setAttribute('aria-hidden', 'true');
}

// ------------------ Initialize UI ------------------
export function uiInit() {
  // Refresh role and username from localStorage
  role = localStorage.getItem('role') || '';
  username = localStorage.getItem('username') || '';

  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const wishlistBtn = document.getElementById('wishlistBtn');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const adminSidebar = document.getElementById('adminSidebar');
  const openAddBtn = document.getElementById('addPropertySidebarBtn');
  const userDisplay = document.getElementById('userDisplay');

  if (loginBtn) loginBtn.style.display = username ? 'none' : 'inline-block';
  if (logoutBtn) logoutBtn.style.display = username ? 'inline-block' : 'none';
  if (wishlistBtn) wishlistBtn.style.display = username ? 'inline-block' : 'none';
  if (userDisplay) {
    userDisplay.style.display = username ? 'inline-block' : 'none';
    if (username) userDisplay.textContent = `Влязъл като: ${username}`;
  }

  if (sidebarToggle) sidebarToggle.style.display = role === 'admin' ? 'inline-block' : 'none';
  if (openAddBtn) openAddBtn.style.display = role === 'admin' ? 'block' : 'none';

  if (role !== 'admin' && adminSidebar) adminSidebar.classList.remove('show');
}

// ------------------ Event Listeners ------------------
document.addEventListener('DOMContentLoaded', () => {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const adminSidebar = document.getElementById('adminSidebar');
  const logoutBtn = document.getElementById('logoutBtn');

  // Admin sidebar toggle
  if (sidebarToggle && adminSidebar) {
    sidebarToggle.addEventListener('click', () => adminSidebar.classList.toggle('show'));
  }

  // Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      location.reload();
    });
  }

  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    const modals = ['loginModal', 'addPropertyModal', 'wishlistModal', 'resetModal'];
    modals.forEach((id) => {
      const modal = document.getElementById(id);
      if (e.target === modal) closeModal(modal);
    });
  });

  // Initialize UI state
  uiInit();
});
