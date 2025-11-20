// Admin search property by ID
adminSearchBtn?.addEventListener('click', async () => {
  if (!adminSearchInput || !adminFound) return;
  const searchId = adminSearchInput.value.trim();
  if (!searchId) return;
  
// Open Add Property modal
openAddBtn?.addEventListener('click', () => {
  if (!addPropertyModal) return;
  addPropertyModal.style.display = 'flex';   // show modal
});

// Close Add Property modal
closeAddBtn?.addEventListener('click', () => {
  if (!addPropertyModal) return;
  addPropertyModal.style.display = 'none';   // hide modal
});

  try {
    const res = await fetch(`${API_URL}/properties`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const properties = await res.json();
    const prop = properties.find(p => String(p.id) === searchId);

    if (!prop) {
      adminFound.textContent = 'Няма намерен имот с това ID';
      return;
    }

    adminFound.innerHTML = `
      <div class="property" data-id="${prop.id}">
        ${prop.images && prop.images.length > 0 ? `<img src="${prop.images[0]}" alt="${prop.title}" style="max-width:100%;margin-top:10px;border-radius:8px;">` : ''}
        <div class="property-content">
          <h3>${prop.title || 'Без име'}</h3>
          <p><strong>Локация:</strong> ${prop.location || '-'}</p>
          <p><strong>Цена:</strong> ${prop.price ?? '-'}</p>
          <p><strong>Тип:</strong> ${prop.type || '-'}</p>
          <p><strong>Категория:</strong> ${prop.category || '-'}</p>
          <p><strong>Статус:</strong> ${prop.status || '-'}</p>
          <p><strong>Спални:</strong> ${prop.bedrooms ?? '-'}</p>
          <p><strong>Бани:</strong> ${prop.bathrooms ?? '-'}</p>
          <p><strong>Площ:</strong> ${prop.size ?? '-'} m²</p>
          <p><strong>Година:</strong> ${prop.year ?? '-'}</p>
          <p><strong>Описание:</strong> ${prop.description || '-'}</p>
          <button id="adminDeleteBtn">Изтрий имота</button>
        </div>
      </div>
    `;

    // Delete property
    const deleteBtn = document.getElementById('adminDeleteBtn');
    deleteBtn?.addEventListener('click', async () => {
      if (!confirm('Наистина ли искате да изтриете този имот?')) return;
      try {
        const delRes = await fetch(`${API_URL}/properties/${prop.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        if (!delRes.ok) throw new Error(`HTTP ${delRes.status}`);
        showToast('Имотът беше изтрит!');
        adminFound.innerHTML = '';
        await loadProperties(); // refresh main property list
      } catch (err) {
        console.error(err);
        showToast('Грешка при изтриване на имота');
      }
    });

  } catch (err) {
    console.error(err);
    adminFound.textContent = 'Грешка при търсене на имота';
  }
});
