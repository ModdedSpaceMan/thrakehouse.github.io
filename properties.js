import { role } from './ui.js';
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

const propertiesContainer = document.getElementById('propertiesContainer');

export async function loadProperties() {
  if (!propertiesContainer) return;

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
      div.className = 'property-card';
      div.innerHTML = `
        <h3>${prop.name}</h3>
        <p>${prop.location}</p>
        <p>Цена: ${prop.price}</p>
        <p>Тип: ${prop.type}</p>
        <p>Статус: ${prop.status}</p>
        ${prop.image ? `<img src="${prop.image}" alt="${prop.name}" />` : ''}
        <button class="wishlist-btn" data-id="${prop.id}">Добави в списък</button>
        ${role === 'admin' ? `<button class="edit-btn" data-id="${prop.id}">Редактирай</button>
        <button class="delete-btn" data-id="${prop.id}">Изтрий</button>` : ''}
      `;
      propertiesContainer.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    propertiesContainer.innerHTML = '<p>Грешка при зареждане на имотите</p>';
  }
}

// Wishlist buttons
document.addEventListener('click', async e => {
  if (!e.target.classList.contains('wishlist-btn')) return;
  const propId = e.target.dataset.id;
  const username = localStorage.getItem('username');
  if (!username) return alert('Моля, влезте в профила си');

  try {
    await fetch(`${API_URL}/wishlists/${username}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, propertyId })
    });
    alert('Имотът е добавен в списъка!');
  } catch {
    alert('Грешка при добавяне в списъка');
  }
});

// Admin edit/delete
document.addEventListener('click', async e => {
  if (e.target.classList.contains('delete-btn')) {
    const id = e.target.dataset.id;
    if (!confirm('Сигурни ли сте, че искате да изтриете този имот?')) return;

    try {
      await fetch(`${API_URL}/properties/${id}`, { method: 'DELETE' });
      loadProperties();
    } catch {
      alert('Грешка при изтриване на имота');
    }
  }
});

export { loadProperties };
