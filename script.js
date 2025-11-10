/* ---------- Base API URL ---------- */
const API_URL = 'https://my-backend.martinmiskata.workers.dev';

/* ---------- State ---------- */
let role = localStorage.getItem('role') || '';
let username = localStorage.getItem('username') || '';
let allProperties = [];
let wishlistIds = [];
let currentPage = 1;
const itemsPerPage = 10;
let editingPropertyId = null; // tracks currently edited property

/* ---------- Helpers: Toast ---------- */
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

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
const propertyImageInput = document.getElementById('propertyImage');

/* ---------- Modal Utility ---------- */
function openModal(modal) { modal.setAttribute('aria-hidden', 'false'); }
function closeModal(modal) { modal.setAttribute('aria-hidden', 'true'); }

window.addEventListener('click', e => {
  if (e.target === loginModal) closeModal(loginModal);
  if (e.target === addPropertyModal) closeModal(addPropertyModal);
  if (e.target === wishlistModal) closeModal(wishlistModal);
  if (e.target === resetModal) closeModal(resetModal);
});

/* ---------- UI Initialization ---------- */
function uiInit() {
  loginBtn.style.display = role ? 'none' : 'inline-block';
  wishlistBtn.style.display = role ? 'inline-block' : 'none';
  logoutBtn.style.display = role ? 'inline-block' : 'none';
  sidebarToggle.style.display = role === 'admin' ? 'inline-block' : 'none';
  adminSidebar.classList.toggle('show', role === 'admin');
  openAddBtn.style.display = role === 'admin' ? 'block' : 'none';
}

/* ---------- Load Wishlist ---------- */
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
    const props = Array.isArray(await pres.json()) ? await pres.json() : [];

    if (!render) return;

    wishlistContent.innerHTML = '';
    wishlistIds.forEach(id => {
      const p = props.find(x => x.id === id);
      const row = document.createElement('div');
      row.className = 'wish-item';

      if (!p) {
        row.innerHTML = `<div class="wish-meta"><div style="font-size:13px;color:#6b7280"><strong>ID:</strong> ${id}</div>Имот е изтрит или недостъпен</div>
                         <button class="remove-wish" onclick="removeFromWishlist('${id}')">Премахни</button>`;
      } else {
        row.innerHTML = `<img class="wish-thumb" src="${p.image || ''}" />
                         <div class="wish-meta"><div style="font-size:13px;color:#6b7280"><strong>ID:</strong> ${p.id}</div>
                         <strong>${p.name || ''}</strong><div style="font-size:13px;color:#6b7280">${p.location || ''} • ${p.price || ''}</div></div>
                         <button class="remove-wish" onclick="removeFromWishlist('${p.id}')">Премахни</button>`;
      }
      wishlistContent.appendChild(row);
    });
  } catch {
    if (render) wishlistContent.innerHTML = '<p>Списъкът е празен</p>';
    showToast('Грешка при зареждане на списъка');
  }
}

/* ---------- Add / Remove Wishlist ---------- */
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
    await fetch(`${API_URL}/wishlists/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, propertyId })
    });
    showToast('Премахнато от списъка');
    loadWishlist();
    renderPage(currentPage);
  } catch {
    showToast('Грешка при премахване');
  }
}

wishlistBtn.addEventListener('click', () => { openModal(wishlistModal); loadWishlist(); });
closeWishlist.addEventListener('click', () => closeModal(wishlistModal));

/* ---------- Load Properties ---------- */
async function loadProperties(page = 1) {
  try {
    const res = await fetch(`${API_URL}/properties`);
    const props = Array.isArray(await res.json()) ? await res.json() : [];
    allProperties = props;
    if (username) await loadWishlist(false);
    renderPage(page);
  } catch {
    showToast('Грешка при зареждане на имотите');
  }
}

/* ---------- Render Properties ---------- */
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
    if (free && (p.status || '') !== 'free') return false;
    if (taken && (p.status || '') !== 'taken') return false;
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
    div.className = `property ${p.status === 'taken' ? 'taken' : ''}`;
    div.innerHTML = `
      <img src="${p.image || ''}" alt="${p.name || ''}" />
      <div class="status-badge">${p.status === 'free' ? 'Свободен' : 'Зает'}</div>
      <div class="property-content">
        <h3>${p.name || ''}</h3>
        <p>${p.location || ''}</p>
        <p>${p.price || ''} лв/мес</p>
        <p>${p.type || ''}</p>
      </div>
      <div class="admin-buttons-right">
        <button class="admin-btn edit-btn" onclick="editProperty('${p.id}')">Редактирай</button>
        <button class="admin-btn delete-btn" onclick="deleteProperty('${p.id}')">Изтрий</button>
        <button class="admin-btn toggle-btn" onclick="togglePropertyStatus('${p.id}')">
          ${p.status === 'free' ? 'Маркирай като зает' : 'Маркирай като свободен'}
        </button>
        <div class="admin-id">ID: ${p.id}</div>
      </div>
      <button class="wishlist-btn" onclick="addToWishlist('${p.id}')">Запази</button>
    `;
    propertiesContainer.appendChild(div);
  });

  currentPage = page;
}

applyFiltersBtn.addEventListener('click', () => renderPage(1));

/* ---------- Edit Property ---------- */
async function editProperty(id) {
  editingPropertyId = id;
  const prop = allProperties.find(p => p.id === id);
  if (!prop) { showToast('Имотът не е намерен'); return; }

  document.getElementById('propertyName').value = prop.name || '';
  document.getElementById('propertyLocation').value = prop.location || '';
  document.getElementById('propertyPrice').value = prop.price || '';
  document.getElementById('propertyType').value = prop.type || 'apartment';
  document.getElementById('propertyStatus').value = prop.status || 'free';
  
  // Show preview of current image if exists
  if (prop.image) {
    const imgPreview = document.createElement('img');
    imgPreview.src = prop.image;
    imgPreview.style.maxWidth = '100%';
    imgPreview.style.marginBottom = '8px';
    propertyForm.insertBefore(imgPreview, propertyForm.firstChild.nextSibling);
  }

  openModal(addPropertyModal);
  document.querySelector('#addPropertyModal h2').textContent = 'Редактирай имот';
}

/* ---------- Add / Update Property ---------- */
propertyForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('propertyName').value.trim();
  const location = document.getElementById('propertyLocation').value.trim();
  const price = parseFloat(document.getElementById('propertyPrice').value) || 0;
  const type = document.getElementById('propertyType').value;
  const status = document.getElementById('propertyStatus').value;
  let image = '';

  if (propertyImageInput.files.length > 0) {
    const file = propertyImageInput.files[0];
    const reader = new FileReader();
    await new Promise(resolve => {
      reader.onload = () => { image = reader.result; resolve(); };
      reader.readAsDataURL(file);
    });
  } else if (editingPropertyId) {
    const oldProp = allProperties.find(p => p.id === editingPropertyId);
    image = oldProp.image; // keep old image
  }

  const property = { name, location, price, type, status, image };

  try {
    let res, data;
    if (editingPropertyId) {
      res = await fetch(`${API_URL}/properties/${editingPropertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, property })
      });
      data = await res.json();
    } else {
      res = await fetch(`${API_URL}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, property })
      });
      data = await res.json();
    }

    if (data.success) {
      showToast(editingPropertyId ? 'Имотът е редактиран успешно!' : 'Имотът е добавен успешно!');
      closeModal(addPropertyModal);
      propertyForm.reset();
      const previews = propertyForm.querySelectorAll('img');
      previews.forEach(img => img.remove());
      editingPropertyId = null;
      document.querySelector('#addPropertyModal h2').textContent = 'Добави нов имот';
      loadProperties();
    } else showToast(data.message || 'Грешка при добавяне/редактиране на имота');
  } catch {
    showToast('Грешка при добавяне/редактиране на имота');
  }
});

/* ---------- Delete Property ---------- */
async function deleteProperty(id) {
  if (!confirm('Сигурни ли сте, че искате да изтриете този имот?')) return;
  try {
    const res = await fetch(`${API_URL}/properties/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'role': role }
    });
    const data = await res.json();
    showToast(data.success ? 'Имотът е изтрит' : 'Грешка при изтриване');
    loadProperties();
  } catch { showToast('Грешка при изтриване'); }
}

/* ---------- Toggle Property Status ---------- */
async function togglePropertyStatus(id) {
  const prop = allProperties.find(p => p.id === id);
  if (!prop) return;
  const newStatus = prop.status === 'free' ? 'taken' : 'free';
  try {
    const res = await fetch(`${API_URL}/properties/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'role': role },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    showToast(data.success ? 'Статусът е променен' : 'Грешка');
    loadProperties();
  } catch { showToast('Грешка'); }
}

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
      loadProperties();
    } else showToast('Грешно потребителско име или парола');
  } catch { showToast('Грешка при опит за вход'); }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('role'); localStorage.removeItem('username');
  role=''; username='';
  uiInit(); showToast('Успешен изход!'); loadProperties();
});

/* ---------- Reset Password ---------- */
forgotPasswordLink.addEventListener('click', e => { e.preventDefault(); openModal(resetModal); });
closeReset.addEventListener('click', () => closeModal(resetModal));
resetForm.addEventListener('submit', async e => {
  e.preventDefault();
  const val = resetInput.value.trim();
  if(!val){ showToast('Въведете имейл или потребителско име'); return; }
  try {
    const res = await fetch(`${API_URL}/reset-password`,{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({emailOrUsername: val})
    });
    const data = await res.json();
    closeModal(resetModal);
    showToast(data.message||'Заявката е създадена');
    resetForm.reset();
  } catch { showToast('Грешка при изпращане'); }
});

/* ---------- Support Form ---------- */
supportForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name=document.getElementById('supportName').value;
  const email=document.getElementById('supportEmail').value;
  const message=document.getElementById('supportMessage').value;
  try{
    await fetch(`${API_URL}/support`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,message})});
    showToast('Съобщението е изпратено');
    supportForm.reset();
  } catch { showToast('Грешка при изпращане на съобщение'); }
});

/* ---------- Admin Sidebar ---------- */
sidebarToggle.addEventListener('click',()=>adminSidebar.classList.toggle('show'));
viewSupportBtn.addEventListener('click', async () => {
  try{
    const res=await fetch(`${API_URL}/support-messages`);
    const data=Array.isArray(await res.json())?await res.json():[];
    supportMessagesDiv.innerHTML='';
    data.forEach(m => {
      const div=document.createElement('div');
      div.innerHTML=`<p><strong>${m.name}</strong> (${m.email})</p><p>${m.message}</p><hr>`;
      supportMessagesDiv.appendChild(div);
    });
  } catch { showToast('Грешка при зареждане на съобщения'); }
});

/* ---------- Admin Search Property by ID ---------- */
adminSearchBtn.addEventListener('click', () => {
  const id=adminSearchInput.value.trim();
  if(!id) return;
  const prop = allProperties.find(p=>p.id===id);
  if(prop) adminFound.textContent=`Намерено: ${prop.name} (${prop.status})`;
  else adminFound.textContent='Не е намерен имот с това ID';
});

/* ---------- Initialization ---------- */
uiInit();
loadProperties();
