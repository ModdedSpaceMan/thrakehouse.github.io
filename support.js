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
function openModal(modal) {
  if (modal) modal.setAttribute('aria-hidden', 'false');
}
function closeModal(modal) {
  if (modal) modal.setAttribute('aria-hidden', 'true');
}

/* ---------- DOMContentLoaded ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const resetForm = document.getElementById('resetForm');
  const resetInput = document.getElementById('resetInput');
  const resetModal = document.getElementById('resetModal');
  const closeReset = document.getElementById('closeReset');

  /* ---------- Close Reset Modal ---------- */
  if (closeReset && resetModal) {
    closeReset.addEventListener('click', () => closeModal(resetModal));
  }

  /* ---------- Submit Reset Form ---------- */
  if (resetForm && resetInput && resetModal) {
    resetForm.addEventListener('submit', async (e) => {
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

        if (data.success !== false) {
          showToast('Заявката е създадена! Админът ще ви изпрати имейл.');
          resetForm.reset();
          closeModal(resetModal);
        } else {
          showToast(data.message || 'Грешка при създаване на заявката');
        }
      } catch {
        showToast('Грешка при изпращане на заявката');
      }
    });
  }

  /* ---------- Optional: Admin can view reset requests ---------- */
  async function loadResetRequests() {
    const container = document.getElementById('supportMessages');
    if (!container) return;

    try {
      const res = await fetch(`${API_URL}/reset-password?role=admin`);
      const requests = await res.json();

      container.innerHTML = '';
      if (!requests.length) {
        container.innerHTML = '<p>Няма заявки за нулиране на парола</p>';
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
        container.appendChild(div);
      });
    } catch {
      showToast('Грешка при зареждане на заявките');
    }
  }

  /* ---------- Optional: Admin can delete requests ---------- */
  document.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('delete-reset-btn')) return;
    const id = e.target.dataset.id;
    if (!id || !confirm('Сигурни ли сте, че искате да изтриете заявката?')) return;

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

  // Auto-load requests if admin view exists
  if (document.getElementById('supportMessages')) {
    loadResetRequests();
  }
});
