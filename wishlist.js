import { showToast } from './ui.js';
import { loadProperties, openPropertyModal } from './properties.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
export let wishlistIds = [];

const wishlistBtn = document.getElementById('wishlistBtn');
const wishlistModal = document.getElementById('wishlistModal');
const closeWishlist = document.getElementById('closeWishlist');
const wishlistContent = document.getElementById('wishlistContent');

// Load wishlist from localStorage
export async function loadWishlist() {
  const saved = JSON.parse(localStorage.getItem('wishlist')) || [];
  wishlistIds = saved;
  updateTopWishlistBtn();
}

// Toggle wishlist
export async function toggleWishlist(id) {
  if (!wishlistIds.includes(id)) wishlistIds.push(id);
  else wishlistIds = wishlistIds.filter(wid => wid !== id);

  localStorage.setItem('wishlist', JSON.stringify(wishlistIds));
  updateTopWishlistBtn();
  await renderWishlist();
}

// Update main menu wishlist button
function updateTopWishlistBtn() {
  if (!wishlistBtn) return;
  wishlistBtn.style.display = wishlistIds.length ? 'inline-block' : 'none';
  wishlistBtn.textContent = `Списък ♥ (${wishlistIds.length})`;
}

// Render wishlist modal
export async function renderWishlist() {
  if (!wishlistContent) return;

  const allProperties = await loadProperties();
  const savedProps = allProperties.filter(p => wishlistIds.includes(p.id));

  if (!savedProps.length) {
    wishlistContent.innerHTML = '<p>Вашият списък е празен.</p>';
    return;
  }

  wishlistContent.innerHTML = savedProps.map(p => `
    <div class="wishlist-item" data-id="${p.id}" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <span>${p.name} (${p.category}) - ${p.price}лв</span>
      <button class="openBtn">Преглед</button>
    </div>
  `).join('');

  wishlistContent.querySelectorAll('.openBtn').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.target.closest('.wishlist-item').dataset.id;
      wishlistModal.setAttribute('aria-hidden','true');
      openPropertyModal(id, localStorage.getItem('role')==='admin');
    });
  });
}

// Open wishlist modal
wishlistBtn?.addEventListener('click', async () => {
  wishlistModal.setAttribute('aria-hidden','false');
  await renderWishlist();
});

// Close modal
closeWishlist?.addEventListener('click', () => {
  wishlistModal.setAttribute('aria-hidden','true');
});

// Auto-load on page load
document.addEventListener('DOMContentLoaded', loadWishlist);
