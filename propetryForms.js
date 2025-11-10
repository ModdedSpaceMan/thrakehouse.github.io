// propertyForm.js
import { role, showToast } from './ui.js';
import { loadProperties } from './properties.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';

const addPropertyModal = document.getElementById('addPropertyModal');
const propertyForm = document.getElementById('propertyForm');
let editingPropertyId = null;

// ------------------ Open Form for Editing ------------------
export function openPropertyFormForEdit(property) {
  if (!property) return;
  editingPropertyId = property.id;

  document.getElementById('propertyName').value = property.name || '';
  document.getElementById('propertyLocation').value = property.location || '';
  document.getElementById('propertyPrice').value = property.price || '';
  document.getElementById('propertyType').value = property.type || '';
  document.getElementById('propertyStatus').value = property.status || '';

  addPropertyModal.querySelector('h2').textContent = 'Редактирай имота';
  addPropertyModal.setAttribute('aria-hidden', 'false');
}

// ------------------ Reset Form ------------------
function resetForm() {
  propertyForm.reset();
  editingPropertyId = null;
  addPropertyModal.querySelector('h2').textContent = 'Добави нов имот';
}

// ------------------ Submit Handler ------------------
propertyForm.addEventListener('submit', async e => {
  e.preventDefault();

  if (!role || role !== 'admin') {
    showToast('Нямате права да добавяте или редактирате имоти');
    return;
  }

  const name = document.getElementById('propertyName').value.trim();
  const location = document.getElementById('propertyLocation').value.trim();
  const price = parseFloat(document.getElementById('propertyPrice').value) || 0;
  const type = document.getElementById('propertyType').value;
  const status = document.getElementById('propertyStatus').value;
  const imageInput = document.getElementById('propertyImage');
  let image = '';

  // ------------------ Image Upload ------------------
  if (imageInput.files.length > 0) {
    const file = imageInput.files[0];
    const reader = new FileReader();
    image = await new Promise(resolve => {
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  const propertyData = { name, location, price, type, status };
  if (image) propertyData.image = image;

  const url = editingPropertyId
    ? `${API_URL}/properties/${editingPropertyId}`
    : `${API_URL}/properties`;
  const method = editingPropertyId ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...propertyData, role })
    });

    const data = await res.json();
    if (data.success) {
      showToast(editingPropertyId ? 'Имотът е обновен!' : 'Имотът е добавен успешно!');
      addPropertyModal.setAttribute('aria-hidden', 'true');
      resetForm();
      await loadProperties();
    } else {
      showToast(data.message || 'Грешка при изпращане на имота');
    }
  } catch (err) {
    console.error(err);
    showToast('Грешка при изпращане на имота');
  }
});

// ------------------ Close Form ------------------
document.getElementById('closeAdd').addEventListener('click', () => {
  addPropertyModal.setAttribute('aria-hidden', 'true');
  resetForm();
});

// ------------------ Export Reset ------------------
export { resetForm };
