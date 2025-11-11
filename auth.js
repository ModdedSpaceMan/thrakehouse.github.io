import { uiInit, showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');
const closeLogin = document.getElementById('closeLogin');
const loginForm = document.getElementById('loginForm');
const userDisplay = document.getElementById('userDisplay');

loginBtn.addEventListener('click', () => loginModal.setAttribute('aria-hidden', 'false'));
closeLogin.addEventListener('click', () => loginModal.setAttribute('aria-hidden', 'true'));

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  userDisplay.textContent = '';
  userDisplay.style.display = 'none';
  showToast('Излязохте успешно!');
  uiInit();
}

export function checkTokenExpired(response) {
  if (response.status === 401) {
    logout();
    showToast('Сесията е изтекла. Моля, влезте отново.');
    return true;
  }
  return false;
}

async function loginUser(username, password) {
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
      uiInit();
      userDisplay.textContent = username;
      userDisplay.style.display = 'inline-block';
      return true;
    } else {
      showToast('Невалидно потребителско име или парола');
      return false;
    }
  } catch (err) {
    console.error(err);
    showToast('Грешка при опит за вход');
    return false;
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  if (!username || !password) return showToast('Попълнете всички полета');
  await loginUser(username, password);
});

logoutBtn.addEventListener('click', logout);

export { loginUser };
