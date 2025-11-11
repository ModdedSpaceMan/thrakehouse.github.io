// ui.js
export let role = localStorage.getItem('role') || '';
export let username = localStorage.getItem('username') || '';

export function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// Modal Utility
export function openModal(modal) { if(modal) modal.setAttribute('aria-hidden', 'false'); }
export function closeModal(modal) { if(modal) modal.setAttribute('aria-hidden', 'true'); }

// Initialize UI based on role
export function uiInit() {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const wishlistBtn = document.getElementById('wishlistBtn');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const adminSidebar = document.getElementById('adminSidebar');
  const openAddBtn = document.getElementById('addPropertySidebarBtn');
  const userDisplay = document.getElementById('userDisplay');

  loginBtn.style.display = role ? 'none' : 'inline-block';
  logoutBtn.style.display = role ? 'inline-block' : 'none';
  wishlistBtn.style.display = role ? 'inline-block' : 'none';
  sidebarToggle.style.display = role === 'admin' ? 'inline-block' : 'none';
  openAddBtn.style.display = role === 'admin' ? 'block' : 'none';

  if (role !== 'admin') adminSidebar.classList.remove('show');

  if (userDisplay) {
    if (username) {
      userDisplay.style.display = 'inline-block';
      userDisplay.textContent = `Влязъл като: ${username}`;
    } else {
      userDisplay.style.display = 'none';
    }
  }

  sidebarToggle.addEventListener('click', () => adminSidebar.classList.toggle('show'));
}

// Close modals on outside click
window.addEventListener('click', e => {
  ['loginModal', 'addPropertyModal', 'wishlistModal', 'resetModal'].forEach(id => {
    const modal = document.getElementById(id);
    if (e.target === modal) closeModal(modal);
  });
});
