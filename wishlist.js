import { showToast } from './ui.js';
import { toggleWishlist as mainToggleWishlist } from './properties.js';

const wishlistContainer = document.getElementById('wishlistProperties');
const username = localStorage.getItem('username');

let propertiesData = [];
let wishlistIds = [];

// --------------------
// Fetch and MAP properties (MATCHES properties.js format)
// --------------------
// Fetch and MAP properties (MATCHES properties.js format)
async function fetchProperties() {
  try {
    const res = await fetch('https://my-backend.martinmiskata.workers.dev/properties');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    // Parse the response
    const data = await res.json();

    // Check if 'data' is an array before trying to map
    if (!Array.isArray(data)) {
      throw new Error('Expected an array of properties but received something else');
    }

    // FIX: Transform raw backend data into same structure used in properties.js
    return data.map(p => ({
      ...p,
      firstImage: typeof p.firstImage === "string" ? p.firstImage.trim() : "",
      restImages: [],
      _fetchedImages: false
    }));

  } catch (err) {
    console.error('Failed to fetch properties:', err);
    return []; // Return an empty array in case of error
  }
}


// --------------------
// Load wishlist from backend
export async function loadWishlist() {
  if (!username) {
    wishlistContainer.innerHTML = '<p>Трябва да сте влезли, за да видите wishlist.</p>';
    return;
  }

  try {
    // Fetch properties (with FIXED mapping)
    propertiesData = await fetchProperties();

    // Fetch wishlist for the user
    const res = await fetch(`https://my-backend.martinmiskata.workers.dev/wishlists/${username}`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const validIds = propertiesData.map(p => String(p.id));

    wishlistIds = (data.items || []).filter(id => validIds.includes(String(id)));

    console.log('Wishlist backend IDs:', wishlistIds);
    console.log('All properties IDs:', validIds);

    renderWishlist();
  } catch (err) {
    console.error(err);
    wishlistContainer.innerHTML = '<p>Грешка при зареждане на wishlist.</p>';
  }
}

// --------------------
// Render wishlist
export function renderWishlist() {
  if (!wishlistContainer) return;

  const savedProps = propertiesData.filter(p => wishlistIds.includes(String(p.id)));

  console.log("Saved properties:", savedProps);

  if (!savedProps.length) {
    wishlistContainer.innerHTML = '<p>Вашият списък е празен.</p>';
    return;
  }

  wishlistContainer.innerHTML = savedProps
    .map(p => {
      const id = p.id ?? '-';
      const title = p.title ?? 'Без име';
      const price = p.price != null ? p.price + ' лева' : '-';
      const category = p.category ?? '-';
      const status = p.status ?? '-';
      const bedrooms = p.bedrooms ?? '-';
      const bathrooms = p.bathrooms ?? '-';
      const size = p.size != null ? p.size + ' м²' : '-';
      const year = p.year ?? '-';

      // FIXED: wishlist images now work
      const image = p.firstImage || p.restImages?.[0] || '';

      const inWishlist = wishlistIds.includes(String(id)) ? '❤️' : '🤍';

      return `
        <div class="property" data-id="${id}">
          ${image ? `<img src="${image}" alt="${title}" loading="lazy">` : ''}

          <div class="property-id-box">ID: ${id}</div>

          <div class="property-content">
            <h3>${title}</h3>
            <p><strong>Цена:</strong> ${price}</p>
            <p><strong>Категория:</strong> ${category}</p>
            <p><strong>Статус:</strong> ${status}</p>
            <p><strong>Спални:</strong> ${bedrooms}</p>
            <p><strong>Бани:</strong> ${bathrooms}</p>
            <p><strong>Площ:</strong> ${size}</p>
            <p><strong>Година:</strong> ${year}</p>
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
// Click listeners
function attachListeners() {
  // Open modal on card click
  wishlistContainer.querySelectorAll('.property').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') return;
      const id = card.dataset.id;
      const property = propertiesData.find(p => p.id == id);
      if (!property) return showToast('Не може да се зареди имотът');
      window.openPropertyDetails(property); // open modal from main script
    });
  });

  // Wishlist toggle
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
document.addEventListener('DOMContentLoaded', loadWishlist);
