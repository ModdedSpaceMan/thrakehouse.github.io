// properties.js
import { showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
let wishlistIds = [];
const propertyContainer = document.getElementById('properties');
const propertyModal = document.getElementById("propertyDetailsModal");
const username = localStorage.getItem('username');
const token = localStorage.getItem('token');
const role = localStorage.getItem('role'); // 'admin' or 'user'

let propertiesData = []; // store loaded properties globally

// --------------------
// Initialize
// --------------------
export async function initProperties() {
  await loadWishlist();
  await loadProperties();
  setupFilterListeners();
  window.addEventListener('propertiesUpdated', loadProperties);
}

// --------------------
// Load properties
// --------------------
export async function loadProperties() {
  if (!propertyContainer) return [];

  try {
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    const res = await fetch(`${API_URL}/properties`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    propertiesData = data; // store globally
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
    // Normalize fields with defaults
    const id = p.id ?? '-';
    const name = p.name || 'Без име';
    const price = p.price ?? '-';
    const type = p.type || '-';
    const category = p.category || '-';
    const status = p.status || 'Свободен';
    const bedrooms = p.bedrooms ?? '-';
    const bathrooms = p.bathrooms ?? '-';
    const size = p.size ? p.size + ' m²' : '-';
    const floor = p.floor ?? '-';
    const year = p.year ?? '-';
    const description = p.description || '-';
    const image = p.image || '';

    const isRental = category.toLowerCase() === 'rental';
    const inWishlist = wishlistIds.includes(String(id)) ? '❤️' : '🤍';
    const takenClass = isRental && status.toLowerCase() === 'taken' ? 'taken' : '';

    // Admin buttons
    const adminButtons = role === 'admin' ? `
      <div class="admin-buttons-right">
        <button class="wishlist-btn" data-id="${id}">${inWishlist}</button>
        <button class="delete-btn" data-id="${id}">Изтрий</button>
        ${isRental ? `<button class="toggle-status-btn" data-id="${id}">${status === "free" ? "Зает" : "Свободен"}</button>` : ''}
      </div>
    ` : `<button class="wishlist-btn" data-id="${id}">${inWishlist}</button>`;

    return `
      <div class="property ${takenClass}" data-id="${id}">
        ${image ? `<img src="${image}" alt="${name}">` : ''}
        <div class="property-content">
          <h3>${name}</h3>
          <p>Цена: ${price} лева</p>
          <p>Категория: ${isRental ? "Наем" : "Продажба"}</p>
          <p>Тип: ${type}</p>
          ${isRental ? `<p>Статус: ${status}</p>` : ''}
        </div>
        <div class="property-actions">
          ${adminButtons}
        </div>
        <div class="property-id">ID: ${id}</div>
      </div>
    `;
  }).join('');

  addEventListeners();
  addModalListeners();
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

  applyBtn.addEventListener('click', () => {
    let filtered = propertiesData;

    const locationFilter = document.getElementById('filterLocation')?.value.toLowerCase();
    const minPrice = Number(document.getElementById('filterMinPrice')?.value);
    const maxPrice = Number(document.getElementById('filterMaxPrice')?.value);
    const typeFilter = document.getElementById('filterType')?.value;
    const categoryFilter = document.getElementById('filterCategory')?.value;
    const statusFilter = document.getElementById('filterStatus')?.value;
    const minBedrooms = Number(document.getElementById('filterMinBedrooms')?.value);
    const minBathrooms = Number(document.getElementById('filterMinBathrooms')?.value);
    const minSize = Number(document.getElementById('filterMinSize')?.value);
    const maxSize = Number(document.getElementById('filterMaxSize')?.value);
    const minYear = Number(document.getElementById('filterMinYear')?.value);
    const maxYear = Number(document.getElementById('filterMaxYear')?.value);

    filtered = filtered.filter(p => {
      const price = Number(p.price);
      const bedrooms = Number(p.bedrooms) || 0;
      const bathrooms = Number(p.bathrooms) || 0;
      const size = Number(p.size) || 0;
      const year = Number(p.year) || 0;

      if (locationFilter && !p.location?.toLowerCase().includes(locationFilter)) return false;
      if (!isNaN(minPrice) && price < minPrice) return false;
      if (!isNaN(maxPrice) && price > maxPrice) return false;
      if (typeFilter && p.type !== typeFilter) return false;
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (p.category === 'rental' && statusFilter && p.status !== statusFilter) return false;
      if (!isNaN(minBedrooms) && bedrooms < minBedrooms) return false;
      if (!isNaN(minBathrooms) && bathrooms < minBathrooms) return false;
      if (!isNaN(minSize) && size < minSize) return false;
      if (!isNaN(maxSize) && size > maxSize) return false;
      if (!isNaN(minYear) && year < minYear) return false;
      if (!isNaN(maxYear) && year > maxYear) return false;

      return true;
    });

    renderProperties(filtered);
  });
}

// --------------------
// Property Details Modal
// --------------------
function addModalListeners() {
  propertyContainer.querySelectorAll('.property').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      const property = propertiesData.find(p => p.id == id);
      if (property) openPropertyDetails(property);
      else showToast('Не може да се зареди информация за имота');
    });
  });

  propertyModal.querySelector(".close")?.addEventListener("click", () => {
    propertyModal.style.display = "none";
  });

  propertyModal.addEventListener("click", e => {
    if (e.target === propertyModal) propertyModal.style.display = "none";
  });
}

function openPropertyDetails(property) {
  const titleEl = document.getElementById("propTitle");
  if (titleEl) titleEl.textContent = property.name;

  const priceEl = document.getElementById("propPrice");
  if (priceEl) priceEl.textContent = property.price + " лева";

  const typeEl = document.getElementById("propType");
  if (typeEl) typeEl.textContent = property.type;

  const categoryEl = document.getElementById("propCategory");
  if (categoryEl) categoryEl.textContent = property.category;

  const statusEl = document.getElementById("propStatus");
  if (statusEl) statusEl.textContent = property.status || 'Свободен';

  const bedroomsEl = document.getElementById("propBedrooms");
  if (bedroomsEl) bedroomsEl.textContent = property.bedrooms || '-';

  const bathroomsEl = document.getElementById("propBathrooms");
  if (bathroomsEl) bathroomsEl.textContent = property.bathrooms || '-';

  const areaEl = document.getElementById("propArea");
  if (areaEl) areaEl.textContent = property.size ? property.size + " m²" : '-';

  const floorEl = document.getElementById("propFloor");
  if (floorEl) floorEl.textContent = property.floor || '-';

  const yearEl = document.getElementById("propYear");
  if (yearEl) yearEl.textContent = property.year || '-';

  const descriptionEl = document.getElementById("propDescription");
  if (descriptionEl) descriptionEl.textContent = property.description || '-';

  const imgEl = document.getElementById("propImage");
  if (imgEl) {
    if (property.image) {
      imgEl.src = property.image;
      imgEl.style.display = "block";
    } else {
      imgEl.style.display = "none";
    }
  }

  if (propertyModal) propertyModal.style.display = "flex";
}


// --------------------
// Init
// --------------------
document.addEventListener('DOMContentLoaded', () => {
  initProperties();
});
