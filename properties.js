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

export async function loadProperties(page = 1, limit = 10, append = false) {
  if (!propertyContainer) return [];
  try {
    const headers = token ? { Authorization: "Bearer " + token } : {};
    const res = await fetch(`${API_URL}/properties?page=${page}&limit=${limit}`, { headers });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    let items = Array.isArray(data) ? data : data.items || data.properties || [];
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
    filteredData = null;
    resetAndRender(propertiesData);
    return propertiesData;
  } catch (err) {
    console.error("Error loading properties:", err);
    propertyContainer.innerHTML = "<p>Грешка при зареждане на имотите.</p>";
    return [];
  }
}

function resetAndRender(list) {
  renderIndex = 0;
  propertyContainer.innerHTML = "";
  ensureLazyObserver();
  renderChunk(list);
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
  return `\n<div class="property" data-id="${id}\">\n  ${firstImage ? `<img class="lazy-img" data-src="${firstImage}" alt="Имот" loading="lazy">` : ""}\n  <div class="property-content">\n    <div class="property-id-box">ID: ${id}</div>\n    <h3>${title}</h3>\n    <p><strong>Цена:</strong> ${price}</p>\n    <p><strong>Категория:</strong> ${category}</p>\n    <p><strong>Тип:</strong> ${type}</p>\n    <p><strong>Спални:</strong> ${bedrooms}</p>\n    <p><strong>Бани:</strong> ${bathrooms}</p>\n    <p><strong>Площ:</strong> ${size}</p>\n    <div class="property-actions">${adminButtons}</div>\n  </div>\n</div>`;
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
      const property = propertiesData.find((p) => p.id == id) || (filteredData || []).find((p) => p.id == id);
      if (!property) return showToast("Имотът не е намерен!");
      return openPropertyDetails(property);
    }
  });
}

function setupScrollLoader() {
  window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
      renderChunk();
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

async function openPropertyDetails(property) {
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "-";
  };
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
    } catch (err) {
      console.error("Failed to load extra images:", err);
    }
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
  } catch (err) {
    console.error(err);
    showToast("Грешка при актуализиране на списъка с любими");
  }
}

async function deleteProperty(id) {
  try {
    await fetch(`${API_URL}/properties/${id}`, { method: "DELETE", headers: { Authorization: "Bearer " + token } });
    showToast("Имотът беше изтрит!");
    await loadProperties();
  } catch (err) {
    console.error(err);
    showToast("Грешка при изтриване на имота");
  }
}

async function toggleRentalStatus(id) {
  try {
    await fetch(`${API_URL}/properties/${id}/status`, { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ status: "toggle" }) });
    showToast("Статусът беше актуализиран!");
    await loadProperties();
  } catch (err) {
    console.error(err);
    showToast("Грешка при актуализиране на статуса");
  }
}

function setupFilterListeners() {
  const btn = document.getElementById("applyFilters");
  if (!btn) return;
  btn.addEventListener("click", () => {
    let list = [...propertiesData];
    const minPrice = Number(document.getElementById("filterMinPrice").value);
    const maxPrice = Number(document.getElementById("filterMaxPrice").value);
    const type = document.getElementById("filterType").value;
    const cat = document.getElementById("filterCategory").value;
    list = list.filter((p) => {
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

document.addEventListener("DOMContentLoaded", () => { initProperties(); });
