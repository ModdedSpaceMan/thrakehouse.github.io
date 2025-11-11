// properties.js
import { showToast } from './ui.js';
import { addToWishlist, removeFromWishlist, loadWishlist } from './wishlist.js';

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

      // Wishlist button (logged in users)
      if (username) {
        const wishlistBtn = document.createElement('button');
        wishlistBtn.className = 'wishlist-btn';
        wishlistBtn.innerHTML = '♥';
        wishlistBtn.addEventListener('click', async () => {
          const isAdded = wishlistBtn.classList.contains('added');
          if (isAdded) {
            await removeFromWishlist(prop.id);
            wishlistBtn.classList.remove('added');
          } else {
            await addToWishlist(prop.id);
            wishlistBtn.classList.add('added');
          }
        });
        div.appendChild(wishlistBtn);
      }

      // Admin buttons
      if (role === 'admin') {
        const adminBtns = document.createElement('div');
        adminBtns.className = 'admin-buttons-right';
        adminBtns.innerHTML = `
          <button class="edit-btn">Редактирай</button>
          <button class="delete-btn">Изтрий</button>
          <button class="toggle-btn">Смени статус</button>
        `;

        const editBtn = adminBtns.querySelector('.edit-btn');
        const deleteBtn = adminBtns.querySelector('.delete-btn');
        const toggleBtn = adminBtns.querySelector('.toggle-btn');

        // Edit property
        editBtn.addEventListener('click', async () => {
          const newName = prompt('Име на имота', prop.name);
          const newLocation = prompt('Локация', prop.location);
          const newPrice = prompt('Цена на месец (лв)', prop.price);
          if (!newName || !newLocation || !newPrice) return;

          try {
            const res = await fetch(`${API_URL}/properties/${prop.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role, property: { ...prop, name: newName, location: newLocation, price: newPrice } })
            });
            const data = await res.json();
            if (data.success) {
              showToast('Имотът е редактиран');
              loadProperties();
            } else showToast(data.message || 'Грешка при редакция');
          } catch (err) {
            console.error(err);
            showToast('Грешка при редакция');
          }
        });

        // Delete property
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
          } catch (err) {
            console.error(err);
            showToast('Грешка при изтриване');
          }
        });

        // Toggle property status
        toggleBtn.addEventListener('click', async () => {
          const newStatus = prop.status === 'free' ? 'taken' : 'free';
          try {
            const res = await fetch(`${API_URL}/properties/${prop.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role, status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
              showToast('Статусът е сменен');
              loadProperties();
            } else showToast(data.message || 'Грешка при смяна на статус');
          } catch (err) {
            console.error(err);
            showToast('Грешка при смяна на статус');
          }
        });

        div.appendChild(adminBtns);
      }

      propertiesContainer.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    showToast('Грешка при зареждане на имотите');
  }
}
