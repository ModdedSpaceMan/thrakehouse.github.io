// wishlist.js
import { loadProperties, openPropertyModal, toggleWishlist, wishlistIds } from './properties.js';

const wishlistBtn = document.getElementById('wishlistBtn');
const wishlistModal = document.getElementById('wishlistModal');
const closeWishlist = document.getElementById('closeWishlist');
const wishlistContent = document.getElementById('wishlistContent');

// Load wishlist from localStorage
export async function loadWishlistUI() {
    updateTopWishlistBtn();
}

// Update top wishlist button
function updateTopWishlistBtn() {
    if (!wishlistBtn) return;
    wishlistBtn.style.display = wishlistIds.length ? 'inline-block' : 'none';
    wishlistBtn.textContent = `Списък ♥ (${wishlistIds.length})`;
}

// Render wishlist properties
export async function renderWishlist() {
    if (!wishlistContent) return;

    const allProperties = await loadProperties();
    const savedProps = allProperties.filter(p => wishlistIds.includes(String(p.id)));

    if (!savedProps.length) {
        wishlistContent.innerHTML = '<p>Вашият списък е празен.</p>';
        return;
    }

    wishlistContent.innerHTML = `
        <div class="properties-grid">
            ${savedProps.map(p => `
                <div class="property-card" data-id="${p.id}">
                    <img src="${p.images?.[0] || ''}" alt="${p.title || 'Имот'}">
                    <h3>${p.title}</h3>
                    <p><strong>Цена:</strong> ${p.price} лева</p>
                    <p><strong>Категория:</strong> ${p.category}</p>
                    <button class="openWishProperty">Детайли</button>
                </div>
            `).join('')}
        </div>
    `;

    wishlistContent.querySelectorAll('.openWishProperty')?.forEach(btn => {
        btn.addEventListener('click', e => {
            const id = e.target.closest('.property-card').dataset.id;
            wishlistModal.setAttribute('aria-hidden', 'true');
            const prop = allProperties.find(p => String(p.id) === String(id));
            if (prop) openPropertyModal(prop);
        });
    });
}

// Open wishlist modal
wishlistBtn?.addEventListener('click', async () => {
    wishlistModal.setAttribute('aria-hidden', 'false');
    await renderWishlist();
});

// Close wishlist modal
closeWishlist?.addEventListener('click', () => {
    wishlistModal.setAttribute('aria-hidden', 'true');
});

// Auto-load
document.addEventListener('DOMContentLoaded', () => {
    loadWishlistUI();
});
