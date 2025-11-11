const API_URL = 'https://my-backend.martinmiskata.workers.dev';
const ticketSidebarBtn = document.getElementById('viewSupportBtn');

let tickets = [];
let filteredTickets = [];

// Modal elements
let ticketModal, ticketListContainer, ticketDetailContainer, searchInput;

function createTicketModal() {
  ticketModal = document.createElement('div');
  ticketModal.id = 'ticketModal';
  ticketModal.className = 'modal';
  ticketModal.setAttribute('aria-hidden', 'true');

  ticketModal.innerHTML = `
    <div class="modal-content" style="display:flex; gap:20px; width:80%; max-width:900px;">
      <div style="flex:1; display:flex; flex-direction:column;">
        <input type="text" id="ticketSearchInput" placeholder="Търсене по потребител или имейл" style="margin-bottom:10px;padding:5px;border-radius:5px;border:1px solid #ccc;">
        <div id="ticketList" style="overflow-y:auto; max-height:400px; border:1px solid #ccc; padding:5px; border-radius:5px;"></div>
      </div>
      <div style="flex:2; border-left:1px solid #ccc; padding-left:10px;">
        <div id="ticketDetail"></div>
      </div>
      <button class="close" id="closeTicketModal" style="position:absolute; top:10px; right:20px;">&times;</button>
    </div>
  `;

  document.body.appendChild(ticketModal);
  ticketListContainer = document.getElementById('ticketList');
  ticketDetailContainer = document.getElementById('ticketDetail');
  searchInput = document.getElementById('ticketSearchInput');

  document.getElementById('closeTicketModal').addEventListener('click', () => {
    ticketModal.setAttribute('aria-hidden', 'true');
    ticketModal.style.display = 'none';
  });

  searchInput.addEventListener('input', () => {
    renderTicketList(searchInput.value);
  });
}

ticketSidebarBtn.addEventListener('click', async () => {
  if (!ticketModal) createTicketModal();
  ticketModal.style.display = 'flex';
  ticketModal.setAttribute('aria-hidden', 'false');
  await loadTickets();
});

// Fetch tickets from backend and filter out older than 30 days
async function loadTickets() {
  try {
    const res = await fetch(`${API_URL}/tickets`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    tickets = await res.json();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    tickets = tickets.filter(t => new Date(t.date) >= thirtyDaysAgo);
    renderTicketList();
  } catch (err) {
    console.error('Error loading tickets:', err);
    ticketListContainer.innerHTML = '<p>Грешка при зареждане на тикети</p>';
  }
}

function renderTicketList(search = '') {
  const term = search.toLowerCase();
  filteredTickets = tickets.filter(t => t.user.toLowerCase().includes(term) || t.email.toLowerCase().includes(term));

  // Newer first
  filteredTickets.sort((a, b) => new Date(b.date) - new Date(a.date));

  ticketListContainer.innerHTML = filteredTickets.map(t => `
    <div class="ticket-item" style="padding:5px; border-bottom:1px solid #ddd; cursor:pointer;">
      <strong>${t.user}</strong> (${t.email}) - <em>${t.status}</em>
    </div>
  `).join('');

  // Add click handlers
  ticketListContainer.querySelectorAll('.ticket-item').forEach((el, i) => {
    el.addEventListener('click', () => showTicketDetail(filteredTickets[i]));
  });
}

function showTicketDetail(ticket) {
  ticketDetailContainer.innerHTML = `
    <h3>${ticket.user} (${ticket.email})</h3>
    <p><strong>Съобщение:</strong> ${ticket.message}</p>
    <p><strong>Дата:</strong> ${new Date(ticket.date).toLocaleString()}</p>
    <label>
      Статус:
      <select id="ticketStatusSelect">
        <option value="pending">В очакване</option>
        <option value="ongoing">В процес</option>
        <option value="finished">Приключен</option>
      </select>
    </label>
    <button id="updateTicketStatus" style="margin-top:10px;">Обнови статус</button>
    <button id="deleteTicket" style="margin-top:10px; background:red;color:white;">Изтрий тикет</button>
  `;

  const statusSelect = document.getElementById('ticketStatusSelect');
  statusSelect.value = ticket.status;

  document.getElementById('updateTicketStatus').addEventListener('click', async () => {
    try {
      const res = await fetch(`${API_URL}/tickets/${ticket.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ status: statusSelect.value })
      });
      const data = await res.json();
      if (data.success) {
        ticket.status = statusSelect.value;
        renderTicketList(searchInput.value);
        showToast('Статус обновен');
      }
    } catch (err) {
      console.error(err);
      showToast('Грешка при обновяване на статуса');
    }
  });

  document.getElementById('deleteTicket').addEventListener('click', async () => {
    if (!confirm('Сигурни ли сте, че искате да изтриете този тикет?')) return;

    try {
      const res = await fetch(`${API_URL}/tickets/${ticket.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      const data = await res.json();
      if (data.success) {
        tickets = tickets.filter(t => t.id !== ticket.id);
        renderTicketList(searchInput.value);
        ticketDetailContainer.innerHTML = '';
        showToast('Тикет изтрит');
      }
    } catch (err) {
      console.error(err);
      showToast('Грешка при изтриване на тикета');
    }
  });
}

// Optional: helper for toast
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show';
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}
