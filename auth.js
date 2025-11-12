// auth.js
import { showToast } from './ui.js';
import { initProperties } from './properties.js';

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userDisplay = document.getElementById('userDisplay');
const wishlistBtn = document.getElementById('wishlistBtn');
const loginModal = document.getElementById('loginModal');
const closeLogin = document.getElementById('closeLogin');
const loginForm = document.getElementById('loginForm');

const API_URL = 'https://my-backend.martinmiskata.workers.dev';

function safeAddListener(el, evt, fn) {
  if (el) el.addEventListener(evt, fn);
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
});

// Update top-nav buttons based on login state
export function updateUI() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  if (loginBtn) loginBtn.style.display = token ? 'none' : 'inline-block';
  if (logoutBtn) logoutBtn.style.display = token ? 'inline-block' : 'none';
  if (userDisplay) {
    userDisplay.style.display = token ? 'inline-block' : 'none';
    userDisplay.textContent = username || '';
  }
  if (wishlistBtn) wishlistBtn.style.display = token ? 'inline-block' : 'none';
}

// Handle login form submission
safeAddListener(loginForm, 'submit', async (e) => {
  e.preventDefault();
  if (!loginForm) return;

  const usernameInput = loginForm.querySelector('#username')?.value.trim();
  const password = loginForm.querySelector('#password')?.value.trim();

  if (!usernameInput || !password) return showToast('Попълнете всички полета');

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, password })
    });

    const data = await res.json();

    if (res.ok && data.token) {
      const token = data.token;
      localStorage.setItem('token', token);

      // Decode JWT payload to get username and role
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const username = payload.username || payload.user || payload.name;
        const role = payload.role || 'user';

        localStorage.setItem('username', username || '');
        localStorage.setItem('role', role);
      } catch (err) {
        console.error("Failed to decode JWT:", err);
        localStorage.setItem('username', '');
        localStorage.setItem('role', 'user');
      }

      updateUI();
      if (loginModal) loginModal.setAttribute('aria-hidden', 'true');
      showToast('Успешен вход');
      initProperties();
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
