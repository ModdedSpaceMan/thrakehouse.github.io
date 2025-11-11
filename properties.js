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
      `;
      propertiesContainer.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    propertiesContainer.innerHTML = '<p>Грешка при зареждане на имотите</p>';
  }
}

// Optional: call this on page load
document.addEventListener('DOMContentLoaded', loadProperties);
