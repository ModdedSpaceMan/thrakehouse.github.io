// wishlist.js
import { showToast } from './ui.js';
import { loadProperties } from './properties.js';
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

const wishlistBtn = document.getElementById('wishlistBtn');
const wishlistModal = document.getElementById('wishlistModal');
const wishlistContent = document.getElementById('wishlistContent');
const closeWishlist = document.getElementById('closeWishlist');

let wishlistIds = [];

export async function loadWishlist() {
  const username = localStorage.getItem('username');
  if (!username) {
    wishlistContent.innerHTML = '<p>Влезте, за да видите списъка</p>';
    wishlistIds = [];
    updatePropertyWishlistButtons();
    return;
  }

  try {
    const res = await fetch(`${API_URL}/wishlists/${username}`);
    const data = await res.json();
    wishlistIds = data.items || [];

    if (!wishlistIds.length) {
      wishlistContent.innerHTML = '<p>Списъкът е празен</p>';
      updatePropertyWishlistButtons();
      return;
    }

    const propsRes = await fetch(`${API_URL}/properties`);
    const propsData = await propsRes.json();

    wishlistContent.innerHTML = '';
    wishlistIds.forEach(id => {
      const prop = propsData.find(p => p.id === id);
      const div = document.createElement('div');
      div.className = 'wish-item';

      if (!prop) {
        div.innerHTML = `
          <div>ID: ${id} (липсва)</div>
          <button onclick="removeFromWishlist('${id}')">Премахни</button>
        `;
      } else {
        div.innerHTML = `
          <img src="${prop.image || ''}" class="wish-thumb" />
          <div class="wish-meta">${prop.name} • ${prop.location} • ${prop.price} лв/месец</div>
          <button onclick="removeFromWishlist('${prop.id}')">Премахни</button>
        `;
      }
      wishlistContent.appendChild(div);
    });

    updatePropertyWishlistButtons();
  } catch (err) {
    console.error(err);
    showToast('Грешка при зареждане на списъка');
  }
}

// Add property to wishlist
export async function addToWishlist(id) {
  const username = localStorage.getItem('username');
  if (!username) { showToast('Влезте, за да добавяте'); return; }

  try {
    const res = await fetch(`${API_URL}/wishlists/add`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username, propertyId: id })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Добавено в списъка');
      wishlistIds.push(id);
      updatePropertyWishlistButtons();
      loadWishlist();
      loadProperties();
    } else showToast('Вече е в списъка');
  } catch {
    showToast('Грешка при добавяне');
  }
}

// Remove property from wishlist
export async function removeFromWishlist(id) {
  const username = localStorage.getItem('username');
  if (!username) { showToast('Влезте, за да премахвате'); return; }

  try {
    const res = await fetch(`${API_URL}/wishlists/remove`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username, propertyId: id })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Премахнато от списъка');
      wishlistIds = wishlistIds.filter(i => i !== id);
      updatePropertyWishlistButtons();
      loadWishlist();
      loadProperties();
    } else showToast(data.message || 'Грешка при премахване');
  } catch {
    showToast('Грешка при премахване');
  }
}

// Update the visual state of per-property wishlist buttons
function updatePropertyWishlistButtons() {
  const username = localStorage.getItem('username');
  if (!username) return;

  document.querySelectorAll('.property').forEach(propDiv => {
    const propIdDiv = propDiv.querySelector('.property-id');
    if (!propIdDiv) return;
    const id = propIdDiv.textContent.replace('ID: ','').trim();

    const btn = propDiv.querySelector('.wishlist-btn');
    if (!btn) return;

    if (wishlistIds.includes(id)) {
      btn.classList.add('added');
      btn.style.color = '#ff6b6b';
    } else {
      btn.classList.remove('added');
      btn.style.color = '#fff';
    }
  });
}

// Wishlist modal open/close
wishlistBtn.addEventListener('click', () => { 
  wishlistModal.setAttribute('aria-hidden','false');
  loadWishlist();
});

closeWishlist.addEventListener('click', () => wishlistModal.setAttribute('aria-hidden','true'));
