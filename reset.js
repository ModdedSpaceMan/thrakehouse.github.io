/* ---------- Base API URL ---------- */
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

/* ---------- Elements ---------- */
const resetForm = document.getElementById('resetForm');
const resetInput = document.getElementById('resetInput');
const resetModal = document.getElementById('resetModal');
const closeReset = document.getElementById('closeReset');

/* ---------- Toast Utility ---------- */
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

/* ---------- Modal Controls ---------- */
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
      showToast(data.message || 'Грешка при създаване на заявката');
    }
  } catch {
    showToast('Грешка при изпращане на заявката');
  }
});
