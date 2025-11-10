/* ---------- Base API URL ---------- */
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

/* ---------- Elements ---------- */
const resetForm = document.getElementById('resetForm');
const resetInput = document.getElementById('resetInput');
const closeReset = document.getElementById('closeReset');
const resetModal = document.getElementById('resetModal');

/* ---------- Toast Utility ---------- */
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

/* ---------- Open / Close Modal ---------- */
function openModal(modal) { if(modal) modal.setAttribute('aria-hidden', 'false'); }
function closeModal(modal) { if(modal) modal.setAttribute('aria-hidden', 'true'); }

closeReset.addEventListener('click', () => closeModal(resetModal));

/* ---------- Submit Reset Form ---------- */
resetForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = resetInput.value.trim();
  if (!email) {
    showToast('Моля, въведете валиден имейл');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (data.success) {
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

/* ---------- Optional: Admin can view reset requests ---------- */
async function loadResetRequests() {
  try {
    const res = await fetch(`${API_URL}/resets`);
    const requests = await res.json();

    const container = document.getElementById('supportMessages'); // reuse admin sidebar
    container.innerHTML = '';

    if (!requests.length) {
      container.innerHTML = '<p>Няма заявки за нулиране на парола</p>';
      return;
    }

    requests.forEach(req => {
      const div = document.createElement('div');
      div.className = 'reset-request';
      div.innerHTML = `
        <strong>${req.email}</strong>
        <small>${new Date(req.date).toLocaleString()}</small>
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
  if (!confirm('Сигурни ли сте, че искате да изтриете заявката?')) return;

  try {
    const res = await fetch(`${API_URL}/resets/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();
    if (data.success) {
      showToast('Заявката е изтрита');
      loadResetRequests();
    } else showToast(data.message || 'Грешка при изтриване');
  } catch {
    showToast('Грешка при изтриване на заявката');
  }
});
