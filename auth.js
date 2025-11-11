// auth.js
import { uiInit, showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';

// Get DOM elements
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');
const closeLogin = document.getElementById('closeLogin');
const loginForm = document.getElementById('loginForm');
const userDisplay = document.getElementById('userDisplay');

// Open login modal
loginBtn.addEventListener('click', () => loginModal.setAttribute('aria-hidden', 'false'));

// Close login modal
closeLogin.addEventListener('click', () => loginModal.setAttribute('aria-hidden', 'true'));

// Decode JWT payload
function getPayload(token) {
  try {
    return JSON.parse(atob(token.split('.')[0]));
  } catch {
    return null;
  }
}

// Login form submit
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) return showToast('Попълнете всички полета');

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.success && data.token) {
      // Store JWT instead of role/username separately
      localStorage.setItem('token', data.token);

      const payload = getPayload(data.token);
      if (payload?.username) {
        userDisplay.textContent = payload.username;
        userDisplay.style.display = 'inline-block';
      }

      showToast('Влязохте успешно!');
      loginModal.setAttribute('aria-hidden', 'true');
      uiInit(); // refresh UI
    } else {
      showToast(data.message || 'Невалидно потребителско име или парола');
    }
  } catch (err) {
    console.error(err);
    showToast('Грешка при опит за вход');
  }
});

// Logout
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  userDisplay.textContent = '';
  userDisplay.style.display = 'none';
  showToast('Излязохте успешно!');
  uiInit();
});
