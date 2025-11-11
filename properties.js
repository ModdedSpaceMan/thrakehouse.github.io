import { showToast } from './ui.js';
const API_URL = 'https://my-backend.martinmiskata.workers.dev';
const propertiesContainer = document.getElementById('properties');

let wishlistIds = [];
const token = localStorage.getItem('token'); // JWT from login/signup
const currentUserRole = localStorage.getItem('role') || 'user';

// --- Edit Modal Elements ---
const editModal = document.getElementById('editModal');
const closeEditModal = document.getElementById('closeEditModal');
const editForm = document.getElementById('editForm');
const editImageInput = document.getElementById('editImage');
const editImagePreview = document.getElementById('editImagePreview');
let editingPropertyId = null;

editImageInput.addEventListener('input', () => {
  editImagePreview.src = editImageInput.value;
});
closeEditModal.addEventListener('click', () => editModal.setAttribute('aria-hidden','true'));

// --- Wishlist helper ---
async function loadWishlist() {
  if (!token) {
    wishlistIds = [];
    return;
  }
  try {
    const username = JSON.parse(atob(token.split('.')[0])).username; // decode payload
    const res = await fetch(`${API_URL}/wishlists/${username}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    wishlistIds = data.items || [];
  } catch (err) {
    console.error('Грешка при зареждане на списъка:', err);
    wishlistIds = [];
  }
}

async function toggleWishlist(propId) {
  if (!token) { 
    showToast('Влезте, за да използвате списъка');
    return;
  }

  const username = JSON.parse(atob(token.split('.')[0])).username;
  const inWishlist = wishlistIds.includes(propId);
  const endpoint = inWishlist ? 'remove' : 'add';

  try {
    const res = await fetch(`${API_URL}/wishlists/${username}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ propertyId: propId })
    });
    const data = await res.json();
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

// --- Load Properties ---
export async function loadProperties() {
  if (!propertiesContainer) return;
  await loadWishlist();

  try {
    const res = await fetch(`${API_URL}/properties`);
    const properties = await res.json();
    propertiesContainer.innerHTML = '';

    if (!properties.length) {
      propertiesContainer.innerHTML = '<p>Няма имоти за показване</p>';
      return;
    }

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
        <div class="admin-buttons-right" style="display:${currentUserRole==='admin'?'flex':'none'};">
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

      // DELETE
      deleteBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!prop.id || !token) return;
        if (!confirm(`Сигурни ли сте, че искате да изтриете "${prop.name}"?`)) return;
        try {
          await fetch(`${API_URL}/properties/${prop.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          div.remove();
          showToast('Имотът е изтрит');
        } catch (err) {
          console.error(err);
          showToast('Грешка при изтриване на имота');
        }
      });

      // EDIT
      editBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(prop);
      });

      // TOGGLE STATUS
      toggleBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!prop.id || !token) return;

        const newStatus = prop.status==='free'?'taken':'free';
        try {
          const res = await fetch(`${API_URL}/properties/${prop.id}`, {
            method:'PUT',
            headers: {
              'Content-Type':'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ property: {...prop, status:newStatus} })
          });
          if(!res.ok) throw new Error('Неуспешно обновяване');

          prop.status = newStatus;
          toggleBtn.textContent = newStatus==='free'?'Свободен':'Зает';
          const badge = div.querySelector('.status-badge');
          if(badge) badge.textContent = newStatus==='free'?'Свободен':'Зает';
          div.classList.toggle('taken', newStatus==='taken');
        } catch(err) {
          console.error(err);
          showToast('Грешка при обновяване на статуса');
        }
      });

      // WISHLIST
      wishlistBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWishlist(prop.id);
      });
    });

    updateWishlistButtons();
  } catch(err) {
    console.error(err);
    propertiesContainer.innerHTML = '<p>Грешка при зареждане на имотите</p>';
  }
}

// --- EDIT MODAL LOGIC ---
export function openEditModal(property) {
  if (!property) return;
  editingPropertyId = property.id;

  editForm.name.value = property.name || '';
  editForm.location.value = property.location || '';
  editForm.price.value = property.price || '';
  editForm.type.value = property.type || '';
  editForm.status.value = property.status || 'free';
  editImageInput.value = property.image || '';
  editImagePreview.src = property.image || '';

  editModal.setAttribute('aria-hidden','false');
}

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if(!editingPropertyId || !token) return;

  const updatedProperty = {
    name: editForm.name.value,
    location: editForm.location.value,
    price: editForm.price.value,
    type: editForm.type.value,
    status: editForm.status.value,
    image: editForm.image.value
  };

  try {
    const res = await fetch(`${API_URL}/properties/${editingPropertyId}`, {
      method:'PUT',
      headers:{
        'Content-Type':'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ property: updatedProperty })
    });
    if(!res.ok) throw new Error('Неуспешно обновяване');

    loadProperties();
    editModal.setAttribute('aria-hidden','true');
    showToast('Имотът е обновен');
  } catch(err) {
    console.error(err);
    showToast('Грешка при обновяване на имота');
  }
});

// Init
document.addEventListener('DOMContentLoaded', loadProperties);
