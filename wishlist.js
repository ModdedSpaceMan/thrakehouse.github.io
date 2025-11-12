// wishlist.js
import { showToast } from './ui.js';
import { loadProperties } from './properties.js';

const wishlistBtn = document.getElementById('wishlistBtn');
const wishlistModal = document.getElementById('wishlistModal');
const closeWishlist = document.getElementById('closeWishlist');
const wishlistContent = document.getElementById('wishlistContent');

let wishlistIds = [];

// Safe addEventListener
function safeAddListener(el, evt, fn) {
  if (el) el.addEventListener(evt, fn);
}

// Load wishlist from localStorage
export async function loadWishlist() {
  const stored = localStorage.getItem('wishlist');
  wishlistIds = stored ? JSON.parse(stored) : [];
  return wishlistIds;
}

// Save wishlist to localStorage
function saveWishlist() {
  localStorage.setItem('wishlist', JSON.stringify(wishlistIds));
}

// Toggle wishlist for a property
export function toggleWishlist(id) {
  const index = wishlistIds.indexOf(id);
  if (index >= 0) {
    wishlistIds.splice(index, 1);
    showToast('Премахнато от списъка');
  } else {
    wishlistIds.push(id);
    showToast('Добавено в списъка');
  }
  saveWishlist();
  awaitRefreshProperties();
}

// Refresh property cards to update heart buttons
async function awaitRefreshProperties() {
  await loadProperties();
}

// Render wishlist modal content
export async function renderWishlist() {
  await loadWishlist();

  if (!wishlistContent) return;

  if (!wishlistIds.length) {
    wishlistContent.innerHTML = '<p>Нямате запазени имоти.</p>';
    return;
  }

  const token = localStorage.getItem('token');
  let html = '';

  for (let id of wishlistIds) {
    try {
      const res = await fetch(`https://my-backend.martinmiskata.workers.dev/properties/${id}`, {
        headers: token ? { 'Authorization': 'Bearer ' + token } : {}
      });
      if (!res.ok) continue;
      const p = await res.json();
      html += `
        <div class="wishlist-item" data-id="${p.id}">
          <h4>${p.name}</h4>
          <p>${p.location}</p>
          <p>${p.price} | ${p.category}</p>
          <button class="removeWishlistBtn" data-id="${p.id}">Премахни</button>
        </div>
      `;
    } catch (err) {
      console.error(err);
    }
  }

  wishlistContent.innerHTML = html;

  // Add remove listeners
  wishlistContent.querySelectorAll('.removeWishlistBtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      wishlistIds = wishlistIds.filter(w => w !== id);
      saveWishlist();
      renderWishlist();
      awaitRefreshProperties();
    });
  });
}

// Top-nav wishlist button
safeAddListener(wishlistBtn, 'click', async () => {
  if (!wishlistModal) return;
  wishlistModal.setAttribute('aria-hidden', 'false');
  await renderWishlist();
});

// Close wishlist modal
safeAddListener(closeWishlist, 'click', () => {
  if (wishlistModal) wishlistModal.setAttribute('aria-hidden', 'true');
});

// Return list of IDs
export function getWishlistIds() {
  return wishlistIds;
}
