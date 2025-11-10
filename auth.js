// auth.js
export let role = localStorage.getItem('role') || '';
export let username = localStorage.getItem('username') || '';
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

const loginBtn = document.getElementById('loginBtn');
const closeLogin = document.getElementById('closeLogin');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');

loginBtn.addEventListener('click', () => loginModal.setAttribute('aria-hidden', 'false'));
closeLogin.addEventListener('click', () => loginModal.setAttribute('aria-hidden', 'true'));

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value.trim();

  if (!u || !p) {
    showToast('Моля въведете потребителско име и парола');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });

    if (!res.ok) {
      console.error('Login request failed:', res.status, await res.text());
      showToast('Грешка при опит за вход');
      return;
    }

    const data = await res.json();
    if (data.success) {
      role = data.role;
      username = data.username;
      localStorage.setItem('role', role);
      localStorage.setItem('username', username);

      showToast('Успешен вход!');
      loginModal.setAttribute('aria-hidden', 'true');
      uiInit();
      await loadProperties();
    } else {
      showToast('Грешно потребителско име или парола');
    }
  } catch (err) {
    console.error('Login error:', err);
    showToast('Грешка при опит за вход');
  }
});

logoutBtn.addEventListener('click', async () => {
  localStorage.removeItem('role');
  localStorage.removeItem('username');
  role = '';
  username = '';
  uiInit();
  showToast('Успешен изход!');
  await loadProperties();
});
