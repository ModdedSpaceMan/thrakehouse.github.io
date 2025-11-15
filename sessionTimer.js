import SessionManager from './sessionManager.js';

const timerDisplay = document.getElementById('timerValue');
let timerInterval;
const SESSION_LENGTH_SEC = 60 * 30; // e.g., 30 minutes

function startTimer(secondsLeft) {
  clearInterval(timerInterval);
  let remaining = secondsLeft;

  function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

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
    console.log('Session active for:', session.username);
    // Start timer from full session length
    startTimer(SESSION_LENGTH_SEC);
    // Optionally show username in UI
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
      userDisplay.style.display = 'inline-block';
      userDisplay.textContent = session.username;
    }
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'inline-block';
  }
});

// Optional logout button
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  SessionManager.logout();
  window.location.reload();
});
