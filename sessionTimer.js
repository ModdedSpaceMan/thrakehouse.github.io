import SessionManager from './sessionManager.js';

const timerDisplay = document.getElementById('timerValue');
let timerInterval;

// Get remaining seconds from JWT token
function getTokenRemainingSeconds() {
  const token = SessionManager.getToken();
  if (!token) return 0;

  try {
    const payloadB64 = token.split('.')[0];
    const payload = JSON.parse(atob(payloadB64));
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp) return 0;
    const remaining = payload.exp - now;
    return remaining > 0 ? remaining : 0;
  } catch {
    return 0;
  }
}

// Format seconds to mm:ss
function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Start the countdown timer
function startTimer(secondsLeft) {
  clearInterval(timerInterval);
  let remaining = secondsLeft;
  timerDisplay.textContent = formatTime(remaining);

  timerInterval = setInterval(() => {
    remaining--;
    timerDisplay.textContent = formatTime(remaining);

    if (remaining <= 0) {
      clearInterval(timerInterval);
      SessionManager.logout();
      window.location.reload(); // force logout
    }
  }, 1000);
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', async () => {
  const session = await SessionManager.waitForSession();
  if (session.loggedIn) {
    const remaining = getTokenRemainingSeconds();
    if (remaining > 0) {
      startTimer(remaining);

      // Show username in UI
      const userDisplay = document.getElementById('userDisplay');
      if (userDisplay) {
        userDisplay.style.display = 'inline-block';
        userDisplay.textContent = session.username;
      }

      // Show/hide buttons
      document.getElementById('loginBtn').style.display = 'none';
      document.getElementById('logoutBtn').style.display = 'inline-block';
    } else {
      SessionManager.logout();
    }
  }
});

// Logout button
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  SessionManager.logout();
  window.location.reload();
});
