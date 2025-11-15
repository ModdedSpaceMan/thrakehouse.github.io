import { showToast } from './ui.js';
import SessionManager from './sessionManager.js';

const signupForm = document.getElementById('signupForm');
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('signupUsername').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirm = document.getElementById('signupConfirmPassword').value;

  if (password !== confirm) return showToast('Паролите не съвпадат!');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return showToast('Моля, въведете валиден имейл');

  try {
    const res = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json().catch(() => null);

    if (data.success && data.token) {
      showToast('Успешна регистрация! Влизане автоматично...');
      signupForm.reset();

      // Store session using sessionManager
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', username);

      // Wait for sessionManager to pick it up
      await SessionManager.waitForSession();

      setTimeout(() => window.location.href = 'index.html', 900);
    } else {
      showToast(data.message || 'Грешка при регистрация');
    }
  } catch (err) {
    console.error('Signup error:', err);
    showToast('Грешка при регистрация');
  }
});
