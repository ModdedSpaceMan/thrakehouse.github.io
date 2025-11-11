import { showToast } from './ui.js';
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

let wishlistIds = [];
const token = localStorage.getItem('token'); // JWT from login/signup

// --- Helper: decode JWT payload ---
function getUsernameFromToken() {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[0]));
    return payload.username;
  } catch {
    return null;
  }
}

// --- Load Wishlist ---
export async function loadWishlist() {
  const username = getUsernameFromToken();
  if (!username) {
    wishlistIds = [];
    return;
  }

  try {
    const res = await fetch(`${API_URL}/wishlists/${username}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    wishlistIds = data.items || [];
  } catch (err) {
    console.error('Грешка при зареждане на списъка:', err);
    wishlistIds = [];
  }
}

// --- Toggle Wishlist Item ---
export async function toggleWishlist(propId) {
  const username = getUsernameFromToken();
  if (!username) { 
    showToast('Влезте, за да използвате списъка');
    return;
  }

  const inWishlist = wishlistIds.includes(propId);
  const endpoint = inWishlist ? 'remove' : 'add';

  try {
    const res = await fetch(`${API_URL}/wishlists/${username}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ propertyId: propId })
    });
    const data = await res.json();
    if (data.success) {
      if (inWishlist) {
        wishlistIds = wishlistIds.filter(id => id !== propId);
        showToast('Премахнато от списъка');
      } else {
        wishlistIds.push(propId);
        showToast('Добавено в списъка');
      }
      updateWishlistButtons();
    } else {
      showToast(data.message || 'Грешка при обновяване на списъка');
    }
  } catch (err) {
    console.error(err);
    showToast('Грешка при обновяване на списъка');
  }
}

// --- Update Buttons UI ---
export function updateWishlistButtons() {
  document.querySelectorAll('.property').forEach(div => {
    const propId = div.dataset.id;
    const btn = div.querySelector('.wishlist-btn');
    if (!btn) return;
    if (wishlistIds.includes(propId)) {
      btn.classList.add('added');
      btn.style.color = '#ff6b6b';
    } else {
      btn.classList.remove('added');
      btn.style.color = '#fff';
    }
  });
}
