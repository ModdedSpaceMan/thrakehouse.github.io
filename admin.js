// admin.js
import { showToast, openModal, closeModal } from './ui.js';
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

document.addEventListener('DOMContentLoaded', () => {
  // ---- Ticket ID Search ----
  const adminSearchInput = document.getElementById('adminSearchInput');
  const adminSearchBtn = document.getElementById('adminSearchBtn');
  const adminFound = document.getElementById('adminFound');

  if (adminSearchBtn) {
    adminSearchBtn.addEventListener('click', async () => {
      const id = adminSearchInput.value.trim();
      if (!id) return showToast('Въведете ID за търсене');
      try {
        const res = await fetch(`${API_URL}/properties`);
        if (!res.ok) throw new Error('Failed to fetch properties');
        const properties = await res.json();
        const prop = properties.find(p => p.id === id);
        if (!prop) adminFound.textContent = 'Няма намерен имот с това ID';
        else {
          adminFound.innerHTML = `
            <p><strong>${prop.name}</strong></p>
            <p>${prop.location} • ${prop.price} лв</p>
            <p>Тип: ${prop.type}, Статус: ${prop.status}</p>
          `;
        }
      } catch (err) {
        console.error(err);
        showToast('Грешка при търсене на имота');
      }
    });
  }

  // ---- Property Upload ----
  const propertyForm = document.getElementById('propertyForm');
  if (propertyForm) {
    propertyForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('propertyName').value.trim();
      const location = document.getElementById('propertyLocation').value.trim();
      const price = document.getElementById('propertyPrice').value.trim();
      const type = document.getElementById('propertyType').value;
      const status = document.getElementById('propertyStatus').value;
      const fileInput = document.getElementById('propertyImage');

      if (!fileInput.files[0]) return showToast('Моля, изберете изображение');

      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Image = reader.result;

        try {
          const res = await fetch(`${API_URL}/properties`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: 'admin',
              property: { name, location, price, type, status, image: base64Image }
            })
          });

          const data = await res.json();
          if (data.success) {
            showToast('Имотът е добавен успешно!');
            propertyForm.reset();
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

  // ---- Support Messages ----
  const viewSupportBtn = document.getElementById('viewSupportBtn');
  const supportMessages = document.getElementById('supportMessages');

  if (viewSupportBtn && supportMessages) {
    viewSupportBtn.addEventListener('click', async () => {
      try {
        const res = await fetch(`${API_URL}/support?role=admin`);
        if (!res.ok) throw new Error('Failed to fetch support messages');
        const messages = await res.json();

        supportMessages.innerHTML = '';
        if (!messages.length) {
          supportMessages.innerHTML = '<p>Няма потребителски съобщения</p>';
          return;
        }

        messages.forEach(msg => {
          const div = document.createElement('div');
          div.className = 'support-msg';
          div.innerHTML = `
            <p><strong>${msg.name}</strong> (${msg.email})</p>
            <p>${msg.message}</p>
          `;
          supportMessages.appendChild(div);
        });
      } catch (err) {
        console.error(err);
        showToast('Грешка при зареждане на съобщенията');
      }
    });
  }
});
