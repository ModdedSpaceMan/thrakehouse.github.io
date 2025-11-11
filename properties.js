document.addEventListener('DOMContentLoaded', () => {
  initProperties();
});

async function initProperties() {
  const propertyContainer = document.getElementById('properties');
  if (!propertyContainer) return;

  try {
    const res = await fetch('/api/properties', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });

    if (!res.ok) throw new Error('Failed to fetch properties');

    const properties = await res.json();
    renderProperties(properties, propertyContainer);
  } catch (err) {
    console.error('Error loading properties:', err);
  }
}

function renderProperties(properties, container) {
  container.innerHTML = '';

  if (!Array.isArray(properties) || properties.length === 0) {
    container.innerHTML = '<p>No properties found.</p>';
    return;
  }

  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  for (const property of properties) {
    const card = document.createElement('div');
    card.className = 'property-card';
    card.innerHTML = `
      <img src="${property.image}" alt="${property.name}">
      <h3>${property.name}</h3>
      <p>Location: ${property.location}</p>
      <p>Type: ${property.type}</p>
      <p>Price: $${property.price}</p>
      <p>Status: ${property.status}</p>
      ${isAdmin ? `
        <div class="admin-controls">
          <button class="edit-btn" data-id="${property.id}">Edit</button>
          <button class="delete-btn" data-id="${property.id}">Delete</button>
          <button class="toggle-btn" data-id="${property.id}">
            ${property.status === 'free' ? 'Mark as Taken' : 'Mark as Free'}
          </button>
        </div>
      ` : ''}
    `;
    container.appendChild(card);
  }

  if (isAdmin) attachAdminListeners();
}

function attachAdminListeners() {
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = e.target.dataset.id;
      if (!confirm('Delete this property?')) return;
      await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      initProperties();
    });
  });

  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = e.target.dataset.id;
      await fetch(`/api/properties/${id}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      initProperties();
    });
  });

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.target.dataset.id;
      window.location.href = `/admin/edit-property.html?id=${id}`;
    });
  });
}
