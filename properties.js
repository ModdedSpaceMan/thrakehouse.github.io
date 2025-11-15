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
  await loadWishlist();
  await loadProperties();
  setupFilterListeners();
  window.addEventListener('propertiesUpdated', loadProperties);
  setupEditModal();
}

function closeEditModal() {
  const editModal = document.getElementById('editPropertyModal');
  const editForm = document.getElementById('editPropertyForm');
  if (!editModal || !editForm) return;

  editModal.setAttribute('aria-hidden', 'true');
  editModal.dataset.propertyId = '';
  editForm.reset();
}


// --------------------
// Edit modal setup
// --------------------
function setupEditModal() {
  const editModal = document.getElementById('editPropertyModal');
  const editForm = document.getElementById('editPropertyForm');
  if (!editModal || !editForm) return;

  const editCloseBtn = editModal.querySelector('.close');

  // Close modal
  const closeModal = () => {
    editModal.setAttribute('aria-hidden', 'true');
    editModal.dataset.propertyId = '';
    editForm.reset();
  };

  if (editCloseBtn) editCloseBtn.addEventListener('click', closeModal);

  // Open modal with property data
  window.openEditModal = async function(propertyId) {
    try {
      const res = await fetch(`${API_URL}/properties/${propertyId}`, {
        headers: token ? { 'Authorization': 'Bearer ' + token } : {}
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const property = await res.json();

      editModal.dataset.propertyId = property.id;
      editForm.editPropertyName.value = property.name || '';
      editForm.editPropertyLocation.value = property.location || '';
      editForm.editPropertyPrice.value = property.price || '';
      editForm.editPropertyType.value = property.type || '';
      editForm.editPropertyCategory.value = property.category || '';
      editForm.editPropertyStatus.value = property.status || 'free';

      editModal.setAttribute('aria-hidden', 'false');
    } catch (err) {
      console.error('Failed to load property for editing:', err);
      showToast('Грешка при зареждане на имота');
    }
  };

  // Submit modal form
  editForm.addEventListener('submit', async e => {
    e.preventDefault();
    const id = editModal.dataset.propertyId;
    if (!id) return showToast('Property ID missing');

    const formData = Object.fromEntries(new FormData(editForm).entries());
    const data = {
      name: formData.editPropertyName,
      location: formData.editPropertyLocation,
      price: parseFloat(formData.editPropertyPrice) || 0,
      type: formData.editPropertyType,
      category: formData.editPropertyCategory,
      status: formData.editPropertyStatus || 'free'
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
      closeModal();
      await loadProperties();
    } catch (err) {
      console.error(err);
      showToast('Грешка при редактиране на имота');
    }
  });
}



// --------------------
// Open edit modal
// --------------------
function openEditModal(id) {
  const editModal = document.getElementById('editPropertyModal');
  const editForm = document.getElementById('editPropertyForm');
  if (!editModal || !editForm) return;

  editModal.dataset.propertyId = id;

  fetch(`${API_URL}/properties/${id}`, {
    headers: token ? { 'Authorization': 'Bearer ' + token } : {}
  })
    .then(res => res.json())
    .then(p => {
      document.getElementById('editPropertyName').value = p.name || '';
      document.getElementById('editPropertyLocation').value = p.location || '';
      document.getElementById('editPropertyPrice').value = p.price || '';
      document.getElementById('editPropertyType').value = p.type || '';
      document.getElementById('editPropertyCategory').value = p.category || '';
      const statusField = document.getElementById('editPropertyStatus');
      if (statusField) statusField.value = p.status || 'free';

      editModal.setAttribute('aria-hidden', 'false');
    })
    .catch(err => {
      console.error('Failed to load property for editing:', err);
      showToast('Грешка при зареждане на имота');
    });
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
// Render properties
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
// Wishlist
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

    const propsRes = await fetch(`${API_URL}/properties`);
    const properties = await propsRes.json();
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

    if (action === 'add') wishlistIds.push(propertyId);
    else wishlistIds = wishlistIds.filter(id => id !== propertyId);

    showToast(action === 'add' ? 'Добавено в wishlist!' : 'Премахнато от wishlist');

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
    const res = await fetch(`${API_URL}/properties/${id}/status`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ status: 'toggle' })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    showToast('Статусът на имота е променен!');
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
      if (locationFilter && !p.location.toLowerCase().includes(locationFilter)) return false;
      if (!isNaN(minPrice) && price < minPrice) return false;
      if (!isNaN(maxPrice) && price > maxPrice) return false;
      if (typeFilter && p.type !== typeFilter) return false;
      if (p.category === 'rental' && statusFilter && p.status !== statusFilter) return false;
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
