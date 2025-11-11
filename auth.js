// auth.js
import { uiInit, showToast } from './ui.js';
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

// DOM elements
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');
const closeLogin = document.getElementById('closeLogin');
const loginForm = document.getElementById('loginForm');
const userDisplay = document.getElementById('userDisplay');

// Open/close login modal
loginBtn.addEventListener('click', () => loginModal.setAttribute('aria-hidden', 'false'));
closeLogin.addEventListener('click', () => loginModal.setAttribute('aria-hidden', 'true'));

// --- Login ---
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

    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', username);
      localStorage.setItem('role', data.role);
      showToast('Влязохте успешно!');
      loginModal.setAttribute('aria-hidden', 'true');
      uiInit();
      userDisplay.textContent = username;
      userDisplay.style.display = 'inline-block';
    } else {
      showToast('Невалидно потребителско име или парола');
    }
  } catch (err) {
    console.error(err);
    showToast('Грешка при опит за вход');
  }
});

// --- Logout ---
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('role');
  userDisplay.textContent = '';
  userDisplay.style.display = 'none';
  showToast('Излязохте успешно!');
  uiInit();
});
