import { showToast } from './ui.js';
import { loadWishlist, toggleWishlist, wishlistIds } from './wishlist.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
const propertyContainer = document.getElementById('properties');

// Init properties
export async function initProperties() {
  await loadWishlist();
  await loadProperties();
  setupFilterListeners();
  window.addEventListener('propertiesUpdated', loadProperties);
}

// Fetch properties
export async function loadProperties() {
  if (!propertyContainer) return;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/properties`, {
      headers: token ? { 'Authorization': 'Bearer ' + token } : {}
    });
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    renderProperties(data);
    return data;
  } catch (err) {
    console.error(err);
    propertyContainer.innerHTML = '<p>Грешка при зареждане на имоти.</p>';
    return [];
  }
}

// Render properties
export function renderProperties(properties) {
  if (!propertyContainer) return;
  if (!properties.length) {
    propertyContainer.innerHTML = '<p>Няма налични имоти.</p>';
    return;
  }

  propertyContainer.innerHTML = properties.map(p => {
    const isRental = p.category === 'rental';
    const takenClass = isRental && p.status?.toLowerCase() === 'taken' ? 'taken' : '';
    return `
      <div class="property ${takenClass}" data-id="${p.id}">
        ${p.image ? `<img src="${p.image}" alt="${p.name}">` : ''}
        <div class="property-content">
          <h3>${p.name}</h3>
          <p>Локация: ${p.location}</p>
          <p>Цена: ${p.price}</p>
          <p>Категория: ${isRental ? 'Наем' : 'Продажба'}</p>
          <p>Тип: ${p.type}</p>
          ${isRental ? `<p>Статус: ${p.status}</p>` : ''}
        </div>
      </div>
    `;
  }).join('');

  propertyContainer.querySelectorAll('.property').forEach(el => {
    el.addEventListener('click', () => openPropertyModal(el.dataset.id, localStorage.getItem('role')==='admin'));
  });
}

// Property modal
export async function openPropertyModal(id, isAdmin) {
  const modal = document.getElementById('propertyModal');
  modal.setAttribute('aria-hidden','false');

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/properties/${id}`, {
      headers: token ? { 'Authorization': 'Bearer ' + token } : {}
    });
    if (!res.ok) throw new Error('Failed to fetch property');
    const p = await res.json();

    document.getElementById('modalImage').src = p.image || '';
    document.getElementById('modalName').textContent = p.name;
    document.getElementById('modalLocation').textContent = p.location;
    document.getElementById('modalPrice').textContent = p.price;
    document.getElementById('modalCategory').textContent = p.category;
    document.getElementById('modalType').textContent = p.type;
    document.getElementById('modalStatus').textContent = p.status || '-';
    document.getElementById('modalId').textContent = p.id;

    const wishlistBtn = document.getElementById('modalWishlistBtn');
    wishlistBtn.textContent = wishlistIds.includes(p.id) ? '❤️ В списък' : '🤍 Добави в списък';
    wishlistBtn.onclick = async () => {
      await toggleWishlist(p.id);
      wishlistBtn.textContent = wishlistIds.includes(p.id) ? '❤️ В списък' : '🤍 Добави в списък';
    };

    const adminBar = document.getElementById('adminModalBar');
    adminBar.style.display = isAdmin ? 'flex' : 'none';

    if(isAdmin) {
      document.getElementById('modalEditBtn').onclick = () => window.openEditModal(p.id);
      document.getElementById('modalDeleteBtn').onclick = async () => {
        await window.deleteProperty(p.id);
        modal.setAttribute('aria-hidden','true');
      };
      document.getElementById('modalToggleBtn').onclick = async () => {
        await window.togglePropertyStatus(p.id);
        await openPropertyModal(p.id,true);
      };
    }

  } catch(err) {
    console.error(err);
    showToast('Грешка при зареждане на имота');
  }
}

// Close modal
document.getElementById('closePropertyModal').addEventListener('click', () => {
  document.getElementById('propertyModal').setAttribute('aria-hidden','true');
});

// Expose global for admin sidebar
window.openEditModal = window.openEditModal || function(id){};
window.deleteProperty = window.deleteProperty || function(id){};
window.togglePropertyStatus = window.togglePropertyStatus || function(id){};

// Init filters
function setupFilterListeners(){
  const applyBtn = document.getElementById('applyFilters');
  applyBtn?.addEventListener('click', async ()=>{
    const location = document.getElementById('filterLocation').value;
    const minPrice = document.getElementById('filterMinPrice').value;
    const maxPrice = document.getElementById('filterMaxPrice').value;
    const type = document.getElementById('filterType').value;
    const category = document.getElementById('filterCategory').value;
    const status = document.getElementById('filterStatus').value;

    const props = await loadProperties();
    const filtered = props.filter(p=>{
      if(location && !p.location.toLowerCase().includes(location.toLowerCase())) return false;
      if(minPrice && +p.price < +minPrice) return false;
      if(maxPrice && +p.price > +maxPrice) return false;
      if(type && p.type!==type) return false;
      if(category && p.category!==category) return false;
      if(status && p.status!==status) return false;
      return true;
    });
    renderProperties(filtered);
  });
}

// Auto init
document.addEventListener('DOMContentLoaded', ()=>initProperties());
