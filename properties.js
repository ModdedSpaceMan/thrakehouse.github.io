// properties.js

export let allProperties = [];
export let currentPage = 1;
export const itemsPerPage = 10;
export let editingPropertyId = null;

import { showToast } from './ui.js';  // UI helper
import { role, username } from './auth.js'; // auth info only

const propertiesContainer = document.getElementById('properties');

// ------------------ Load Properties ------------------
export async function loadProperties(page = 1) {
  try {
    const res = await fetch('https://my-backend.martinmiskata.workers.dev/properties');
    const props = await res.json();
    allProperties = Array.isArray(props) ? props : [];
    renderPage(page);
  } catch {
    showToast('Грешка при зареждане на имотите');
  }
}

// ------------------ Render Properties ------------------
export function renderPage(page = 1) {
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginated = allProperties.slice(start, end);

  propertiesContainer.innerHTML = '';
  if (!paginated.length) {
    propertiesContainer.innerHTML = '<p>Няма имоти за показване.</p>';
    return;
  }

  paginated.forEach(p => {
    const div = document.createElement('div');
    div.className = 'property' + (p.status === 'taken' ? ' taken' : '');
    div.innerHTML = `
      ${p.status ? `<div class="status-badge">${p.status === 'free' ? 'Свободен' : 'Зает'}</div>` : ''}
      <img src="${p.image || ''}" alt="${p.name || ''}" />
      <div class="property-content">
        <h3>${p.name || ''}</h3>
        <p>${p.location || ''}</p>
        <p>${p.price || ''} лв/мес</p>
        <p>${p.type || ''} • ${p.status || ''}</p>
      </div>
      ${role === 'admin' ? `
        <div class="admin-buttons-right">
          <button class="edit-btn" onclick="editProperty('${p.id}')">Редактирай</button>
          <button class="delete-btn" onclick="deleteProperty('${p.id}')">Изтрий</button>
          <button class="toggle-btn" onclick="toggleStatus('${p.id}')">${p.status === 'free' ? 'Зает' : 'Свободен'}</button>
          <div class="admin-id">ID: ${p.id}</div>
        </div>` : ''}
    `;
    propertiesContainer.appendChild(div);
  });

  currentPage = page;
}

// ------------------ Edit Property ------------------
export function editProperty(id) {
  const prop = allProperties.find(p => p.id === id);
  if (!prop) return;
  editingPropertyId = id;

  document.getElementById('propertyName').value = prop.name || '';
  document.getElementById('propertyLocation').value = prop.location || '';
  document.getElementById('propertyPrice').value = prop.price || '';
  document.getElementById('propertyType').value = prop.type || '';
  document.getElementById('propertyStatus').value = prop.status || '';

  const addPropertyModal = document.getElementById('addPropertyModal');
  addPropertyModal.querySelector('h2').textContent = 'Редактирай имота';
  addPropertyModal.setAttribute('aria-hidden', 'false');
}

// ------------------ Delete Property ------------------
export async function deleteProperty(id) {
  if (!confirm('Сигурни ли сте, че искате да изтриете имота?')) return;
  if (role !== 'admin') {
    showToast('Нямате права да изтривате');
    return;
  }

  try {
    const res = await fetch(`https://my-backend.martinmiskata.workers.dev/properties/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Имотът е изтрит!');
      await loadProperties(currentPage);
    } else showToast(data.message || 'Грешка при изтриване');
  } catch {
    showToast('Грешка при изтриване');
  }
}

// ------------------ Toggle Status ------------------
export async function toggleStatus(id) {
  const prop = allProperties.find(p => p.id === id);
  if (!prop) return;
  if (role !== 'admin') {
    showToast('Нямате права да променяте статуса');
    return;
  }

  const newStatus = prop.status === 'free' ? 'taken' : 'free';
  try {
    const res = await fetch(`https://my-backend.martinmiskata.workers.dev/properties/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, role })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Статусът е променен');
      await loadProperties(currentPage);
    } else showToast(data.message || 'Грешка при промяна на статус');
  } catch {
    showToast('Грешка при промяна на статус');
  }
}
