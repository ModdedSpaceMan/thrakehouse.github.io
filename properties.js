const API_URL = 'https://my-backend.martinmiskata.workers.dev';
const propertiesContainer = document.getElementById('properties');

// Get role & username dynamically (saved at login)
const currentUserRole = localStorage.getItem('role') || 'user';
const currentUsername = localStorage.getItem('username') || '';

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

      div.innerHTML = `
        ${prop.status ? `<div class="status-badge">${prop.status === 'free' ? 'Свободен' : 'Зает'}</div>` : ''}
        ${prop.image ? `<img src="${prop.image}" alt="${prop.name}" />` : ''}
        <div class="property-content">
          <h3>${prop.name}</h3>
          <p>${prop.location}</p>
          <p>Цена: ${prop.price}</p>
          <p>Тип: ${prop.type}</p>
        </div>
        ${currentUserRole === 'admin' ? `
        <div class="admin-buttons-right">
          <button class="admin-btn edit-btn">Edit</button>
          <button class="admin-btn delete-btn">Delete</button>
          <button class="admin-btn toggle-btn">${prop.status === 'free' ? 'Свободен' : 'Зает'}</button>
        </div>
        ` : ''}
        <button class="wishlist-btn">♥</button>
      `;

      propertiesContainer.appendChild(div);

      if (currentUserRole !== 'admin') return; // Skip admin buttons for normal users

      const deleteBtn = div.querySelector('.delete-btn');
      const editBtn = div.querySelector('.edit-btn');
      const toggleBtn = div.querySelector('.toggle-btn');

      // DELETE
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!prop.id) return;
        if (confirm(`Сигурни ли сте, че искате да изтриете "${prop.name}"?`)) {
          try {
            const res = await fetch(`${API_URL}/properties/${prop.id}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: currentUserRole })
            });
            if (!res.ok) throw new Error('Неуспешно изтриване');
            div.remove();
          } catch (err) {
            console.error(err);
            alert('Грешка при изтриване на имота');
          }
        }
      });

      // EDIT
      editBtn.addEventListener('click', async (e) => {
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
            body: JSON.stringify({
              property: { ...prop, name: newName, location: newLocation },
              role: currentUserRole
            })
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

      // TOGGLE STATUS (PATCH)
      toggleBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!prop.id) return;

        const newStatus = prop.status === 'free' ? 'taken' : 'free';

        try {
          const res = await fetch(`${API_URL}/properties/${prop.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: newStatus,
              role: currentUserRole
            })
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
            div.appendChild(newBadge);
          }

          div.classList.toggle('taken', newStatus === 'taken');
        } catch (err) {
          console.error(err);
          alert('Грешка при обновяване на статуса');
        }
      });

    });

  } catch (err) {
    console.error(err);
    propertiesContainer.innerHTML = '<p>Грешка при зареждане на имотите</p>';
  }
}

// Auto-load
document.addEventListener('DOMContentLoaded', loadProperties);
