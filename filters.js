// filters.js
import { renderPage } from './properties.js';

// ------------------ Filter Elements ------------------
const filterLocation = document.getElementById('filterLocation');
const filterMinPrice = document.getElementById('filterMinPrice');
const filterMaxPrice = document.getElementById('filterMaxPrice');
const filterType = document.getElementById('filterType');
const filterFree = document.getElementById('filterFree');
const filterTaken = document.getElementById('filterTaken');
const applyFiltersBtn = document.getElementById('applyFilters');

// ------------------ Apply Filters ------------------
export function getFilters() {
  return {
    location: filterLocation.value.trim().toLowerCase(),
    minPrice: parseFloat(filterMinPrice.value) || 0,
    maxPrice: parseFloat(filterMaxPrice.value) || Infinity,
    type: filterType.value,
    free: filterFree.checked,
    taken: filterTaken.checked,
  };
}

// ------------------ Filter Button ------------------
applyFiltersBtn.addEventListener('click', () => {
  renderPage(1); // We will pass filters to renderPage via import
});
