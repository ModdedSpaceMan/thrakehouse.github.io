const signupForm = document.getElementById('signupForm');
const API_URL = 'https://my-backend.martinmiskata.workers.dev'; // <-- Worker URL

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

  const usernameInput = document.getElementById('signupUsername').value.trim();
  const emailInput = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirm = document.getElementById('signupConfirmPassword').value;

  if (password !== confirm) {
    showToastLocal('Паролите не съвпадат!');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailInput)) {
    showToastLocal('Моля, въведете валиден имейл');
    return;
  }

  const allowedDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];
  const domain = emailInput.split("@")[1];
  if (!allowedDomains.includes(domain)) {
    showToastLocal('Моля, използвайте валиден имейл (gmail, yahoo, outlook...)');
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
      showToastLocal('Потребителското име вече е заето!');
      return;
    }
    if (checkData.emailTaken) {
      showToastLocal('Имейлът вече е регистриран!');
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
      showToastLocal('Успешна регистрация! Можете да влезете с акаунта си.');
      signupForm.reset();
      setTimeout(() => window.location.href = 'index.html', 900);
    } else {
      showToastLocal(data.message || 'Грешка при регистрация');
    }

  } catch (err) {
    showToastLocal('Грешка при регистрация');
    console.error(err);
  }
});
