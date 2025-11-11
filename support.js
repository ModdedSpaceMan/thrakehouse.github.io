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
  const resetModal = document.getElementById('resetModal');
  const closeReset = document.getElementById('closeReset');

  // --- Close Reset Modal ---
  closeReset?.addEventListener('click', () => closeModal(resetModal));

  // --- Load reset requests (read-only) ---
  async function loadResetRequests() {
    if (!supportContainer) return;
    try {
      const res = await fetch(`${API_URL}/reset-password?role=admin`);
      const requests = await res.json();

      supportContainer.innerHTML = '';
      if (!Array.isArray(requests) || !requests.length) {
        supportContainer.innerHTML = '<p>Няма заявки за нулиране на парола</p>';
        return;
      }

      requests.forEach(req => {
        const div = document.createElement('div');
        div.className = 'reset-request';
        div.innerHTML = `
          <strong>${req.emailOrUsername}</strong>
          <small>${new Date(req.createdAt).toLocaleString()}</small>
        `;
        supportContainer.appendChild(div);
      });
    } catch {
      showToast('Грешка при зареждане на заявките');
    }
  }

  // --- Initial load ---
  loadResetRequests();
});
