const API_URL = 'https://my-backend.martinmiskata.workers.dev';

export function initAdminSidebar(){
  const sidebar = document.getElementById('adminSidebar');
  const addBtn = document.getElementById('addPropertySidebarBtn');
  const supportBtn = document.getElementById('viewSupportBtn');
  const searchBtn = document.getElementById('adminSearchBtn');
  const searchInput = document.getElementById('adminSearchInput');
  const foundDiv = document.getElementById('adminFound');

  addBtn?.addEventListener('click',()=>{
    document.getElementById('addPropertyModal')?.setAttribute('aria-hidden','false');
  });

  supportBtn?.addEventListener('click',()=>{
    document.getElementById('ticketModal')?.setAttribute('aria-hidden','false');
  });

  searchBtn?.addEventListener('click', async()=>{
    const id = searchInput.value.trim();
    if(!id) return alert('Въведете ID');
    try{
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/properties/${id}`, {
        headers: token?{'Authorization':'Bearer '+token}:{}
      });
      if(!res.ok) throw new Error('Не е намерен имот');
      const p = await res.json();
      foundDiv.innerHTML=`
        <p><strong>${p.name}</strong> (${p.category}) - ${p.price}лв</p>
        <button class="admin-btn edit-btn" onclick="window.openEditModal('${p.id}')">Редактирай</button>
        <button class="admin-btn delete-btn" onclick="window.deleteProperty('${p.id}')">Изтрий</button>
      `;
    }catch(err){
      foundDiv.innerHTML='<p>Не е намерен имот с това ID</p>';
      console.error(err);
    }
  });
}

document.addEventListener('DOMContentLoaded', ()=>initAdminSidebar());
