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

export async function loginUser(username, password) {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Грешка при връзка със сървъра' };
  }
}


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

// Update UI based on login state
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

// Decode custom token safely
function decodeCustomToken(token) {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null; // must have payload + signature
    const payloadB64 = parts[0];        // first part only
    const jsonStr = atob(payloadB64);
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Failed to decode token payload:", err);
    return null;
  }
}



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
      await initProperties(); // fetch properties + wishlist
    } else {
      showToast(data.message || 'Грешка при вход');
    }
  } catch (err) {
    console.error(err);
    showToast('Грешка при връзка със сървъра');
  }
});

// Initialize UI
document.addEventListener('DOMContentLoaded', () => updateUI());
