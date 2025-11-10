/* ---------- Base API URL ---------- */
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

/* ---------- Elements ---------- */
const supportForm = document.getElementById('supportForm');
const resetForm = document.getElementById('resetForm');
const resetInput = document.getElementById('resetInput');
const resetModal = document.getElementById('resetModal');
const closeReset = document.getElementById('closeReset');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');

const viewSupportBtn = document.getElementById('viewSupportBtn');
const supportMessagesDiv = document.getElementById('supportMessages');

/* ---------- Toast ---------- */
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

/* ---------- Modal Utility ---------- */
function openModal(modal) { if(modal) modal.setAttribute('aria-hidden', 'false'); }
function closeModal(modal) { if(modal) modal.setAttribute('aria-hidden', 'true'); }

closeReset.addEventListener('click', () => closeModal(resetModal));
forgotPasswordLink.addEventListener('click', () => openModal(resetModal));

window.addEventListener('click', e => {
  if (e.target === resetModal) closeModal(resetModal);
});

/* ---------- Submit Support Message ---------- */
supportForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('supportName').value.trim();
  const email = document.getElementById('supportEmail').value.trim();
  const message = document.getElementById('supportMessage').value.trim();

  if (!name || !email || !message) {
    showToast('Попълнете всички полета');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ type: 'support', name, email, message })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Съобщението е изпратено!');
      supportForm.reset();
    } else {
      showToast(data.message || 'Грешка при изпращане');
    }
  } catch {
    showToast('Грешка при изпращане');
  }
});

/* ---------- Submit Password Reset Request ---------- */
resetForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email = resetInput.value.trim();
  if (!email) {
    showToast('Въведете имейл');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ type: 'reset', email })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Заявката за нулиране е изпратена!');
      resetForm.reset();
      closeModal(resetModal);
    } else {
      showToast(data.message || 'Грешка при изпращане на заявката');
    }
  } catch {
    showToast('Грешка при изпращане на заявката');
  }
});

/* ---------- Admin: Load Tickets ---------- */
async function loadTickets() {
  try {
    const res = await fetch(`${API_URL}/tickets`);
    const tickets = await res.json();
    supportMessagesDiv.innerHTML = '';

    if (!Array.isArray(tickets) || tickets.length === 0) {
      supportMessagesDiv.innerHTML = '<p>Няма тикети</p>';
      return;
    }

    tickets.forEach(ticket => {
      const div = document.createElement('div');
      div.className = 'ticket';
      div.innerHTML = `
        <div style="font-size:12px;color:#aaa">${ticket.type.toUpperCase()} • ID: ${ticket.id}</div>
        ${ticket.type === 'support' 
          ? `<strong>${ticket.name}</strong> (${ticket.email})<p>${ticket.message}</p>` 
          : `<strong>Искане за нулиране:</strong> ${ticket.email}` }
        <button class="reply-btn" onclick="replyTicket('${ticket.id}','${ticket.type}','${ticket.email || ''}')">Отговори</button>
      `;
      supportMessagesDiv.appendChild(div);
    });
  } catch {
    supportMessagesDiv.innerHTML = '<p>Грешка при зареждане на тикетите</p>';
  }
}

viewSupportBtn.addEventListener('click', loadTickets);

/* ---------- Admin: Reply to Ticket ---------- */
async function replyTicket(id, type, email) {
  const reply = prompt(`Отговор на тикет ${id} (${type})`, type === 'support' ? '' : `Новата парола за ${email}: `);
  if (!reply) return;

  try {
    const res = await fetch(`${API_URL}/tickets/${id}/reply`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ reply })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Отговорът е изпратен!');
      loadTickets();
    } else {
      showToast(data.message || 'Грешка при изпращане на отговора');
    }
  } catch {
    showToast('Грешка при изпращане на отговора');
  }
}
