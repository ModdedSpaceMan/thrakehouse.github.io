const API_URL = 'https://my-backend.martinmiskata.workers.dev';
const propertiesContainer = document.getElementById('propertiesContainer');

export async function loadProperties() {
  if (!propertiesContainer) return;

  const role = localStorage.getItem('role') || '';

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
        ${role === 'admin' ? `
          <button class="edit-btn" data-id="${prop.id}">Редактирай</button>
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
  if (e.target.classList.contains('wishlist-btn')) {
    const propId = e.target.dataset.id;
    const username = localStorage.getItem('username');
    if (!username) return alert('Моля, влезте в профила си');

    try {
      await fetch(`${API_URL}/wishlists/${username}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, propertyId: propId })
      });
      alert('Имотът е добавен в списъка!');
    } catch {
      alert('Грешка при добавяне в списъка');
    }
  }
});

// Admin edit/delete
document.addEventListener('click', async e => {
  const role = localStorage.getItem('role') || '';

  if (role !== 'admin') return;

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

  if (e.target.classList.contains('edit-btn')) {
    const id = e.target.dataset.id;
    // Open edit form
    import('./propertyForm.js').then(mod => {
      const propCard = e.target.closest('.property-card');
      const property = {
        id,
        name: propCard.querySelector('h3')?.textContent || '',
        location: propCard.querySelectorAll('p')[0]?.textContent || '',
        price: parseFloat(propCard.querySelectorAll('p')[1]?.textContent.replace('Цена: ', '')) || 0,
        type: propCard.querySelectorAll('p')[2]?.textContent.replace('Тип: ', '') || '',
        status: propCard.querySelectorAll('p')[3]?.textContent.replace('Статус: ', '') || '',
        image: propCard.querySelector('img')?.src || ''
      };
      mod.openPropertyFormForEdit(property);
    });
  }
});
