import { showToast } from './ui.js';
import { loadProperties } from './properties.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
const wishlistBtn = document.getElementById('wishlistBtn');
const wishlistModal = document.getElementById('wishlistModal');
const closeWishlist = document.getElementById('closeWishlist');
const wishlistContent = document.getElementById('wishlistContent');

let wishlistIds = [];
let savedProps = [];

// Load wishlist from backend
export async function loadWishlist() {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    if (!username || !token) {
        wishlistIds = [];
        renderWishlist();
        return;
    }

    try {
        const res = await fetch(`${API_URL}/wishlists/${username}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error('Failed to fetch wishlist');

        const data = await res.json();
        wishlistIds = (data.items || []).map(String); // ensure strings

        updateTopWishlistBtn();
        await renderWishlist();
    } catch (err) {
        console.error(err);
        wishlistIds = [];
        renderWishlist();
    }
}

// Update top menu wishlist button
function updateTopWishlistBtn() {
    if (!wishlistBtn) return;
    wishlistBtn.style.display = wishlistIds.length ? 'inline-block' : 'none';
    wishlistBtn.textContent = `Списък ♥ (${wishlistIds.length})`;
}

// Render wishlist as property cards
export async function renderWishlist() {
    if (!wishlistContent) return;

    const allProperties = await loadProperties();
    savedProps = allProperties.filter(p => wishlistIds.includes(String(p.id)));

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
                    <p><strong>Тип:</strong> ${p.type}</p>
                    <button class="openWishProperty">Детайли</button>
                </div>
            `).join('')}
        </div>
    `;

    // Attach click events for each property
    wishlistContent.querySelectorAll('.openWishProperty')?.forEach(btn => {
        btn.addEventListener('click', e => {
            const id = e.target.closest('.property-card').dataset.id;
            wishlistModal.setAttribute('aria-hidden', 'true');
            if (window.openPropertyDetails) window.openPropertyDetails(savedProps.find(p => p.id == id));
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
