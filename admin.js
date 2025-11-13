// admin.js
import { openModal, closeModal, showToast } from './ui.js';
import { loadProperties } from './properties.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';

document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const openAddBtn = document.getElementById('addPropertySidebarBtn');
  const addPropertyModal = document.getElementById('addPropertyModal');
  const closeAddBtn = document.getElementById('closeAdd');
  const adminSearchInput = document.getElementById('adminSearchInput');
  const adminSearchBtn = document.getElementById('adminSearchBtn');
  const adminFound = document.getElementById('adminFound');
  const viewSupportBtn = document.getElementById('viewSupportBtn');
  const supportMessages = document.getElementById('supportMessages');
  const sidebarToggle = document.getElementById('sidebarToggle');

  // Get role from JWT
  function getRoleFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[0]));
      return payload.role;
    } catch {
      return null;
    }
  }

  // Show admin UI
  const role = getRoleFromToken();
  if (role === 'admin') {
    document.body.classList.add('admin');
    sidebarToggle?.style.setProperty('display', 'inline-block');
    openAddBtn?.style.setProperty('display', 'inline-block');
    viewSupportBtn?.style.setProperty('display', 'inline-block');
  }

  // Open/close add modal
  openAddBtn?.addEventListener('click', () => openModal(addPropertyModal));
  closeAddBtn?.addEventListener('click', () => closeModal(addPropertyModal));

  // --- Admin Search Property by ID ---
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

    // Render the property with admin buttons
    const isRental = prop.category === 'rental';
    const inWishlist = '🤍'; // Optionally fetch if in wishlist
    const takenClass = isRental && prop.status?.toLowerCase() === 'taken' ? 'taken' : '';

    adminFound.innerHTML = `
      <div class="property ${takenClass}" data-id="${prop.id}">
        ${prop.image ? `<img src="${prop.image}" alt="${prop.name}">` : ''}
        <div class="property-content">
          <h3>${prop.name}</h3>
          <p>Локация: ${prop.location}</p>
          <p>Цена: ${prop.price}</p>
          <p>Категория: ${isRental ? "Наем" : "Продажба"}</p>
          <p>Тип: ${prop.type}</p>
          ${isRental ? `<p>Статус: ${prop.status}</p>` : ''}
        </div>
        <div class="property-actions">
          <div class="admin-buttons-right">
            <button class="wishlist-btn" data-id="${prop.id}">${inWishlist}</button>
            <button class="edit-btn" data-id="${prop.id}">Редактирай</button>
            <button class="delete-btn" data-id="${prop.id}">Изтрий</button>
            ${isRental ? `<button class="toggle-status-btn" data-id="${prop.id}">${prop.status === "free" ? "Зает" : "Свободен"}</button>` : ''}
          </div>
        </div>
      </div>
    `;

    // Add the same event listeners as in properties.js
    const wishlistBtn = adminFound.querySelector('.wishlist-btn');
    wishlistBtn?.addEventListener('click', async e => {
      e.stopPropagation();
      await toggleWishlist(prop.id); // Make sure toggleWishlist is imported or defined
    });

    const deleteBtn = adminFound.querySelector('.delete-btn');
    deleteBtn?.addEventListener('click', e => {
      e.stopPropagation();
      if (confirm('Наистина ли искате да изтриете този имот?')) {
        deleteProperty(prop.id); // Make sure deleteProperty is imported or defined
      }
    });

    const editBtn = adminFound.querySelector('.edit-btn');
    editBtn?.addEventListener('click', e => {
      e.stopPropagation();
      openEditModal(prop.id); // Make sure openEditModal is imported or defined
    });

    const toggleBtn = adminFound.querySelector('.toggle-status-btn');
    toggleBtn?.addEventListener('click', e => {
      e.stopPropagation();
      toggleRentalStatus(prop.id); // Make sure toggleRentalStatus is imported or defined
    });

  } catch (err) {
    console.error(err);
    adminFound.textContent = 'Грешка при търсене на имота';
  }
});


  // --- View Support Tickets (read-only) ---
  viewSupportBtn?.addEventListener('click', async () => {
    if (!supportMessages) return;

    try {
      const res = await fetch(`${API_URL}/tickets`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();

      supportMessages.innerHTML = (Array.isArray(data) && data.length
        ? data.map(msg => `<div class="support-ticket"><strong>${msg.user}</strong>: ${msg.message}</div>`).join('')
        : 'Няма съобщения'
      );
    } catch (err) {
      console.error(err);
      supportMessages.textContent = 'Грешка при зареждане на съобщения';
    }
  });
});
