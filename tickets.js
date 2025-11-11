import { showToast } from './ui.js';
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

const ticketModal = document.getElementById('ticketModal');
const closeTicketModal = document.getElementById('closeTicketModal');
const ticketsLeftPanel = document.getElementById('ticketsLeftPanel');
const ticketSearch = document.getElementById('ticketSearch');
const ticketTitle = document.getElementById('ticketTitle');
const ticketMessage = document.getElementById('ticketMessage');
const ticketStatus = document.getElementById('ticketStatus');
const deleteTicketBtn = document.getElementById('deleteTicketBtn');

let tickets = [];
let selectedTicketId = null;

// Open/close modal
closeTicketModal.addEventListener('click', () => ticketModal.setAttribute('aria-hidden','true'));
window.addEventListener('click', e => { if(e.target === ticketModal) ticketModal.setAttribute('aria-hidden','true'); });

// Load tickets from backend
export async function loadTickets() {
  try {
    const res = await fetch(`${API_URL}/tickets`);
    let data = await res.json();

    // Filter tickets older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    tickets = data.filter(t => new Date(t.createdAt) >= thirtyDaysAgo);

    renderTicketList(tickets);
  } catch {
    showToast('Грешка при зареждане на тикетите');
  }
}

// Render left panel ticket list
function renderTicketList(ticketArray) {
  ticketsLeftPanel.innerHTML = '';

  if(ticketArray.length === 0) {
    ticketsLeftPanel.innerHTML = '<p>Няма тикети</p>';
    return;
  }

  ticketArray.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  ticketArray.forEach(t => {
    const div = document.createElement('div');
    div.className = 'ticket-item';
    div.textContent = `${t.type.toUpperCase()} • ${t.email || t.name} • ${t.status}`;
    div.dataset.id = t.id;

    div.addEventListener('click', () => selectTicket(t.id));
    ticketsLeftPanel.appendChild(div);
  });
}

// Select a ticket and show details
function selectTicket(id) {
  const t = tickets.find(ticket => ticket.id === id);
  if(!t) return;

  selectedTicketId = t.id;
  ticketTitle.textContent = `${t.type.toUpperCase()} • ${t.email || t.name}`;
  ticketMessage.textContent = t.message;
  ticketStatus.value = t.status;
}

// Status change
ticketStatus.addEventListener('change', async () => {
  if(!selectedTicketId) return;
  const newStatus = ticketStatus.value;

  try {
    const res = await fetch(`${API_URL}/tickets/${selectedTicketId}/status`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if(data.success){
      showToast('Статусът е обновен!');
      await loadTickets();
    } else showToast(data.message || 'Грешка при промяна на статуса');
  } catch {
    showToast('Грешка при промяна на статуса');
  }
});

// Delete ticket
deleteTicketBtn.addEventListener('click', async () => {
  if(!selectedTicketId) return;
  if(!confirm('Сигурни ли сте, че искате да изтриете този тикет?')) return;

  try {
    const res = await fetch(`${API_URL}/tickets/${selectedTicketId}`, { method:'DELETE' });
    const data = await res.json();
    if(data.success){
      showToast('Тикетът е изтрит!');
      selectedTicketId = null;
      ticketTitle.textContent = 'Изберете тикет';
      ticketMessage.textContent = '';
      await loadTickets();
    } else showToast(data.message || 'Грешка при изтриване на тикета');
  } catch {
    showToast('Грешка при изтриване на тикета');
  }
});

// Search/filter tickets
ticketSearch.addEventListener('input', () => {
  const term = ticketSearch.value.toLowerCase();
  renderTicketList(tickets.filter(t => (t.email||t.name).toLowerCase().includes(term)));
});
