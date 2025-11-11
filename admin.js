// admin.js
import { showToast, openModal, closeModal } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';

// Elements
const addPropertyBtn = document.getElementById('addPropertySidebarBtn');
const addPropertyModal = document.getElementById('addPropertyModal');
const closeAddModalBtn = document.getElementById('closeAdd');
const propertyForm = document.getElementById('propertyForm');
const adminSearchInput = document.getElementById('adminSearchInput');
const adminSearchBtn = document.getElementById('adminSearchBtn');
const adminFound = document.getElementById('adminFound');
const viewSupportBtn = document.getElementById('viewSupportBtn');
const supportMessagesContainer = document.getElementById('supportMessages');

// --- Open / Close Add Property Modal ---
addPropertyBtn?.addEventListener('click', () => openModal(addPropertyModal));
closeAddModalBtn?.addEventListener('click', () => closeModal(addPropertyModal));

// --- Convert file to Base64 ---
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
}

// --- Add Property ---
propertyForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const file = document.getElementById('propertyImage').files[0];
  const imageBase64 = file ? await fileToBase64(file) : '';

  const property = {
    name: document.getElementById('propertyName').value.trim(),
    location: document.getElementById('propertyLocation').value.trim(),
    price: document.getElementById('propertyPrice').value.trim(),
    type: document.getElementById('propertyType').value,
    status: document.getElementById('propertyStatus').value,
    image: imageBase64
  };

  const role = localStorage.getItem('role') || '';

  try {
    const res = await fetch(`${API_URL}/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ property, role })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Имотът е добавен успешно!');
      propertyForm.reset();
      closeModal(addPropertyModal);
    } else {
      showToast('Грешка: ' + data.message);
    }
  } catch (err) {
    console.error(err);
    showToast('Грешка при добавяне на имот');
  }
});

// --- Search Property by ID ---
adminSearchBtn?.addEventListener('click', async () => {
  const id = adminSearchInput.value.trim();
  if (!id) return showToast('Въведете ID за търсене');

  try {
    const res = await fetch(`${API_URL}/properties`);
    const properties = await res.json();
    const prop = properties.find(p => p.id === id);

    if (!prop) adminFound.textContent = 'Няма намерен имот с това ID';
    else adminFound.innerHTML = `
      <strong>${prop.name}</strong> <br>
      ${prop.location} • ${prop.price} лв • ${prop.type} • ${prop.status}
      <img src="${prop.image}" style="max-width:150px;display:block;margin-top:5px;" />
    `;
  } catch (err) {
    console.error(err);
    showToast('Грешка при търсене');
  }
});

// --- View Support Tickets ---
viewSupportBtn?.addEventListener('click', async () => {
  supportMessagesContainer.innerHTML = 'Зареждане...';
  const role = localStorage.getItem('role') || '';
  try {
    const res = await fetch(`${API_URL}/support?role=${role}`);
    const tickets = await res.json();
    if (!tickets.length) supportMessagesContainer.textContent = 'Няма съобщения';
    else {
      supportMessagesContainer.innerHTML = tickets.map(t => `
        <div class="support-ticket">
          <strong>${t.name} (${t.email})</strong>
          <p>${t.message}</p>
          <small>${new Date(t.createdAt).toLocaleString()}</small>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error(err);
    supportMessagesContainer.textContent = 'Грешка при зареждане на съобщения';
  }
});
