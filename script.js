/* ---------- Base API URL ---------- */
const API_URL = 'https://my-backend.martinmiskata.workers.dev/';

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
async function loadWishlist(render = true) {
  if (!username) {
    if (render) wishlistContent.innerHTML = '<p>Влезте, за да видите списъка</p>';
    return;
  }
  try {
    const res = await fetch(`${API_URL}/wishlists/${username}`);
    const data = await res.json();
    wishlistIds = data.items || [];
    if (!wishlistIds.length) {
      if (render) wishlistContent.innerHTML = '<p>Списъкът е празен</p>';
      return;
    }
    const pres = await fetch(`${API_URL}/properties`);
    const props = await pres.json();
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
    const res = await fetch(`${API_URL}/wishlists/add`, {
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
    await fetch(`${API_URL}/wishlists/remove`, {
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

/* ---------- Properties ---------- */
async function loadProperties(page = 1) {
  try {
    const res = await fetch(`${API_URL}/properties`);
    const props = await res.json();
    allProperties = props;
    if (username) await loadWishlist(false);
    renderPage(page);
  } catch {
    showToast('Грешка при зареждане на имотите');
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

/* ---------- Signup handled separately in signup.js ---------- */

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
    await fetch(`${API_URL}/support`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,message})});
    showToast('Съобщението е изпратено!');
    supportForm.reset();
  } catch{ showToast('Грешка при изпращане'); }
});

/* ---------- Admin: View Support ---------- */
viewSupportBtn.addEventListener('click', async ()=>{
  if(role!=='admin'){showToast('Нямате права!'); return;}
  try{
    const res=await fetch(`${API_URL}/support?role=${role}`);
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
