/* ---------- Base API URL ---------- */
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

/* ---------- Toast Utility ---------- */
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

/* ---------- Modal Controls ---------- */
function openModal(modal) { if(modal) modal.setAttribute('aria-hidden', 'false'); }
function closeModal(modal) { if(modal) modal.setAttribute('aria-hidden', 'true'); }

/* ---------- Main Script ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const supportContainer = document.getElementById('supportMessages'); // Admin view

  // --- Load support messages (read-only, token required) ---
  async function loadSupportMessages() {
    if (!supportContainer) return;

    const token = localStorage.getItem('token');
    if (!token) {
      supportContainer.innerHTML = '<p>Трябва да сте влезли, за да видите съобщенията</p>';
      return;
    }

    try {
      const res = await fetch(`${API_URL}/support?role=admin`, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          supportContainer.innerHTML = '<p>Нямате достъп. Влезте като админ.</p>';
        } else {
          supportContainer.innerHTML = '<p>Грешка при зареждане на съобщенията</p>';
        }
        return;
      }

      const messages = await res.json();

      supportContainer.innerHTML = '';
      if (!Array.isArray(messages) || !messages.length) {
        supportContainer.innerHTML = '<p>Няма подадени съобщения</p>';
        return;
      }

      messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'support-message';
        div.innerHTML = `
          <strong>${msg.name} (${msg.email})</strong>
          <p>${msg.message}</p>
          <small>${new Date(msg.createdAt).toLocaleString()}</small>
        `;
        supportContainer.appendChild(div);
      });
    } catch {
      showToast('Грешка при зареждане на съобщенията');
    }
  }

  // --- Initial load ---
  loadSupportMessages();
});
