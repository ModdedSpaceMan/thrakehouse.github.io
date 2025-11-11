// properties.js
import { showToast, role } from './ui.js';
import { openPropertyFormForEdit } from './propertyForm.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
const propertiesContainer = document.getElementById('properties');
const username = localStorage.getItem('username');

// ------------------ Load Properties ------------------
export async function loadProperties() {
  try {
    const res = await fetch(`${API_URL}/properties`);
    const data = await res.json();

    propertiesContainer.innerHTML = '';

    data.forEach(prop => {
      const div = document.createElement('div');
      div.className = `property${prop.status === 'taken' ? ' taken' : ''}`;

      const statusBG = prop.status === 'free' ? 'Свободен' : 'Зает';

      div.innerHTML = `
        <img src="${prop.image || ''}" alt="${prop.name}" />
        <div class="property-content">
          <h3>${prop.name}</h3>
          <p>${prop.location}</p>
          <p>${prop.price} лв/месец</p>
        </div>
        <div class="status-badge">${statusBG}</div>
        <div class="property-id">ID: ${prop.id}</div>
      `;

      // Wishlist button
      if (username) {
        const wishlistBtn = document.createElement('button');
        wishlistBtn.className = 'wishlist-btn';
        wishlistBtn.innerHTML = '♥';
        checkWishlist(prop.id, wishlistBtn);

        wishlistBtn.addEventListener('click', async () => {
          const isAdded = wishlistBtn.classList.contains('added');
          try {
            await fetch(`${API_URL}/wishlists/${username}/${isAdded ? 'remove' : 'add'}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, propertyId: prop.id })
            });
            wishlistBtn.classList.toggle('added');
          } catch {
            showToast('Грешка при актуализиране на списъка с любими');
          }
        });

        div.appendChild(wishlistBtn);
      }

      // Admin buttons
      if (role === 'admin') {
        const adminBtns = document.createElement('div');
        adminBtns.className = 'admin-buttons-right';

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = 'Редактирай';
        editBtn.addEventListener('click', () => openPropertyFormForEdit(prop));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Изтрий';
        deleteBtn.addEventListener('click', async () => {
          if (!confirm('Сигурни ли сте, че искате да изтриете имота?')) return;

          try {
            const res = await fetch(`${API_URL}/properties/${prop.id}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role })
            });
            const data = await res.json();
            if (data.success) {
              showToast('Имотът е изтрит');
              loadProperties();
            } else showToast(data.message || 'Грешка при изтриване');
          } catch {
            showToast('Грешка при изтриване на имота');
          }
        });

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggle-btn';
        toggleBtn.textContent = 'Смени статус';
        toggleBtn.addEventListener('click', async () => {
          try {
            const res = await fetch(`${API_URL}/properties/${prop.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role })
            });
            const data = await res.json();
            if (data.success) {
              showToast('Статусът е променен');
              loadProperties();
            } else showToast(data.message || 'Грешка при смяна на статус');
          } catch {
            showToast('Грешка при смяна на статус');
          }
        });

        adminBtns.append(editBtn, deleteBtn, toggleBtn);
        div.appendChild(adminBtns);
      }

      propertiesContainer.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    showToast('Грешка при зареждане на имотите');
  }
}

// ------------------ Check Wishlist ------------------
async function checkWishlist(propId, btn) {
  try {
    const res = await fetch(`${API_URL}/wishlists/${username}`);
    const data = await res.json();
    if (data.items && data.items.includes(propId)) {
      btn.classList.add('added');
    }
  } catch {
    console.warn('Неуспешно зареждане на wishlist');
  }
}
