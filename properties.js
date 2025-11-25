import { showToast } from "./ui.js";

const API_URL = "https://my-backend.martinmiskata.workers.dev";

let wishlistIds = [];
let propertiesData = [];
let filteredData = null;

const propertyContainer = document.getElementById("properties");
const propertyModal = document.getElementById("propertyDetailsModal");

const username = localStorage.getItem("username");
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

const CATEGORY_LABELS_BG = { rent: "Наем", sale: "Продажба" };
const TYPE_LABELS_BG = { apartment: "Апартамент", house: "Къща", villa: "Вила" };

let lazyObserver;

let currentPage = 1;
const PAGE_LIMIT = 10;
let totalProperties = 0;
let loadingProperties = false;
let renderIndex = 0;

export async function initProperties() {
  await loadWishlist();
  await loadProperties(1, PAGE_LIMIT, false);
  setupFilterListeners();
  setupModalStaticListeners();
  setupSearchListener();
  setupScrollLoader();
  setupDelegatedListeners();
  window.addEventListener("propertiesUpdated", () => loadProperties(1, PAGE_LIMIT, false));
  window.openPropertyDetails = openPropertyDetails;
}

// =======================
// LOAD PROPERTIES WITH PAGINATION
// =======================
export async function loadProperties(page = 1, limit = PAGE_LIMIT, append = false) {
  if (!propertyContainer || loadingProperties) return [];

  loadingProperties = true;

  try {
    const headers = token ? { Authorization: "Bearer " + token } : {};
    const res = await fetch(`${API_URL}/properties?page=${page}&limit=${limit}`, { headers });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json(); // { items, total, page, limit }
    const items = (Array.isArray(data.items) ? data.items : data.items || []).map(p => ({
      ...p,
      firstImage: typeof p.firstImage === "string" ? p.firstImage.trim() : "",
      restImages: [],
      _fetchedImages: false
    }));

    totalProperties = data.total ?? totalProperties;

    if (append) propertiesData.push(...items);
    else propertiesData = items;

    filteredData = null;
    if (!append) resetAndRender(propertiesData);
    else renderChunk(items);

    currentPage = page + 1;
    return propertiesData;
  } catch (err) {
    console.error("Error loading properties:", err);
    if (!append) propertyContainer.innerHTML = "<p>Грешка при зареждане на имотите.</p>";
    return [];
  } finally {
    loadingProperties = false;
  }
}

// =======================
// CHUNKED RENDERING & LAZY IMAGES
// =======================
function renderChunk(list = filteredData ?? propertiesData) {
  if (!list || renderIndex >= list.length) return;

  const frag = document.createDocumentFragment();
  const slice = list.slice(renderIndex, renderIndex + PAGE_LIMIT);
  slice.forEach((p) => {
    const temp = document.createElement("div");
    temp.innerHTML = renderPropertyCard(p);
    while (temp.firstChild) frag.appendChild(temp.firstChild);
  });
  propertyContainer.appendChild(frag);
  observeLazyImages();
  renderIndex += PAGE_LIMIT;
}

function resetAndRender(list) {
  renderIndex = 0;
  propertyContainer.innerHTML = "";
  ensureLazyObserver();
  renderChunk(list);
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

// =======================
// PROPERTY CARD
// =======================
function renderPropertyCard(p) {
  const id = p.id ?? "-";
  const firstImage = p.firstImage || "";
  const category = CATEGORY_LABELS_BG[p.category] || p.category || "-";
  const type = TYPE_LABELS_BG[p.type] || p.type || "-";
  const title = p.title || "-";
  const price = p.price != null ? p.price + "€" : "-";
  const bedrooms = p.bedrooms ?? "-";
  const bathrooms = p.bathrooms ?? "-";
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

// =======================
// DELEGATED LISTENERS
// =======================
function setupDelegatedListeners() {
  if (!propertyContainer) return;
  propertyContainer.addEventListener("click", async (e) => {
    const wishlistBtn = e.target.closest(".wishlist-btn");
    if (wishlistBtn) return toggleWishlist(wishlistBtn.dataset.id);
    const deleteBtn = e.target.closest(".delete-btn");
    if (deleteBtn && role === "admin" && confirm("Изтриване на имота?")) return deleteProperty(deleteBtn.dataset.id);
    const toggleBtn = e.target.closest(".toggle-status-btn");
    if (toggleBtn && role === "admin") return toggleRentalStatus(toggleBtn.dataset.id);
    const propEl = e.target.closest(".property");
    if (propEl) {
      const id = propEl.dataset.id;
      const property = propertiesData.find((p) => p.id == id) || (filteredData || []).find((p) => p.id == id);
      if (!property) return showToast("Имотът не е намерен!");
      return openPropertyDetails(property);
    }
  });
}

// =======================
// SCROLL LOADER (INFINITE SCROLL)
// =======================
function setupScrollLoader() {
  window.addEventListener("scroll", async () => {
    if (loadingProperties) return;
    if (propertiesData.length >= totalProperties) return;
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
      await loadProperties(currentPage, PAGE_LIMIT, true);
    }
  });
}

// =======================
// SEARCH BY ID
// =======================
function setupSearchListener() {
  const searchBtn = document.getElementById("searchByIdBtn");
  const searchInput = document.getElementById("searchByIdInput");
  if (!searchBtn || !searchInput) return;
  searchBtn.addEventListener("click", async () => {
    const id = searchInput.value.trim();
    if (!id) return showToast("Въведете ID на имота!");
    try {
      const headers = token ? { Authorization: "Bearer " + token } : {};
      const res = await fetch(`${API_URL}/properties/${id}`, { headers });
      if (!res.ok) return showToast("Имотът не е намерен");
      const property = await res.json();
      filteredData = [property];
      resetAndRender(filteredData);
    } catch (err) {
      console.error(err);
      showToast("Грешка при зареждане на имота");
    }
  });
}

// =======================
// PROPERTY DETAILS MODAL
// =======================
async function openPropertyDetails(property) {
  const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value ?? "-"; };
  set("propTitle", property.title || "-");
  set("propPrice", property.price != null ? property.price + "€" : "-");
  set("propType", TYPE_LABELS_BG[property.type] || property.type || "-");
  set("propBedrooms", property.bedrooms ?? "-");
  set("propBathrooms", property.bathrooms ?? "-");
  set("propArea", property.size != null ? property.size + " м²" : "-");
  set("propDescription", property.description || "-");
  set("propCategory", CATEGORY_LABELS_BG[property.category] || property.category || "-");
  set("propStatus", property.status || "-");
  set("propYear", property.year ?? "-");

  let currentPropertyImages = [];
  if (property.firstImage) currentPropertyImages.push(property.firstImage);

  if (!property._fetchedImages) {
    try {
      const res = await fetch(`${API_URL}/properties/${property.id}/images`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.images)) {
          property.restImages = data.images;
          currentPropertyImages.push(...data.images);
        }
      }
    } catch (err) { console.error("Failed to load extra images:", err); }
    property._fetchedImages = true;
  } else if (property.restImages?.length) {
    currentPropertyImages.push(...property.restImages);
  }

  let currentImageIndex = 0;
  const img = document.getElementById("propImage");
  const dots = document.getElementById("propImageDots");

  function updateModalImage() {
    if (!img) return;
    if (!currentPropertyImages.length) {
      img.style.display = "none";
      if (dots) dots.innerHTML = "";
      return;
    }
    img.style.display = "block";
    img.src = currentPropertyImages[currentImageIndex];
    if (dots) {
      dots.innerHTML = "";
      currentPropertyImages.forEach((_, i) => {
        const dot = document.createElement("span");
        dot.className = "slider-dot";
        dot.style.opacity = i === currentImageIndex ? "1" : "0.5";
        dot.addEventListener("click", (e) => { e.stopPropagation(); currentImageIndex = i; updateModalImage(); });
        dots.appendChild(dot);
      });
    }
  }

  const prevBtn = propertyModal.querySelector("#prevImageBtn");
  const nextBtn = propertyModal.querySelector("#nextImageBtn");
  prevBtn?.addEventListener("click", (e) => { e.stopPropagation(); if (!currentPropertyImages.length) return; currentImageIndex = (currentImageIndex - 1 + currentPropertyImages.length) % currentPropertyImages.length; updateModalImage(); });
  nextBtn?.addEventListener("click", (e) => { e.stopPropagation(); if (!currentPropertyImages.length) return; currentImageIndex = (currentImageIndex + 1) % currentPropertyImages.length; updateModalImage(); });

  updateModalImage();
  propertyModal.style.display = "flex";
}

// =======================
// MODAL STATIC LISTENERS
// =======================
function setupModalStaticListeners() {
  if (!propertyModal) return;
  const closeBtn = propertyModal.querySelector(".close");
  closeBtn?.addEventListener("click", () => propertyModal.style.display = "none");
  propertyModal.addEventListener("click", (e) => { if (e.target === propertyModal) propertyModal.style.display = "none"; });
}

// =======================
// WISHLIST
// =======================
export async function loadWishlist() {
  if (!username || !token) return (wishlistIds = []);
  try {
    const res = await fetch(`${API_URL}/wishlists/${username}`, { headers: { Authorization: "Bearer " + token } });
    const data = await res.json();
    wishlistIds = data.items || [];
  } catch {
    wishlistIds = [];
  }
}

export async function toggleWishlist(id) {
  if (!username || !token) return showToast("Трябва да сте влезли!");
  const action = wishlistIds.includes(String(id)) ? "remove" : "add";
  try {
    const res = await fetch(`${API_URL}/wishlists/${username}/${action}`, {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: id }),
    });
    const data = await res.json();
    if (!data.success) return showToast("Грешка при актуализиране на списъка с любими");
    if (action === "add") wishlistIds.push(String(id)); else wishlistIds = wishlistIds.filter(x => x !== String(id));
    const btn = document.querySelector(`.wishlist-btn[data-id="${id}"]`);
    if (btn) btn.textContent = wishlistIds.includes(String(id)) ? "❤️" : "🤍";
  } catch (err) { console.error(err); showToast("Грешка при актуализиране на списъка с любими"); }
}

// =======================
// ADMIN
// =======================
async function deleteProperty(id) {
  try {
    await fetch(`${API_URL}/properties/${id}`, { method: "DELETE", headers: { Authorization: "Bearer " + token } });
    showToast("Имотът беше изтрит!");
    await loadProperties(1, PAGE_LIMIT, false);
  } catch (err) { console.error(err); showToast("Грешка при изтриване на имота"); }
}

async function toggleRentalStatus(id) {
  try {
    await fetch(`${API_URL}/properties/${id}/status`, { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ status: "toggle" }) });
    showToast("Статусът беше актуализиран!");
    await loadProperties(1, PAGE_LIMIT, false);
  } catch (err) { console.error(err); showToast("Грешка при актуализиране на статуса"); }
}

// =======================
// FILTERS
// =======================
function setupFilterListeners() {
  const btn = document.getElementById("applyFilters");
  if (!btn) return;
  btn.addEventListener("click", () => {
    let list = [...propertiesData];
    const minPrice = Number(document.getElementById("filterMinPrice").value);
    const maxPrice = Number(document.getElementById("filterMaxPrice").value);
    const type = document.getElementById("filterType").value;
    const cat = document.getElementById("filterCategory").value;

    list = list.filter(p => {
      if (!isNaN(minPrice) && minPrice > 0 && p.price < minPrice) return false;
      if (!isNaN(maxPrice) && maxPrice > 0 && p.price > maxPrice) return false;
      if (type && type !== "" && p.type !== type) return false;
      if (cat && cat !== "" && p.category !== cat) return false;
      return true;
    });

    filteredData = list;
    resetAndRender(filteredData);
  });
}

// =======================
// INIT
// =======================
document.addEventListener("DOMContentLoaded", () => { initProperties(); });
