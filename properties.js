import { showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
let wishlistIds = [];
const propertyContainer = document.getElementById('properties');

// Initialize everything
export async function initProperties() {
  await loadWishlist();
  await loadProperties();
  setupFilterListeners();
}

// Fetch all properties and render
export async function loadProperties() {
  if (!propertyContainer) return;

  try {
    const res = await fetch(`${API_URL}/properties`, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });
    const data = await res.json();

    if (!Array.isArray(data)) {
      console.warn('Properties response is not an array:', data);
      propertyContainer.innerHTML = '<p>Няма налични имоти.</p>';
      return [];
    }

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

  propertyContainer.innerHTML = properties.map(p => {
    const takenClass = p.status?.toLowerCase() === 'taken' ? 'taken' : '';
    const inWishlist = wishlistIds.includes(p.id) ? '❤️' : '🤍';

    return `
      <div class="property ${takenClass}">
        ${p.image ? `<img src="${p.image}" alt="${p.name}">` : ''}
        <div class="property-content">
          <h3>${p.name}</h3>
          <p>Локация: ${p.location}</p>
          <p>Цена: ${p.price}</p>
          <p>Тип: ${p.type}</p>
          <p>Статус: ${p.status}</p>
        </div>
        <button class="wishlist-btn" data-id="${p.id}">${inWishlist}</button>
      </div>
    `;
  }).join('');

  // Add click listeners for wishlist buttons
  propertyContainer.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await toggleWishlist(btn.dataset.id);
      await loadProperties(); // re-render after toggle
    });
  });
}

// Load wishlist for the current user
export async function loadWishlist() {
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');

  if (!username || !token) {
    wishlistIds = [];
    return;
  }

  try {
    const res = await fetch(`${API_URL}/wishlists/${username}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    wishlistIds = data.items || [];
  } catch (err) {
    console.error('Грешка при зареждане на wishlist:', err);
    wishlistIds = [];
  }
}

// Toggle property in wishlist
export async function toggleWishlist(propertyId) {
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');

  if (!username || !token) {
    showToast('Трябва да сте влезли, за да добавите в wishlist');
    return;
  }

  const action = wishlistIds.includes(propertyId) ? 'remove' : 'add';

  try {
    const res = await fetch(`${API_URL}/wishlists/${username}/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ propertyId })
    });

    const data = await res.json();
    if (data.success) {
      if (action === 'add') wishlistIds.push(propertyId);
      else wishlistIds = wishlistIds.filter(id => id !== propertyId);

      showToast(action === 'add' ? 'Добавено в wishlist!' : 'Премахнато от wishlist');
    }
  } catch (err) {
    console.error(err);
    showToast('Грешка при добавяне/премахване на wishlist');
  }
}

// Optional: filter handling (if you implement filters)
function setupFilterListeners() {
  const applyBtn = document.getElementById('applyFilters');
  if (!applyBtn) return;

  applyBtn.addEventListener('click', async () => {
    let properties = await loadProperties();
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
      if (freeChecked && p.status.toLowerCase() !== 'free') return false;
      if (takenChecked && p.status.toLowerCase() !== 'taken') return false;
      return true;
    });

    renderProperties(properties);
  });
}
