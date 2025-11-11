// ui.js
export function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

export function openModal(modal) {
  if (modal) modal.setAttribute('aria-hidden', 'false');
}

export function closeModal(modal) {
  if (modal) modal.setAttribute('aria-hidden', 'true');
}

export function uiInit() {
  const role = localStorage.getItem('role') || '';
  const username = localStorage.getItem('username') || '';

  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const wishlistBtn = document.getElementById('wishlistBtn');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const adminSidebar = document.getElementById('adminSidebar');
  const openAddBtn = document.getElementById('addPropertySidebarBtn');
  const userDisplay = document.getElementById('userDisplay');

  // Show/hide buttons
  loginBtn.style.display = username ? 'none' : 'inline-block';
  logoutBtn.style.display = username ? 'inline-block' : 'none';
  wishlistBtn.style.display = username ? 'inline-block' : 'none';
  userDisplay.style.display = username ? 'inline-block' : 'none';
  if (username) userDisplay.textContent = `Влязъл като: ${username}`;

  sidebarToggle.style.display = role === 'admin' ? 'inline-block' : 'none';
  openAddBtn.style.display = role === 'admin' ? 'block' : 'none';

  // Hide admin sidebar for non-admins
  if (role !== 'admin') adminSidebar.classList.remove('show');
}

// Attach event listeners once
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

  // Global modal click-to-close
  window.addEventListener('click', (e) => {
    const modals = ['loginModal', 'addPropertyModal', 'wishlistModal', 'resetModal'];
    modals.forEach((id) => {
      const modal = document.getElementById(id);
      if (e.target === modal) closeModal(modal);
    });
  });

  // Initialize UI
  uiInit();
});
