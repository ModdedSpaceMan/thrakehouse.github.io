/* ---------- State ---------- */
let role = localStorage.getItem('role') || '';
let username = localStorage.getItem('username') || '';
let allProperties = [];
let wishlistIds = [];
let currentPage = 1;
const itemsPerPage = 10;

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
const adminSearchInput = document.getElementById('adminSearchInput');
const adminSearchBtn = document.getElementById('adminSearchBtn');
const adminFound = document.getElementById('adminFound');
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

/* ---------- Modal Utility ---------- */
function openModal(modal) { modal.setAttribute('aria-hidden', 'false'); }
function closeModal(modal) { modal.setAttribute('aria-hidden', 'true'); }

window.addEventListener('click', (e) => {
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
async function loadWishlist() {
  if (!username) {
    wishlistContent.innerHTML = '<p>Влезте, за да видите списъка</p>';
    return;
  }
  try {
    const res = await fetch(`/wishlists/${username}`);
    const data = await res.json();
    wishlistIds = data.items || [];
    if (!wishlistIds.length) {
      wishlistContent.innerHTML = '<p>Списъкът е празен</p>';
      return;
    }
    const pres = await fetch('/properties');
    const props = await pres.json();
    wishlistContent.innerHTML = '';
    wishlistIds.forEach(id => {
      const p = props.find(x => x.id === id);
      const row = document.createElement('div');
      row.className = 'wish-item';
      if (!p) {
        row.innerHTML = `<div class="wish-meta"><div style="font-size:13px;color:#6b7280"><strong>ID:</strong> ${id}</div>Имот е изтрит или недостъпен</div>
                         <button class="remove-wish" onclick="removeFromWishlist('${id}')">Премахни</button>`;
      } else {
        row.innerHTML = `<img class="wish-thumb" src="${p.image}" />
                         <div class="wish-meta"><div style="font-size:13px;color:#6b7280"><strong>ID:</strong> ${p.id}</div>
                         <strong>${p.name}</strong><div style="font-size:13px;color:#6b7280">${p.location} • ${p.price}</div></div>
                         <button class="remove-wish" onclick="removeFromWishlist('${p.id}')">Премахни</button>`;
      }
      wishlistContent.appendChild(row);
    });
  } catch {
    showToast('Грешка при зареждане на списъка');
  }
}

/* ---------- Add / Remove Wishlist ---------- */
async function addToWishlist(propertyId) {
  if (!username) { showToast('Влезте, за да добавяте в списък'); return; }
  try {
    const res = await fetch('/wishlists/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, propertyId })
    });
    const json = await res.json();
    if (json.success) showToast('Добавено в списъка');
    else showToast('Вече е в списъка');
    loadWishlist();
    loadProperties(currentPage);
  } catch {
    showToast('Грешка при добавяне');
  }
}

async function removeFromWishlist(propertyId) {
  if (!username) { showToast('Влезте, за да премахвате'); return; }
  try {
    await fetch('/wishlists/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, propertyId })
    });
    showToast('Премахнато от списъка');
    loadWishlist();
    loadProperties(currentPage);
  } catch {
    showToast('Грешка при премахване');
  }
}

wishlistBtn.addEventListener('click', () => { openModal(wishlistModal); loadWishlist(); });
closeWishlist.addEventListener('click', () => closeModal(wishlistModal));

/* ---------- Property Modal ---------- */
const propertyModal = document.createElement('div');
propertyModal.className = 'property-modal';
propertyModal.setAttribute('aria-hidden', 'true');
propertyModal.innerHTML = `
  <div class="property-modal-content">
    <button class="property-modal-close" aria-label="Close">&times;</button>
    <img id="modalImage" src="" />
    <div class="modal-body">
      <h3 id="modalName"></h3>
      <p><strong>ID:</strong> <span id="modalId"></span></p>
      <p id="modalLocation"></p>
      <p id="modalPrice"></p>
      <p>Контакт: <a href="mailto:info@example.com">info@example.com</a></p>
    </div>
  </div>`;
document.body.appendChild(propertyModal);
propertyModal.querySelector('.property-modal-close').addEventListener('click', () => closeModal(propertyModal));

/* ---------- Render Single Property ---------- */
function renderProperty(p) {
    const div = document.createElement('div');
    div.className = 'property';
    const inWishlist = wishlistIds.includes(p.id);
  
    div.innerHTML = `
      <img src="${p.image}" />
      <div class="property-content">
        <h3>${p.name}</h3>
        <p>${p.location} • ${p.price}</p>
        <div style="margin-top:10px;">
          ${p.status === 'taken'
            ? username && inWishlist
              ? `<button class="remove-wish">Премахни от списъка</button>`
              : `<div style="padding:12px;color:#9aa3ac;">В момента е зает</div>`
            : username
              ? inWishlist
                ? `<button class="remove-wish">Премахни</button>`
                : `<button class="top-btn">Добави в списъка</button>`
              : `<div style="padding:12px;color:#9aa3ac;">Влезте за да добавите</div>`}
        </div>
      </div>
      <div class="status-badge">${p.type.toUpperCase()}</div>
      ${role === 'admin' ? `
        <div class="admin-buttons-right">
          <button class="admin-btn delete-btn">Изтрий</button>
          <button class="admin-btn edit-btn">Редактирай</button>
          <button class="admin-btn toggle-btn">${p.status==='free' ? 'Маркирай като зает' : 'Освободи'}</button>
          <div class="admin-id">ID: ${p.id}</div>
        </div>
      ` : ''}`;
  
    // Property click -> modal
    div.addEventListener('click', e => {
      if (e.target.closest('.admin-btn') || e.target.closest('.top-btn') || e.target.closest('.remove-wish')) return;
      document.getElementById('modalImage').src = p.image;
      document.getElementById('modalName').textContent = p.name;
      document.getElementById('modalId').textContent = p.id;
      document.getElementById('modalLocation').textContent = p.location;
      document.getElementById('modalPrice').textContent = p.price;
      openModal(propertyModal);
    });
  
    // Wishlist
    div.querySelector('.top-btn')?.addEventListener('click', e => { e.stopPropagation(); addToWishlist(p.id); });
    div.querySelector('.remove-wish')?.addEventListener('click', e => { e.stopPropagation(); removeFromWishlist(p.id); });
  
    // Admin: Delete
    div.querySelector('.delete-btn')?.addEventListener('click', async e => {
      e.stopPropagation();
      if (!confirm('Сигурни ли сте?')) return;
      try {
        await fetch(`/properties/${p.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role })
        });
        showToast('Имотът е изтрит');
        loadProperties(currentPage);
      } catch { showToast('Грешка при изтриване'); }
    });
  
    // Admin: Toggle Status
    div.querySelector('.toggle-btn')?.addEventListener('click', async e => {
      e.stopPropagation();
      const newStatus = p.status === 'free' ? 'taken' : 'free';
      try {
        await fetch(`/properties/${p.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, status: newStatus })
        });
        showToast('Статусът беше обновен');
        loadProperties(currentPage);
      } catch { showToast('Грешка при обновяване'); }
    });
  
    // Admin: Edit
    div.querySelector('.edit-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      if (role !== 'admin') return showToast('Нямате права');
      openEditProperty(p);
    });
  
    return div;
  }
  
  
/* ---------- Open Edit Property ---------- */
function openEditProperty(prop) {
  openModal(addPropertyModal);
  addPropertyModal.querySelector('h2').textContent = 'Редактирай имот';
  addPropertyModal.dataset.editingId = prop.id;

  document.getElementById('propertyName').value = prop.name;
  document.getElementById('propertyLocation').value = prop.location;
  document.getElementById('propertyPrice').value = prop.price.replace(' лв/месец','');
  document.getElementById('propertyType').value = prop.type;
  document.getElementById('propertyStatus').value = prop.status;

  // Image preview
  let imgPreview = document.getElementById('propertyPreview');
  if(!imgPreview){
    imgPreview = document.createElement('img');
    imgPreview.id = 'propertyPreview';
    imgPreview.style.width = '100px';
    imgPreview.style.marginTop = '8px';
    propertyForm.insertBefore(imgPreview, propertyForm.querySelector('button'));
  }
  imgPreview.src = prop.image;
}

/* ---------- Add / Edit Property ---------- */
openAddBtn.addEventListener('click', () => {
  openModal(addPropertyModal);
  addPropertyModal.querySelector('h2').textContent = 'Добави нов имот';
  delete addPropertyModal.dataset.editingId;
  propertyForm.reset();
  const preview = document.getElementById('propertyPreview');
  if(preview) preview.src = '';
});

closeAdd.addEventListener('click', () => closeModal(addPropertyModal));

propertyForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (role !== 'admin') { showToast('Нямате права'); return; }

  const fileInput = document.getElementById('propertyImage');
  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onloadend = async () => {
    const imgSrc = file ? reader.result : document.getElementById('propertyPreview')?.src;
    const newP = {
      name: document.getElementById('propertyName').value,
      location: document.getElementById('propertyLocation').value,
      price: document.getElementById('propertyPrice').value + ' лв/месец',
      type: document.getElementById('propertyType').value,
      status: document.getElementById('propertyStatus').value,
      image: imgSrc
    };

    const editingId = addPropertyModal.dataset.editingId;

    try {
      let res;
      if (editingId) {
        res = await fetch(`/properties/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: newP, role })
        });
      } else {
        if (!file) { showToast('Моля изберете снимка'); return; }
        res = await fetch('/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ property: newP, role })
        });
      }

      const json = await res.json();
      if (json.success) {
        showToast(editingId ? 'Имотът беше редактиран' : 'Имотът е добавен');
        propertyForm.reset();
        delete addPropertyModal.dataset.editingId;
        document.getElementById('propertyPreview').src = '';
        addPropertyModal.querySelector('h2').textContent = 'Добави нов имот';
        closeModal(addPropertyModal);
        loadProperties(currentPage);
      } else showToast('Грешка при запис');
    } catch {
      showToast('Грешка при запис');
    }
  };

  if (file) reader.readAsDataURL(file);
  else reader.onloadend();
});

/* ---------- Load Properties ---------- */
async function loadProperties(page = 1) {
    try {
      // Load properties
      const res = await fetch('/properties');
      const props = await res.json();
      allProperties = props;
  
      // If user is logged in, load wishlist first
      if (username) {
        await loadWishlist(true); // fetch wishlist IDs but don't render modal
      }
  
      renderPage(page);
    } catch {
      showToast('Грешка при зареждане на имотите');
    }
  }
  

function renderPage(page = 1) {
  currentPage = page;
  const container = document.querySelector('.properties');
  container.innerHTML = '';
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = allProperties.slice(start, end);
  pageItems.forEach(p => container.appendChild(renderProperty(p)));
}

/* ---------- Filters ---------- */
let filteredProperties = []; // new list for filtered results

applyFiltersBtn.addEventListener('click', () => {
  const loc = filterLocation.value.toLowerCase();
  const minPrice = parseFloat(filterMinPrice.value) || 0;
  const maxPrice = parseFloat(filterMaxPrice.value) || Infinity;
  const typeVal = filterType.value;
  const freeChecked = filterFree.checked;
  const takenChecked = filterTaken.checked;

  filteredProperties = allProperties.filter(p => {
    const priceNum = parseFloat(p.price.replace(/\D/g,'')) || 0;
    const statusMatch = (freeChecked && p.status==='free') || 
                        (takenChecked && p.status==='taken') || 
                        (!freeChecked && !takenChecked);
    return p.location.toLowerCase().includes(loc) &&
           priceNum >= minPrice && priceNum <= maxPrice &&
           (typeVal ? p.type === typeVal : true) &&
           statusMatch;
  });

  renderPage(1, filteredProperties);
});

/* ---------- Reset Filters ---------- */
const resetFiltersBtn = document.createElement('button');
resetFiltersBtn.textContent = 'Нулирай';
resetFiltersBtn.id = 'resetFilters';
resetFiltersBtn.style.marginLeft = '10px';
document.getElementById('propertyFilters').appendChild(resetFiltersBtn);

resetFiltersBtn.addEventListener('click', () => {
  filterLocation.value = '';
  filterMinPrice.value = '';
  filterMaxPrice.value = '';
  filterType.value = '';
  filterFree.checked = false;
  filterTaken.checked = false;

  filteredProperties = [];
  renderPage(1); // show full allProperties list
});

/* ---------- Update renderPage / renderPagination to accept list ---------- */
function renderPage(page = 1, list = filteredProperties.length ? filteredProperties : allProperties) {
  currentPage = page;
  const container = document.querySelector('.properties');
  container.innerHTML = '';
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = list.slice(start, end);
  pageItems.forEach(p => container.appendChild(renderProperty(p)));
  renderPagination(list);
}

function renderPagination(list = filteredProperties.length ? filteredProperties : allProperties) {
  const container = document.getElementById('pagination');
  if (!container) return;
  container.innerHTML = '';
  const totalPages = Math.ceil(list.length / itemsPerPage);
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = 'filter-btn';
    if (i === currentPage) btn.classList.add('active');
    btn.addEventListener('click', () => renderPage(i, list));
    container.appendChild(btn);
  }
}

/* ---------- Login / Logout ---------- */
loginBtn.addEventListener('click', () => openModal(loginModal));
closeLogin.addEventListener('click', () => closeModal(loginModal));

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const u = document.getElementById('username').value;
  const p = document.getElementById('password').value;
  try {
    const res = await fetch('/login', {
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
    const res = await fetch('/reset-password',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({emailOrUsername: val})
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
    await fetch('/support',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,message})});
    showToast('Съобщението е изпратено!');
    supportForm.reset();
  } catch{ showToast('Грешка при изпращане'); }
});

/* ---------- Admin: View Support ---------- */
viewSupportBtn.addEventListener('click', async ()=>{
  if(role!=='admin'){showToast('Нямате права!'); return;}
  try{
    const res=await fetch(`/support?role=${role}`);
    if(res.status===403){showToast('Нямате права'); return;}
    const msgs=await res.json();
    supportMessagesDiv.innerHTML='';
    if(!msgs.length){supportMessagesDiv.textContent='Няма съобщения'; return;}
    msgs.slice().reverse().forEach(m=>{
      const el=document.createElement('div');
      el.style.padding='8px';
      el.style.borderBottom='1px solid rgba(0,0,0,0.06)';
      el.innerHTML=`<strong>${escapeHtml(m.name)} (${escapeHtml(m.email||m.emailOrUsername||'')})</strong><p style="margin-top:6px">${escapeHtml(m.message)}</p><small style="color:#9aa3ac">${new Date(m.createdAt).toLocaleString()}</small>`;
      supportMessagesDiv.appendChild(el);
    });
  }catch{showToast('Грешка при зареждане на съобщения');}
});

/* ---------- Sidebar Toggle ---------- */
sidebarToggle.addEventListener('click',()=>adminSidebar.classList.toggle('show'));

/* ---------- Escape HTML ---------- */
function escapeHtml(text){
  const div=document.createElement('div');
  div.textContent=text;
  return div.innerHTML;
}

/* ---------- Init ---------- */
uiInit();
loadProperties();
