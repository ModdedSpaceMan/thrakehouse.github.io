const API_URL = 'https://my-backend.martinmiskata.workers.dev';

// Create modal structure
const ticketListContainer = document.createElement('div');
ticketListContainer.id = 'ticketListContainer';
ticketListContainer.style.cssText = 'overflow-y:auto; max-height:400px; margin-bottom:10px;';

const ticketDetailContainer = document.createElement('div');
ticketDetailContainer.id = 'ticketDetailContainer';
ticketDetailContainer.style.cssText = 'border-left:1px solid #ccc; padding-left:10px; flex:1;';

const ticketModal = document.createElement('div');
ticketModal.id = 'ticketModal';
ticketModal.classList.add('modal');
ticketModal.style.display = 'none';
ticketModal.innerHTML = `
  <div class="modal-content" style="display:flex; gap:10px; position: relative;">
    <div style="flex:1;">
      <input type="text" id="ticketSearchInput" placeholder="Търси потребител/имейл..." style="width:100%;margin-bottom:10px;padding:5px;">
    </div>
    <div id="ticketListWrapper" style="flex:2; display:flex;">
      <div id="ticketListContainer" style="flex:1;"></div>
      <div id="ticketDetailContainer" style="flex:2;"></div>
    </div>
    <button id="closeTicketModal" style="position:absolute; top:10px; right:10px;">&times;</button>
  </div>
`;
document.body.appendChild(ticketModal);

let tickets = [];

// Fetch tickets from backend
async function loadTickets() {
  try {
    const res = await fetch(`${API_URL}/tickets`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    // Remove tickets older than 30 days
    const now = new Date();
    tickets = data.filter(t => {
      const ticketDate = new Date(t.date);
      return (now - ticketDate) / (1000 * 60 * 60 * 24) <= 30;
    });

    renderTicketList();
  } catch (err) {
    console.error('Error fetching tickets:', err);
    const listContainer = document.getElementById('ticketListContainer');
    listContainer.innerHTML = `<p style="color:red;">Грешка при зареждане на съобщения: ${err.message}</p>`;
  }
}

// Render ticket list
function renderTicketList(searchTerm = '') {
  const listContainer = document.getElementById('ticketListContainer');
  listContainer.innerHTML = '';

  const filtered = tickets
    .filter(t => 
      t.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a,b) => new Date(b.date) - new Date(a.date)); // newest first

  filtered.forEach(ticket => {
    const item = document.createElement('div');
    item.classList.add('ticket-item');
    item.dataset.id = ticket.id;
    item.style.cursor = 'pointer';
    item.style.padding = '5px';
    item.style.borderBottom = '1px solid #ccc';

    if(ticket.status === 'pending') item.style.backgroundColor = '#fff3b0';
    else if(ticket.status === 'ongoing') item.style.backgroundColor = '#a0d2eb';
    else if(ticket.status === 'finished') item.style.backgroundColor = '#a8e6cf';

    item.innerHTML = `<strong>${ticket.user}</strong> - ${new Date(ticket.date).toLocaleDateString()} <span style="float:right">${ticket.status}</span>`;
    item.addEventListener('click', () => showTicketDetail(ticket));
    listContainer.appendChild(item);
  });
}

// Show selected ticket in detail pane
function showTicketDetail(ticket) {
  const detail = document.getElementById('ticketDetailContainer');
  detail.innerHTML = `
    <h3>${ticket.user} (${ticket.email})</h3>
    <p>Съобщение: ${ticket.message}</p>
    <p>Създадено: ${new Date(ticket.date).toLocaleString()}</p>
    <p>
      Статус:
      <select id="ticketStatusSelect">
        <option value="pending" ${ticket.status==='pending'?'selected':''}>Pending</option>
        <option value="ongoing" ${ticket.status==='ongoing'?'selected':''}>Ongoing</option>
        <option value="finished" ${ticket.status==='finished'?'selected':''}>Finished</option>
      </select>
    </p>
    <button id="deleteTicketBtn" style="margin-top:5px;">Изтрий</button>
  `;

  document.getElementById('ticketStatusSelect').addEventListener('change', async (e) => {
    const newStatus = e.target.value;
    await updateTicketStatus(ticket.id, newStatus);
    ticket.status = newStatus;
    renderTicketList(document.getElementById('ticketSearchInput').value);
  });

  document.getElementById('deleteTicketBtn').addEventListener('click', async () => {
    await deleteTicket(ticket.id);
    tickets = tickets.filter(t => t.id !== ticket.id);
    renderTicketList(document.getElementById('ticketSearchInput').value);
    detail.innerHTML = '<p>Избраното съобщение е изтрито.</p>';
  });
}

// Update ticket status
async function updateTicketStatus(ticketId, status) {
  try {
    const res = await fetch(`${API_URL}/tickets/${ticketId}/status`, {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer '+localStorage.getItem('token')
      },
      body: JSON.stringify({status})
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch(err) { console.error(err); }
}

// Delete ticket
async function deleteTicket(ticketId) {
  try {
    const res = await fetch(`${API_URL}/tickets/${ticketId}`, {
      method:'DELETE',
      headers:{'Authorization':'Bearer '+localStorage.getItem('token')}
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch(err) { console.error(err); }
}

// Search
document.getElementById('ticketSearchInput').addEventListener('input', (e)=>{
  renderTicketList(e.target.value);
});

// Open/Close modal
document.getElementById('viewSupportBtn').addEventListener('click', () => {
  ticketModal.style.display = 'block';
  loadTickets();
});
document.getElementById('closeTicketModal').addEventListener('click', () => {
  ticketModal.style.display = 'none';
});
