// properties.js
import { showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
let wishlistIds = [];
const propertyContainer = document.getElementById('properties');

const username = localStorage.getItem('username');
const token = localStorage.getItem('token');
const role = localStorage.getItem('role'); // 'admin' or 'user'

// --------------------
// Token monitoring
// --------------------
function logoutAndRedirect() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('role');
  window.location.href = '/login.html';
}

function monitorToken() {
  setInterval(() => {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
      logoutAndRedirect();
    }
  }, 3000);
}

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch (err) {
    return true;
  }
}

monitorToken();

// --------------------
// Initialize
// --------------------
export async function initProperties() {
  await loadWishlist();
  await loadProperties();
  setupFilterListeners();
  window.addEventListener('propertiesUpdated', loadProperties);

  // --------------------
  // Edit Property Modal
  // --------------------
  const editModal = document.getElementById('editPropertyModal');
  const editCloseBtn = editModal?.querySelector('.close');
  const editForm = document.getElementById('editPropertyForm');

  if (editCloseBtn) {
    editCloseBtn.addEventListener('click', () => {
      editModal.setAttribute('aria-hidden', 'true');
      editModal.dataset.propertyId = '';
    });
  }

  if (editForm) {
    editForm.addEventListener('submit', async e => {
      e.preventDefault();
      const id = editModal.dataset.propertyId;
      if (!id) return;

      const data = {
        name: editForm.querySelector('#editPropertyName').value,
        location: editForm.querySelector('#editPropertyLocation').value,
        price: editForm.querySelector('#editPropertyPrice').value,
        type: editForm.querySelector('#editPropertyType').value,
        category: editForm.querySelector('#editPropertyCategory').value,
        status: editForm.querySelector('#editPropertyStatus')?.value || 'free'
      };

      try {
        const res = await fetch(`${API_URL}/properties/${id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        showToast('Имотът беше редактиран!');
        editModal.setAttribute('aria-hidden','true');
        editModal.dataset.propertyId = '';
        await loadProperties();
      } catch (err) {
        console.error(err);
        showToast('Грешка при редактиране на имота');
      }
    });
  }
}

// --------------------
// Open edit modal helper
// --------------------
function openEditModal(propertyId) {
  const propertyCard = document.querySelector(`.property[data-id="${propertyId}"]`);
  const editModal = document.getElementById('editPropertyModal');
  if (!propertyCard || !editModal) return;

  editModal.querySelector('#editPropertyName').value = propertyCard.querySelector('h3').innerText;
  editModal.querySelector('#editPropertyLocation').value = propertyCard.querySelector('p:nth-of-type(1)').innerText.replace('Локация: ','');
  editModal.querySelector('#editPropertyPrice').value = propertyCard.querySelector('p:nth-of-type(2)').innerText.replace('Цена: ','');
  editModal.querySelector('#editPropertyType').value = propertyCard.querySelector('p:nth-of-type(4)').innerText.replace('Тип: ','');
  editModal.querySelector('#editPropertyCategory').value = propertyCard.querySelector('p:nth-of-type(3)').innerText.includes('Наем') ? 'rental' : 'sale';

  const statusSelect = editModal.querySelector('#editPropertyStatus');
  if (statusSelect) {
    const statusText = propertyCard.querySelector('p:nth-of-type(5)') 
      ? propertyCard.querySelector('p:nth-of-type(5)').innerText.replace('Статус: ','') 
      : 'free';
    statusSelect.value = statusText;
  }

  editModal.querySelector('#editPropertyImage').value = '';
  editModal.dataset.propertyId = propertyId;
  editModal.setAttribute('aria-hidden','false');
}

// --------------------
// Load properties
// --------------------
export async function loadProperties() {
  if (!propertyContainer) return;

  try {
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    const res = await fetch(`${API_URL}/properties`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    renderProperties(data);
    return data;
  } catch (err) {
    console.error('Грешка при зареждане на имоти:', err);
    propertyContainer.innerHTML = '<p>Грешка при зареждане на имоти.</p>';
    return [];
  }
}

// --------------------
// Render property cards
// --------------------
export function renderProperties(properties) {
  if (!propertyContainer) return;

  if (!properties.length) {
    propertyContainer.innerHTML = '<p>Няма налични имоти.</p>';
    return;
  }

  propertyContainer.innerHTML = properties.map(p => {
    const isRental = p.category === 'rental';
    const inWishlist = wishlistIds.includes(p.id) ? '❤️' : '🤍';
    const takenClass = isRental && p.status?.toLowerCase() === 'taken' ? 'taken' : '';

    const adminButtons = role === 'admin' ? `
      <div class="admin-buttons-right">
        <button class="wishlist-btn" data-id="${p.id}">${inWishlist}</button>
        <button class="edit-btn" data-id="${p.id}">Редактирай</button>
        <button class="delete-btn" data-id="${p.id}">Изтрий</button>
        ${isRental ? `<button class="toggle-status-btn" data-id="${p.id}">${p.status === "free" ? "Зает" : "Свободен"}</button>` : ''}
      </div>
    ` : `<button class="wishlist-btn" data-id="${p.id}">${inWishlist}</button>`;

    return `
      <div class="property ${takenClass}" data-id="${p.id}">
        ${p.image ? `<img src="${p.image}" alt="${p.name}">` : ''}
        <div class="property-content">
          <h3>${p.name}</h3>
          <p>Локация: ${p.location}</p>
          <p>Цена: ${p.price}</p>
          <p>Категория: ${isRental ? "Наем" : "Продажба"}</p>
          <p>Тип: ${p.type}</p>
          ${isRental ? `<p>Статус: ${p.status}</p>` : ''}
        </div>
        <div class="property-actions">
          ${adminButtons}
        </div>
      </div>
    `;
  }).join('');

  addEventListeners();
}

// --------------------
// Event listeners
// --------------------
function addEventListeners() {
  propertyContainer.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      await toggleWishlist(btn.dataset.id);
      await loadProperties();
    });
  });

  if (role === 'admin') {
    propertyContainer.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (confirm('Наистина ли искате да изтриете този имот?')) {
          deleteProperty(id);
        }
      });
    });

    propertyContainer.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        openEditModal(btn.dataset.id);
      });
    });

    propertyContainer.querySelectorAll('.toggle-status-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        toggleRentalStatus(btn.dataset.id);
      });
    });
  }
}

// --------------------
// Wishlist
// --------------------
export async function loadWishlist() {
  if (!username || !token) {
    wishlistIds = JSON.parse(localStorage.getItem("wishlist") || "[]");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/wishlists/${username}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    wishlistIds = data.items || [];
  } catch (err) {
    console.error("Failed to load wishlist:", err);
    wishlistIds = [];
  }
}

export async function toggleWishlist(propertyId) {
  if (!username || !token) {
    showToast('Трябва да сте влезли!');
    return;
  }

  if (wishlistIds.includes(propertyId)) {
    wishlistIds = wishlistIds.filter(id => id !== propertyId);
  } else {
    wishlistIds.push(propertyId);
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlistIds));
  showToast(wishlistIds.includes(propertyId) ? 'Добавено в wishlist!' : 'Премахнато от wishlist');
}

// --------------------
// Admin Actions
// --------------------
async function deleteProperty(id) {
  try {
    const res = await fetch(`${API_URL}/properties/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    showToast('Имотът беше изтрит!');
    await loadProperties();
  } catch (err) {
    console.error(err);
    showToast('Грешка при изтриване на имота');
  }
}

async function toggleRentalStatus(id) {
  try {
    const property = JSON.parse(localStorage.getItem('properties') || '[]').find(p => p.id === id);
    if (!property) return;

    const newStatus = property.status === 'free' ? 'taken' : 'free';

    const res = await fetch(`${API_URL}/properties/${id}/status`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    showToast(`Статусът на имота е променен!`);
    await loadProperties();
  } catch (err) {
    console.error(err);
    showToast('Грешка при промяна на статуса');
  }
}

// --------------------
// Filters
// --------------------
function setupFilterListeners() {
  const applyBtn = document.getElementById('applyFilters');
  if (!applyBtn) return;

  applyBtn.addEventListener('click', () => {
    let properties = JSON.parse(localStorage.getItem('properties') || '[]');

    const locationFilter = document.getElementById('filterLocation').value.toLowerCase();
    const minPrice = Number(document.getElementById('filterMinPrice').value);
    const maxPrice = Number(document.getElementById('filterMaxPrice').value);
    const typeFilter = document.getElementById('filterType').value;
    const statusFilter = document.getElementById('filterStatus').value;

    properties = properties.filter(p => {
      const price = Number(p.price);
      if (locationFilter && !p.location.toLowerCase().includes(locationFilter)) return false;
      if (!isNaN(minPrice) && price < minPrice) return false;
      if (!isNaN(maxPrice) && price > maxPrice) return false;
      if (typeFilter && p.type !== typeFilter) return false;
      if (p.category === 'rental' && statusFilter && p.status !== statusFilter) return false;
      return true;
    });

    renderProperties(properties);
  });
}

// --------------------
// Init
// --------------------
document.addEventListener('DOMContentLoaded', () => {
  initProperties();
});
