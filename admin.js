// admin.js
import { showToast, openModal, closeModal } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';

document.addEventListener('DOMContentLoaded', () => {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const adminSidebar = document.getElementById('adminSidebar');
  const viewSupportBtn = document.getElementById('viewSupportBtn');
  const supportMessagesDiv = document.getElementById('supportMessages');
  const adminSearchBtn = document.getElementById('adminSearchBtn');
  const adminSearchInput = document.getElementById('adminSearchInput');

  const addPropertySidebarBtn = document.getElementById('addPropertySidebarBtn');
  const addPropertyModal = document.getElementById('addPropertyModal');
  const closeAdd = document.getElementById('closeAdd');
  const propertyForm = document.getElementById('propertyForm');

  // --- Sidebar toggle ---
  if (sidebarToggle && adminSidebar) {
    sidebarToggle.addEventListener('click', () => adminSidebar.classList.toggle('show'));
  }

  // --- Ticket ID search ---
  if (adminSearchBtn && adminSearchInput) {
    adminSearchBtn.addEventListener('click', async () => {
      const id = adminSearchInput.value.trim();
      if (!id) return showToast('Въведете ID за търсене');
      try {
        const res = await fetch(`${API_URL}/properties`);
        const props = await res.json();
        const found = props.find(p => p.id === id);
        const adminFoundDiv = document.getElementById('adminFound');
        if (found) {
          adminFoundDiv.textContent = `ID: ${found.id}, Name: ${found.name}, Location: ${found.location}, Price: ${found.price}`;
        } else {
          adminFoundDiv.textContent = 'Не е намерен имот с това ID';
        }
      } catch (err) {
        console.error(err);
        showToast('Грешка при търсене');
      }
    });
  }

  // --- View support tickets ---
  if (viewSupportBtn && supportMessagesDiv) {
    viewSupportBtn.addEventListener('click', async () => {
      try {
        const res = await fetch(`${API_URL}/support?role=admin`);
        const messages = await res.json();
        supportMessagesDiv.innerHTML = '';
        messages.forEach(msg => {
          const div = document.createElement('div');
          div.className = 'support-message';
          div.innerHTML = `<strong>${msg.name} (${msg.email})</strong><p>${msg.message}</p>`;
          supportMessagesDiv.appendChild(div);
        });
      } catch (err) {
        console.error(err);
        showToast('Грешка при зареждане на съобщенията');
      }
    });
  }

  // --- Add Property Modal ---
  if (addPropertySidebarBtn && addPropertyModal) {
    addPropertySidebarBtn.addEventListener('click', () => openModal(addPropertyModal));
  }
  if (closeAdd && addPropertyModal) {
    closeAdd.addEventListener('click', () => closeModal(addPropertyModal));
  }

  // --- Add Property Form Submission ---
  if (propertyForm) {
    propertyForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('propertyName').value.trim();
      const location = document.getElementById('propertyLocation').value.trim();
      const price = document.getElementById('propertyPrice').value.trim();
      const type = document.getElementById('propertyType').value;
      const status = document.getElementById('propertyStatus').value;
      const imageInput = document.getElementById('propertyImage');
      const role = localStorage.getItem('role');

      if (!role || role !== 'admin') return showToast('Нямате права за добавяне на имот');

      if (!name || !location || !price || !imageInput.files.length) return showToast('Попълнете всички полета');

      const file = imageInput.files[0];
      const reader = new FileReader();
      reader.onload = async () => {
        const imageBase64 = reader.result;

        try {
          const res = await fetch(`${API_URL}/properties`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role,
              property: { name, location, price, type, status, image: imageBase64 }
            })
          });

          const data = await res.json();
          if (data.success) {
            showToast('Имотът е добавен успешно!');
            propertyForm.reset();
            closeModal(addPropertyModal);
          } else {
            showToast(data.message || 'Грешка при добавяне на имота');
          }
        } catch (err) {
          console.error(err);
          showToast('Грешка при добавяне на имота');
        }
      };
      reader.readAsDataURL(file);
    });
  }
});
