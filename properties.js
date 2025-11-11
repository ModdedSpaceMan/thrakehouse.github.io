const API_URL = 'https://my-backend.martinmiskata.workers.dev';
const propertiesContainer = document.getElementById('properties');

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
    ${prop.status ? `<div class="status-badge">${prop.status}</div>` : ''}
    ${prop.image ? `<img src="${prop.image}" alt="${prop.name}" />` : ''}
    <div class="property-content">
      <h3>${prop.name}</h3>
      <p>${prop.location}</p>
      <p>Цена: ${prop.price}</p>
      <p>Тип: ${prop.type}</p>
    </div>
    <div class="admin-buttons-right">
      <button class="admin-btn edit-btn">Edit</button>
      <button class="admin-btn delete-btn">Delete</button>
      <button class="admin-btn toggle-btn">${prop.status === 'free' ? 'Свободен' : 'Зает'}</button>
    </div>
    <button class="wishlist-btn">♥</button>
  `;

  propertiesContainer.appendChild(div);

  // --- EVENT LISTENERS ---
  const deleteBtn = div.querySelector('.delete-btn');
  const editBtn = div.querySelector('.edit-btn');

  deleteBtn.addEventListener('click', /* delete code */ );
  editBtn.addEventListener('click', /* edit code */ );

});



  } catch (err) {
    console.error(err);
    propertiesContainer.innerHTML = '<p>Грешка при зареждане на имотите</p>';
  }
}

// Optional: call this on page load
document.addEventListener('DOMContentLoaded', loadProperties);
