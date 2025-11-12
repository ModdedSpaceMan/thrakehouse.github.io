const propertiesContainer = document.getElementById('properties');
let properties = [];

async function loadProperties() {
  try {
    const res = await fetch('/properties');
    properties = await res.json();
    renderProperties(properties);
  } catch (err) {
    console.error('Error loading properties:', err);
  }
}

function renderProperties(list) {
  propertiesContainer.innerHTML = '';
  list.forEach(p => {
    const div = document.createElement('div');
    div.className = 'property-card';
    div.innerHTML = `
      <h3>${p.name}</h3>
      <p>${p.location}</p>
      <p>${p.price} лв</p>
      <button class="viewPropertyBtn" data-id="${p.id}">Виж</button>
    `;
    propertiesContainer.appendChild(div);
  });

  document.querySelectorAll('.viewPropertyBtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      const prop = properties.find(p => p.id === id);
      if (!prop) return;

      document.getElementById('modalTitle').textContent = prop.name;
      document.getElementById('modalLocation').textContent = prop.location;
      document.getElementById('modalPrice').textContent = prop.price + ' лв';
      document.getElementById('modalType').textContent = prop.type;
      document.getElementById('modalCategory').textContent = prop.category;
      document.getElementById('modalImage').src = prop.image || '';

      document.getElementById('propertyModal').style.display = 'block';
    });
  });
}

document.getElementById('closePropertyModal').addEventListener('click', () => {
  document.getElementById('propertyModal').style.display = 'none';
});

loadProperties();
