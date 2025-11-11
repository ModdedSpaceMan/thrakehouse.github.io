// admin.js
import { openModal, closeModal, showToast } from './ui.js';
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

const token = localStorage.getItem('token'); // JWT from login/signup

// --- Helper: decode JWT payload ---
function getPayload() {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[0]));
  } catch {
    return null;
  }
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
const payload = getPayload();
if (payload?.role === 'admin') document.body.classList.add('admin');

// --- Add Property Modal ---
if (openAddBtn && addPropertyModal) openAddBtn.addEventListener('click', () => openModal(addPropertyModal));
if (closeAddBtn && addPropertyModal) closeAddBtn.addEventListener('click', () => closeModal(addPropertyModal));

// --- Property Form Submission ---
if (propertyForm) {
  propertyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (payload?.role !== 'admin') {
      showToast('Нямате права за добавяне на имот');
      return;
    }

    const propertyName = document.getElementById('propertyName').value.trim();
    const propertyLocation = document.getElementById('propertyLocation').value.trim();
    const propertyPrice = document.getElementById('propertyPrice').value.trim();
    const propertyType = document.getElementById('propertyType').value;
    const propertyStatus = document.getElementById('propertyStatus').value;
    const propertyImage = document.getElementById('propertyImage').files[0];

    let imageBase64 = '';
    if (propertyImage) imageBase64 = await fileToBase64(propertyImage);

    const newProperty = {
      name: propertyName,
      location: propertyLocation,
      price: propertyPrice,
      type: propertyType,
      status: propertyStatus,
      image: imageBase64
    };

    try {
      const res = await fetch(`${API_URL}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ property: newProperty })
      });

      const data = await res.json();
      if (data.success) {
        showToast('Имотът е добавен успешно');
        propertyForm.reset();
        closeModal(addPropertyModal);
      } else {
        showToast(data.message || 'Грешка при добавяне на имот');
      }
    } catch (err) {
      console.error(err);
      showToast('Грешка при добавяне на имот');
    }
  });
}

// --- Helper: File to Base64 ---
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
  });
}

// --- Admin Property Search by ID ---
if (adminSearchBtn) {
  adminSearchBtn.addEventListener('click', async () => {
    const searchId = adminSearchInput.value.trim();
    if (!searchId) return;

    try {
      const res = await fetch(`${API_URL}/properties`);
      const properties = await res.json();
      const prop = properties.find(p => p.id === searchId);

      if (!prop) {
        adminFound.textContent = 'Няма намерен имот с това ID';
        return;
      }

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
    if (payload?.role !== 'admin') {
      showToast('Нямате права за преглед на съобщения');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/support`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      supportMessages.innerHTML = data
        .map(msg => `<div class="support-ticket"><strong>${msg.name}</strong>: ${msg.message}</div>`)
        .join('') || 'Няма съобщения';
    } catch (err) {
      console.error(err);
      supportMessages.textContent = 'Грешка при зареждане на съобщения';
    }
  });
}
