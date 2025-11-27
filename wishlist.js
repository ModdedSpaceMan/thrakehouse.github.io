export function renderWishlist() {
  if (!wishlistContainer) return;

  const savedProps = propertiesData.filter(p => wishlistIds.includes(String(p.id)));

  if (!savedProps.length) {
    wishlistContainer.innerHTML = '<p>Вашият списък е празен.</p>';
    return;
  }

  wishlistContainer.innerHTML = savedProps
    .map(p => {
      const id = p.id ?? '-';
      const title = p.title ?? 'Без име';
      const price = p.price != null ? p.price + ' лева' : '-';
      const category = p.category ?? '-';
      const status = p.status ?? '-';
      const bedrooms = p.bedrooms ?? '-';
      const bathrooms = p.bathrooms ?? '-';
      const size = p.size != null ? p.size + ' м²' : '-';
      const year = p.year ?? '-';

      // Show only the first image as a preview
      const image = p.firstImage || p.restImages?.[0] || '';
      const inWishlist = wishlistIds.includes(String(id)) ? '❤️' : '🤍';

      return `
        <div class="property" data-id="${id}">
          ${image ? `<img src="${image}" alt="${title}" loading="lazy">` : ''}
          <div class="property-id-box">ID: ${id}</div>
          <div class="property-content">
            <h3>${title}</h3>
            <p><strong>Цена:</strong> ${price}</p>
            <p><strong>Категория:</strong> ${category}</p>
            <p><strong>Статус:</strong> ${status}</p>
            <p><strong>Спални:</strong> ${bedrooms}</p>
            <p><strong>Бани:</strong> ${bathrooms}</p>
            <p><strong>Площ:</strong> ${size}</p>
            <p><strong>Година:</strong> ${year}</p>
          </div>
          <div class="property-actions">
            <button class="wishlist-btn" data-id="${id}">${inWishlist}</button>
          </div>
        </div>
      `;
    })
    .join('');

  attachListeners();
}

// --------------------
// Attach click listeners
function attachListeners() {
  wishlistContainer.querySelectorAll('.property').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') return;
      const id = card.dataset.id;
      const property = propertiesData.find(p => p.id == id);
      if (!property) return showToast('Не може да се зареди имотът');

      // Pass full property including restImages to your modal
      // Example: your modal can iterate property.restImages and property.firstImage
      window.openPropertyDetails(property);
    });
  });

  wishlistContainer.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      await mainToggleWishlist(btn.dataset.id);
      loadWishlist();
    });
  });
}
