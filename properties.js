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

  // Edit modal submission
  const editForm = document.getElementById('editPropertyForm');
  if(editForm){
    editForm.addEventListener('submit', async e => {
      e.preventDefault();
      const modal = document.getElementById('editPropertyModal');
      const id = modal.dataset.propertyId;
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
        modal.setAttribute('aria-hidden','true'); // close modal
        await loadProperties(); // reload
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
      </div>
    `;
  }).join('');

  addEventListeners();
}

// --------------------
// Event listeners for buttons
// --------------------
function addEventListeners() {
  propertyContainer.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      await toggleWishlist(btn.dataset.id);
      await loadProperties();
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
        const property = document.querySelector(`.property[data-id="${id}"]`);
        if(!property) return;

        const modal = document.getElementById('editPropertyModal');
        modal.querySelector('#editPropertyName').value = property.querySelector('h3').innerText;
        modal.querySelector('#editPropertyLocation').value = property.querySelector('p:nth-of-type(1)').innerText.replace('Локация: ','');
        modal.querySelector('#editPropertyPrice').value = property.querySelector('p:nth-of-type(2)').innerText.replace('Цена: ','');
        modal.querySelector('#editPropertyType').value = property.querySelector('p:nth-of-type(4)').innerText.replace('Тип: ','');
        modal.querySelector('#editPropertyCategory').value = property.querySelector('p:nth-of-type(3)').innerText.includes('Наем') ? 'rental' : 'sale';
        
        const statusSelect = modal.querySelector('#editPropertyStatus');
        if(statusSelect){
          const statusText = property.querySelector('p:nth-of-type(5)') ? property.querySelector('p:nth-of-type(5)').innerText.replace('Статус: ','') : 'free';
          statusSelect.value = statusText;
        }

        modal.querySelector('#editPropertyImage').value = '';
        modal.dataset.propertyId = id;
        modal.setAttribute('aria-hidden','false'); // open modal
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
  if(!username || !token){
    wishlistIds = JSON.parse(localStorage.getItem("wishlist") || "[]");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/wishlists/${username}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    wishlistIds = data.items || [];
  } catch(err){
    console.error("Failed to load wishlist:", err);
    wishlistIds = [];
  }
}

export async function toggleWishlist(propertyId){
  if(!username || !token){
    showToast('Трябва да сте влезли!');
    return;
  }

  if(wishlistIds.includes(propertyId)){
    wishlistIds = wishlistIds.filter(id => id !== propertyId);
  } else {
    wishlistIds.push(propertyId);
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlistIds));
  showToast(wishlistIds.includes(propertyId) ? 'Добавено в wishlist!' : 'Премахнато от wishlist');
}

// --------------------
// Admin Actions
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
    const property = JSON.parse(localStorage.getItem('properties')).find(p => p.id === id);
    if(!property) return;

    const newStatus = property.status === 'free' ? 'taken' : 'free';

    const res = await fetch(`${API_URL}/properties/${id}/status`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ status: newStatus })
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    showToast(`Статусът на имота е променен!`);
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

  applyBtn.addEventListener('click', () => {
    let properties = JSON.parse(localStorage.getItem('properties') || '[]');

    const locationFilter = document.getElementById('filterLocation').value.toLowerCase();
    const minPrice = Number(document.getElementById('filterMinPrice').value);
    const maxPrice = Number(document.getElementById('filterMaxPrice').value);
    const typeFilter = document.getElementById('filterType').value;
    const statusFilter = document.getElementById('filterStatus').value;

    properties = properties.filter(p => {
      const price = Number(p.price);
      if(locationFilter && !p.location.toLowerCase().includes(locationFilter)) return false;
      if(!isNaN(minPrice) && price < minPrice) return false;
      if(!isNaN(maxPrice) && price > maxPrice) return false;
      if(typeFilter && p.type !== typeFilter) return false;
      if(p.category === 'rental' && statusFilter && p.status !== statusFilter) return false;
      return true;
    });

    renderProperties(properties);
  });
}

// --------------------
// Init
// --------------------
document.addEventListener('DOMContentLoaded', () => {
  initProperties();
});
