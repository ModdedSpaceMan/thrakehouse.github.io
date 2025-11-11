// ui.js

// ------------------ Toast Utility ------------------
export function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ------------------ Modal Controls ------------------
export function openModal(modal) { if(modal) modal.setAttribute('aria-hidden','false'); }
export function closeModal(modal) { if(modal) modal.setAttribute('aria-hidden','true'); }

// ------------------ JWT Decoding ------------------
function getRoleFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return '';
  try {
    const [payloadB64] = token.split('.');
    const payload = JSON.parse(atob(payloadB64));
    return payload.role || '';
  } catch {
    return '';
  }
}

function getUsernameFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return '';
  try {
    const [payloadB64] = token.split('.');
    const payload = JSON.parse(atob(payloadB64));
    return payload.username || '';
  } catch {
    return '';
  }
}

// ------------------ Initialize UI ------------------
export function uiInit() {
  const username = getUsernameFromToken();
  const role = getRoleFromToken();

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

  if (sidebarToggle && adminSidebar) {
    sidebarToggle.addEventListener('click', () => adminSidebar.classList.toggle('show'));
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
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

  uiInit();
});
