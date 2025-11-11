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
        wishlistBtn.addEventListener('click', () => {
          if (wishlistBtn.classList.contains('added')) {
            removeFromWishlist(prop.id);
            wishlistBtn.classList.remove('added');
          } else {
            addToWishlist(prop.id);
            wishlistBtn.classList.add('added');
          }
        });
        div.appendChild(wishlistBtn);
      }

      // Admin buttons (only if admin)
      if (role === 'admin') {
        const adminBtns = document.createElement('div');
        adminBtns.className = 'admin-buttons-right';
        adminBtns.innerHTML = `
          <button class="edit-btn" onclick="editProperty('${prop.id}')">Редактирай</button>
          <button class="delete-btn" onclick="deleteProperty('${prop.id}')">Изтрий</button>
          <button class="toggle-btn" onclick="togglePropertyStatus('${prop.id}')">Смени статус</button>
          <div class="admin-id">${prop.id}</div>
        `;
        div.appendChild(adminBtns);
      }

      propertiesContainer.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    showToast('Грешка при зареждане на имотите');
  }
}

// Dummy functions for admin buttons — implement real API calls
window.editProperty = function(id) { showToast(`Редакция на имот ${id}`); }
window.deleteProperty = function(id) { showToast(`Изтриване на имот ${id}`); }
window.togglePropertyStatus = function(id) { showToast(`Смяна на статус за имот ${id}`); }
