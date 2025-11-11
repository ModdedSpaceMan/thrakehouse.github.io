import { showToast } from './ui.js';
const API_URL = 'https://my-backend.martinmiskata.workers.dev';
const propertiesContainer = document.getElementById('properties');
let wishlistIds = [];

// --- Helpers ---
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');
  if (!options.headers) options.headers = {};
  if (token) options.headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, options);
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    alert('Сесията ви е изтекла. Моля, влезте отново.');
    window.location.href = '/login.html';
    throw new Error('Session expired');
  }
  return res.json();
}

// --- Wishlist ---
async function loadWishlist() {
  const username = localStorage.getItem('username');
  if (!username) { wishlistIds = []; return; }
  try {
    const data = await fetchWithAuth(`${API_URL}/wishlists/${username}`);
    wishlistIds = data.items || [];
  } catch (err) {
    console.error(err);
    wishlistIds = [];
  }
}

async function toggleWishlist(propId) {
  const username = localStorage.getItem('username');
  if (!username) { showToast('Влезте, за да използвате списъка'); return; }

  const inWishlist = wishlistIds.includes(propId);
  const endpoint = inWishlist ? 'remove' : 'add';

  try {
    const data = await fetchWithAuth(`${API_URL}/wishlists/${username}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ propertyId: propId })
    });

    if (data.success) {
      if (inWishlist) {
        wishlistIds = wishlistIds.filter(id => id !== propId);
        showToast('Премахнато от списъка');
      } else {
        wishlistIds.push(propId);
        showToast('Добавено в списъка');
      }
      updateWishlistButtons();
    } else {
      showToast(data.message || 'Грешка при обновяване на списъка');
    }
  } catch (err) {
    console.error(err);
    showToast('Грешка при обновяване на списъка');
  }
}

function updateWishlistButtons() {
  document.querySelectorAll('.property').forEach(div => {
    const propId = div.dataset.id;
    const btn = div.querySelector('.wishlist-btn');
    if (!btn) return;
    if (wishlistIds.includes(propId)) {
      btn.classList.add('added');
      btn.style.color = '#ff6b6b';
    } else {
      btn.classList.remove('added');
      btn.style.color = '#fff';
    }
  });
}

// --- Load properties ---
export async function loadProperties() {
  if (!propertiesContainer) return;
  await loadWishlist();

  try {
    const properties = await fetchWithAuth(`${API_URL}/properties`);
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
        <div class="admin-buttons-right" style="display:${localStorage.getItem('role')==='admin'?'flex':'none'};">
          <button class="admin-btn edit-btn">Редактирай</button>
          <button class="admin-btn delete-btn">Изтрий</button>
          <button class="admin-btn toggle-btn">${prop.status==='free'?'Свободен':'Зает'}</button>
        </div>
        <button class="wishlist-btn">♥</button>
      `;
      propertiesContainer.appendChild(div);

      const deleteBtn = div.querySelector('.delete-btn');
      const editBtn = div.querySelector('.edit-btn');
      const toggleBtn = div.querySelector('.toggle-btn');
      const wishlistBtn = div.querySelector('.wishlist-btn');

      deleteBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!prop.id) return;
        if (!confirm(`Сигурни ли сте, че искате да изтриете "${prop.name}"?`)) return;
        try {
          await fetchWithAuth(`${API_URL}/properties/${prop.id}`, { method:'DELETE' });
          div.remove();
          showToast('Имотът е изтрит');
        } catch (err) { console.error(err); showToast('Грешка при изтриване на имота'); }
      });

      editBtn?.addEventListener('click', (e) => { e.stopPropagation(); openEditModal(prop); });

      toggleBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!prop.id) return;
        const newStatus = prop.status==='free'?'taken':'free';
        try {
          const data = await fetchWithAuth(`${API_URL}/properties/${prop.id}`, {
            method:'PUT',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ property: {...prop, status:newStatus} })
          });
          if (!data.success) throw new Error('Неуспешно обновяване');
          prop.status = newStatus;
          toggleBtn.textContent = newStatus==='free'?'Свободен':'Зает';
          const badge = div.querySelector('.status-badge');
          if(badge) badge.textContent = newStatus==='free'?'Свободен':'Зает';
          div.classList.toggle('taken', newStatus==='taken');
        } catch(err) { console.error(err); showToast('Грешка при обновяване на статуса'); }
      });

      wishlistBtn?.addEventListener('click', (e) => { e.stopPropagation(); toggleWishlist(prop.id); });
    });

    updateWishlistButtons();
  } catch(err) {
    console.error(err);
    propertiesContainer.innerHTML = '<p>Грешка при зареждане на имотите</p>';
  }
}

// --- Edit modal logic (remains same) ---
export function openEditModal(property) { /* ... same as before ... */ }

// --- Init ---
document.addEventListener('DOMContentLoaded', loadProperties);
