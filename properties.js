import { showToast } from "./ui.js";

const API_URL = "https://my-backend.martinmiskata.workers.dev";

let wishlistIds = [];
let propertiesData = [];
let filteredData = null;
let renderIndex = 0;
const CHUNK = 20;

const propertyContainer = document.getElementById("properties");
const propertyModal = document.getElementById("propertyDetailsModal");

const username = localStorage.getItem("username");
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

const CATEGORY_LABELS_BG = { rent: "Наем", sale: "Продажба" };
const TYPE_LABELS_BG = { apartment: "Апартамент", house: "Къща", villa: "Вила" };

let lazyObserver;
let currentPage = 1;
let totalItems = 0;
let currentFilters = { minPrice: "", maxPrice: "", type: "", category: "" };
let isLoading = false;
let isSearchActive = false;

export async function initProperties() {
  await loadWishlist();
  await loadProperties(true);
  setupFilterListeners();
  setupModalStaticListeners();
  setupSearchListener();
  setupScrollLoader();
  setupDelegatedListeners();
  window.addEventListener("propertiesUpdated", () => loadProperties(true));
  window.openPropertyDetails = openPropertyDetails;
}

export async function loadProperties(reset = false) {
  if (!propertyContainer || isLoading) return;
  isLoading = true;

  if (reset) {
    currentPage = 1;
    propertiesData = [];
    renderIndex = 0;
    propertyContainer.innerHTML = "";
  }

  try {
    const headers = token ? { Authorization: "Bearer " + token } : {};
    const params = new URLSearchParams({
      page: currentPage,
      limit: CHUNK,
      ...currentFilters,
    });
    const res = await fetch(`${API_URL}/properties?${params.toString()}`, { headers });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];

    items.forEach((p) => {
      p.firstImage = typeof p.firstImage === "string" ? p.firstImage.trim() : "";
      p.restImages = [];
      p._fetchedImages = false;
    });

    propertiesData = reset ? items : propertiesData.concat(items);
    filteredData = null;

    renderChunk(items);
    totalItems = data.total || totalItems;
    currentPage++;
  } catch (err) {
    console.error("Error loading properties:", err);
    if (reset) propertyContainer.innerHTML = "<p>Грешка при зареждане на имотите.</p>";
  } finally {
    isLoading = false;
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

function setupDelegatedListeners() {
  if (!propertyContainer) return;
  propertyContainer.addEventListener("click", async (e) => {
    const wishlistBtn = e.target.closest(".wishlist-btn");
    if (wishlistBtn) { e.preventDefault(); e.stopPropagation(); return toggleWishlist(wishlistBtn.dataset.id); }

    const deleteBtn = e.target.closest(".delete-btn");
    if (deleteBtn && role === "admin") {
      e.preventDefault(); e.stopPropagation();
      if (confirm("Изтриване на имота?")) return deleteProperty(deleteBtn.dataset.id);
      return;
    }

    const toggleBtn = e.target.closest(".toggle-status-btn");
    if (toggleBtn && role === "admin") {
      e.preventDefault(); e.stopPropagation();
      return toggleRentalStatus(toggleBtn.dataset.id);
    }

    const propEl = e.target.closest(".property");
    if (propEl) {
      e.preventDefault();
      const id = propEl.dataset.id;
      const property = propertiesData.find((p) => p.id == id) || (filteredData || []).find((p) => p.id == id);
      if (!property) return showToast("Имотът не е намерен!");
      return openPropertyDetails(property);
    }
  });
}

function setupScrollLoader() {
  window.addEventListener("scroll", () => {
    if ((window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) && !isLoading) {
      if (isSearchActive) return; // do not load more when searching by ID
      if (propertiesData.length < totalItems) loadProperties();
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

    isSearchActive = true;
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

async function openPropertyDetails(property) {
  const loader = document.getElementById("globalLoader");
  loader.style.display = "flex";
  
  const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value ?? "-"; };
  const category = CATEGORY_LABELS_BG[property.category] || property.category || "-";
  const type = TYPE_LABELS_BG[property.type] || property.type || "-";

  set("propTitle", property.title || "-");
  set("propPrice", property.price != null ? property.price + "€" : "-");
  set("propType", type);
  set("propBedrooms", property.bedrooms ?? "-");
  set("propBathrooms", property.bathrooms ?? "-");
  set("propArea", property.size != null ? property.size + " м²" : "-");
  set("propDescription", property.description || "-");
  set("propCategory", category);
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
} else if (property.restImages?.length) currentPropertyImages.push(...property.restImages);

// **Wait for all images to load**
await Promise.all(currentPropertyImages.map(src => new Promise(res => {
  const img = new Image();
  img.onload = res;
  img.onerror = res;
  img.src = src;
})));

loader.style.display = "none"; // hide loader after images loaded


  let currentImageIndex = 0;
  const img = document.getElementById("propImage");
  const dots = document.getElementById("propImageDots");

  function updateModalImage() {
    if (!img) return;
    if (!currentPropertyImages.length) { img.style.display = "none"; if (dots) dots.innerHTML = ""; return; }
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

function setupModalStaticListeners() {
  if (!propertyModal) return;
  const closeBtn = propertyModal.querySelector(".close");
  closeBtn?.addEventListener("click", () => (propertyModal.style.display = "none"));
  propertyModal.addEventListener("click", (e) => { if (e.target === propertyModal) propertyModal.style.display = "none"; });
}

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

    if (action === "add") wishlistIds.push(String(id)); else wishlistIds = wishlistIds.filter((x) => x !== String(id));
    const btn = document.querySelector(`.wishlist-btn[data-id="${id}"]`);
    if (btn) btn.textContent = wishlistIds.includes(String(id)) ? "❤️" : "🤍";
  } catch (err) { console.error(err); showToast("Грешка при актуализиране на списъка с любими"); }
}

async function deleteProperty(id) {
  try {
    await fetch(`${API_URL}/properties/${id}`, { method: "DELETE", headers: { Authorization: "Bearer " + token } });
    showToast("Имотът беше изтрит!");
    await loadProperties(true);
  } catch (err) { console.error(err); showToast("Грешка при изтриване на имота"); }
}

async function toggleRentalStatus(id) {
  try {
    await fetch(`${API_URL}/properties/${id}/status`, { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ status: "toggle" }) });
    showToast("Статусът беше актуализиран!");
    await loadProperties(true);
  } catch (err) { console.error(err); showToast("Грешка при актуализиране на статуса"); }
}

function setupFilterListeners() {
  const btn = document.getElementById("applyFilters");
  const resetBtn = document.getElementById("resetFilters");
  if (!btn) return;
  btn.addEventListener("click", () => {
    isSearchActive = false;
    const minPrice = document.getElementById("filterMinPrice").value;
    const maxPrice = document.getElementById("filterMaxPrice").value;
    const type = document.getElementById("filterType").value;
    const category = document.getElementById("filterCategory").value;

    currentFilters = { minPrice, maxPrice, type, category };
    loadProperties(true);
  });

  resetBtn?.addEventListener("click", () => {
    resetSearch();
  });
}

document.addEventListener("DOMContentLoaded", () => { initProperties(); });
