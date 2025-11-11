import { showToast, checkTokenExpired } from './auth.js';
const API_URL = 'https://my-backend.martinmiskata.workers.dev';
const propertiesContainer = document.getElementById('properties');
let wishlistIds = [];

// --- Wishlist helper ---
async function loadWishlist() {
  const username = localStorage.getItem('username');
  if (!username) { wishlistIds = []; return; }

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/wishlists/${username}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (checkTokenExpired(res)) return;
    const data = await res.json();
    wishlistIds = data.items || [];
  } catch {
    wishlistIds = [];
  }
}

async function toggleWishlist(propId) {
  const username = localStorage.getItem('username');
  if (!username) { showToast('Влезте, за да използвате списъка'); return; }

  const token = localStorage.getItem('token');
  const inWishlist = wishlistIds.includes(propId);
  const endpoint = inWishlist ? 'remove' : 'add';
  try {
    const res = await fetch(`${API_URL}/wishlists/${username}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ username, propertyId: propId })
    });
    if (checkTokenExpired(res)) return;
    const data = await res.json();
    if (data.success) {
      wishlistIds = inWishlist ? wishlistIds.filter(id => id !== propId) : [...wishlistIds, propId];
      showToast(inWishlist ? 'Премахнато от списъка' : 'Добавено в списъка');
      updateWishlistButtons();
    } else showToast(data.message || 'Грешка при обновяване на списъка');
  } catch { showToast('Грешка при обновяване на списъка'); }
}

function updateWishlistButtons() {
  document.querySelectorAll('.property').forEach(div => {
    const propId = div.dataset.id;
    const btn = div.querySelector('.wishlist-btn');
    if (!btn) return;
    if (wishlistIds.includes(propId)) { btn.classList.add('added'); btn.style.color='#ff6b6b'; }
    else { btn.classList.remove('added'); btn.style.color='#fff'; }
  });
}

// --- Load Properties ---
export async function loadProperties() {
  if (!propertiesContainer) return;
  await loadWishlist();

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/properties`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (checkTokenExpired(res)) return;
    const properties = await res.json();

    propertiesContainer.innerHTML = '';
    if (!properties.length) { propertiesContainer.innerHTML = '<p>Няма имоти за показване</p>'; return; }

    properties.forEach(prop => {
      const div = document.createElement('div');
      div.className = `property ${prop.status === 'taken' ? 'taken' : ''}`;
      div.dataset.id = prop.id;

      div.innerHTML = `
        ${prop.status ? `<div class="status-badge">${prop.status==='free'?'Свободен':'Зает'}</div>` : ''}
        ${prop.image ? `<img src="${prop.image}" alt="${prop.name}" />` : ''}
        <div class="property-content">
          <h3>${prop.name}</h3>
          <p>${prop.location}</p>
          <p>Цена: ${prop.price} лв/месец</p>
          <p>Тип: ${prop.type}</p>
        </div>
        <button class="wishlist-btn">♥</button>
      `;
      propertiesContainer.appendChild(div);

      const wishlistBtn = div.querySelector('.wishlist-btn');
      wishlistBtn?.addEventListener('click', () => toggleWishlist(prop.id));
    });

    updateWishlistButtons();
  } catch {
    propertiesContainer.innerHTML = '<p>Грешка при зареждане на имотите</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadProperties);
