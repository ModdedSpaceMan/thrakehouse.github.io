// properties.js
import { showToast } from './ui.js';
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

export async function loadProperties() {
  try {
    const res = await fetch(`${API_URL}/properties`);
    const data = await res.json();
    const container = document.getElementById('properties');
    if (!container) return;
    container.innerHTML = '';

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = '<p>Няма налични имоти.</p>';
      return;
    }

    data.forEach(prop => {
      const card = document.createElement('div');
      card.className = 'property-card';
      card.innerHTML = `
        <img src="${prop.image || 'assets/no-image.png'}" alt="${prop.name}" />
        <h3>${prop.name}</h3>
        <p>${prop.location} • ${prop.price || 0} лв</p>
        <p>Статус: ${prop.status || 'Неизвестен'}</p>
        <button class="wishlist-btn" data-id="${prop.id}">Добави в списъка</button>
      `;
      container.appendChild(card);
    });

    // Attach click listeners to all wishlist buttons
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        await addToWishlist(id);
      });
    });
  } catch (err) {
    console.error(err);
    showToast('Грешка при зареждане на имоти');
  }
}

async function addToWishlist(propertyId) {
  const username = localStorage.getItem('username');
  if (!username) {
    showToast('Моля, влезте в профила си.');
    return;
  }
  try {
    const res = await fetch(`${API_URL}/wishlists/${username}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, propertyId })
    });
    const data = await res.json();
    if (data.success) showToast('Добавено в списъка!');
    else showToast('Неуспешно добавяне');
  } catch (err) {
    console.error(err);
    showToast('Грешка при добавяне към списъка');
  }
}

document.addEventListener('DOMContentLoaded', loadProperties);
