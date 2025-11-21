// mapping English type values to Bulgarian
const TYPE_BG = {
  apartment: "Апартамент",
  house: "Къща",
  villa: "Вила",
  farm: "Земеделски имот",
  regulated: "Земя в регулация"
};

// --------------------
// Render properties
// --------------------
export function renderProperties(properties) {
  if (!propertyContainer) return;

  if (!properties.length) {
    propertyContainer.innerHTML = '<p>Няма налични имоти.</p>';
    return;
  }

  propertyContainer.innerHTML = properties.map(p => {
    const id = p.id ?? '-';
    const title = p.title || 'Без име';
    const price = p.price ?? '-';
    const type = TYPE_BG[p.type] || p.type; // <-- Bulgarian type
    const category = p.category || '-';
    const status = p.status || 'Свободен';
    const bedrooms = p.bedrooms ?? '-';
    const bathrooms = p.bathrooms ?? '-';
    const size = p.size ? p.size + ' m²' : '-';
    const image = (p.images && p.images.length > 0) ? p.images[0] : '';
    
    const isRental = category.toLowerCase() === 'rental';
    const displayStatus = isRental ? (status.toLowerCase() === 'taken' ? 'Зает' : 'Свободен') : '';
    const inWishlist = wishlistIds.includes(String(id)) ? '❤️' : '🤍';
    const takenClass = isRental && status.toLowerCase() === 'taken' ? 'taken' : '';

    const adminButtons = role === 'admin' ? `
      <div class="admin-buttons-right">
        <button class="wishlist-btn" data-id="${id}">${inWishlist}</button>
        <button class="delete-btn" data-id="${id}">Изтрий</button>
        ${isRental ? `<button class="toggle-status-btn" data-id="${id}">
          ${displayStatus}
        </button>` : ''}
      </div>
    ` : `<button class="wishlist-btn" data-id="${id}">${inWishlist}</button>`;

    return `
      <div class="property ${takenClass}" data-id="${id}">
        ${image ? `<img src="${image}" alt="${title}">` : ''}
        
        <div class="property-content">
          <h3>${title}</h3>

          <p><strong>Тип:</strong> ${type}</p>
          <p><strong>Категория:</strong> ${isRental ? "Наем" : "Продажба"}</p>
          ${isRental ? `<p><strong>Статус:</strong> ${displayStatus}</p>` : ''}
          <p><strong>Спални:</strong> ${bedrooms}</p>
          <p><strong>Бани:</strong> ${bathrooms}</p>
          <p><strong>Площ:</strong> ${size}</p>
        </div>

        <div class="property-actions">
          ${adminButtons}
        </div>

        <div class="property-id">ID: ${id}</div>
      </div>
    `;
  }).join('');

  addEventListeners();
  addModalListeners();
}

// --------------------
// Property Details Modal
// --------------------
function openPropertyDetails(property) {
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? '-';
  };

  const type = TYPE_BG[property.type] || property.type;
  const status = property.status ? (property.status.toLowerCase() === 'taken' ? 'Зает' : 'Свободен') : 'Свободен';

  set("propTitle", property.title);
  set("propPrice", property.price ? property.price + " лева" : "-");
  set("propType", type);
  set("propCategory", property.category);
  set("propStatus", status);
  set("propBedrooms", property.bedrooms);
  set("propBathrooms", property.bathrooms);
  set("propArea", property.size ? property.size + " m²" : "-");
  set("propYear", property.year);
  set("propDescription", property.description || "-");

  const imgEl = document.getElementById("propImage");
  if (imgEl) {
    if (property.images && property.images.length > 0) {
      imgEl.src = property.images[0];
      imgEl.style.display = "block";
    } else {
      imgEl.style.display = "none";
    }
  }

  const modal = document.getElementById("propertyDetailsModal");
  if (modal) modal.style.display = "flex";
}


// --------------------
// Init
// --------------------
document.addEventListener('DOMContentLoaded', () => {
  initProperties();
});
