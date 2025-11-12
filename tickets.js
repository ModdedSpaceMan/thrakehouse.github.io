const API_URL = 'https://my-backend.martinmiskata.workers.dev';

// DOM Elements
const ticketModal = document.getElementById('ticketModal');
const ticketsLeftPanel = document.getElementById('ticketsLeftPanel');
const ticketSearch = document.getElementById('ticketSearch');
const ticketTitle = document.getElementById('ticketTitle');
const ticketMessage = document.getElementById('ticketMessage');
const ticketStatus = document.getElementById('ticketStatus');
const deleteTicketBtn = document.getElementById('deleteTicketBtn');
const viewSupportBtn = document.getElementById('viewSupportBtn');
const closeTicketModal = document.getElementById('closeTicketModal');

let tickets = [];
let selectedTicket = null;

// --- Load tickets from backend ---
async function loadTickets() {
  try {
    const res = await fetch(`${API_URL}/tickets`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const now = new Date();
    tickets = data.filter(t => (now - new Date(t.date)) / (1000*60*60*24) <= 30);

    renderTicketList();
  } catch (err) {
    console.error('Error fetching tickets:', err);
    ticketsLeftPanel.innerHTML = `<p style="color:red;">Грешка при зареждане на съобщения: ${err.message}</p>`;
  }
}

// --- Render ticket list ---
function renderTicketList(searchTerm = '') {
  ticketsLeftPanel.innerHTML = '';

  const filtered = tickets
    .filter(t =>
      t.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a,b) => new Date(b.date) - new Date(a.date));

  filtered.forEach(ticket => {
    const item = document.createElement('div');
    item.classList.add('ticket-item');
    item.style.cursor = 'pointer';
    item.style.padding = '5px';
    item.style.borderBottom = '1px solid #ccc';
    item.style.backgroundColor = ticket.status === 'pending' ? '#fff3b0' :
                                 ticket.status === 'ongoing' ? '#a0d2eb' :
                                 '#a8e6cf';

    item.textContent = `${ticket.user} - ${new Date(ticket.date).toLocaleDateString()} [${ticket.status}]`;
    item.addEventListener('click', () => selectTicket(ticket));
    ticketsLeftPanel.appendChild(item);
  });
}

// --- Select a ticket to view details ---
function selectTicket(ticket) {
  selectedTicket = ticket;
  ticketTitle.textContent = `${ticket.user} (${ticket.email})`;
  ticketMessage.textContent = ticket.message;
  ticketStatus.value = ticket.status;
}

// --- Update ticket status ---
ticketStatus.addEventListener('change', async () => {
  if (!selectedTicket) return;
  const newStatus = ticketStatus.value;
  try {
    const res = await fetch(`${API_URL}/tickets/${selectedTicket.id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    selectedTicket.status = newStatus;
    renderTicketList(ticketSearch.value);
  } catch (err) {
    console.error(err);
    alert('Грешка при обновяване на статуса');
  }
});

// --- Delete ticket ---
deleteTicketBtn.addEventListener('click', async () => {
  if (!selectedTicket) return;
  if (!confirm('Наистина ли искате да изтриете този тикет?')) return;

  try {
    const res = await fetch(`${API_URL}/tickets/${selectedTicket.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    tickets = tickets.filter(t => t.id !== selectedTicket.id);
    selectedTicket = null;
    ticketTitle.textContent = 'Изберете тикет';
    ticketMessage.textContent = '';
    renderTicketList(ticketSearch.value);
  } catch (err) {
    console.error(err);
    alert('Грешка при изтриване на тикета');
  }
});

// --- Search tickets ---
ticketSearch.addEventListener('input', (e) => {
  renderTicketList(e.target.value);
});

// --- Open/Close modal ---
viewSupportBtn.addEventListener('click', () => {
  ticketModal.style.display = 'block';
  loadTickets();
});

closeTicketModal.addEventListener('click', () => {
  ticketModal.style.display = 'none';
});
