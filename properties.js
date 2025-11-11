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

    // Get user's wishlist
    let wishlistIds = [];
    if (username) {
      const wishRes = await fetch(`${API_URL}/wishlists/${username}`);
      const wishData = await wishRes.json();
      wishlistIds = wishData.items || [];
    }

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
        if (wishlistIds.includes(prop.id)) {
          wishlistBtn.classList.add('added');
          wishlistBtn.style.color = '#ff6b6b';
        }
        wishlistBtn.addEventListener('click', async () => {
          if (wishlistBtn.classList.contains('added')) {
            await removeFromWishlist(prop.id);
            wishlistBtn.classList.remove('added');
            wishlistBtn.style.color = '#fff';
          } else {
            await addToWishlist(prop.id);
            wishlistBtn.classList.add('added');
            wishlistBtn.style.color = '#ff6b6b';
          }
          document.getElementById('wishlistBtn').dispatchEvent(new Event('click'));
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
          <div class="admin-id">${prop.id}</div>
        `;

        // Edit property
        adminBtns.querySelector('.edit-btn').addEventListener('click', async () => {
          const newName = prompt('Ново име на имота:', prop.name);
          if (!newName) return;
          try {
            const res = await fetch(`${API_URL}/properties`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role, property: { ...prop, name: newName } })
            });
            const data = await res.json();
            showToast(data.success ? 'Имотът е редактиран' : data.message || 'Грешка');
            loadProperties();
          } catch (err) { console.error(err); showToast('Грешка при редакция'); }
        });

        // Delete property
        adminBtns.querySelector('.delete-btn').addEventListener('click', async () => {
          if (!confirm('Сигурни ли сте, че искате да изтриете имота?')) return;
          try {
            const res = await fetch(`${API_URL}/properties/delete`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: prop.id, role })
            });
            const data = await res.json();
            showToast(data.success ? 'Имотът е изтрит' : data.message || 'Грешка при изтриване');
            loadProperties();
          } catch (err) { console.error(err); showToast('Грешка при изтриване'); }
        });

        // Toggle status
        adminBtns.querySelector('.toggle-btn').addEventListener('click', async () => {
          const newStatus = prop.status === 'free' ? 'taken' : 'free';
          try {
            const res = await fetch(`${API_URL}/properties`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role, property: { ...prop, status: newStatus } })
            });
            const data = await res.json();
            showToast(data.success ? 'Статусът е сменен' : data.message || 'Грешка при смяна на статус');
            loadProperties();
          } catch (err) { console.error(err); showToast('Грешка при смяна на статус'); }
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

// Auto-load properties on page load
document.addEventListener('DOMContentLoaded', () => loadProperties());
