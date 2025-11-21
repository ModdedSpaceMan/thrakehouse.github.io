import { showToast } from './ui.js';
import { loadProperties, toggleWishlist as mainToggleWishlist } from './properties.js';

const wishlistContainer = document.getElementById('wishlistProperties');
const username = localStorage.getItem('username');

let propertiesData = [];
let wishlistIds = [];

// --------------------
// Load wishlist from backend
// --------------------
export async function loadWishlist() {
  if (!username) {
    wishlistContainer.innerHTML = '<p>Трябва да сте влезли, за да видите wishlist.</p>';
    return;
  }

  try {
    // Load all properties
    propertiesData = await loadProperties();

    // Load wishlist for the user from backend
    const res = await fetch(`https://my-backend.martinmiskata.workers.dev/wishlists/${username}`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const validIds = propertiesData.map(p => String(p.id));
    wishlistIds = (data.items || []).filter(id => validIds.includes(String(id)));

    renderWishlist();
  } catch (err) {
    console.error(err);
    wishlistContainer.innerHTML = '<p>Грешка при зареждане на wishlist.</p>';
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
            <button class="wishlist-btn" data-id="${id}">${inWishlist}</button>
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
  wishlistContainer.querySelectorAll('.property').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') return;
      const id = card.dataset.id;
      const property = propertiesData.find(p => p.id == id);
      if (!property) return showToast('Не може да се зареди имотът');
      window.openPropertyDetails(property);
    });
  });

  wishlistContainer.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      await mainToggleWishlist(btn.dataset.id);
      loadWishlist(); // reload after toggle
    });
  });
}

// --------------------
// Init
// --------------------
document.addEventListener('DOMContentLoaded', loadWishlist);
