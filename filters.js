// filters.js
import { renderPage } from './properties.js';

// ------------------ Filter Elements ------------------
const filterLocation = document.getElementById('filterLocation');
const filterMinPrice = document.getElementById('filterMinPrice');
const filterMaxPrice = document.getElementById('filterMaxPrice');
const filterType = document.getElementById('filterType');
const filterCategory = document.getElementById('filterCategory');
const filterStatus = document.getElementById('filterStatus');
const applyFiltersBtn = document.getElementById('applyFilters');

// ------------------ Get Filters ------------------
export function getFilters() {
  return {
    location: filterLocation.value.trim().toLowerCase(),
    minPrice: parseFloat(filterMinPrice.value) || 0,
    maxPrice: parseFloat(filterMaxPrice.value) || Infinity,
    type: filterType.value,
    category: filterCategory.value,
    status: filterStatus.value, // "free", "taken", or "" for all
  };
}

// ------------------ Apply Filters Button ------------------
applyFiltersBtn.addEventListener('click', () => {
  renderPage(1); // render first page with current filters
});
