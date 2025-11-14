// properties.js
import { showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
let wishlistIds = [];
const propertyContainer = document.getElementById('properties');

const username = localStorage.getItem('username');
const token = localStorage.getItem('token');
const role = localStorage.getItem('role'); // 'admin' or 'user'

// --------------------
// Initialize
// --------------------
export async function initProperties() {
  await loadWishlist();      // ensure wishlist loaded first
  await loadProperties();    // then render properties
  setupFilterListeners();
  window.addEventListener('propertiesUpdated', loadProperties);

  setupEditModal();
}

// --------------------
// Edit modal setup
// --------------------
function setupEditModal() {
  const editModal = document.getElementById('editPropertyModal');
  const editCloseBtn = editModal?.querySelector('.close');
  const editForm = document.getElementById('editPropertyForm');

  if(editCloseBtn){
    editCloseBtn.addEventListener('click', () => {
      editModal.setAttribute('aria-hidden', 'true');
      editModal.dataset.propertyId = '';
    });
  }

  if(editForm){
    editForm.addEventListener('submit', async e => {
      e.preventDefault();
      const id = editModal.dataset.propertyId;
      if(!id) return;

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

        if(!res.ok) throw new Error(`HTTP ${res.status}`);

        showToast('Имотът беше редактиран!');
        editModal.setAttribute('aria-hidden','true');
        editModal.dataset.propertyId = '';
        await loadProperties();
      } catch(err){
        console.error(err);
        showToast('Грешка при редактиране на имота');
      }
    });
  }
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
        <!-- ID Badge -->
        <div class="property-id">ID: ${p.id}</div>
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
        const id = btn.dataset.id;
        openEditModal(id);
      });
    });

    propertyContainer.querySelectorAll('.toggle-status-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.id;
        toggleRentalStatus(id);
      });
    });
  }
}

// --------------------
// Wishlist functions
// --------------------
export async function loadWishlist() {
  if (!username || !token) {
    wishlistIds = [];
    return;
  }

  try {
    const res = await fetch(`${API_URL}/wishlists/${username}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Remove deleted properties
    const propertiesRes = await fetch(`${API_URL}/properties`);
    const properties = await propertiesRes.json();
    const validIds = properties.map(p => p.id);

    wishlistIds = (data.items || []).filter(id => validIds.includes(id));
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

  const action = wishlistIds.includes(propertyId) ? 'remove' : 'add';

  try {
    const res = await fetch(`${API_URL}/wishlists/${username}/${action}`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ propertyId })
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Грешка при wishlist');

    // Update memory state
    if (action === 'add') wishlistIds.push(propertyId);
    else wishlistIds = wishlistIds.filter(id => id !== propertyId);

    showToast(action === 'add' ? 'Добавено в wishlist!' : 'Премахнато от wishlist');

    // Update just the button
    const btn = document.querySelector(`.wishlist-btn[data-id="${propertyId}"]`);
    if (btn) btn.textContent = wishlistIds.includes(propertyId) ? '❤️' : '🤍';

  } catch (err) {
    console.error(err);
    showToast('Грешка при връзка със сървъра');
  }
}

// --------------------
// Admin actions
// --------------------
async function deleteProperty(id){
  try{
    const res = await fetch(`${API_URL}/properties/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    showToast('Имотът беше изтрит!');
    await loadProperties();
  } catch(err){
    console.error(err);
    showToast('Грешка при изтриване на имота');
  }
}

async function toggleRentalStatus(id){
  try{
    const res = await fetch(`${API_URL}/properties/${id}/status`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ status: 'toggle' })
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    showToast('Статусът на имота е променен!');
    await loadProperties();
  } catch(err){
    console.error(err);
    showToast('Грешка при промяна на статуса');
  }
}

// --------------------
// Filters
// --------------------
function setupFilterListeners(){
  const applyBtn = document.getElementById('applyFilters');
  if(!applyBtn) return;

  applyBtn.addEventListener('click', async () => {
    const properties = await loadProperties();
    let filtered = properties;

    const locationFilter = document.getElementById('filterLocation').value.toLowerCase();
    const minPrice = Number(document.getElementById('filterMinPrice').value);
    const maxPrice = Number(document.getElementById('filterMaxPrice').value);
    const typeFilter = document.getElementById('filterType').value;
    const statusFilter = document.getElementById('filterStatus').value;

    filtered = filtered.filter(p => {
      const price = Number(p.price);
      if(locationFilter && !p.location.toLowerCase().includes(locationFilter)) return false;
      if(!isNaN(minPrice) && price < minPrice) return false;
      if(!isNaN(maxPrice) && price > maxPrice) return false;
      if(typeFilter && p.type !== typeFilter) return false;
      if(p.category === 'rental' && statusFilter && p.status !== statusFilter) return false;
      return true;
    });

    renderProperties(filtered);
  });
}

// --------------------
// Init
// --------------------
document.addEventListener('DOMContentLoaded', () => {
  initProperties();
});
