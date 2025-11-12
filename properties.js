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
      <div class="property ${takenClass}">
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
  propertyContainer.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleWishlist(btn.dataset.id));
  });

  propertyContainer.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });

  propertyContainer.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteProperty(btn.dataset.id));
  });

  propertyContainer.querySelectorAll('.toggle-status-btn').forEach(btn => {
    btn.addEventListener('click', () => togglePropertyStatus(btn.dataset.id));
  });
}

// Wishlist
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

    await loadProperties();
  } catch (err) {
    console.error(err);
    showToast('Грешка при актуализиране на wishlist');
  }
}

// Delete property
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

// Toggle rental status
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

// Edit modal opener
function openEditModal(id) {
  const modal = document.getElementById("editModal");
  modal.setAttribute("aria-hidden", "false");

  // Fetch property data from backend
  const token = localStorage.getItem('token');
  fetch(`${API_URL}/properties/${id}`, {
    headers: { 'Authorization': 'Bearer ' + token }
  })
    .then(res => res.json())
    .then(prop => {
      const form = document.getElementById("editForm");
      form.dataset.propertyId = id;

      const closeBtn = document.getElementById('closeEditModal');
      closeBtn.onclick = () => modal.setAttribute('aria-hidden', 'true');

      document.getElementById("editName").value = prop.name;
      document.getElementById("editLocation").value = prop.location;
      document.getElementById("editPrice").value = prop.price;
      document.getElementById("editCategory").value = prop.category;
      document.getElementById("editType").value = prop.type;
      document.getElementById("editStatus").value = prop.status || "";
      document.getElementById("editStatusContainer").style.display = prop.category === "rental" ? "block" : "none";

      const editImagePreview = document.getElementById("editImagePreview");
      editImagePreview.src = prop.image || "";

      const editImageInput = document.getElementById("editImage");
      editImageInput.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => { editImagePreview.src = reader.result; };
        reader.readAsDataURL(file);
      };

      form.onsubmit = async e => {
        e.preventDefault();
        try {
          const body = {
            name: document.getElementById("editName").value,
            location: document.getElementById("editLocation").value,
            price: document.getElementById("editPrice").value,
            category: document.getElementById("editCategory").value,
            type: document.getElementById("editType").value,
            status: document.getElementById("editStatus").value,
          };
          if (editImagePreview.src) body.image = editImagePreview.src;

          await fetch(`${API_URL}/properties/${id}`, {
            method: 'PATCH',
            headers: { 
              'Authorization': 'Bearer ' + token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          });

          modal.setAttribute('aria-hidden', 'true');
          await loadProperties();
          showToast('Имотът е актуализиран');
        } catch (err) {
          console.error(err);
          showToast('Грешка при редактиране на имота');
        }
      };
    })
    .catch(err => {
      console.error(err);
      showToast('Грешка при зареждане на имота');
    });
}

// --------------------
// Filters
// --------------------
function setupFilterListeners() {
  const applyBtn = document.getElementById('applyFilters');
  if (!applyBtn) return;

  applyBtn.addEventListener('click', async () => {
    let properties = await loadProperties();

    const locationFilter = document.getElementById('filterLocation').value.toLowerCase();
    const minPrice = Number(document.getElementById('filterMinPrice').value);
    const maxPrice = Number(document.getElementById('filterMaxPrice').value);
    const typeFilter = document.getElementById('filterType').value;
    const statusFilter = document.getElementById('filterStatus').value;

    properties = properties.filter(p => {
      const price = Number(p.price);
      if (locationFilter && !p.location.toLowerCase().includes(locationFilter)) return false;
      if (!isNaN(minPrice) && price < minPrice) return false;
      if (!isNaN(maxPrice) && price > maxPrice) return false;
      if (typeFilter && p.type !== typeFilter) return false;
      if (p.category === "rental" && statusFilter) {
        if (p.status !== statusFilter) return false;
      }
      return true;
    });

    renderProperties(properties);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initProperties();
});
