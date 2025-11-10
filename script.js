/* ---------- Base API URL ---------- */
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

/* ---------- State ---------- */
let role = localStorage.getItem('role') || '';
let username = localStorage.getItem('username') || '';
let allProperties = [];
let wishlistIds = [];
let currentPage = 1;
const itemsPerPage = 10;
let editingPropertyId = null;

/* ---------- Toast ---------- */
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

/* ---------- Modal Utility ---------- */
function openModal(modal) { if(modal) modal.setAttribute('aria-hidden', 'false'); }
function closeModal(modal) { if(modal) modal.setAttribute('aria-hidden', 'true'); }

window.addEventListener('click', e => {
  if (e.target === loginModal) closeModal(loginModal);
  if (e.target === addPropertyModal) closeModal(addPropertyModal);
  if (e.target === wishlistModal) closeModal(wishlistModal);
  if (e.target === resetModal) closeModal(resetModal);
});

/* ---------- Elements ---------- */
const propertiesContainer = document.getElementById('properties');
const loginModal = document.getElementById('loginModal');
const loginBtn = document.getElementById('loginBtn');
const closeLogin = document.getElementById('closeLogin');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const addPropertyModal = document.getElementById('addPropertyModal');
const openAddBtn = document.getElementById('addPropertySidebarBtn');
const closeAdd = document.getElementById('closeAdd');
const propertyForm = document.getElementById('propertyForm');
const wishlistBtn = document.getElementById('wishlistBtn');
const wishlistModal = document.getElementById('wishlistModal');
const closeWishlist = document.getElementById('closeWishlist');
const wishlistContent = document.getElementById('wishlistContent');
const adminSidebar = document.getElementById('adminSidebar');
const viewSupportBtn = document.getElementById('viewSupportBtn');
const supportMessagesDiv = document.getElementById('supportMessages');
const sidebarToggle = document.getElementById('sidebarToggle');
const supportForm = document.getElementById('supportForm');
const resetModal = document.getElementById('resetModal');
const resetForm = document.getElementById('resetForm');
const resetInput = document.getElementById('resetInput');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const closeReset = document.getElementById('closeReset');
const filterLocation = document.getElementById('filterLocation');
const filterMinPrice = document.getElementById('filterMinPrice');
const filterMaxPrice = document.getElementById('filterMaxPrice');
const filterType = document.getElementById('filterType');
const filterFree = document.getElementById('filterFree');
const filterTaken = document.getElementById('filterTaken');
const applyFiltersBtn = document.getElementById('applyFilters');
const adminSearchInput = document.getElementById('adminSearchInput');
const adminSearchBtn = document.getElementById('adminSearchBtn');
const adminFound = document.getElementById('adminFound');

/* ---------- UI Init ---------- */
function uiInit() {
  loginBtn.style.display = role ? 'none' : 'inline-block';
  wishlistBtn.style.display = role ? 'inline-block' : 'none';
  logoutBtn.style.display = role ? 'inline-block' : 'none';
  sidebarToggle.style.display = role === 'admin' ? 'inline-block' : 'none';
  adminSidebar.classList.toggle('show', role === 'admin');
  openAddBtn.style.display = role === 'admin' ? 'block' : 'none';
}

//////////////////////////
// WISHLIST FUNCTIONS
//////////////////////////
async function loadWishlist(render = true) {
  if (!username) {
    if (render) wishlistContent.innerHTML = '<p>Влезте, за да видите списъка</p>';
    return;
  }
  try {
    const res = await fetch(`${API_URL}/wishlists/${username}`);
    const data = await res.json().catch(() => ({ items: [] }));
    wishlistIds = Array.isArray(data.items) ? data.items : [];

    if (!wishlistIds.length) {
      if (render) wishlistContent.innerHTML = '<p>Списъкът е празен</p>';
      return;
    }

    const pres = await fetch(`${API_URL}/properties`);
    const props = await pres.json();
    const properties = Array.isArray(props) ? props : [];

    if (!render) return;

    wishlistContent.innerHTML = '';
    wishlistIds.forEach(id => {
      const p = properties.find(x => x.id === id);
      const row = document.createElement('div');
      row.className = 'wish-item';

      if (!p) {
        row.innerHTML = `<div class="wish-meta">
                          <div style="font-size:13px;color:#6b7280"><strong>ID:</strong> ${id}</div>
                          Имот е изтрит или недостъпен
                        </div>
                        <button class="remove-wish" onclick="removeFromWishlist('${id}')">Премахни</button>`;
      } else {
        row.innerHTML = `<img class="wish-thumb" src="${p.image || ''}" />
                         <div class="wish-meta">
                           <div style="font-size:13px;color:#6b7280"><strong>ID:</strong> ${p.id}</div>
                           <strong>${p.name || ''}</strong>
                           <div style="font-size:13px;color:#6b7280">${p.location || ''} • ${p.price || ''}</div>
                         </div>
                         <button class="remove-wish" onclick="removeFromWishlist('${p.id}')">Премахни</button>`;
      }
      wishlistContent.appendChild(row);
    });
  } catch {
    if (render) wishlistContent.innerHTML = '<p>Списъкът е празен</p>';
    showToast('Грешка при зареждане на списъка');
  }
}

async function addToWishlist(propertyId) {
  if (!username) { showToast('Влезте, за да добавяте в списък'); return; }
  try {
    const res = await fetch(`${API_URL}/wishlists/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, propertyId })
    });
    const json = await res.json();
    showToast(json.success ? 'Добавено в списъка' : 'Вече е в списъка');
    loadWishlist();
    renderPage(currentPage);
  } catch {
    showToast('Грешка при добавяне');
  }
}

async function removeFromWishlist(propertyId) {
  if (!username) { showToast('Влезте, за да премахвате'); return; }
  try {
    const res = await fetch(`${API_URL}/wishlists/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, propertyId })
    });
    const json = await res.json();
    if (json.success) {
      showToast('Премахнато от списъка');
      loadWishlist();
      renderPage(currentPage);
    } else {
      showToast(json.message || 'Грешка при премахване');
    }
  } catch {
    showToast('Грешка при премахване');
  }
}

wishlistBtn.addEventListener('click', () => { openModal(wishlistModal); loadWishlist(); });
closeWishlist.addEventListener('click', () => closeModal(wishlistModal));

//////////////////////////
// LOAD & RENDER PROPERTIES
//////////////////////////
async function loadProperties(page = 1) {
  try {
    const res = await fetch(`${API_URL}/properties`);
    const props = await res.json();
    allProperties = Array.isArray(props) ? props : [];
    if (username) await loadWishlist(false);
    renderPage(page);
  } catch {
    showToast('Грешка при зареждане на имотите');
  }
}

function renderPage(page = 1) {
  let filtered = [...allProperties];

  const loc = filterLocation.value.trim().toLowerCase();
  const min = parseFloat(filterMinPrice.value) || 0;
  const max = parseFloat(filterMaxPrice.value) || Infinity;
  const type = filterType.value;
  const free = filterFree.checked;
  const taken = filterTaken.checked;

  filtered = filtered.filter(p => {
    if (!p) return false;
    if (loc && !(p.location || '').toLowerCase().includes(loc)) return false;
    if ((p.price || 0) < min || (p.price || 0) > max) return false;
    if (type && (p.type || '') !== type) return false;
    if ((free && p.status !== 'free') || (taken && p.status !== 'taken')) return false;
    return true;
  });

  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginated = filtered.slice(start, end);

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
      <button class="wishlist-btn" onclick="addToWishlist('${p.id}')">Запази</button>
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

applyFiltersBtn.addEventListener('click', () => renderPage(1));

//////////////////////////
// EDIT PROPERTY
//////////////////////////
function editProperty(id) {
  const prop = allProperties.find(p => p.id === id);
  if (!prop) return;
  editingPropertyId = id;

  document.getElementById('propertyName').value = prop.name || '';
  document.getElementById('propertyLocation').value = prop.location || '';
  document.getElementById('propertyPrice').value = prop.price || '';
  document.getElementById('propertyType').value = prop.type || '';
  document.getElementById('propertyStatus').value = prop.status || '';

  addPropertyModal.querySelector('h2').textContent = 'Редактирай имота';
  openModal(addPropertyModal);
}

async function deleteProperty(id) {
  if (!confirm('Сигурни ли сте, че искате да изтриете имота?')) return;
  if (!role || role !== 'admin') {
    showToast('Нямате права да изтривате');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/properties/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }) // move role into body to avoid CORS
    });

    const data = await res.json();

    if (data.success) {
      showToast('Имотът е изтрит!');
      await loadProperties(currentPage);
    } else {
      showToast(data.message || 'Грешка при изтриване');
    }
  } catch (err) {
    console.error(err);
    showToast('Грешка при изтриване');
  }
}


async function toggleStatus(id) {
  const prop = allProperties.find(p => p.id === id);
  if (!prop) return;
  if (!role || role !== 'admin') {
    showToast('Нямате права да променяте статуса');
    return;
  }

  const newStatus = prop.status === 'free' ? 'taken' : 'free';

  try {
    const res = await fetch(`${API_URL}/properties/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, role }) // role moved to body
    });

    const data = await res.json();

    if (data.success) {
      showToast('Статусът е променен');
      await loadProperties(currentPage);
    } else {
      showToast(data.message || 'Грешка при промяна на статус');
    }
  } catch (err) {
    console.error(err);
    showToast('Грешка при промяна на статус');
  }
}


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

  if (imageInput.files.length > 0) {
    const file = imageInput.files[0];
    const reader = new FileReader();
    image = await new Promise(resolve => {
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  } else if (editingPropertyId) {
    const prop = allProperties.find(p => p.id === editingPropertyId);
    if (prop?.image) image = prop.image;
  }

  const property = { name, location, price, type, status };
  if (image) property.image = image;

  try {
    const url = editingPropertyId
      ? `${API_URL}/properties/${editingPropertyId}`
      : `${API_URL}/properties`;
    const method = editingPropertyId ? 'PUT' : 'POST';

    // Send role inside the body, not headers
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...property, role })
    });

    const data = await res.json();

    if (data.success) {
      showToast(editingPropertyId ? 'Имотът е обновен!' : 'Имотът е добавен успешно!');
      closeModal(addPropertyModal);
      propertyForm.reset();
      editingPropertyId = null;
      addPropertyModal.querySelector('h2').textContent = 'Добави нов имот';
      await loadProperties(currentPage);
    } else {
      showToast(data.message || 'Грешка');
    }
  } catch (err) {
    console.error(err);
    showToast('Грешка при изпращане на имота');
  }
});


/* ---------- Login / Logout ---------- */
loginBtn.addEventListener('click', () => openModal(loginModal));
closeLogin.addEventListener('click', () => closeModal(loginModal));

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const u = document.getElementById('username').value;
  const p = document.getElementById('password').value;
  try {
    const res = await fetch(`${API_URL}/login`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username:u,password:p })
    });
    const data = await res.json();
    if(data.success){
      role=data.role; username=data.username;
      localStorage.setItem('role',role);
      localStorage.setItem('username',username);
      showToast('Успешен вход!');
      closeModal(loginModal);
      uiInit();
      await loadProperties();
    } else showToast('Грешно потребителско име или парола');
  } catch { showToast('Грешка при опит за вход'); }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('role'); localStorage.removeItem('username');
  role=''; username='';
  uiInit(); showToast('Успешен изход!'); loadProperties();
});

/* ---------- Init ---------- */
uiInit();
loadProperties();