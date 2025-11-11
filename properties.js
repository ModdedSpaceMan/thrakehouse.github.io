import { showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
const propertiesContainer = document.getElementById('properties');
const wishlistList = document.getElementById('wishlistList'); // container for wishlist panel
const username = localStorage.getItem('username');
const role = localStorage.getItem('role');

async function getWishlist() {
  if (!username) return [];
  try {
    const res = await fetch(`${API_URL}/wishlists/${username}`);
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export async function loadProperties() {
  if (!propertiesContainer) return;

  try {
    const res = await fetch(`${API_URL}/properties`);
    const data = await res.json();
    const wishlist = await getWishlist();

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
        wishlistBtn.textContent = wishlist.includes(prop.id) ? '♥' : '♡';
        wishlistBtn.addEventListener('click', async () => {
          try {
            const action = wishlistBtn.textContent === '♡' ? 'add' : 'remove';
            const res = await fetch(`${API_URL}/wishlists/${username}/${action}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, propertyId: prop.id })
            });
            const data = await res.json();
            if (data.success) {
              wishlistBtn.textContent = action === 'add' ? '♥' : '♡';
              loadWishlistPanel();
            } else {
              showToast('Грешка при промяна на списъка с желания');
            }
          } catch {
            showToast('Грешка при промяна на списъка с желания');
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

        // Delete
        adminBtns.querySelector('.delete-btn').addEventListener('click', async () => {
          if (!confirm('Сигурни ли сте, че искате да изтриете имота?')) return;
          try {
            const res = await fetch(`${API_URL}/properties/${prop.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
              showToast('Имотът е изтрит');
              loadProperties();
            } else showToast(data.message || 'Грешка при изтриване');
          } catch {
            showToast('Грешка при изтриване');
          }
        });

        // Edit
        adminBtns.querySelector('.edit-btn').addEventListener('click', () => {
          showToast(`Редакция на имот ${prop.id}`);
        });

        // Toggle status
        adminBtns.querySelector('.toggle-btn').addEventListener('click', async () => {
          try {
            const newStatus = prop.status === 'free' ? 'taken' : 'free';
            const res = await fetch(`${API_URL}/properties/${prop.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
              showToast('Статусът е променен');
              loadProperties();
            } else showToast(data.message || 'Грешка при промяна на статуса');
          } catch {
            showToast('Грешка при промяна на статуса');
          }
        });

        div.appendChild(adminBtns);
      }

      propertiesContainer.appendChild(div);
    });
  } catch {
    showToast('Грешка при зареждане на имотите');
  }
}

// Load wishlist panel
export async function loadWishlistPanel() {
  if (!wishlistList || !username) return;
  try {
    const items = await getWishlist();
    wishlistList.innerHTML = '';
    if (!items.length) {
      wishlistList.innerHTML = '<p>Списъкът с желания е празен</p>';
      return;
    }

    items.forEach(id => {
      const propDiv = document.createElement('div');
      propDiv.textContent = `Имот ID: ${id}`;
      wishlistList.appendChild(propDiv);
    });
  } catch {
    wishlistList.innerHTML = '<p>Грешка при зареждане на списъка с желания</p>';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadProperties();
  loadWishlistPanel();
});
