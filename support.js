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
  const supportForm = document.getElementById('supportForm');

  if (!supportForm) return;

  supportForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('supportName').value.trim();
    const email = document.getElementById('supportEmail').value.trim();
    const message = document.getElementById('supportMessage').value.trim();

    if (!name || !email || !message) {
      showToast('Попълнете всички полета!');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, message })
      });

      const data = await res.json();

      if (data.success) {
        showToast('Съобщението е изпратено успешно!');
        supportForm.reset();
      } else {
        showToast(data.message || 'Грешка при изпращане на съобщението');
      }
    } catch (err) {
      console.error(err);
      showToast('Грешка при свързване със сървъра');
    }
  });
});
