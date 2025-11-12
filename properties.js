import { showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
let wishlistIds = [];
const propertyContainer = document.getElementById('properties');

// --------------------
// Initialize
// --------------------
export async function initProperties() {
  await loadWishlist();
  await loadProperties();
  setupFilterListeners();
  window.addEventListener("propertiesUpdated", loadProperties);
}

// --------------------
// Wishlist
// --------------------
export async function loadWishlist() {
  const stored = localStorage.getItem('wishlist');
  wishlistIds = stored ? JSON.parse(stored) : [];
}

// Toggle wishlist
export function toggleWishlist(id) {
  if (wishlistIds.includes(id)) {
    wishlistIds = wishlistIds.filter(x => x !== id);
    showToast('Премахнато от списъка');
  } else {
    wishlistIds.push(id);
    showToast('Добавено в списъка');
  }
  localStorage.setItem('wishlist', JSON.stringify(wishlistIds));
  updateModalWishlistBtn(id);
}

// Update modal wishlist button text
function updateModalWishlistBtn(id) {
  const btn = document.getElementById('modalWishlistBtn');
  if (!btn) return;
  btn.textContent = wishlistIds.includes(id) ? 'Премахни от списъка ♥' : 'Добави в списъка ♥';
}

// --------------------
// Load Properties
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
    console.error('Грешка при зареждане на имоти:', err);
    propertyContainer.innerHTML = '<p>Грешка при зареждане на имоти.</p>';
    return [];
  }
}

// --------------------
// Render Properties
// --------------------
export function renderProperties(properties) {
  if (!propertyContainer) return;
  if (!properties.length) {
    propertyContainer.innerHTML = '<p>Няма налични имоти.</p>';
    return;
  }

  propertyContainer.innerHTML = properties.map(p => {
    const isRental = p.category === "rental";
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
      </div>
    `;
  }).join('');

  // Click to open modal
  propertyContainer.querySelectorAll('.property').forEach(el => {
    el.addEventListener('click', () => {
      const isAdmin = localStorage.getItem('role') === 'admin';
      openPropertyModal(el.dataset.id, isAdmin);
    });
  });
}

// --------------------
// Property Modal
// --------------------
export async function openPropertyModal(id, isAdmin) {
  const token = localStorage.getItem('token');
  const modal = document.getElementById('propertyModal');
  modal.setAttribute('aria-hidden', 'false');

  try {
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

    // Wishlist button
    const wishlistBtn = document.getElementById('modalWishlistBtn');
    wishlistBtn.onclick = () => toggleWishlist(p.id);
    updateModalWishlistBtn(p.id);

    // Admin bar
    const adminBar = document.getElementById('adminModalBar');
    adminBar.style.display = isAdmin ? 'flex' : 'none';
    if (isAdmin) {
      document.getElementById('modalEditBtn').onclick = () => openEditModal(p.id);
      document.getElementById('modalDeleteBtn').onclick = async () => {
        await deleteProperty(p.id);
        modal.setAttribute('aria-hidden', 'true');
      };
      document.getElementById('modalToggleBtn').onclick = async () => {
        await togglePropertyStatus(p.id);
        await openPropertyModal(p.id, true);
      };
    }

  } catch (err) {
    console.error(err);
    showToast('Грешка при зареждане на имота');
  }
}

// Close modal
document.getElementById('closePropertyModal').addEventListener('click', () => {
  document.getElementById('propertyModal').setAttribute('aria-hidden', 'true');
});
