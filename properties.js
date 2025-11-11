import { showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
export let wishlistIds = [];

// ---------------------------
// Load all properties
// ---------------------------
export async function loadProperties() {
  try {
    const res = await fetch(`${API_URL}/properties`, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data;
  } catch (err) {
    console.error('Грешка при зареждане на имоти:', err);
    return [];
  }
}

// ---------------------------
// Load wishlist for logged-in user
// ---------------------------
export async function loadWishlist() {
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
  if (!username || !token) {
    wishlistIds = [];
    return;
  }

  try {
    const res = await fetch(`${API_URL}/wishlists/${username}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    wishlistIds = data.items || [];
  } catch (err) {
    console.error('Грешка при зареждане на wishlist:', err);
    wishlistIds = [];
  }
}

// ---------------------------
// Toggle property in wishlist
// ---------------------------
export async function toggleWishlist(propertyId) {
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
  if (!username || !token) {
    showToast('Трябва да сте влезли, за да добавите в wishlist');
    return;
  }

  const action = wishlistIds.includes(propertyId) ? 'remove' : 'add';
  try {
    const res = await fetch(`${API_URL}/wishlists/${username}/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ propertyId })
    });
    const data = await res.json();
    if (data.success) {
      if (action === 'add') wishlistIds.push(propertyId);
      else wishlistIds = wishlistIds.filter(id => id !== propertyId);
      showToast(action === 'add' ? 'Добавено в wishlist!' : 'Премахнато от wishlist');
    }
  } catch (err) {
    console.error(err);
    showToast('Грешка при добавяне/премахване на wishlist');
  }
}
