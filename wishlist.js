import { showToast } from './ui.js';
import { loadProperties, openPropertyModal } from './properties.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
export let wishlistIds = [];

const wishlistBtn = document.getElementById('wishlistBtn');
const wishlistModal = document.getElementById('wishlistModal');
const closeWishlist = document.getElementById('closeWishlist');
const wishlistContent = document.getElementById('wishlistContent');

let savedProps = [];
let currentIndex = 0;

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
export async function renderWishlist(index = 0) {
  if (!wishlistContent) return;

  const allProperties = await loadProperties();
  savedProps = allProperties.filter(p => wishlistIds.includes(p.id));

  if (!savedProps.length) {
    wishlistContent.innerHTML = '<p>Вашият списък е празен.</p>';
    return;
  }

  currentIndex = index < 0 ? savedProps.length - 1 : index % savedProps.length;
  const p = savedProps[currentIndex];

  wishlistContent.innerHTML = `
    <div class="wishlist-item-detail" style="text-align:center;">
      <img src="${p.image}" alt="${p.name}" style="max-width:90%; border-radius:12px; margin-bottom:10px;">
      <h3>${p.name}</h3>
      <p><strong>Локация:</strong> ${p.location}</p>
      <p><strong>Цена:</strong> ${p.price}</p>
      <p><strong>Категория:</strong> ${p.category}</p>
      <p><strong>Тип:</strong> ${p.type}</p>
      <p><strong>Статус:</strong> ${p.status || '-'}</p>
      <div style="margin-top:12px; display:flex; justify-content:center; gap:10px;">
        <button id="prevWishBtn">Prev</button>
        <button id="openWishBtn">Open</button>
        <button id="nextWishBtn">Next</button>
      </div>
    </div>
  `;

  // Event listeners
  document.getElementById('prevWishBtn').addEventListener('click', () => renderWishlist(currentIndex - 1));
  document.getElementById('nextWishBtn').addEventListener('click', () => renderWishlist(currentIndex + 1));
  document.getElementById('openWishBtn').addEventListener('click', () => {
    wishlistModal.setAttribute('aria-hidden', 'true');
    openPropertyModal(p.id, localStorage.getItem('role') === 'admin');
  });
}

// Open wishlist modal
wishlistBtn?.addEventListener('click', async () => {
  wishlistModal.setAttribute('aria-hidden', 'false');
  await renderWishlist(0);
});

// Close modal
closeWishlist?.addEventListener('click', () => {
  wishlistModal.setAttribute('aria-hidden', 'true');
});

// Auto-load on page load
document.addEventListener('DOMContentLoaded', loadWishlist);
