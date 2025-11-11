import { showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
export let wishlistIds = [];

// Get the container where properties will be shown
const propertyContainer = document.getElementById('property'); // <-- make sure your HTML has this div

// Load all properties
export async function loadProperties() {
  try {
    const res = await fetch(`${API_URL}/properties`, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    renderProperties(data); // render as soon as we fetch
    return data;
  } catch (err) {
    console.error('Грешка при зареждане на имоти:', err);
    return [];
  }
}

// Render properties into the container
export function renderProperties(properties) {
  if (!propertyContainer) return;

  propertyContainer.innerHTML = properties.map(p => {
    const takenClass = p.status === 'Taken' ? 'taken' : '';
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
        <div class="property-id">${p.id}</div>
      </div>
    `;
  }).join('');

  // Add wishlist button event listeners
  propertyContainer.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleWishlist(btn.dataset.id).then(() => loadProperties()));
  });
}

// Load wishlist for logged-in user
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
