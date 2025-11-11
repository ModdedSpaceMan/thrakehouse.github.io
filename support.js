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
  const resetForm = document.getElementById('resetForm');
  const resetInput = document.getElementById('resetInput');
  const resetModal = document.getElementById('resetModal');
  const closeReset = document.getElementById('closeReset');
  const supportContainer = document.getElementById('supportMessages'); // For admin view
  const supportForm = document.getElementById('supportForm'); // Actual support form
  const supportName = document.getElementById('supportName');
  const supportEmail = document.getElementById('supportEmail');
  const supportMessage = document.getElementById('supportMessage');

  // --- Close Reset Modal ---
  closeReset?.addEventListener('click', () => closeModal(resetModal));

  // --- Submit Reset Form ---
  resetForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = resetInput.value.trim();
    if (!email) {
      showToast('Моля, въведете валиден имейл');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: email })
      });
      const data = await res.json();
      if (data.success || data.message) {
        showToast('Заявката е създадена! Админът ще ви изпрати имейл.');
        resetForm.reset();
        closeModal(resetModal);
      } else {
        showToast(data.message || 'Грешка при създаване на заявка');
      }
    } catch {
      showToast('Грешка при изпращане на заявката');
    }
  });

  // --- Submit Support Form ---
  supportForm?.addEventListener('submit', async (e) => {
    e.preventDefault(); // <<< critical: prevents page reload
    const name = supportName.value.trim();
    const email = supportEmail.value.trim();
    const message = supportMessage.value.trim();
    if (!name || !email || !message) {
      showToast('Моля, попълнете всички полета');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Съобщението е изпратено успешно');
        supportForm.reset();
      } else {
        showToast(data.message || 'Грешка при изпращане на съобщение');
      }
    } catch {
      showToast('Грешка при изпращане на съобщение');
    }
  });

  // --- Optional: Admin view for reset requests ---
  async function loadResetRequests() {
    if (!supportContainer) return;
    try {
      const res = await fetch(`${API_URL}/reset-password?role=admin`);
      const requests = await res.json();
      supportContainer.innerHTML = '';
      if (!requests.length) {
        supportContainer.innerHTML = '<p>Няма заявки за нулиране на парола</p>';
        return;
      }
      requests.forEach(req => {
        const div = document.createElement('div');
        div.className = 'reset-request';
        div.innerHTML = `
          <strong>${req.emailOrUsername}</strong>
          <small>${new Date(req.createdAt).toLocaleString()}</small>
          <button class="delete-reset-btn" data-id="${req.id}">Изтрий</button>
        `;
        supportContainer.appendChild(div);
      });
    } catch {
      showToast('Грешка при зареждане на заявките');
    }
  }

  // --- Delete reset request (admin) ---
  document.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('delete-reset-btn')) return;
    const id = e.target.dataset.id;
    if (!confirm('Сигурни ли сте, че искате да изтриете заявката?')) return;
    try {
      const res = await fetch(`${API_URL}/reset-password/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Заявката е изтрита');
        loadResetRequests();
      } else {
        showToast(data.message || 'Грешка при изтриване');
      }
    } catch {
      showToast('Грешка при изтриване на заявката');
    }
  });

  // --- Initial load for admin ---
  loadResetRequests();
});
