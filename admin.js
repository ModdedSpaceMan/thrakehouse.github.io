// admin.js
import { openModal, closeModal, showToast } from './ui.js';
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

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

// --- Add Property Modal ---
if (openAddBtn && addPropertyModal) {
  openAddBtn.addEventListener('click', () => openModal(addPropertyModal));
}

if (closeAddBtn && addPropertyModal) {
  closeAddBtn.addEventListener('click', () => closeModal(addPropertyModal));
}

// --- Property Form Submission ---
if (propertyForm) {
  propertyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const role = localStorage.getItem('role');
    if (role !== 'admin') {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property: newProperty, role })
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

// --- Admin Ticket Search (placeholder) ---
if (adminSearchBtn) {
  adminSearchBtn.addEventListener('click', async () => {
    const id = adminSearchInput.value.trim();
    if (!id) return;
    try {
      const res = await fetch(`${API_URL}/support?id=${id}&role=admin`);
      const data = await res.json();
      adminFound.textContent = data.length
        ? `Намерено съобщение: ${JSON.stringify(data[0])}`
        : 'Няма съобщения с това ID';
    } catch (err) {
      console.error(err);
      adminFound.textContent = 'Грешка при търсене';
    }
  });
}

// --- View Support Tickets (placeholder) ---
if (viewSupportBtn) {
  viewSupportBtn.addEventListener('click', async () => {
    try {
      const res = await fetch(`${API_URL}/support?role=admin`);
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
