import { showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
let wishlistIds = [];
const propertyContainer = document.getElementById('properties');

// Initialize everything
export async function initProperties() {
  await loadWishlist();
  await loadProperties();
  setupFilterListeners();

  window.addEventListener("propertiesUpdated", loadProperties);
}

// Load properties (from localStorage for demo)
export async function loadProperties() {
  if (!propertyContainer) return;

  try {
    const data = JSON.parse(localStorage.getItem("properties") || "[]");
    renderProperties(data);
    return data;
  } catch (err) {
    console.error('Грешка при зареждане на имоти:', err);
    propertyContainer.innerHTML = '<p>Грешка при зареждане на имоти.</p>';
    return [];
  }
}

// Render property cards
export function renderProperties(properties) {
  if (!propertyContainer) return;

  if (!properties.length) {
    propertyContainer.innerHTML = '<p>Няма налични имоти.</p>';
    return;
  }

  propertyContainer.innerHTML = properties.map(p => {
    const isRental = p.category === "rental";
    const inWishlist = wishlistIds.includes(p.id) ? '❤️' : '🤍';
    const takenClass = isRental && p.status?.toLowerCase() === 'taken' ? 'taken' : '';

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
          <button class="wishlist-btn" data-id="${p.id}">${inWishlist}</button>
          <button class="edit-btn" data-id="${p.id}">Редактирай</button>
          <button class="delete-btn" data-id="${p.id}">Изтрий</button>
          ${isRental ? `<button class="toggle-status-btn" data-id="${p.id}">${p.status === "free" ? "Зает" : "Свободен"}</button>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Add click listeners
  propertyContainer.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      await toggleWishlist(btn.dataset.id);
      await loadProperties();
    });
  });
}

// Load wishlist from backend (if logged in)
export async function loadWishlist() {
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');

  if (!username || !token) {
    console.warn("User not logged in — skipping wishlist fetch.");
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

// Toggle wishlist
export async function toggleWishlist(propertyId) {
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
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
// Filters
// --------------------
function setupFilterListeners() {
  const applyBtn = document.getElementById('applyFilters');
  if (!applyBtn) return;

  applyBtn.addEventListener('click', () => {
    let properties = JSON.parse(localStorage.getItem("properties") || "[]");

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
      if (p.category === "rental" && statusFilter) {
        if (p.status !== statusFilter) return false;
      }
      return true;
    });

    renderProperties(properties);
  });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  initProperties();
});
