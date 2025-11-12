import { showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
let wishlistIds = [];
const propertyContainer = document.getElementById('properties');

// Initialize everything
export async function initProperties() {
  await loadWishlist();
  await loadProperties();
  setupFilterListeners();

  // Re-render when properties updated via forms
  window.addEventListener("propertiesUpdated", loadProperties);
}

// Fetch all properties from backend
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

// Render property cards
export function renderProperties(properties) {
  if (!propertyContainer) return;

  if (!properties.length) {
    propertyContainer.innerHTML = '<p>Няма налични имоти.</p>';
    return;
  }

  propertyContainer.innerHTML = properties.map(p => {
    const isRental = p.category === "rental";
    const inWishlist = wishlistIds.includes(p.id) ? '❤️' : '🤍';
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
        <div class="property-actions">
          <button class="wishlist-btn" data-id="${p.id}">${inWishlist}</button>
          <button class="edit-btn" data-id="${p.id}">Редактирай</button>
          <button class="delete-btn" data-id="${p.id}">Изтрий</button>
          ${isRental ? `<button class="toggle-status-btn" data-id="${p.id}">${p.status === "free" ? "Зает" : "Свободен"}</button>` : ''}
        </div>
      </div>
    `;

  }).join('');

  // Click listeners
  propertyContainer.querySelectorAll('.property').forEach(el => {
    el.addEventListener('click', e => {
      // prevent clicks on action buttons from opening modal
      if (e.target.closest('.property-actions')) return;
      const isAdmin = localStorage.getItem('role') === 'admin';
      openPropertyModal(el.dataset.id, isAdmin);
    });
  });

  propertyContainer.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      toggleWishlist(btn.dataset.id);
    });
  });

  propertyContainer.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openEditModal(btn.dataset.id);
    });
  });

  propertyContainer.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      deleteProperty(btn.dataset.id);
    });
  });

  propertyContainer.querySelectorAll('.toggle-status-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      togglePropertyStatus(btn.dataset.id);
    });
  });
}

// --------------------
// Property Modal Logic
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

// Close modal
document.getElementById('closePropertyModal')?.addEventListener('click', () => {
  document.getElementById('propertyModal').setAttribute('aria-hidden', 'true');
});
