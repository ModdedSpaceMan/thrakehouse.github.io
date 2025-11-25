export function renderWishlist() {
  if (!wishlistContainer) return;

  const savedProps = propertiesData.filter(p => wishlistIds.includes(String(p.id)));
  console.log('Saved properties to show in wishlist:', savedProps);

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
      const bedrooms = p.bedrooms != null ? p.bedrooms : '-';
      const bathrooms = p.bathrooms != null ? p.bathrooms : '-';
      const size = p.size != null ? p.size + ' м²' : '';
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
            ${category === 'rental' ? `<p><strong>Статус:</strong> ${status}</p>` : ''}
            <p><strong>Спални:</strong> ${bedrooms}</p>
            <p><strong>Бани:</strong> ${bathrooms}</p>
            <p><strong>Площ:</strong> ${size}</p>
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
