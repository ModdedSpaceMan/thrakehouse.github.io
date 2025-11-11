import { openModal, closeModal, showToast } from './ui.js';
import { loadProperties } from './properties.js';
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

// --- Helpers ---
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');
  if (!options.headers) options.headers = {};
  if (token) options.headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, options);
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    alert('Сесията ви е изтекла. Моля, влезте отново.');
    window.location.href = '/login.html';
    throw new Error('Session expired');
  }
  return res.json();
}

// --- Elements ---
const openAddBtn = document.getElementById('addPropertySidebarBtn');
const addPropertyModal = document.getElementById('addPropertyModal');
const closeAddBtn = document.getElementById('closeAdd');
const propertyForm = document.getElementById('propertyForm');
const adminSearchInput = document.getElementById('adminSearchInput');
const adminSearchBtn = document.getElementById('adminSearchBtn');
const adminFound = document.getElementById('adminFound');
const viewSupportBtn = document.getElementById('viewSupportBtn');
const supportMessages = document.getElementById('supportMessages');

// Toggle admin class on body
if (localStorage.getItem('role')==='admin') document.body.classList.add('admin');

// --- Add Property ---
if (openAddBtn && addPropertyModal) openAddBtn.addEventListener('click', () => openModal(addPropertyModal));
if (closeAddBtn && addPropertyModal) closeAddBtn.addEventListener('click', () => closeModal(addPropertyModal));

if (propertyForm) {
  propertyForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (localStorage.getItem('role') !== 'admin') return showToast('Нямате права за добавяне на имот');

    const name = document.getElementById('propertyName').value.trim();
    const location = document.getElementById('propertyLocation').value.trim();
    const price = parseFloat(document.getElementById('propertyPrice').value) || 0;
    const type = document.getElementById('propertyType').value;
    const status = document.getElementById('propertyStatus').value;
    const imageInput = document.getElementById('propertyImage');
    let image = '';

    if (imageInput.files.length > 0) {
      const file = imageInput.files[0];
      const reader = new FileReader();
      image = await new Promise(resolve => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }

    const propertyData = { name, location, price, type, status, ...(image && { image }) };
    const method = propertyForm.dataset.editing ? 'PUT' : 'POST';
    const url = propertyForm.dataset.editing ? `${API_URL}/properties/${propertyForm.dataset.editing}` : `${API_URL}/properties`;

    try {
      const data = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ property: propertyData })
      });

      if (data.success) {
        showToast(method==='POST' ? 'Имотът е добавен успешно' : 'Имотът е обновен');
        propertyForm.reset();
        addPropertyModal.setAttribute('aria-hidden','true');
        await loadProperties();
      } else {
        showToast(data.message || 'Грешка при изпращане на имота');
      }
    } catch (err) {
      console.error(err);
      showToast('Грешка при изпращане на имота');
    }
  });
}

// --- Admin Search ---
if (adminSearchBtn) {
  adminSearchBtn.addEventListener('click', async () => {
    const searchId = adminSearchInput.value.trim();
    if (!searchId) return;
    try {
      const properties = await fetchWithAuth(`${API_URL}/properties`);
      const prop = properties.find(p => p.id === searchId);
      if (!prop) { adminFound.textContent = 'Няма намерен имот с това ID'; return; }
      adminFound.innerHTML = `
        <div class="admin-property-found">
          <h4>${prop.name}</h4>
          <p>Локация: ${prop.location}</p>
          <p>Цена: ${prop.price}</p>
          <p>Тип: ${prop.type}</p>
          <p>Статус: ${prop.status}</p>
          ${prop.image ? `<img src="${prop.image}" alt="${prop.name}" style="max-width:100%;margin-top:10px;border-radius:8px;">` : ''}
        </div>
      `;
    } catch (err) {
      console.error(err);
      adminFound.textContent = 'Грешка при търсене на имота';
    }
  });
}

// --- View Support Tickets ---
if (viewSupportBtn) {
  viewSupportBtn.addEventListener('click', async () => {
    try {
      const data = await fetchWithAuth(`${API_URL}/support`);
      supportMessages.innerHTML = data.map(msg => `<div class="support-ticket"><strong>${msg.name}</strong>: ${msg.message}</div>`).join('') || 'Няма съобщения';
    } catch (err) {
      console.error(err);
      supportMessages.textContent = 'Грешка при зареждане на съобщения';
    }
  });
}
