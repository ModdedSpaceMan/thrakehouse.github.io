// auth.js
export let role = localStorage.getItem('role') || '';
export let username = localStorage.getItem('username') || '';
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

const loginBtn = document.getElementById('loginBtn');
const closeLogin = document.getElementById('closeLogin');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');

// ✅ Simple toast notification system
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '30px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = '#333';
    toast.style.color = '#fff';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '5px';
    toast.style.fontSize = '16px';
    toast.style.zIndex = '9999';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.opacity = '0';
  }, 3000); // Hide after 3s
}

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
