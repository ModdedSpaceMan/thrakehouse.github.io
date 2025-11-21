import { showToast } from './ui.js';
import { loadProperties } from './properties.js';

const wishlistBtn = document.getElementById('wishlistBtn');
const wishlistModal = document.getElementById('wishlistModal');
const closeWishlist = document.getElementById('closeWishlist');
const wishlistContent = document.getElementById('wishlistContent');

export let wishlistIds = [];

// Load wishlist from localStorage
export async function loadWishlist() {
    const saved = JSON.parse(localStorage.getItem('wishlist')) || [];
    wishlistIds = saved;
    updateTopWishlistBtn();
    await renderWishlist();
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

// Render wishlist as property grid
export async function renderWishlist() {
    if (!wishlistContent) return;

    const allProperties = await loadProperties();
    const savedProps = allProperties.filter(p => wishlistIds.includes(p.id));

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
                    <p>${p.category || '-'}</p>
                    <p><strong>${p.price ?? '-'}</strong></p>
                    <button class="openWishProperty">Детайли</button>
                </div>
            `).join('')}
        </div>
    `;

    // Click handler for each property
    wishlistContent.querySelectorAll('.openWishProperty')?.forEach(btn => {
        btn.addEventListener('click', e => {
            const card = e.target.closest('.property-card');
            const id = card.dataset.id;
            const property = savedProps.find(p => p.id == id);
            if (property && window.openPropertyDetails) {
                window.openPropertyDetails(property);
                wishlistModal.setAttribute('aria-hidden', 'true');
            } else {
                showToast('Не може да се зареди информация за имота');
            }
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
