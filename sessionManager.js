// sessionManager.js
const API_LOGIN_PAGE = '/login.html'; // redirect here on logout

// Optional: element ID for visible timer
const TIMER_ELEMENT_ID = 'session-timer';

// Start monitoring the token
export function startSessionManager() {
  const token = localStorage.getItem('token');
  const exp = parseInt(localStorage.getItem('token_exp') || '0', 10);

  if (!token || !exp) {
    forceLogout();
    return;
  }

  const checkInterval = 1000; // every second
  const intervalId = setInterval(() => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = exp - now;

    // Update visible timer if element exists
    const timerEl = document.getElementById(TIMER_ELEMENT_ID);
    if (timerEl) timerEl.textContent = `Сесия: ${remaining}s`;

    if (remaining <= 0) {
      clearInterval(intervalId);
      forceLogout();
    }
  }, checkInterval);
}

// Force logout function
function forceLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('token_exp');
  alert('Сесията ви е изтекла. Моля, влезте отново.');
  window.location.href = API_LOGIN_PAGE;
}

// Optional: utility to check token validity anywhere
export function isTokenValid() {
  const token = localStorage.getItem('token');
  const exp = parseInt(localStorage.getItem('token_exp') || '0', 10);
  if (!token || !exp) return false;
  return Math.floor(Date.now() / 1000) < exp;
}
