// properties.js
import { showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
let propertyContainer = document.getElementById('properties');
const propertyModal = document.getElementById("propertyDetailsModal");
const username = localStorage.getItem('username');
const token = localStorage.getItem('token');
const role = localStorage.getItem('role'); // 'admin' or 'user'

export let propertiesData = []; // global store
export let wishlistIds = [];    // global wishlist store
export { initProperties };

// --------------------
// Load wishlist from backend or localStorage fallback
// --------------------
export async function loadWishlist() {
    if (!username || !token) {
        wishlistIds = JSON.parse(localStorage.getItem('wishlist') || '[]').map(String);
        return;
    }

    try {
        const res = await fetch(`${API_URL}/wishlists/${username}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const validIds = (await loadProperties()).map(p => p.id);
        wishlistIds = (data.items || []).filter(id => validIds.includes(id)).map(String);
    } catch (err) {
        console.error("Failed to load wishlist:", err);
        wishlistIds = [];
    }
}

// --------------------
// Toggle wishlist
// --------------------
export async function toggleWishlist(propertyId) {
    propertyId = String(propertyId);

    if (!username || !token) {
        showToast('Трябва да сте влезли!');
        return;
    }

    const action = wishlistIds.includes(propertyId) ? 'remove' : 'add';

    try {
        const res = await fetch(`${API_URL}/wishlists/${username}/${action}`, {
            method: 'POST',
            headers: { 
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ propertyId })
        });

        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Грешка при wishlist');

        if (action === 'add') wishlistIds.push(propertyId);
        else wishlistIds = wishlistIds.filter(id => id !== propertyId);

        showToast(action === 'add' ? 'Добавено в wishlist!' : 'Премахнато от wishlist');

        const btn = document.querySelector(`.wishlist-btn[data-id="${propertyId}"]`);
        if (btn) btn.textContent = wishlistIds.includes(propertyId) ? '❤️' : '🤍';
    } catch (err) {
        console.error(err);
        showToast('Грешка при връзка със сървъра');
    }
}

// --------------------
// Load properties
// --------------------
export async function loadProperties() {
    if (!propertyContainer) return [];

    try {
        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
        const res = await fetch(`${API_URL}/properties`, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        propertiesData = data;
        renderProperties(data);
        return data;
    } catch (err) {
        console.error('Грешка при зареждане на имоти:', err);
        if (propertyContainer) propertyContainer.innerHTML = '<p>Грешка при зареждане на имоти.</p>';
        return [];
    }
}

// --------------------
// Render properties
// --------------------
export function renderProperties(properties) {
    if (!propertyContainer) return;

    if (!properties.length) {
        propertyContainer.innerHTML = '<p>Няма налични имоти.</p>';
        return;
    }

    propertyContainer.innerHTML = properties.map(p => {
        const id = p.id ?? '-';
        const inWishlist = wishlistIds.includes(String(id)) ? '❤️' : '🤍';
        return `
            <div class="property" data-id="${id}">
                ${p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.title || 'Имот'}">` : ''}
                <div class="property-content">
                    <h3>${p.title || 'Без име'}</h3>
                    <p><strong>Цена:</strong> ${p.price ?? '-'}</p>
                    <p><strong>Категория:</strong> ${p.category ?? '-'}</p>
                </div>
                <div class="property-actions">
                    <button class="wishlist-btn" data-id="${id}">${inWishlist}</button>
                </div>
            </div>
        `;
    }).join('');

    addPropertyListeners();
}

// --------------------
// Property event listeners
// --------------------
function addPropertyListeners() {
    propertyContainer.querySelectorAll('.wishlist-btn').forEach(btn =>
        btn.addEventListener('click', e => {
            e.stopPropagation();
            toggleWishlist(btn.dataset.id);
        })
    );

    propertyContainer.querySelectorAll('.property').forEach(el =>
        el.addEventListener('click', () => {
            const id = el.dataset.id;
            const prop = propertiesData.find(p => String(p.id) === String(id));
            if (prop) openPropertyModal(prop);
        })
    );
}

// --------------------
// Property Modal
// --------------------
let currentPropertyImages = [];
let currentImageIndex = 0;

export function openPropertyModal(property) {
    const modal = document.getElementById("propertyDetailsModal");
    if (!modal) return;

    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value ?? '-';
    };

    set("propTitle", property.title);
    set("propPrice", property.price ? property.price + " лева" : "-");
    set("propCategory", property.category);
    set("propStatus", property.status || "Свободен");
    set("propBedrooms", property.bedrooms);
    set("propBathrooms", property.bathrooms);
    set("propArea", property.size ? property.size + " m²" : "-");
    set("propDescription", property.description || "-");

    currentPropertyImages = property.images || [];
    currentImageIndex = 0;

    const imgEl = document.getElementById('propImage');
    if (imgEl) imgEl.src = currentPropertyImages[0] || '';
    modal.style.display = "flex";

    // Modal close
    modal.querySelector(".close")?.addEventListener('click', () => modal.style.display = 'none');
    modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
}
