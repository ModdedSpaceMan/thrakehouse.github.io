// admin.js
import { openModal, closeModal, showToast } from './ui.js';
import { loadProperties } from './properties.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';

document.addEventListener('DOMContentLoaded', () => {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const adminSidebar = document.getElementById('adminSidebar');
  const openAddBtn = document.getElementById('addPropertySidebarBtn');
  const addPropertyModal = document.getElementById('addPropertyModal');
  const closeAddBtn = addPropertyModal?.querySelector('.close');
  const viewSupportBtn = document.getElementById('viewSupportBtn');
  const ticketModal = document.getElementById('ticketModal');
  const adminSearchInput = document.getElementById('adminSearchInput');
  const adminSearchBtn = document.getElementById('adminSearchBtn');
  const adminFound = document.getElementById('adminFound');

  const token = localStorage.getItem('token');

  // Show sidebar toggle only for admins
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
    if (!addPropertyModal) return;
    addPropertyModal.style.display = 'flex';
    addPropertyModal.setAttribute('aria-hidden', 'false');
  });

  // Close Add Property modal
  closeAddBtn?.addEventListener('click', () => {
    if (!addPropertyModal) return;
    addPropertyModal.style.display = 'none';
    addPropertyModal.setAttribute('aria-hidden', 'true');
  });

  // Open Support Tickets modal
  viewSupportBtn?.addEventListener('click', () => {
    if (!ticketModal) return;
    ticketModal.setAttribute('aria-hidden', 'false');
  });

  // Admin search property by ID
  adminSearchBtn?.addEventListener('click', async () => {
    if (!adminSearchInput || !adminFound) return;
    const searchId = adminSearchInput.value.trim();
    if (!searchId) return;

    try {
      const res = await fetch(`${API_URL}/properties`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const properties = await res.json();
      const prop = properties.find(p => String(p.id) === searchId);

      if (!prop) {
        adminFound.textContent = 'Няма намерен имот с това ID';
        return;
      }

      adminFound.innerHTML = `
        <div class="property" data-id="${prop.id}">
          ${prop.images && prop.images.length > 0 ? `<img src="${prop.images[0]}" alt="${prop.title}" style="max-width:100%;margin-top:10px;border-radius:8px;">` : ''}
          <div class="property-content">
            <h3>${prop.title || 'Без име'}</h3>
            <p><strong>Локация:</strong> ${prop.location || '-'}</p>
            <p><strong>Цена:</strong> ${prop.price ?? '-'}</p>
            <p><strong>Тип:</strong> ${prop.type || '-'}</p>
            <p><strong>Категория:</strong> ${prop.category || '-'}</p>
            <p><strong>Статус:</strong> ${prop.status || '-'}</p>
            <p><strong>Спални:</strong> ${prop.bedrooms ?? '-'}</p>
            <p><strong>Бани:</strong> ${prop.bathrooms ?? '-'}</p>
            <p><strong>Площ:</strong> ${prop.size ?? '-'} m²</p>
            <p><strong>Година:</strong> ${prop.year ?? '-'}</p>
            <p><strong>Описание:</strong> ${prop.description || '-'}</p>
            <button id="adminDeleteBtn">Изтрий имота</button>
          </div>
        </div>
      `;

      // Delete property
      const deleteBtn = document.getElementById('adminDeleteBtn');
      deleteBtn?.addEventListener('click', async () => {
        if (!confirm('Наистина ли искате да изтриете този имот?')) return;
        try {
          const delRes = await fetch(`${API_URL}/properties/${prop.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
          });
          if (!delRes.ok) throw new Error(`HTTP ${delRes.status}`);
          showToast('Имотът беше изтрит!');
          adminFound.innerHTML = '';
          await loadProperties();
        } catch (err) {
          console.error(err);
          showToast('Грешка при изтриване на имота');
        }
      });

    } catch (err) {
      console.error(err);
      adminFound.textContent = 'Грешка при търсене на имота';
    }
  });
});
