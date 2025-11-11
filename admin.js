import { openModal, closeModal, showToast, checkTokenExpired } from './ui.js';
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

const openAddBtn = document.getElementById('addPropertySidebarBtn');
const addPropertyModal = document.getElementById('addPropertyModal');
const closeAddBtn = document.getElementById('closeAdd');
const propertyForm = document.getElementById('propertyForm');

const role = localStorage.getItem('role');
if (role === 'admin') document.body.classList.add('admin');
else document.body.classList.remove('admin');

openAddBtn?.addEventListener('click', () => openModal(addPropertyModal));
closeAddBtn?.addEventListener('click', () => closeModal(addPropertyModal));

propertyForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const role = localStorage.getItem('role');
  if (!role || role !== 'admin') { showToast('Нямате права'); return; }

  const name = document.getElementById('propertyName').value.trim();
  const location = document.getElementById('propertyLocation').value.trim();
  const price = document.getElementById('propertyPrice').value.trim();
  const type = document.getElementById('propertyType').value;
  const status = document.getElementById('propertyStatus').value;
  const propertyImage = document.getElementById('propertyImage').files[0];

  let imageBase64 = '';
  if (propertyImage) {
    imageBase64 = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(propertyImage);
    });
  }

  const newProperty = { name, location, price, type, status };
  if (imageBase64) newProperty.image = imageBase64;

  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_URL}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ property: newProperty })
    });
    if (checkTokenExpired(res)) return;
    const data = await res.json();
    if (data.success) { showToast('Имотът е добавен успешно'); propertyForm.reset(); closeModal(addPropertyModal); }
    else showToast(data.message || 'Грешка при добавяне');
  } catch {
    showToast('Грешка при добавяне');
  }
});
