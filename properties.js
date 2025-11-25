import { showToast } from "./ui.js";

const API_URL = "https://my-backend.martinmiskata.workers.dev";

let wishlistIds = [];
let propertiesData = [];
let filteredParams = null; // store filter/search params
let renderIndex = 0;
const CHUNK = 20;

const propertyContainer = document.getElementById("properties");
const propertyModal = document.getElementById("propertyDetailsModal");

const username = localStorage.getItem("username");
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

const CATEGORY_LABELS_BG = {
  rent: "Наем",
  sale: "Продажба",
};

const TYPE_LABELS_BG = {
  apartment: "Апартамент",
  house: "Къща",
  villa: "Вила",
};

let lazyObserver;
let currentPage = 1;
let totalProperties = 0;
let isLoading = false;

export async function initProperties() {
  await loadWishlist();
  await loadProperties();
  setupFilterListeners();
  setupModalStaticListeners();
  setupSearchListener();
  setupScrollLoader();
  setupDelegatedListeners();
  window.addEventListener("propertiesUpdated", () => loadProperties(1, CHUNK, false));
  window.openPropertyDetails = openPropertyDetails;
}

export async function loadProperties(page = 1, limit = CHUNK, append = false) {
  if (isLoading || !propertyContainer) return [];
  isLoading = true;

  try {
    const headers = token ? { Authorization: "Bearer " + token } : {};
    let url = `${API_URL}/properties?page=${page}&limit=${limit}`;

    // append search/filter params
    if (filteredParams) {
      const params = new URLSearchParams(filteredParams);
      url += "&" + params.toString();
    }

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    let items = Array.isArray(data) ? data : data.items || [];
    items = items.map((p) => ({
      ...p,
      firstImage: typeof p.firstImage === "string" ? p.firstImage.trim() : "",
      restImages: [],
      _fetchedImages: false,
    }));

    if (append) {
      propertiesData = propertiesData.concat(items);
    } else {
      propertiesData = items;
    }

    totalProperties = data.total || items.length;
    currentPage = page;
    renderIndex = 0;
    propertyContainer.innerHTML = "";
    ensureLazyObserver();
    renderChunk();

    isLoading = false;
    return propertiesData;
  } catch (err) {
    console.error("Error loading properties:", err);
    propertyContainer.innerHTML = "<p>Грешка при зареждане на имотите.</p>";
    isLoading = false;
    return [];
  }
}

function renderChunk(list = propertiesData) {
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
  if (!lazyObserver) return;
  propertyContainer.querySelectorAll('img.lazy-img').forEach((img) => {
    if (!img.src && img.dataset && img.dataset.src) lazyObserver.observe(img);
  });
}

function renderPropertyCard(p) {
  const id = p.id ?? "-";
  const firstImage = typeof p.firstImage === "string" ? p.firstImage.trim() : "";
  const category = CATEGORY_LABELS_BG[p.category] || p.category || "-";
  const type = TYPE_LABELS_BG[p.type] || p.type || "-";
  const title = p.title || "-";
  const price = p.price != null ? p.price + "€" : "-";
  const bedrooms = p.bedrooms != null ? p.bedrooms : "-";
  const bathrooms = p.bathrooms != null ? p.bathrooms : "-";
  const size = p.size != null ? p.size + " м²" : "-";
  const wishlistHeart = wishlistIds.includes(String(id)) ? "❤️" : "🤍";
  const adminButtons = role === "admin"
    ? `\n<div class="admin-buttons-right">\n  <button class="wishlist-btn" data-id="${id}">${wishlistHeart}</button>\n  <button class="delete-btn" data-id="${id}">Изтрий</button>\n  ${p.category === "rent" ? `<button class="toggle-status-btn" data-id="${id}">${p.status === "free" ? "Зает" : "Свободен"}</button>` : ""}\n</div>`
    : `<button class="wishlist-btn" data-id="${id}">${wishlistHeart}</button>`;
  return `\n<div class="property" data-id="${id}">\n  ${firstImage ? `<img class="lazy-img" data-src="${firstImage}" alt="Имот" loading="lazy">` : ""}\n  <div class="property-content">\n    <div class="property-id-box">ID: ${id}</div>\n    <h3>${title}</h3>\n    <p><strong>Цена:</strong> ${price}</p>\n    <p><strong>Категория:</strong> ${category}</p>\n    <p><strong>Тип:</strong> ${type}</p>\n    <p><strong>Спални:</strong> ${bedrooms}</p>\n    <p><strong>Бани:</strong> ${bathrooms}</p>\n    <p><strong>Площ:</strong> ${size}</p>\n    <div class="property-actions">${adminButtons}</div>\n  </div>\n</div>`;
}

function setupDelegatedListeners() {
  if (!propertyContainer) return;
  propertyContainer.addEventListener("click", async (e) => {
    const wishlistBtn = e.target.closest(".wishlist-btn");
    if (wishlistBtn) {
      e.preventDefault();
      e.stopPropagation();
      return toggleWishlist(wishlistBtn.dataset.id);
    }
    const deleteBtn = e.target.closest(".delete-btn");
    if (deleteBtn && role === "admin") {
      e.preventDefault();
      e.stopPropagation();
      if (confirm("Изтриване на имота?")) return deleteProperty(deleteBtn.dataset.id);
      return;
    }
    const toggleBtn = e.target.closest(".toggle-status-btn");
    if (toggleBtn && role === "admin") {
      e.preventDefault();
      e.stopPropagation();
      return toggleRentalStatus(toggleBtn.dataset.id);
    }
    const propEl = e.target.closest(".property");
    if (propEl) {
      e.preventDefault();
      const id = propEl.dataset.id;
      const property = propertiesData.find((p) => p.id == id);
      if (!property) return showToast("Имотът не е намерен!");
      return openPropertyDetails(property);
    }
  });
}

function setupScrollLoader() {
  window.addEventListener("scroll", async () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
      if (renderIndex < propertiesData.length) {
        renderChunk();
      } else if (propertiesData.length < totalProperties) {
        await loadProperties(currentPage + 1, CHUNK, true);
      }
    }
  });
}

function setupSearchListener() {
  const searchBtn = document.getElementById("searchByIdBtn");
  const searchInput = document.getElementById("searchByIdInput");
  if (!searchBtn || !searchInput) return;
  searchBtn.addEventListener("click", async () => {
    const id = searchInput.value.trim();
    if (!id) return showToast("Въведете ID на имота!");
    filteredParams = null;
    try {
      const headers = token ? { Authorization: "Bearer " + token } : {};
      const res = await fetch(`${API_URL}/properties/${id}`, { headers });
      if (!res.ok) return showToast("Имотът не е намерен");
      const property = await res.json();
      propertiesData = [property];
      renderIndex = 0;
      propertyContainer.innerHTML = "";
      renderChunk();
    } catch (err) {
      console.error(err);
      showToast("Грешка при зареждане на имота");
    }
  });
}

function setupFilterListeners() {
  const btn = document.getElementById("applyFilters");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const minPrice = Number(document.getElementById("filterMinPrice").value);
    const maxPrice = Number(document.getElementById("filterMaxPrice").value);
    const type = document.getElementById("filterType").value;
    const cat = document.getElementById("filterCategory").value;

    filteredParams = {};
    if (!isNaN(minPrice) && minPrice > 0) filteredParams.minPrice = minPrice;
    if (!isNaN(maxPrice) && maxPrice > 0) filteredParams.maxPrice = maxPrice;
    if (type) filteredParams.type = type;
    if (cat) filteredParams.category = cat;

    currentPage = 1;
    await loadProperties(currentPage, CHUNK, false);
  });
}

document.addEventListener("DOMContentLoaded", () => { initProperties(); });

// The rest (openPropertyDetails, toggleWishlist, deleteProperty, toggleRentalStatus) remains unchanged
