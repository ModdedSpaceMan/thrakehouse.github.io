// filters.js
import { renderPage } from './properties.js';

// ------------------ Filter Elements ------------------
const filterMinPrice = document.getElementById('filterMinPrice');
const filterMaxPrice = document.getElementById('filterMaxPrice');
const filterType = document.getElementById('filterType');
const filterCategory = document.getElementById('filterCategory');
const filterStatus = document.getElementById('filterStatus');

const filterMinBedrooms = document.getElementById('filterMinBedrooms');
const filterMaxBedrooms = document.getElementById('filterMaxBedrooms');

const filterMinBathrooms = document.getElementById('filterMinBathrooms');
const filterMaxBathrooms = document.getElementById('filterMaxBathrooms');

const filterMinSize = document.getElementById('filterMinSize');
const filterMaxSize = document.getElementById('filterMaxSize');

const filterMinYear = document.getElementById('filterMinYear');
const filterMaxYear = document.getElementById('filterMaxYear');

const applyFiltersBtn = document.getElementById('applyFilters');

// ------------------ Get Filters ------------------
export function getFilters() {
  return {
    minPrice: parseFloat(filterMinPrice.value) || 0,
    maxPrice: parseFloat(filterMaxPrice.value) || Infinity,

    type: filterType.value,
    category: filterCategory.value,
    status: filterStatus.value,

    minBedrooms: parseInt(filterMinBedrooms.value) || 0,
    maxBedrooms: parseInt(filterMaxBedrooms.value) || Infinity,

    minBathrooms: parseInt(filterMinBathrooms.value) || 0,
    maxBathrooms: parseInt(filterMaxBathrooms.value) || Infinity,

    minSize: parseFloat(filterMinSize.value) || 0,
    maxSize: parseFloat(filterMaxSize.value) || Infinity,

    minYear: parseInt(filterMinYear.value) || 0,
    maxYear: parseInt(filterMaxYear.value) || Infinity,
  };
}

// ------------------ Apply Filters ------------------
applyFiltersBtn.addEventListener('click', () => {
  console.log("Applying filters:", getFilters());
  renderPage(1);
});
