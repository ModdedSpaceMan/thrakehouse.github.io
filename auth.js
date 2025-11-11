// auth.js
import { uiInit, showToast } from './ui.js';
export let role = localStorage.getItem('role') || '';
export let username = localStorage.getItem('username') || '';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';

const loginBtn = document.getElementById('loginBtn');
const closeLogin = document.getElementById('closeLogin');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');

loginBtn.addEventListener('click', () => openModal(loginModal));
closeLogin.addEventListener('click', () => closeModal(loginModal));

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value.trim();
  if (!u || !p) return showToast('Моля въведете потребителско име и парола');

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();
    if (data.success) {
      role = data.role;
      username = data.username;
      localStorage.setItem('role', role);
      localStorage.setItem('username', username);
      uiInit();
      showToast('Успешен вход!');
      closeModal(loginModal);
    } else showToast('Грешно потребителско име или парола');
  } catch {
    showToast('Грешка при опит за вход');
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('role');
  localStorage.removeItem('username');
  role = '';
  username = '';
  uiInit();
  showToast('Успешен изход!');
});
