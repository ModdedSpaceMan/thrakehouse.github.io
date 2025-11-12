import { showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
let wishlistIds = [];
const propertyContainer = document.getElementById('properties');

// Initialize everything
export async function initProperties() {
  await loadWishlist();
  await loadProperties();
  setupFilterListeners();

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
          <button class="view-btn" data-id="${p.id}">Преглед</button>
        </div>
      </div>
    `;
  }).join('');

  // Click listener for opening modal
  propertyContainer.querySelectorAll('.property').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.property-actions')) return;
      const isAdmin = localStorage.getItem('role') === 'admin';
      openPropertyModal(el.dataset.id, isAdmin);
    });
  });

  // View button listener
  propertyContainer.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const isAdmin = localStorage.getItem('role') === 'admin';
      openPropertyModal(btn.dataset.id, isAdmin);
    });
  });
}

// --------------------
// Wishlist
// --------------------
export async function loadWishlist() {
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
  if (!username || !token) { wishlistIds = []; return; }

  try {
    const res = await fetch(`${API_URL}/wishlists/${username}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    wishlistIds = data.items || [];
  } catch {
    wishlistIds = [];
  }
}

export async function toggleWishlist(propertyId) {
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
  if (!username || !token) { showToast('Трябва да сте влезли!'); return; }

  try {
    if (wishlistIds.includes(propertyId)) {
      await fetch(`${API_URL}/wishlists/${username}/${propertyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      wishlistIds = wishlistIds.filter(id => id !== propertyId);
      showToast('Премахнато от wishlist');
    } else {
      await fetch(`${API_URL}/wishlists/${username}/${propertyId}`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      wishlistIds.push(propertyId);
      showToast('Добавено в wishlist!');
    }
  } catch (err) {
    console.error(err);
    showToast('Грешка при актуализиране на wishlist');
  }
}

// --------------------
// Delete property
// --------------------
async function deleteProperty(id) {
  const token = localStorage.getItem('token');
  if (!token) return showToast('Нямате права!');

  try {
    await fetch(`${API_URL}/properties/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    showToast('Имотът е изтрит');
    await loadProperties();
  } catch (err) {
    console.error(err);
    showToast('Грешка при изтриване на имота');
  }
}

// --------------------
// Toggle rental status
// --------------------
async function togglePropertyStatus(id) {
  const token = localStorage.getItem('token');
  if (!token) return showToast('Нямате права!');

  try {
    const res = await fetch(`${API_URL}/properties/${id}`, {
      method: 'PATCH',
      headers: { 
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ toggleStatus: true })
    });
    if (!res.ok) throw new Error('Failed');
    await loadProperties();
  } catch (err) {
    console.error(err);
    showToast('Грешка при промяна на статуса');
  }
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

    // Populate modal content
    document.getElementById('modalImage').src = p.image || '';
    document.getElementById('modalName').textContent = p.name;
    document.getElementById('modalLocation').textContent = p.location;
    document.getElementById('modalPrice').textContent = p.price;
    document.getElementById('modalCategory').textContent = p.category;
    document.getElementById('modalType').textContent = p.type;
    document.getElementById('modalStatus').textContent = p.status || '-';
    document.getElementById('modalId').textContent = p.id;

    // Wishlist button inside modal
    const wishlistBtn = document.getElementById('modalWishlistBtn');
    wishlistBtn.textContent = wishlistIds.includes(p.id) ? '❤️' : '🤍';
    wishlistBtn.onclick = () => toggleWishlist(p.id).then(() => {
      wishlistBtn.textContent = wishlistIds.includes(p.id) ? '❤️' : '🤍';
    });

    // Admin bar/buttons
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
        await openPropertyModal(id, true); // refresh modal
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
