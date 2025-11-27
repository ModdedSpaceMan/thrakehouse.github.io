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
    const res = await fetch(`${API_URL}/properties/${searchId}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    // Handle 404
    if (!res.ok) {
      adminFound.textContent = 'Няма намерен имот с това ID';
      return;
    }

    const prop = await res.json(); // property comes directly

    if (!prop || !prop.id) {
      adminFound.textContent = 'Няма намерен имот с това ID';
      return;
    }

    // inside your adminSearchBtn click handler, after fetching `prop`
let firstImage = (prop.images && prop.images[0]) || '';

// if no image in prop.images, try fetching extra images
if (!firstImage) {
  try {
    const imgRes = await fetch(`${API_URL}/properties/${prop.id}/images`);
    if (imgRes.ok) {
      const imgData = await imgRes.json();
      if (Array.isArray(imgData.images) && imgData.images.length > 0) {
        firstImage = imgData.images[0];
      }
    }
  } catch (e) {
    console.warn('Could not fetch extra images', e);
  }
}

adminFound.innerHTML = `
  <div class="property" data-id="${prop.id}">
    ${firstImage ? `<img src="${firstImage}" alt="${prop.title}" style="max-width:100%;margin-top:10px;border-radius:8px;">` : ''}
    <div class="property-content">
      <h3 style="color: #0f1c2b;">${prop.title || 'Без име'}</h3>
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
    document.getElementById('adminDeleteBtn')?.addEventListener('click', async () => {
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

