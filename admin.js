import { openModal, closeModal, showToast } from './ui.js';
import { loadProperties } from './properties.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';

// --- DOM elements ---
const openAddBtn = document.getElementById('addPropertySidebarBtn');
const addPropertyModal = document.getElementById('addPropertyModal');
const closeAddBtn = document.getElementById('closeAdd');
const propertyForm = document.getElementById('propertyForm');
const adminSearchInput = document.getElementById('adminSearchInput');
const adminSearchBtn = document.getElementById('adminSearchBtn');
const adminFound = document.getElementById('adminFound');
const viewSupportBtn = document.getElementById('viewSupportBtn');
const supportMessages = document.getElementById('supportMessages');
const sidebarToggle = document.getElementById('sidebarToggle');

// --- Helper: get role from JWT token ---
function getRoleFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[0]));
    return payload.role;
  } catch (e) {
    console.error("Invalid token", e);
    return null;
  }
}

// --- Show admin UI if role is admin ---
const role = getRoleFromToken();
if (role === 'admin') {
  document.body.classList.add('admin');
  sidebarToggle.style.display = 'inline-block';
  openAddBtn?.style.setProperty('display', 'inline-block');
  viewSupportBtn?.style.setProperty('display', 'inline-block');
}

// --- Add Property Modal ---
if (openAddBtn && addPropertyModal) {
  openAddBtn.addEventListener('click', () => openModal(addPropertyModal));
}
if (closeAddBtn && addPropertyModal) {
  closeAddBtn.addEventListener('click', () => closeModal(addPropertyModal));
}

// --- Admin Search Property by ID ---
if (adminSearchBtn) {
  adminSearchBtn.addEventListener('click', async () => {
    const searchId = adminSearchInput.value.trim();
    if (!searchId) return;

    try {
      const res = await fetch(`${API_URL}/properties`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      const properties = await res.json();
      const prop = properties.find(p => p.id === searchId);

      if (!prop) {
        adminFound.textContent = 'Няма намерен имот с това ID';
        return;
      }

      adminFound.innerHTML = `
        <div class="admin-property-found">
          <h4>${prop.name}</h4>
          <p>Локация: ${prop.location}</p>
          <p>Цена: ${prop.price}</p>
          <p>Тип: ${prop.type}</p>
          <p>Статус: ${prop.status}</p>
          ${prop.image ? `<img src="${prop.image}" alt="${prop.name}" style="max-width:100%;margin-top:10px;border-radius:8px;">` : ''}
        </div>
      `;
    } catch (err) {
      console.error(err);
      adminFound.textContent = 'Грешка при търсене на имота';
    }
  });
}

// --- View Support Tickets (read-only) ---
if (viewSupportBtn) {
  viewSupportBtn.addEventListener('click', async () => {
    try {
      const res = await fetch(`${API_URL}/support`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      const data = await res.json();

      supportMessages.innerHTML = (Array.isArray(data) && data.length
        ? data.map(msg => `<div class="support-ticket"><strong>${msg.name}</strong>: ${msg.message}</div>`).join('')
        : 'Няма съобщения'
      );
    } catch (err) {
      console.error(err);
      supportMessages.textContent = 'Грешка при зареждане на съобщения';
    }
  });
}
