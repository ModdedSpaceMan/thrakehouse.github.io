import { showToast } from './ui.js';
import { loadProperties, toggleWishlist as mainToggleWishlist, wishlistIds as mainWishlistIds } from './properties.js';

const wishlistContainer = document.getElementById('wishlistProperties');

let propertiesData = [];
let username = localStorage.getItem('username');
let role = localStorage.getItem('role');
let wishlistIds = [];

// --------------------
// Load wishlist for logged-in user
// --------------------
export async function loadWishlist() {
  if (!username) {
    wishlistIds = [];
    renderWishlist();
    return;
  }

  try {
    // Fetch all properties
    propertiesData = await loadProperties();

    // Filter wishlist
    wishlistIds = mainWishlistIds; // get from properties.js global
    renderWishlist();
  } catch (err) {
    console.error(err);
    wishlistContainer.innerHTML = "<p>Грешка при зареждане на wishlist.</p>";
  }
}

// --------------------
// Render wishlist
// --------------------
export function renderWishlist() {
  if (!wishlistContainer) return;

  const savedProps = propertiesData.filter(p => wishlistIds.includes(String(p.id)));

  if (!savedProps.length) {
    wishlistContainer.innerHTML = '<p>Вашият списък е празен.</p>';
    return;
  }

  wishlistContainer.innerHTML = savedProps
    .map(p => {
      const id = p.id ?? '-';
      const title = p.title ?? 'Без име';
      const price = p.price ?? '-';
      const category = p.category ?? '-';
      const status = p.status ?? '';
      const bedrooms = p.bedrooms ?? '-';
      const bathrooms = p.bathrooms ?? '-';
      const size = p.size ? p.size + ' m²' : '-';
      const image = p.images?.[0] ?? '';

      const inWishlist = wishlistIds.includes(String(id)) ? '❤️' : '🤍';

      const adminButtons = role === 'admin' ? `
        <div class="admin-buttons-right">
          <button class="wishlist-btn" data-id="${id}">${inWishlist}</button>
          <button class="delete-btn" data-id="${id}">Изтрий</button>
          ${category === 'rental' ? `<button class="toggle-status-btn" data-id="${id}">
            ${status === "free" ? "Зает" : "Свободен"}
          </button>` : ''}
        </div>
      ` : `<button class="wishlist-btn" data-id="${id}">${inWishlist}</button>`;

      return `
        <div class="property" data-id="${id}">
          ${image ? `<img src="${image}" alt="${title}">` : ''}
          <div class="property-content">
            <h3>${title}</h3>
            <p><strong>Цена:</strong> ${price} лева</p>
            <p><strong>Категория:</strong> ${category}</p>
            ${category === 'rental' ? `<p><strong>Статус:</strong> ${status}</p>` : ''}
            <p><strong>Спални:</strong> ${bedrooms}</p>
            <p><strong>Бани:</strong> ${bathrooms}</p>
            <p><strong>Площ:</strong> ${size}</p>
          </div>
          <div class="property-actions">
            ${adminButtons}
          </div>
        </div>
      `;
    })
    .join('');

  attachListeners();
}

// --------------------
// Attach click listeners
// --------------------
function attachListeners() {
  // Open modal on card click
  wishlistContainer.querySelectorAll('.property').forEach(card => {
    card.addEventListener('click', e => {
      // Ignore clicks on buttons
      if (e.target.tagName === 'BUTTON') return;

      const id = card.dataset.id;
      const property = propertiesData.find(p => p.id == id);
      if (!property) return showToast('Не може да се зареди имотът');
      window.openPropertyDetails(property);
    });
  });

  // Wishlist buttons
  wishlistContainer.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      await mainToggleWishlist(id);
      loadWishlist();
    });
  });

  // Admin buttons
  if (role === 'admin') {
    wishlistContainer.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (confirm('Наистина ли искате да изтриете този имот?')) {
          fetch(`${loadProperties.API_URL}/properties/${id}`, {
            method: 'DELETE',
            headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
          }).then(() => loadWishlist());
        }
      });
    });

    wishlistContainer.querySelectorAll('.toggle-status-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.id;
        fetch(`${loadProperties.API_URL}/properties/${id}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + localStorage.getItem('token')
          },
          body: JSON.stringify({ status: 'toggle' })
        }).then(() => loadWishlist());
      });
    });
  }
}

// --------------------
// Init
// --------------------
document.addEventListener('DOMContentLoaded', loadWishlist);
