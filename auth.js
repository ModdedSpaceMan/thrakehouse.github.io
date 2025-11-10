// auth.js
import { showToast, uiInit } from './ui.js';
import { loadProperties } from './properties.js';

export let role = localStorage.getItem('role') || '';
export let username = localStorage.getItem('username') || '';
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

const loginBtn = document.getElementById('loginBtn');
const closeLogin = document.getElementById('closeLogin');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');

loginBtn.addEventListener('click', () => document.getElementById('loginModal').setAttribute('aria-hidden', 'false'));
closeLogin.addEventListener('click', () => document.getElementById('loginModal').setAttribute('aria-hidden', 'true'));

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const u = document.getElementById('username').value;
  const p = document.getElementById('password').value;
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();
    if(data.success){
      role = data.role;
      username = data.username;
      localStorage.setItem('role', role);
      localStorage.setItem('username', username);
      showToast('Успешен вход!');
      document.getElementById('loginModal').setAttribute('aria-hidden', 'true');
      uiInit();
      await loadProperties();
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
  loadProperties();
});
