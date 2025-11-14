// i18n.js
import { translations } from './translations.js';

export const setLanguage = (lang) => {
  if (!translations[lang]) return;

  // Top buttons
  document.getElementById('loginBtn').textContent = translations[lang].login;
  document.getElementById('logoutBtn').textContent = translations[lang].logout;
  document.getElementById('registerBtn').textContent = translations[lang].register;
  document.querySelector('.go-wishlist-btn').textContent = translations[lang].wishlist;

  // Filters
  const filters = translations[lang].filters;
  document.getElementById('filterLocation').placeholder = filters.location;
  document.getElementById('filterMinPrice').placeholder = filters.minPrice;
  document.getElementById('filterMaxPrice').placeholder = filters.maxPrice;
  document.getElementById('filterType').options[0].text = filters.type;
  document.getElementById('filterCategory').options[0].text = filters.category;
  document.getElementById('filterStatus').options[0].text = filters.status;
  document.getElementById('applyFilters').textContent = filters.apply;

  // Support
  const support = translations[lang].support;
  document.querySelector('#supportForm h4').textContent = support.title;
  document.getElementById('supportName').placeholder = support.name;
  document.getElementById('supportEmail').placeholder = support.email;
  document.getElementById('supportMessage').placeholder = support.message;
  document.querySelector('.support-submit').textContent = support.send;
};

// Dropdown logic
export const initLanguageDropdown = () => {
  document.querySelectorAll('.lang-dropdown-content div').forEach(item => {
    item.addEventListener('click', () => {
      const lang = item.getAttribute('data-lang');
      setLanguage(lang);

      // Update dropdown button to show selected flag & text
      const btn = item.closest('.lang-dropdown').querySelector('button');
      btn.innerHTML = item.innerHTML;
    });
  });
};
