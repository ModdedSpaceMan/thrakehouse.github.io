import { showToast } from './ui.js';
import { toggleWishlist as mainToggleWishlist } from './properties.js';

const wishlistContainer = document.getElementById('wishlistProperties');
const username = localStorage.getItem('username');

let propertiesData = [];
let wishlistIds = [];

// --------------------
// Fetch all properties with full details
async function fetchProperties() {
  try {
    const res = await fetch('https://my-backend.martinmiskata.workers.dev/properties');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (!Array.isArray(data.items)) throw new Error('Expected an array of properties');

    // Detect if backend returned only IDs
    if (typeof data.items[0] === 'string' || typeof data.items[0] === 'number') {
      // Only IDs returned, fetch full details per property
      const props = await Promise.all(
        data.items.map(async id => {
          const r = await fetch(`https://my-backend.martinmiskata.workers.dev/properties/${id}`);
          if (!r.ok) throw new Error(`Failed to fetch property ${id}`);
          const p = await r.json();
          return {
            id: p.id,
            title: p.title ?? 'Без име',
            price: p.price ?? null,
            category: p.category ?? '-',
            status: p.status ?? '-',
            bedrooms: p.bedrooms ?? '-',
            bathrooms: p.bathrooms ?? '-',
            size: p.size ?? null,
            year: p.year ?? '-',
            firstImage: p.firstImage || '',
            restImages: p.restImages || [],
            _fetchedImages: true
          };
        })
      );
      return props;
    }

    // Already full objects
    return data.items.map(p => ({
      id: p.id,
      title: p.title ?? 'Без име',
      price: p.price ?? null,
      category: p.category ?? '-',
      status: p.status ?? '-',
      bedrooms: p.bedrooms ?? '-',
      bathrooms: p.bathrooms ?? '-',
      size: p.size ?? null,
      year: p.year ?? '-',
      firstImage: p.firstImage || p.images?.[0] || '',
      restImages: p.restImages || p.images?.slice(1) || [],
      _fetchedImages: true
    }));

  } catch (err) {
    console.error('Failed to fetch properties:', err);
    return [];
  }
}

// --------------------
// Load wishlist for the logged-in user
export async function loadWishlist() {
  if (!username) {
    wishlistContainer.innerHTML = '<p>Трябва да сте влезли, за да видите wishlist.</p>';
    return;
  }

  try {
    // Fetch all properties
    propertiesData = await fetchProperties();
    console.log('Fetched properties:', propertiesData);

    // Fetch wishlist IDs
    const res = await fetch(`https://my-backend.martinmiskata.workers.dev/wishlists/${username}`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const validIds = propertiesData.map(p => String(p.id));
    wishlistIds = (data.items || []).filter(id => validIds.includes(String(id)));
    console.log('Wishlist IDs:', wishlistIds);

    renderWishlist();
  } catch (err) {
    console.error(err);
    wishlistContainer.innerHTML = '<p>Грешка при зареждане на wishlist.</p>';
  }
}

// --------------------
// Render wishlist properties
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
      const price = p.price != null ? p.price + ' лева' : '-';
      const category = p.category ?? '-';
      const status = p.status ?? '-';
      const bedrooms = p.bedrooms ?? '-';
      const bathrooms = p.bathrooms ?? '-';
      const size = p.size != null ? p.size + ' м²' : '-';
      const year = p.year ?? '-';
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
// Attach click listeners
function attachListeners() {
  wishlistContainer.querySelectorAll('.property').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') return;
      const id = card.dataset.id;
      const property = propertiesData.find(p => p.id == id);
      if (!property) return showToast('Не може да се зареди имотът');
      window.openPropertyDetails(property); // modal gets full images
    });
  });

  wishlistContainer.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      await mainToggleWishlist(btn.dataset.id);
      loadWishlist();
    });
  });
}

// --------------------
// Initialize
document.addEventListener('DOMContentLoaded', loadWishlist);
