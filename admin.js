// admin.js
import { openModal, closeModal, showToast } from './ui.js';
import { loadProperties } from './properties.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';

document.addEventListener('DOMContentLoaded', () => {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const adminSidebar = document.getElementById('adminSidebar');
  const openAddBtn = document.getElementById('addPropertySidebarBtn');
  const addPropertyModal = document.getElementById('addPropertyModal');
  const viewSupportBtn = document.getElementById('viewSupportBtn');
  const adminSearchInput = document.getElementById('adminSearchInput');
  const adminSearchBtn = document.getElementById('adminSearchBtn');
  const adminFound = document.getElementById('adminFound');
  const ticketModal = document.getElementById('ticketModal');

  // Show sidebar toggle only for admins
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[0]));
      if (payload.role === 'admin') {
        sidebarToggle.style.display = 'inline-block';
      }
    } catch {}
  }

  // Toggle admin sidebar
  sidebarToggle?.addEventListener('click', () => {
    if (!adminSidebar) return;
    const hidden = adminSidebar.getAttribute('aria-hidden') === 'true';
    adminSidebar.setAttribute('aria-hidden', hidden ? 'false' : 'true');
  });

  // Open Add Property modal
  openAddBtn?.addEventListener('click', () => {
    if (addPropertyModal) addPropertyModal.setAttribute('aria-hidden', 'false');
  });

  // Open Support Tickets modal
  viewSupportBtn?.addEventListener('click', () => {
    if (ticketModal) ticketModal.setAttribute('aria-hidden', 'false');
  });
    // Close Add Property modal
  const closeAddBtn = addPropertyModal?.querySelector('.close');
  closeAddBtn?.addEventListener('click', () => {
    addPropertyModal.setAttribute('aria-hidden', 'true');
  });

  // Admin search property by ID
  adminSearchBtn?.addEventListener('click', async () => {
    if (!adminSearchInput || !adminFound) return;
    const searchId = adminSearchInput.value.trim();
    if (!searchId) return;

    try {
      const res = await fetch(`${API_URL}/properties`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const properties = await res.json();
      const prop = properties.find(p => p.id === searchId);

      if (!prop) {
        adminFound.textContent = 'Няма намерен имот с това ID';
        return;
      }

      adminFound.innerHTML = `
        <div class="property">
          <div class="property-content">
            <h3>${prop.name}</h3>
            <p>Локация: ${prop.location}</p>
            <p>Цена: ${prop.price}</p>
            <p>Тип: ${prop.type}</p>
            <p>Статус: ${prop.status || '-'}</p>
            ${prop.image ? `<img src="${prop.image}" alt="${prop.name}" style="max-width:100%;margin-top:10px;border-radius:8px;">` : ''}
          </div>
        </div>

      `;
    } catch (err) {
      console.error(err);
      adminFound.textContent = 'Грешка при търсене на имота';
    }
  });
});
