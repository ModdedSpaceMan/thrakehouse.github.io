// wishlist.js
import { username, showToast } from './ui.js';
import { loadProperties } from './properties.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
let wishlistIds = [];

const wishlistBtn = document.getElementById('wishlistBtn');
const wishlistModal = document.getElementById('wishlistModal');
const wishlistContent = document.getElementById('wishlistContent');
const closeWishlist = document.getElementById('closeWishlist');

export async function loadWishlist(render = true) {
  if (!username) {
    if (render) wishlistContent.innerHTML = '<p>Влезте, за да видите списъка</p>';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/wishlists/${username}`);
    const data = await res.json().catch(() => ({ items: [] }));
    wishlistIds = Array.isArray(data.items) ? data.items : [];

    if (!wishlistIds.length) {
      if (render) wishlistContent.innerHTML = '<p>Списъкът е празен</p>';
      return;
    }

    const pres = await fetch(`${API_URL}/properties`);
    const props = await pres.json();
    const properties = Array.isArray(props) ? props : [];

    if (!render) return;

    wishlistContent.innerHTML = '';
    wishlistIds.forEach(id => {
      const p = properties.find(x => x.id === id);
      const row = document.createElement('div');
      row.className = 'wish-item';
      if (!p) {
        row.innerHTML = `<div class="wish-meta"><strong>ID:</strong> ${id}</div>
                         <p>Имот е изтрит или недостъпен</p>
                         <button onclick="removeFromWishlist('${id}')">Премахни</button>`;
      } else {
        row.innerHTML = `<img src="${p.image||''}" class="wish-thumb"/>
                         <div class="wish-meta">
                           <strong>${p.name||''}</strong>
                           <p>${p.location||''} • ${p.price||''}</p>
                         </div>
                         <button onclick="removeFromWishlist('${p.id}')">Премахни</button>`;
      }
      wishlistContent.appendChild(row);
    });
  } catch {
    if (render) wishlistContent.innerHTML = '<p>Списъкът е празен</p>';
    showToast('Грешка при зареждане на списъка');
  }
}

export async function addToWishlist(propertyId) {
  if (!username) { showToast('Влезте, за да добавяте в списък'); return; }
  try {
    const res = await fetch(`${API_URL}/wishlists/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, propertyId })
    });
    const json = await res.json();
    showToast(json.success ? 'Добавено в списъка' : 'Вече е в списъка');
    loadWishlist();
    loadProperties();
  } catch {
    showToast('Грешка при добавяне');
  }
}

export async function removeFromWishlist(propertyId) {
  if (!username) { showToast('Влезте, за да премахвате'); return; }
  try {
    const res = await fetch(`${API_URL}/wishlists/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, propertyId })
    });
    const json = await res.json();
    if (json.success) {
      showToast('Премахнато от списъка');
      loadWishlist();
      loadProperties();
    } else showToast(json.message || 'Грешка при премахване');
  } catch {
    showToast('Грешка при премахване');
  }
}

// Wishlist modal events
wishlistBtn.addEventListener('click', async () => {
  openModal(wishlistModal);
  await loadWishlist();
});
closeWishlist.addEventListener('click', () => closeModal(wishlistModal));

function openModal(modal) { if(modal) modal.setAttribute('aria-hidden', 'false'); }
function closeModal(modal) { if(modal) modal.setAttribute('aria-hidden', 'true'); }
