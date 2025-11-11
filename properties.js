import { addToWishlist, removeFromWishlist } from './wishlist.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
const propertiesContainer = document.getElementById('properties');

const currentUsername = localStorage.getItem('username');
const currentUserRole = localStorage.getItem('role') || 'user';

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
      div.className = 'property';
      if (prop.status === 'taken') div.classList.add('taken');

      div.innerHTML = `
        <div class="property-id" style="display:none;">ID: ${prop.id}</div>
        ${prop.status ? `<div class="status-badge">${prop.status === 'free' ? 'Свободен' : 'Зает'}</div>` : ''}
        ${prop.image ? `<img src="${prop.image}" alt="${prop.name}" />` : ''}
        <div class="property-content">
          <h3>${prop.name}</h3>
          <p>${prop.location}</p>
          <p>Цена: ${prop.price}</p>
          <p>Тип: ${prop.type}</p>
        </div>
        <div class="admin-buttons-right" ${currentUserRole !== 'admin' ? 'style="display:none;"' : ''}>
          <button class="admin-btn edit-btn">Edit</button>
          <button class="admin-btn delete-btn">Delete</button>
          <button class="admin-btn toggle-btn">${prop.status === 'free' ? 'Свободен' : 'Зает'}</button>
        </div>
        <button class="wishlist-btn">♥</button>
      `;

      propertiesContainer.appendChild(div);

      const deleteBtn = div.querySelector('.delete-btn');
      const editBtn = div.querySelector('.edit-btn');
      const toggleBtn = div.querySelector('.toggle-btn');
      const wishlistBtn = div.querySelector('.wishlist-btn');

      // DELETE
      if (deleteBtn) {
        deleteBtn.addEventListener('click', async e => {
          e.stopPropagation();
          if (!prop.id) return;
          if (!confirm(`Сигурни ли сте, че искате да изтриете "${prop.name}"?`)) return;
          try {
            const res = await fetch(`${API_URL}/properties/${prop.id}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) throw new Error('Неуспешно изтриване');
            div.remove();
          } catch (err) {
            console.error(err);
            alert('Грешка при изтриване на имота');
          }
        });
      }

      // EDIT
      if (editBtn) {
        editBtn.addEventListener('click', async e => {
          e.stopPropagation();
          if (!prop.id) return;

          const newName = prompt('Ново име на имота:', prop.name);
          if (!newName) return;
          const newLocation = prompt('Нова локация:', prop.location);
          if (!newLocation) return;

          try {
            const res = await fetch(`${API_URL}/properties/${prop.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ property: { ...prop, name: newName, location: newLocation }, role: currentUserRole })
            });
            if (!res.ok) throw new Error('Неуспешно обновяване');

            prop.name = newName;
            prop.location = newLocation;

            const content = div.querySelector('.property-content');
            content.querySelector('h3').textContent = newName;
            content.querySelector('p').textContent = newLocation;
          } catch (err) {
            console.error(err);
            alert('Грешка при обновяване на имота');
          }
        });
      }

      // TOGGLE STATUS
      if (toggleBtn) {
        toggleBtn.addEventListener('click', async e => {
          e.stopPropagation();
          if (!prop.id) return;

          const newStatus = prop.status === 'free' ? 'taken' : 'free';

          try {
            const res = await fetch(`${API_URL}/properties/${prop.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ property: { ...prop, status: newStatus }, role: currentUserRole })
            });
            if (!res.ok) throw new Error('Неуспешно обновяване');

            prop.status = newStatus;
            toggleBtn.textContent = newStatus === 'free' ? 'Свободен' : 'Зает';

            const badge = div.querySelector('.status-badge');
            if (badge) {
              badge.textContent = newStatus === 'free' ? 'Свободен' : 'Зает';
            } else {
              const newBadge = document.createElement('div');
              newBadge.className = 'status-badge';
              newBadge.textContent = newStatus === 'free' ? 'Свободен' : 'Зает';
              div.insertBefore(newBadge, div.firstChild);
            }

            div.classList.toggle('taken', newStatus === 'taken');
          } catch (err) {
            console.error(err);
            alert('Грешка при обновяване на статуса');
          }
        });
      }

      // WISHLIST
      if (wishlistBtn && currentUsername) {
        wishlistBtn.addEventListener('click', async e => {
          e.stopPropagation();
          if (!prop.id) return;
          if (wishlistBtn.classList.contains('added')) {
            await removeFromWishlist(prop.id);
          } else {
            await addToWishlist(prop.id);
          }
        });
      }

      // Update wishlist button state
      if (wishlistBtn && currentUsername) {
        const wishlistIds = JSON.parse(localStorage.getItem('wishlist') || '[]');
        if (wishlistIds.includes(prop.id)) {
          wishlistBtn.classList.add('added');
          wishlistBtn.style.color = '#ff6b6b';
        } else {
          wishlistBtn.classList.remove('added');
          wishlistBtn.style.color = '#fff';
        }
      }
    });

  } catch (err) {
    console.error(err);
    propertiesContainer.innerHTML = '<p>Грешка при зареждане на имотите</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadProperties);
