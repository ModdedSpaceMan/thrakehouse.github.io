import { showToast } from './ui.js';
import { initProperties } from './properties.js';

// Buttons and display elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const wishlistBtn = document.getElementById('wishlistBtn');
const userDisplay = document.getElementById('userDisplay');
const loginModal = document.getElementById('loginModal');
const closeLogin = document.getElementById('closeLogin');
const loginForm = document.getElementById('loginForm');

const API_URL = 'https://my-backend.martinmiskata.workers.dev';

// Safe event listener helper
function safeAddListener(el, evt, fn) {
  if (el) el.addEventListener(evt, fn);
}

// Decode custom token safely
function decodeCustomToken(token) {
  try {
    const base64Payload = token.split('.')[0]; // first part = payload
    const json = atob(base64Payload);
    return JSON.parse(json);
  } catch (err) {
    console.error('Failed to decode token payload:', err);
    return null;
  }
}

// Update UI based on login state
export function updateUI() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  if (loginBtn) loginBtn.style.display = token ? 'none' : 'inline-block';
  if (registerBtn) registerBtn.style.display = token ? 'none' : 'inline-block';
  if (logoutBtn) logoutBtn.style.display = token ? 'inline-block' : 'none';
  if (wishlistBtn) wishlistBtn.style.display = token ? 'inline-block' : 'none';

  if (userDisplay) {
    userDisplay.style.display = token ? 'inline-block' : 'none';
    userDisplay.textContent = username || '';
  }
}

// Show login modal
safeAddListener(loginBtn, 'click', () => {
  if (loginModal) loginModal.setAttribute('aria-hidden', 'false');
});

// Close login modal
safeAddListener(closeLogin, 'click', () => {
  if (loginModal) loginModal.setAttribute('aria-hidden', 'true');
});

// Logout
safeAddListener(logoutBtn, 'click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('role');
  updateUI();
  showToast('Успешен изход');
  window.location.reload(); // refresh page to reset UI
});

// Handle login form submission
safeAddListener(loginForm, 'submit', async (e) => {
  e.preventDefault();
  if (!loginForm) return;

  const username = loginForm.querySelector('#username')?.value.trim();
  const password = loginForm.querySelector('#password')?.value.trim();
  if (!username || !password) return showToast('Попълнете всички полета');

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (res.ok && data.token) {
      const token = data.token;
      localStorage.setItem('token', token);

      const payload = decodeCustomToken(token);
      if (payload) {
        localStorage.setItem('username', payload.username || payload.user || '');
        localStorage.setItem('role', payload.role || 'user');
      } else {
        localStorage.setItem('username', '');
        localStorage.setItem('role', 'user');
      }

      updateUI();
      if (loginModal) loginModal.setAttribute('aria-hidden', 'true');
      showToast('Успешен вход');

      // Refresh page so main page reflects login state
      window.location.reload();
    } else {
      showToast(data.message || 'Грешка при вход');
    }
  } catch (err) {
    console.error(err);
    showToast('Грешка при връзка със сървъра');
  }
});

// Initialize UI on page load
document.addEventListener('DOMContentLoaded', () => updateUI());
