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
    if (!res.ok) throw new Error('Неуспешно зареждане на списъка');
    const data = await res.json();
    wishlistIds = data.items || [];

    wishlistContent.innerHTML = '';
    if (!wishlistIds.length) {
      wishlistContent.innerHTML = '<p>Списъкът е празен</p>';
      updatePropertyWishlistButtons();
      return;
    }

    const propsRes = await fetch(`${API_URL}/properties`);
    const propsData = await propsRes.json();

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

export async function addToWishlist(id) {
  const username = localStorage.getItem('username');
  if (!username) { showToast('Влезте, за да добавяте'); return; }

  try {
    const res = await fetch(`${API_URL}/wishlists/${username}/add`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ propertyId: id })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Добавено в списъка');
      wishlistIds.push(id);
      updatePropertyWishlistButtons();
      loadWishlist();
      loadProperties();
    } else showToast(data.message || 'Вече е в списъка');
  } catch (err) {
    console.error(err);
    showToast('Грешка при добавяне');
  }
}

export async function removeFromWishlist(id) {
  const username = localStorage.getItem('username');
  if (!username) { showToast('Влезте, за да премахвате'); return; }

  try {
    const res = await fetch(`${API_URL}/wishlists/${username}/remove`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ propertyId: id })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Премахнато от списъка');
      wishlistIds = wishlistIds.filter(i => i !== id);
      updatePropertyWishlistButtons();
      loadWishlist();
      loadProperties();
    } else showToast(data.message || 'Грешка при премахване');
  } catch (err) {
    console.error(err);
    showToast('Грешка при премахване');
  }
}

function updatePropertyWishlistButtons() {
  const username = localStorage.getItem('username');
  if (!username) return;

  document.querySelectorAll('.property').forEach(propDiv => {
    const propId = propDiv.dataset.id;
    const btn = propDiv.querySelector('.wishlist-btn');
    if (!btn) return;

    if (wishlistIds.includes(propId)) {
      btn.classList.add('added');
      btn.style.color = '#ff6b6b';
    } else {
      btn.classList.remove('added');
      btn.style.color = '#fff';
    }

    btn.onclick = () => {
      if (wishlistIds.includes(propId)) removeFromWishlist(propId);
      else addToWishlist(propId);
    };
  });
}

// Wishlist modal open/close
wishlistBtn.addEventListener('click', () => { 
  wishlistModal.setAttribute('aria-hidden','false');
  loadWishlist();
});

closeWishlist.addEventListener('click', () => wishlistModal.setAttribute('aria-hidden','true'));

// Load wishlist on page load
document.addEventListener('DOMContentLoaded', loadWishlist);
