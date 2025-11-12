import { showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
let wishlistIds = [];
const propertyContainer = document.getElementById('properties');

// Initialize everything
export async function initProperties() {
  await loadWishlist();
  await loadProperties();
  setupFilterListeners();

  // Re-render when properties updated via forms
  window.addEventListener("propertiesUpdated", loadProperties);
}

// Fetch all properties and render
export async function loadProperties() {
  if (!propertyContainer) return;

  try {
    // Here we read from localStorage for demo; replace with fetch if needed
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
      <div class="property ${takenClass}">
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
    btn.addEventListener('click', async () => {
      await toggleWishlist(btn.dataset.id);
      await loadProperties();
    });
  });

  propertyContainer.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });

  propertyContainer.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteProperty(btn.dataset.id));
  });

  propertyContainer.querySelectorAll('.toggle-status-btn').forEach(btn => {
    btn.addEventListener('click', () => togglePropertyStatus(btn.dataset.id));
  });
}

// Wishlist
export async function loadWishlist() {
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
  if (!username || !token) { wishlistIds = []; return; }

  try {
    const res = await fetch(`${API_URL}/wishlists/${username}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    wishlistIds = data.items || [];
  } catch { wishlistIds = []; }
}

export async function toggleWishlist(propertyId) {
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
  if (!username || !token) { showToast('Трябва да сте влезли!'); return; }

  const properties = JSON.parse(localStorage.getItem("properties") || "[]");
  const prop = properties.find(p => p.id === propertyId);
  if (!prop) return;

  if (wishlistIds.includes(propertyId)) {
    wishlistIds = wishlistIds.filter(id => id !== propertyId);
  } else {
    wishlistIds.push(propertyId);
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlistIds));
  showToast(wishlistIds.includes(propertyId) ? 'Добавено в wishlist!' : 'Премахнато от wishlist');
}

// Delete property
function deleteProperty(id) {
  let properties = JSON.parse(localStorage.getItem("properties") || "[]");
  properties = properties.filter(p => p.id !== id);
  localStorage.setItem("properties", JSON.stringify(properties));
  window.dispatchEvent(new Event("propertiesUpdated"));
}

// Toggle rental status
function togglePropertyStatus(id) {
  let properties = JSON.parse(localStorage.getItem("properties") || "[]");
  properties = properties.map(p => {
    if (p.id === id && p.category === "rental") {
      p.status = p.status === "free" ? "taken" : "free";
    }
    return p;
  });
  localStorage.setItem("properties", JSON.stringify(properties));
  window.dispatchEvent(new Event("propertiesUpdated"));
}

// Edit modal opener
function openEditModal(id) {
  const prop = JSON.parse(localStorage.getItem("properties") || "[]").find(p => p.id === id);
  if (!prop) return;

  const modal = document.getElementById("editModal");
  modal.setAttribute("aria-hidden", "false");
  const form = document.getElementById("editForm");
  form.dataset.propertyId = id;

  document.getElementById("editName").value = prop.name;
  document.getElementById("editLocation").value = prop.location;
  document.getElementById("editPrice").value = prop.price;
  document.getElementById("editCategory").value = prop.category;
  document.getElementById("editType").value = prop.type;
  document.getElementById("editStatus").value = prop.status || "";
  document.getElementById("editImage").value = prop.image || "";
  document.getElementById("editStatusLabel").style.display = prop.category === "rental" ? "block" : "none";
}

// Filters
function setupFilterListeners() {
  const applyBtn = document.getElementById('applyFilters');
  if (!applyBtn) return;

  applyBtn.addEventListener('click', async () => {
    let properties = JSON.parse(localStorage.getItem("properties") || "[]");

    const locationFilter = document.getElementById('filterLocation').value.toLowerCase();
    const minPrice = Number(document.getElementById('filterMinPrice').value);
    const maxPrice = Number(document.getElementById('filterMaxPrice').value);
    const typeFilter = document.getElementById('filterType').value;
    const freeChecked = document.getElementById('filterFree').checked;
    const takenChecked = document.getElementById('filterTaken').checked;

    properties = properties.filter(p => {
      const price = Number(p.price);
      if (locationFilter && !p.location.toLowerCase().includes(locationFilter)) return false;
      if (!isNaN(minPrice) && price < minPrice) return false;
      if (!isNaN(maxPrice) && price > maxPrice) return false;
      if (typeFilter && p.type !== typeFilter) return false;

      if (p.category === "rental") {
        if (freeChecked && p.status !== 'free') return false;
        if (takenChecked && p.status !== 'taken') return false;
      }

      return true;
    });

    renderProperties(properties);
  });
}
document.addEventListener('DOMContentLoaded', () => {
  initProperties();
});
