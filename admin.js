// admin.js
import { showToast, openModal, closeModal } from './ui.js';
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

document.addEventListener('DOMContentLoaded', () => {
  const adminSearchBtn = document.getElementById('adminSearchBtn');
  const adminSearchInput = document.getElementById('adminSearchInput');
  const adminFound = document.getElementById('adminFound');
  const addPropertyForm = document.getElementById('propertyForm');
  const viewSupportBtn = document.getElementById('viewSupportBtn');
  const supportMessages = document.getElementById('supportMessages');

  const role = localStorage.getItem('role') || '';
  if (role !== 'admin') return; // safety check

  // --- Search Property by ID ---
  adminSearchBtn.addEventListener('click', async () => {
    const id = adminSearchInput.value.trim();
    if (!id) return showToast('Въведете ID за търсене');

    try {
      const res = await fetch(`${API_URL}/properties`);
      const properties = await res.json();
      const prop = properties.find(p => p.id === id);
      if (!prop) {
        adminFound.textContent = 'Имотът не е намерен';
      } else {
        adminFound.innerHTML = `
          <strong>${prop.name}</strong> • ${prop.location} • ${prop.price} лв • ${prop.status || 'Свободен'}
        `;
      }
    } catch (err) {
      console.error(err);
      showToast('Грешка при търсене на имот');
    }
  });

  // --- Add Property ---
  addPropertyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const property = {
      name: document.getElementById('propertyName').value.trim(),
      location: document.getElementById('propertyLocation').value.trim(),
      price: document.getElementById('propertyPrice').value.trim(),
      type: document.getElementById('propertyType').value,
      status: document.getElementById('propertyStatus').value,
      image: document.getElementById('propertyImage').value || ''
    };

    try {
      const res = await fetch(`${API_URL}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, property })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Имотът е добавен успешно!');
        addPropertyForm.reset();
        closeModal(document.getElementById('addPropertyModal'));
      } else {
        showToast(data.message || 'Грешка при добавяне');
      }
    } catch (err) {
      console.error(err);
      showToast('Грешка при добавяне на имота');
    }
  });

  // --- View Support Messages ---
  viewSupportBtn.addEventListener('click', async () => {
    try {
      const res = await fetch(`${API_URL}/support?role=admin`);
      const messages = await res.json();
      supportMessages.innerHTML = '';

      if (!messages.length) {
        supportMessages.textContent = 'Няма съобщения';
        return;
      }

      messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'support-message';
        div.innerHTML = `
          <strong>${msg.name} (${msg.email})</strong>
          <p>${msg.message}</p>
        `;
        supportMessages.appendChild(div);
      });

      openModal(document.getElementById('adminSidebar'));
    } catch (err) {
      console.error(err);
      showToast('Грешка при зареждане на съобщенията');
    }
  });
});
