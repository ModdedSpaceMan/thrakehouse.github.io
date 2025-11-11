// properties.js
import { showToast } from './ui.js';
import { addToWishlist, removeFromWishlist } from './wishlist.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
const propertiesContainer = document.getElementById('properties');

export async function loadProperties() {
  try {
    const res = await fetch(`${API_URL}/properties`);
    const data = await res.json();
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');

    propertiesContainer.innerHTML = '';

    data.forEach(prop => {
      const div = document.createElement('div');
      div.className = `property${prop.status === 'taken' ? ' taken' : ''}`;

      // Status mapping to Bulgarian
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

      // Wishlist button (only if logged in)
      if (username) {
        const wishlistBtn = document.createElement('button');
        wishlistBtn.className = 'wishlist-btn';
        wishlistBtn.innerHTML = '♥';
        wishlistBtn.addEventListener('click', async () => {
          if (wishlistBtn.classList.contains('added')) {
            await removeFromWishlist(prop.id);
            wishlistBtn.classList.remove('added');
          } else {
            await addToWishlist(prop.id);
            wishlistBtn.classList.add('added');
          }
          loadProperties(); // refresh button state
        });
        div.appendChild(wishlistBtn);
      }

      // Admin buttons (only if admin)
      if (role === 'admin') {
        const adminBtns = document.createElement('div');
        adminBtns.className = 'admin-buttons-right';

        // Delete
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Изтрий';
        deleteBtn.addEventListener('click', async () => {
          try {
            const res = await fetch(`${API_URL}/properties`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'delete', id: prop.id, role })
            });
            const data = await res.json();
            if (data.success) {
              showToast('Имотът е изтрит');
              loadProperties();
            } else showToast(data.message || 'Грешка при изтриване');
          } catch {
            showToast('Грешка при изтриване');
          }
        });
        adminBtns.appendChild(deleteBtn);

        // Edit
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = 'Редактирай';
        editBtn.addEventListener('click', async () => {
          const newName = prompt('Ново име на имота', prop.name);
          if (!newName) return;
          try {
            const res = await fetch(`${API_URL}/properties`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'edit', id: prop.id, property: { name: newName }, role })
            });
            const data = await res.json();
            if (data.success) {
              showToast('Имотът е редактиран');
              loadProperties();
            } else showToast(data.message || 'Грешка при редакция');
          } catch {
            showToast('Грешка при редакция');
          }
        });
        adminBtns.appendChild(editBtn);

        // Toggle Status
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggle-btn';
        toggleBtn.textContent = 'Смени статус';
        toggleBtn.addEventListener('click', async () => {
          try {
            const res = await fetch(`${API_URL}/properties`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'toggle', id: prop.id, role })
            });
            const data = await res.json();
            if (data.success) {
              showToast('Статусът е сменен');
              loadProperties();
            } else showToast(data.message || 'Грешка при смяна на статус');
          } catch {
            showToast('Грешка при смяна на статус');
          }
        });
        adminBtns.appendChild(toggleBtn);

        // Admin ID
        const adminId = document.createElement('div');
        adminId.className = 'admin-id';
        adminId.textContent = `ID: ${prop.id}`;
        adminBtns.appendChild(adminId);

        div.appendChild(adminBtns);
      }

      propertiesContainer.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    showToast('Грешка при зареждане на имотите');
  }
}
