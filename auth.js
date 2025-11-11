// auth.js
import { uiInit, showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';

export async function login(usernameInput, passwordInput) {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, password: passwordInput })
    });
    if (!res.ok) throw new Error('Login failed');

    const data = await res.json();
    if (data.success) {
      localStorage.setItem('username', data.username);
      localStorage.setItem('role', data.role);
      uiInit();
      showToast('Успешен вход!');
      location.reload(); // reload page to reflect login
    } else {
      showToast('Грешно потребителско име или парола');
    }
  } catch (err) {
    console.error(err);
    showToast('Грешка при опит за вход');
  }
}

export function logout() {
  localStorage.removeItem('username');
  localStorage.removeItem('role');
  uiInit();
  showToast('Успешен изход!');
  location.reload(); // reload page to reflect logout
}
