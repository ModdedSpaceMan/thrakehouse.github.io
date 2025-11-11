import { uiInit, showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');
const closeLogin = document.getElementById('closeLogin');
const loginForm = document.getElementById('loginForm');
const userDisplay = document.getElementById('userDisplay');
const sidebarToggle = document.getElementById('sidebarToggle');
const openAddBtn = document.getElementById('addPropertySidebarBtn');
const viewSupportBtn = document.getElementById('viewSupportBtn');

// --- Open/close login modal ---
loginBtn.addEventListener('click', () => loginModal.setAttribute('aria-hidden', 'false'));
closeLogin.addEventListener('click', () => loginModal.setAttribute('aria-hidden', 'true'));

// --- Helper: decode role from JWT ---
function getRoleFromToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[0]));
    return payload.role;
  } catch (e) {
    console.error("Invalid token", e);
    return null;
  }
}

// --- Login form submit ---
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
      localStorage.setItem('username', username);
      localStorage.setItem('token', data.token);
      showToast('Влязохте успешно!');
      loginModal.setAttribute('aria-hidden', 'true');

      // --- Update UI ---
      uiInit();
      userDisplay.textContent = username;
      userDisplay.style.display = 'inline-block';

      // --- Show admin buttons if role is admin ---
      const role = getRoleFromToken(data.token);
      if (role === 'admin') {
        document.body.classList.add('admin');
        sidebarToggle?.style.setProperty('display', 'inline-block');
        openAddBtn?.style.setProperty('display', 'inline-block');
        viewSupportBtn?.style.setProperty('display', 'inline-block');
      }
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
  localStorage.removeItem('username');
  localStorage.removeItem('token');
  userDisplay.textContent = '';
  userDisplay.style.display = 'none';
  document.body.classList.remove('admin');
  sidebarToggle?.style.setProperty('display', 'none');
  openAddBtn?.style.setProperty('display', 'none');
  viewSupportBtn?.style.setProperty('display', 'none');
  showToast('Излязохте успешно!');
  uiInit();
});
