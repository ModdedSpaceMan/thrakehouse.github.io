// properties.js
import { showToast } from './ui.js';
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

export async function loadProperties() {
  try {
    const res = await fetch(`${API_URL}/properties`);
    const data = await res.json();
    const container = document.getElementById('properties');
    container.innerHTML = '';

    data.forEach(prop => {
      const card = document.createElement('div');
      card.className = 'property-card';
      card.innerHTML = `
        <img src="${prop.image || ''}" />
        <h3>${prop.name}</h3>
        <p>${prop.location} • ${prop.price} лв</p>
        <p>Status: ${prop.status}</p>
        <button onclick="addToWishlist('${prop.id}')">Добави в списъка</button>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    showToast('Грешка при зареждане на имоти');
  }
}
