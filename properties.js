import { showToast } from "./ui.js";

const API_URL = "https://my-backend.martinmiskata.workers.dev";

let wishlistIds = [];
let propertiesData = [];
let filteredData = null;
let renderIndex = 0;
const CHUNK = 20;
let pageCache = {};

const propertyContainer = document.getElementById("properties");
const propertyModal = document.getElementById("propertyDetailsModal");
const paginationTop = document.getElementById("paginationTop");
const paginationBottom = document.getElementById("paginationBottom");
const username = localStorage.getItem("username");
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

const CATEGORY_LABELS_BG = { rent: "Наем", sale: "Продажба" };
const TYPE_LABELS_BG = { apartment: "Апартамент", house: "Къща", villa: "Вила", farm: "Земеделски имот", plot: "Парцел" };

let lazyObserver;
let currentPage = 1;
let totalItems = 0;
let currentFilters = { minPrice: "", maxPrice: "", type: "", category: "" };
let isLoading = false;
let isSearchActive = false;

const loader = document.getElementById("globalLoader");

export async function initProperties() {
  await loadWishlist();
  await loadProperties(true);
  setupFilterListeners();
  setupModalStaticListeners();
  setupSearchListener();
  setupDelegatedListeners();
  window.addEventListener("propertiesUpdated", () => loadProperties(true));
  window.openPropertyDetails = openPropertyDetails;
}

export function clearCache() {
  propertiesData = [];
  filteredData = null;
  pageCache = {};
  renderIndex = 0;
}

export async function loadProperties(reset = false) {
  if (!propertyContainer || isLoading) return;
  isLoading = true;
  if (loader) loader.style.display = "flex";

  if (reset) {
    currentPage = 1;
    clearCache();
    propertyContainer.innerHTML = "";
  }

  try {
    const headers = token ? { Authorization: "Bearer " + token } : {};
    const params = new URLSearchParams({ page: currentPage, limit: CHUNK, ...currentFilters });
    const res = await fetch(`${API_URL}/properties?${params.toString()}`, { headers });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];

    // Render immediately
    items.forEach((p) => {
      p.firstImage = typeof p.firstImage === "string" ? p.firstImage.trim() : "";
      p.restImages = [];
      p._fetchedImages = false;

      const temp = document.createElement("div");
      temp.innerHTML = renderPropertyCard(p);
      while (temp.firstChild) propertyContainer.appendChild(temp.firstChild);
    });

    propertiesData = reset ? items : propertiesData.concat(items);
    filteredData = null;
    totalItems = data.total || totalItems;

    renderPagination();
    observeLazyImages();
  } catch (err) {
    console.error("Error loading properties:", err);
    if (reset) propertyContainer.innerHTML = "<p>Грешка при зареждане на имотите.</p>";
  } finally {
    isLoading = false;
    if (loader) loader.style.display = "none";
  }
}

function renderChunk(list = filteredData ?? propertiesData) {
  if (!list || renderIndex >= list.length) return;

  const frag = document.createDocumentFragment();
  const slice = list.slice(renderIndex, renderIndex + CHUNK);

  slice.forEach((p) => {
    const temp = document.createElement("div");
    temp.innerHTML = renderPropertyCard(p);
    while (temp.firstChild) frag.appendChild(temp.firstChild);
  });

  propertyContainer.appendChild(frag);
  observeLazyImages();
  renderIndex += CHUNK;
}

function ensureLazyObserver() {
  if (lazyObserver) return;
  lazyObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const img = e.target;
        if (img.dataset && img.dataset.src) img.src = img.dataset.src;
        lazyObserver.unobserve(img);
      }
    });
  }, { rootMargin: "200px" });
}

function observeLazyImages() {
  ensureLazyObserver();
  propertyContainer.querySelectorAll('img.lazy-img').forEach((img) => {
    if (!img.src && img.dataset && img.dataset.src) lazyObserver.observe(img);
  });
}

function renderPropertyCard(p) {
  const id = p.id ?? "-";
  const firstImage = p.firstImage || "";
  const category = CATEGORY_LABELS_BG[p.category] || p.category || "-";
  const type = TYPE_LABELS_BG[p.type] || p.type || "-";
  const title = p.title || "-";
  const price = p.price != null ? p.price + "€" : "-";
  const bedrooms = p.bedrooms != null ? p.bedrooms : "-";
  const bathrooms = p.bathrooms != null ? p.bathrooms : "-";
  const size = p.size != null ? p.size + " м²" : "-";
  const wishlistHeart = wishlistIds.includes(String(id)) ? "❤️" : "🤍";
  const adminButtons = role === "admin"
    ? `<div class="admin-buttons-right">
        <button class="wishlist-btn" data-id="${id}">${wishlistHeart}</button>
        <button class="delete-btn" data-id="${id}">Изтрий</button>
        ${p.category === "rent" ? `<button class="toggle-status-btn" data-id="${id}">${p.status === "free" ? "Зает" : "Свободен"}</button>` : ""}
      </div>`
    : `<button class="wishlist-btn" data-id="${id}">${wishlistHeart}</button>`;

  return `<div class="property" data-id="${id}">
    ${firstImage ? `<img class="lazy-img" data-src="${firstImage}" alt="Имот" loading="lazy">` : ""}
    <div class="property-content">
      <div class="property-id-box">ID: ${id}</div>
      <h3>${title}</h3>
      <p><strong>Цена:</strong> ${price}</p>
      <p><strong>Категория:</strong> ${category}</p>
      <p><strong>Тип:</strong> ${type}</p>
      <p><strong>Спални:</strong> ${bedrooms}</p>
      <p><strong>Бани:</strong> ${bathrooms}</p>
      <p><strong>Площ:</strong> ${size}</p>
      <div class="property-actions">${adminButtons}</div>
    </div>
  </div>`;
}

// --- FILTER LISTENERS ---
function setupFilterListeners() {
  const btn = document.getElementById("applyFilters");
  const resetBtn = document.getElementById("resetFilters");
  if (!btn) return;
  btn.addEventListener("click", () => {
    isSearchActive = false;
    currentFilters = {
      minPrice: document.getElementById("filterMinPrice").value,
      maxPrice: document.getElementById("filterMaxPrice").value,
      type: document.getElementById("filterType").value,
      category: document.getElementById("filterCategory").value,
    };
    clearCache(); // reset cache on filter change
    loadProperties(true); // reload page 1 with new filters
  });
  resetBtn?.addEventListener("click", resetSearch);
}

// --- SEARCH ---
function setupSearchListener() {
  const searchBtn = document.getElementById("searchByIdBtn");
  const searchInput = document.getElementById("searchByIdInput");
  if (!searchBtn || !searchInput) return;

  searchBtn.addEventListener("click", async () => {
    const id = searchInput.value.trim();
    if (!id) return showToast("Въведете ID на имота!");
    isSearchActive = true;

    loader.style.display = "flex";
    try {
      const headers = token ? { Authorization: "Bearer " + token } : {};
      const res = await fetch(`${API_URL}/properties/${id}`, { headers });
      if (!res.ok) return showToast("Имотът не е намерен");
      const property = await res.json();
      filteredData = [property];
      renderIndex = 0;
      propertyContainer.innerHTML = "";
      renderChunk(filteredData);
    } catch (err) {
      console.error(err);
      showToast("Грешка при зареждане на имота");
    } finally {
      loader.style.display = "none";
    }
  });
}

function resetSearch() {
  isSearchActive = false;
  filteredData = null;
  renderIndex = 0;
  propertyContainer.innerHTML = "";
  loadProperties(true);
}

// --- PAGINATION ---
function renderPagination() {
  if (!paginationTop || !paginationBottom) return;
  const totalPages = Math.ceil(totalItems / CHUNK);
  if (totalPages <= 1) { paginationTop.innerHTML = ""; paginationBottom.innerHTML = ""; return; }

  function createButton(page) { return `<button class="page-btn${page === currentPage ? " active-page" : ""}" data-page="${page}">${page}</button>`; }

  let pagesHTML = createButton(1);
  if (currentPage > 3) pagesHTML += `<span class="dots">...</span>`;
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) pagesHTML += createButton(i);
  if (currentPage < totalPages - 2) pagesHTML += `<span class="dots">...</span>`;
  if (totalPages > 1) pagesHTML += createButton(totalPages);

  paginationTop.innerHTML = pagesHTML;
  paginationBottom.innerHTML = pagesHTML;

  document.querySelectorAll(".page-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = parseInt(btn.dataset.page);
      if (!page || page === currentPage) return;
      loadPropertiesPage(page);
    });
  });
}

async function loadPropertiesPage(page) {
  if (!propertyContainer || isLoading) return;
  if (page === currentPage) return;
  isLoading = true;
  loader.style.display = "flex";

  // Serve from cache
  if (pageCache[page]) {
    renderPageFromCache(page);
    currentPage = page;
    renderPagination();
    isLoading = false;
    loader.style.display = "none";
    return;
  }

  try {
    const headers = token ? { Authorization: "Bearer " + token } : {};
    const params = new URLSearchParams({ page, limit: CHUNK, ...currentFilters });
    const res = await fetch(`${API_URL}/properties?${params.toString()}`, { headers });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    items.forEach((p) => { p.firstImage = p.firstImage?.trim() ?? ""; p.restImages = []; p._fetchedImages = false; });
    pageCache[page] = items;
    renderPageFromCache(page);
    currentPage = page;
    totalItems = data.total || totalItems;
    renderPagination();
  } catch (err) {
    console.error(err);
    propertyContainer.innerHTML = "<p>Грешка при зареждане на имотите.</p>";
  } finally {
    isLoading = false;
    loader.style.display = "none";
  }
}

function renderPageFromCache(page) {
  const items = pageCache[page] || [];
  propertyContainer.innerHTML = "";
  renderIndex = 0;
  renderChunk(items);
}

// --- SCROLL LOADER ---
function setupScrollLoader() {
  window.addEventListener("scroll", () => {
    if ((window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) && !isLoading) {
      if (isSearchActive) return;
      if (propertiesData.length < totalItems) loadProperties();
    }
  });
}

try { document.addEventListener("DOMContentLoaded", initProperties); } catch (err) { console.error(err); }
