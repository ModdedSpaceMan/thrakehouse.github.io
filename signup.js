// signup.js
const signupForm = document.getElementById('signupForm');
const API_URL = 'https://my-backend.martinmiskata.workers.dev'; 

function showToastLocal(msg, duration = 3000) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.position = 'fixed';
  t.style.right = '28px';
  t.style.bottom = '28px';
  t.style.padding = '12px 16px';
  t.style.background = '#111827';
  t.style.color = '#fff';
  t.style.borderRadius = '10px';
  t.style.boxShadow = '0 8px 30px rgba(2,6,23,0.4)';
  document.body.appendChild(t);
  setTimeout(() => document.body.removeChild(t), duration);
}

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log('Signup form submitted');

  const usernameInput = document.getElementById('signupUsername')?.value.trim();
  const emailInput = document.getElementById('signupEmail')?.value.trim();
  const password = document.getElementById('signupPassword')?.value;
  const confirm = document.getElementById('signupConfirmPassword')?.value;

  if (!usernameInput || !emailInput || !password || !confirm) {
    showToastLocal('Моля, попълнете всички полета');
    console.log('Missing fields:', { usernameInput, emailInput, password, confirm });
    return;
  }

  if (password !== confirm) {
    showToastLocal('Паролите не съвпадат!');
    console.log('Password mismatch');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailInput)) {
    showToastLocal('Моля, въведете валиден имейл');
    console.log('Invalid email format');
    return;
  }

  const allowedDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];
  const domain = emailInput.split("@")[1];
  if (!allowedDomains.includes(domain)) {
    showToastLocal('Моля, използвайте валиден имейл (gmail, yahoo, outlook...)');
    console.log('Email domain not allowed:', domain);
    return;
  }

  try {
    console.log('Checking availability for:', usernameInput, emailInput);

    const checkRes = await fetch(`${API_URL}/check-availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, email: emailInput })
    });

    console.log('Availability response status:', checkRes.status);
    const checkData = await checkRes.json();
    console.log('Availability response data:', checkData);

    if (checkData.usernameTaken) {
      showToastLocal('Потребителското име вече е заето!');
      return;
    }
    if (checkData.emailTaken) {
      showToastLocal('Имейлът вече е регистриран!');
      return;
    }

    console.log('Sending signup request:', { username: usernameInput, email: emailInput, password });

    const res = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, email: emailInput, password })
    });

    console.log('Signup response status:', res.status);
    const data = await res.json();
    console.log('Signup response data:', data);

    if (data.success) {
      showToastLocal('Успешна регистрация! Можете да влезете с акаунта си.');
      signupForm.reset();
      setTimeout(() => window.location.href = 'index.html', 900);
    } else {
      showToastLocal(data.message || 'Грешка при регистрация');
    }

  } catch (err) {
    showToastLocal('Грешка при регистрация');
    console.error('Signup error:', err);
  }
});
