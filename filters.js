// filters.js
import { renderPage } from './properties.js';

// ------------------ Filter Elements ------------------
const filterMinPrice = document.getElementById('filterMinPrice');
const filterMaxPrice = document.getElementById('filterMaxPrice');

const filterType = document.getElementById('filterType');
const filterCategory = document.getElementById('filterCategory');
const filterStatus = document.getElementById('filterStatus');

const filterMinBedrooms = document.getElementById('filterMinBedrooms');
const filterMinBathrooms = document.getElementById('filterMinBathrooms');

const filterMinSize = document.getElementById('filterMinSize');
const filterMaxSize = document.getElementById('filterMaxSize');

const filterMinYear = document.getElementById('filterMinYear');
const filterMaxYear = document.getElementById('filterMaxYear');

const applyFiltersBtn = document.getElementById('applyFilters');

// ------------------ Get Filters ------------------
export function getFilters() {
  return {
    // price
    minPrice: parseFloat(filterMinPrice.value) || 0,
    maxPrice: parseFloat(filterMaxPrice.value) || Infinity,

    // basic property fields
    type: filterType.value,
    category: filterCategory.value,
    status: filterStatus.value,

    // bedrooms & bathrooms (ONLY MIN)
    minBedrooms: parseInt(filterMinBedrooms.value) || 0,
    minBathrooms: parseInt(filterMinBathrooms.value) || 0,

    // size
    minSize: parseFloat(filterMinSize.value) || 0,
    maxSize: parseFloat(filterMaxSize.value) || Infinity,

    // year
    minYear: parseInt(filterMinYear.value) || 0,
    maxYear: parseInt(filterMaxYear.value) || Infinity,
  };
}

// ------------------ Apply Filters ------------------
applyFiltersBtn.addEventListener('click', () => {
  console.log("Applying filters:", getFilters());
  renderPage(1);
});
