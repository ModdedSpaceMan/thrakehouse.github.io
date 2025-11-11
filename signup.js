import { showToast } from './toast.js'; // same as used in auth.js
const signupForm = document.getElementById('signupForm');
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const usernameInput = document.getElementById('signupUsername').value.trim();
  const emailInput = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirm = document.getElementById('signupConfirmPassword').value;

  if (password !== confirm) {
    showToast('Паролите не съвпадат!', 'error');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailInput)) {
    showToast('Моля, въведете валиден имейл', 'error');
    return;
  }

  const allowedDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];
  const domain = emailInput.split("@")[1];
  if (!allowedDomains.includes(domain)) {
    showToast('Моля, използвайте валиден имейл (gmail, yahoo, outlook...)', 'error');
    return;
  }

  try {
    // Check availability
    const checkRes = await fetch(`${API_URL}/check-availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, email: emailInput })
    });
    const checkData = await checkRes.json();

    if (checkData.usernameTaken) {
      showToast('Потребителското име вече е заето!', 'error');
      return;
    }
    if (checkData.emailTaken) {
      showToast('Имейлът вече е регистриран!', 'error');
      return;
    }

    // Signup
    const res = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, email: emailInput, password })
    });
    const data = await res.json();

    if (data.success) {
      showToast('Успешна регистрация! Можете да влезете с акаунта си.', 'success');
      signupForm.reset();
      setTimeout(() => window.location.href = 'index.html', 900);
    } else {
      showToast(data.message || 'Грешка при регистрация', 'error');
    }

  } catch (err) {
    showToast('Грешка при регистрация', 'error');
    console.error(err);
  }
});
