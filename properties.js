// properties.js
import { showToast } from './ui.js';
import { getWishlistIds, toggleWishlist } from './wishlist.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
const propertyContainer = document.getElementById('properties');
const propertyModal = document.getElementById('propertyModal');
const modalWishlistBtn = document.createElement('button');

modalWishlistBtn.classList.add('wishlist-btn');
modalWishlistBtn.textContent = '🤍';
modalWishlistBtn.style.marginTop = '10px';

// --------------------
// Initialize everything
// --------------------
export async function initProperties() {
  await loadProperties();
  setupFilterListeners();

  window.addEventListener('propertiesUpdated', loadProperties);
}

// --------------------
// Load properties
// --------------------
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
    return data;

  } catch (err) {
    console.error('Error loading properties:', err);
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

  const wishlistIds = getWishlistIds();

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
          <p>Категория: ${isRental ? "Наем" : "Продажба"}</p>
          <p>Тип: ${p.type}</p>
          ${isRental ? `<p>Статус: ${p.status}</p>` : ''}
        </div>
        <div class="property-id">${p.id}</div>
      </div>
    `;
  }).join('');

  // --------------------
  // Click on property card
  // --------------------
  propertyContainer.querySelectorAll('.property').forEach(el => {
    el.addEventListener('click', async (e) => {
      // Prevent multiple modal triggers
      if (e.target.closest('.property-actions')) return;

      const isAdmin = localStorage.getItem('role') === 'admin';
      await openPropertyModal(el.dataset.id, isAdmin);
    });
  });
}

// --------------------
// Open Property Modal
// --------------------
export async function openPropertyModal(id, isAdmin) {
  if (!propertyModal) return;

  propertyModal.setAttribute('aria-hidden', 'false');

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

    // --------------------
    // Wishlist button inside modal
    // --------------------
    const wishlistIds = getWishlistIds();
    modalWishlistBtn.textContent = wishlistIds.includes(p.id) ? '❤️' : '🤍';
    modalWishlistBtn.onclick = () => {
      toggleWishlist(p.id);
      modalWishlistBtn.textContent = wishlistIds.includes(p.id) ? '🤍' : '❤️';
    };

    // Append button if not already in modal
    if (!document.getElementById('modalWishlistBtn')) {
      modalWishlistBtn.id = 'modalWishlistBtn';
      const modalContent = propertyModal.querySelector('.property-modal-inner .property-info');
      modalContent.appendChild(modalWishlistBtn);
    }

    // --------------------
    // Admin bar
    // --------------------
    const adminBar = document.getElementById('adminModalBar');
    if (adminBar) {
      adminBar.style.display = isAdmin ? 'flex' : 'none';
      if (isAdmin) {
        document.getElementById('modalEditBtn').onclick = () => window.openEditModal(p.id);
        document.getElementById('modalDeleteBtn').onclick = async () => {
          await window.deleteProperty(p.id);
          propertyModal.setAttribute('aria-hidden', 'true');
        };
        document.getElementById('modalToggleBtn').onclick = async () => {
          await window.togglePropertyStatus(p.id);
          await openPropertyModal(p.id, true);
        };
      }
    }

  } catch (err) {
    console.error(err);
    showToast('Грешка при зареждане на имота');
  }
}

// Close modal safely
document.getElementById('closePropertyModal')?.addEventListener('click', () => {
  if (propertyModal) propertyModal.setAttribute('aria-hidden', 'true');
});

// --------------------
// Filter listeners (simplified example)
// --------------------
function setupFilterListeners() {
  const applyBtn = document.getElementById('applyFilters');
  if (!applyBtn) return;

  applyBtn.addEventListener('click', async () => {
    const location = document.getElementById('filterLocation')?.value || '';
    const minPrice = document.getElementById('filterMinPrice')?.value || '';
    const maxPrice = document.getElementById('filterMaxPrice')?.value || '';
    const type = document.getElementById('filterType')?.value || '';
    const category = document.getElementById('filterCategory')?.value || '';
    const status = document.getElementById('filterStatus')?.value || '';

    let data = await loadProperties();
    data = data.filter(p => {
      if (location && !p.location.toLowerCase().includes(location.toLowerCase())) return false;
      if (minPrice && Number(p.price) < Number(minPrice)) return false;
      if (maxPrice && Number(p.price) > Number(maxPrice)) return false;
      if (type && p.type !== type) return false;
      if (category && p.category !== category) return false;
      if (status && p.status !== status) return false;
      return true;
    });

    renderProperties(data);
  });
}
