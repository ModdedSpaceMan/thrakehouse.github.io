import { showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
let wishlistIds = [];
const propertyContainer = document.getElementById('properties');

// Initialize
export async function initProperties() {
  loadWishlist();
  await loadProperties();
  setupFilterListeners();

  // Listen for updates
  window.addEventListener("propertiesUpdated", loadProperties);
}

// Load wishlist from localStorage
function loadWishlist() {
  const saved = localStorage.getItem('wishlist');
  wishlistIds = saved ? JSON.parse(saved) : [];
}

// Toggle wishlist for a property
function toggleWishlist(id) {
  const index = wishlistIds.indexOf(id);
  if (index >= 0) wishlistIds.splice(index, 1);
  else wishlistIds.push(id);
  localStorage.setItem('wishlist', JSON.stringify(wishlistIds));
  updateModalWishlist(id);
}

// Update wishlist button in modal
function updateModalWishlist(id) {
  const btn = document.getElementById('modalWishlistBtn');
  if (!btn) return;
  btn.textContent = wishlistIds.includes(id) ? '❤️' : '🤍';
}

// Load properties from backend
export async function loadProperties() {
  if (!propertyContainer) return;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/properties`, {
      headers: token ? { 'Authorization': 'Bearer ' + token } : {}
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    renderProperties(data);
  } catch (err) {
    console.error(err);
    propertyContainer.innerHTML = '<p>Грешка при зареждане на имоти.</p>';
  }
}

// Render property cards
export function renderProperties(properties) {
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
    el.addEventListener('click', () => {
      const isAdmin = localStorage.getItem('role') === 'admin';
      openPropertyModal(el.dataset.id, isAdmin);
    });
  });
}

// Open property modal
export async function openPropertyModal(id, isAdmin) {
  const modal = document.getElementById('propertyModal');
  modal.setAttribute('aria-hidden', 'false');

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/properties/${id}`, {
      headers: token ? { 'Authorization': 'Bearer ' + token } : {}
    });
    if (!res.ok) throw new Error('Failed to fetch property');
    const p = await res.json();

    // Fill modal info
    document.getElementById('modalImage').src = p.image || '';
    document.getElementById('modalName').textContent = p.name;
    document.getElementById('modalLocation').textContent = p.location;
    document.getElementById('modalPrice').textContent = p.price;
    document.getElementById('modalCategory').textContent = p.category;
    document.getElementById('modalType').textContent = p.type;
    document.getElementById('modalStatus').textContent = p.status || '-';
    document.getElementById('modalId').textContent = p.id;

    // Wishlist inside modal
    let wishlistBtn = document.getElementById('modalWishlistBtn');
    if (!wishlistBtn) {
      wishlistBtn = document.createElement('button');
      wishlistBtn.id = 'modalWishlistBtn';
      wishlistBtn.className = 'wishlist-btn';
      wishlistBtn.style.marginTop = '10px';
      document.querySelector('#propertyModal .property-info').appendChild(wishlistBtn);
      wishlistBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWishlist(p.id);
      });
    }
    updateModalWishlist(p.id);

    // Admin buttons
    const adminBar = document.getElementById('adminModalBar');
    adminBar.style.display = isAdmin ? 'flex' : 'none';
    if (isAdmin) {
      document.getElementById('modalEditBtn').onclick = () => openEditModal(id);
      document.getElementById('modalDeleteBtn').onclick = async () => {
        await deleteProperty(id);
        modal.setAttribute('aria-hidden', 'true');
      };
      document.getElementById('modalToggleBtn').onclick = async () => {
        await togglePropertyStatus(id);
        await openPropertyModal(id, true);
      };
    }

  } catch (err) {
    console.error(err);
    showToast('Грешка при зареждане на имота');
  }
}

// Close property modal
document.getElementById('closePropertyModal')?.addEventListener('click', () => {
  document.getElementById('propertyModal').setAttribute('aria-hidden', 'true');
});
