export let role = localStorage.getItem('role') || '';
export let username = localStorage.getItem('username') || '';
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

const loginBtn = document.getElementById('loginBtn');
const closeLogin = document.getElementById('closeLogin');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');

// ✅ Toast notification
function showToast(message, duration = 3000) {
  const t = document.createElement('div');
  t.textContent = message;
  t.style.position = 'fixed';
  t.style.right = '28px';
  t.style.bottom = '28px';
  t.style.padding = '12px 16px';
  t.style.background = '#111827';
  t.style.color = '#fff';
  t.style.borderRadius = '10px';
  t.style.boxShadow = '0 8px 30px rgba(2,6,23,0.4)';
  t.style.transition = 'opacity 0.5s ease';
  t.style.opacity = '1';
  document.body.appendChild(t);

  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => document.body.removeChild(t), 500);
  }, duration);
}

// ✅ Open / close login modal
loginBtn.addEventListener('click', () => {
  document.activeElement.blur();
  loginModal.removeAttribute('inert');
  loginModal.setAttribute('aria-hidden', 'false');
});
closeLogin.addEventListener('click', () => {
  document.activeElement.blur();
  loginModal.setAttribute('aria-hidden', 'true');
  loginModal.setAttribute('inert', '');
});

// ✅ Login form submit
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
      localStorage.setItem('role', data.role);
      localStorage.setItem('username', data.username);

      showToast('Успешен вход!');
      loginModal.setAttribute('aria-hidden', 'true');

      // ✅ Reload page to update all content
      window.location.reload();
    } else {
      showToast('Грешно потребителско име или парола');
    }
  } catch (err) {
    console.error('Login error:', err);
    showToast('Грешка при опит за вход');
  }
});

// ✅ Logout button
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('role');
  localStorage.removeItem('username');

  showToast('Успешен изход!');

  // ✅ Reload page to update content
  window.location.reload();
});

// ✅ Update header UI on page load
function updateUI() {
  const loggedIn = !!localStorage.getItem('username');
  const userDisplay = document.getElementById('userDisplay');

  if (loggedIn) {
    const name = localStorage.getItem('username');
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    if (userDisplay) {
      userDisplay.textContent = `Влязъл като: ${name}`;
      userDisplay.style.display = 'inline-block';
    }
  } else {
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    if (userDisplay) {
      userDisplay.style.display = 'none';
    }
  }
}

document.addEventListener('DOMContentLoaded', updateUI);
