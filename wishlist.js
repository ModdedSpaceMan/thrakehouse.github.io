import { showToast } from './ui.js';
import { loadProperties, openPropertyModal } from './properties.js';

export let wishlistIds = [];

const wishlistBtn = document.getElementById('wishlistBtn');
const wishlistModal = document.getElementById('wishlistModal');
const closeWishlist = document.getElementById('closeWishlist');
const wishlistContent = document.getElementById('wishlistContent');

// Load wishlist from localStorage
export async function loadWishlist() {
    const saved = JSON.parse(localStorage.getItem('wishlist')) || [];
    // Ensure all IDs are strings for consistency
    wishlistIds = saved.map(String);
    updateTopWishlistBtn();
}

// Toggle wishlist
export async function toggleWishlist(id) {
    id = String(id); // ensure string
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

// Render wishlist as property grid
export async function renderWishlist() {
    if (!wishlistContent) return;

    const allProperties = await loadProperties();
    // Match IDs as strings
    const savedProps = allProperties.filter(p => wishlistIds.includes(String(p.id)));

    if (!savedProps.length) {
        wishlistContent.innerHTML = '<p>Вашият списък е празен.</p>';
        return;
    }

    wishlistContent.innerHTML = `
        <div class="properties-grid">
            ${savedProps.map(p => `
                <div class="property-card" data-id="${p.id}">
                    <img src="${p.image}" alt="${p.name}">
                    <h3>${p.name}</h3>
                    <p>${p.location}</p>
                    <p><strong>${p.price}</strong></p>
                    <button class="openWishProperty">Детайли</button>
                </div>
            `).join('')}
        </div>
    `;

    // Click handler for each property
    wishlistContent.querySelectorAll('.openWishProperty')?.forEach(btn => {
        btn.addEventListener('click', e => {
            const id = e.target.closest('.property-card').dataset.id;
            wishlistModal.setAttribute('aria-hidden', 'true');
            openPropertyModal(id, localStorage.getItem('role') === 'admin');
        });
    });
}

// Open wishlist modal
wishlistBtn?.addEventListener('click', async () => {
    wishlistModal.setAttribute('aria-hidden', 'false');
    await renderWishlist();
});

// Close modal
closeWishlist?.addEventListener('click', () => {
    wishlistModal.setAttribute('aria-hidden', 'true');
});

// Auto-load on page load
document.addEventListener('DOMContentLoaded', loadWishlist);
