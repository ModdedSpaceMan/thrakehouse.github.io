import { showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';
let wishlistIds = [];
const propertyContainer = document.getElementById('properties');

function getAuth() {
  return {
    username: localStorage.getItem('username'),
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role')
  };
}

// --------------------
// Initialize
// --------------------
export async function initProperties() {
  await loadWishlist();
  await loadProperties();
  setupFilterListeners();
  window.addEventListener('propertiesUpdated', loadProperties);

  const editModal = document.getElementById('editPropertyModal');
  const editCloseBtn = editModal?.querySelector('.close');
  const editForm = document.getElementById('editPropertyForm');

  if(editCloseBtn){
    editCloseBtn.addEventListener('click', () => {
      editModal.setAttribute('aria-hidden', 'true');
      editModal.dataset.propertyId = '';
    });
  }

  if(editForm){
    editForm.addEventListener('submit', async e => {
      e.preventDefault();
      const id = editModal.dataset.propertyId;
      if (!id) return;

      const formData = new FormData(editForm);
      const data = {
        name: formData.get('editPropertyName'),
        location: formData.get('editPropertyLocation'),
        price: formData.get('editPropertyPrice'),
        type: formData.get('editPropertyType'),
        category: formData.get('editPropertyCategory'),
        status: formData.get('editPropertyStatus') || 'free'
      };

      const imageFile = editForm.querySelector('#editPropertyImage').files[0];
      if(imageFile){
        // Optional: handle image upload
      }

      try {
        const { token } = getAuth();
        const res = await fetch(`${API_URL}/properties/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(data)
        });
        if(!res.ok) throw new Error(`HTTP ${res.status}`);

        showToast('Имотът беше редактиран!');
        editModal.setAttribute('aria-hidden','true');
        editModal.dataset.propertyId = '';
        await loadProperties();
      } catch(err){
        console.error(err);
        showToast('Грешка при редактиране на имота');
      }
    });
  }
}

// --------------------
// Load properties
// --------------------
export async function loadProperties() {
  if(!propertyContainer) return;

  try {
    const { token } = getAuth();
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    const res = await fetch(`${API_URL}/properties`, { headers });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderProperties(data);
    localStorage.setItem('properties', JSON.stringify(data)); // store for filters
    return data;
  } catch(err){
    console.error('Грешка при зареждане на имоти:', err);
    propertyContainer.innerHTML = '<p>Грешка при зареждане на имоти.</p>';
    return [];
  }
}

// --------------------
// Wishlist
// --------------------
export async function loadWishlist() {
  const { username, token } = getAuth();
  if(!username || !token){
    wishlistIds = JSON.parse(localStorage.getItem("wishlist") || "[]");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/wishlists/${username}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    wishlistIds = data.items || [];
  } catch(err){
    console.error("Failed to load wishlist:", err);
    wishlistIds = [];
  }
}

export async function toggleWishlist(propertyId){
  const { username, token } = getAuth();
  if(!username || !token){
    showToast('Трябва да сте влезли!');
    return;
  }

  if(wishlistIds.includes(propertyId)){
    wishlistIds = wishlistIds.filter(id => id !== propertyId);
  } else {
    wishlistIds.push(propertyId);
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlistIds));
  showToast(wishlistIds.includes(propertyId) ? 'Добавено в wishlist!' : 'Премахнато от wishlist');
  await loadWishlist(); // refresh server wishlist if needed
}

// --------------------
// Admin actions
// --------------------
async function deleteProperty(id){
  try{
    const { token } = getAuth();
    const res = await fetch(`${API_URL}/properties/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    showToast('Имотът беше изтрит!');
    await loadProperties();
  } catch(err){
    console.error(err);
    showToast('Грешка при изтриване на имота');
  }
}

async function toggleRentalStatus(id){
  try{
    const properties = JSON.parse(localStorage.getItem('properties') || '[]');
    const property = properties.find(p => p.id === id);
    if(!property) return;

    const newStatus = property.status === 'free' ? 'taken' : 'free';
    const { token } = getAuth();
    const res = await fetch(`${API_URL}/properties/${id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ status: newStatus })
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    showToast('Статусът на имота е променен!');
    await loadProperties();
  } catch(err){
    console.error(err);
    showToast('Грешка при промяна на статуса');
  }
}
