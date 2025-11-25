// property.js
import { showToast } from "./ui.js";

const API_URL = "https://my-backend.martinmiskata.workers.dev";

let wishlistIds = [];
let propertiesData = [];

const propertyContainer = document.getElementById("properties");
const propertyModal = document.getElementById("propertyDetailsModal");

const username = localStorage.getItem("username");
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

// ======================================================
// TRANSLATIONS TO BULGARIAN
// ======================================================
const CATEGORY_LABELS_BG = {
  rent: "Наем",
  sale: "Продажба",
};

const TYPE_LABELS_BG = {
  apartment: "Апартамент",
  house: "Къща",
  villa: "Вила",
};

// ======================================================
// INIT
// ======================================================
export async function initProperties() {
  await loadWishlist();
  await loadProperties();
  setupFilterListeners();
  setupModalStaticListeners();
  setupSearchListener();

  window.addEventListener("propertiesUpdated", loadProperties);
  window.openPropertyDetails = openPropertyDetails;
}

// ======================================================
// SEARCH BY ID
// ======================================================
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
      propertiesData = [property];

      renderSearchResults([property]);
    } catch (err) {
      console.error(err);
      showToast("Грешка при зареждане на имота");
    }
  });
}

function renderSearchResults(properties) {
  if (!properties || properties.length === 0) {
    propertyContainer.innerHTML = "<p>Не са намерени имоти.</p>";
    return;
  }

  propertyContainer.innerHTML = properties
    .map((p) => renderPropertyCard(p))
    .join("");

  attachPropertyCardListeners();
  attachAdminListeners();
}

// ======================================================
// LOAD PROPERTIES
// ======================================================
export async function loadProperties() {
  if (!propertyContainer) return [];

  try {
    const headers = token ? { Authorization: "Bearer " + token } : {};
    const res = await fetch(`${API_URL}/properties`, { headers });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();

    propertiesData = data.map((p) => ({
      ...p,
      firstImage: typeof p.firstImage === "string" ? p.firstImage.trim() : "",
      restImages: [],
      _fetchedImages: false,
    }));

    renderProperties(propertiesData);
    return propertiesData;
  } catch (err) {
    console.error("Error loading properties:", err);
    propertyContainer.innerHTML = "<p>Грешка при зареждане на имотите.</p>";
    return [];
  }
}

// ======================================================
// RENDER PROPERTIES
// ======================================================
export function renderProperties(properties) {
  if (!properties || properties.length === 0) {
    propertyContainer.innerHTML = "<p>Не са намерени имоти.</p>";
    return;
  }

  propertyContainer.innerHTML = properties
    .map((p) => renderPropertyCard(p))
    .join("");

  attachPropertyCardListeners();
  attachAdminListeners();
}

// ======================================================
// RENDER SINGLE PROPERTY CARD WITH BG TRANSLATIONS
// ======================================================
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

  const adminButtons =
    role === "admin"
      ? `
<div class="admin-buttons-right">
  <button class="wishlist-btn" data-id="${id}">
    ${wishlistIds.includes(String(id)) ? "❤️" : "🤍"}
  </button>
  <button class="delete-btn" data-id="${id}">Изтрий</button>
  ${
    p.category === "rent"
      ? `<button class="toggle-status-btn" data-id="${id}">
           ${p.status === "free" ? "Зает" : "Свободен"}
         </button>`
      : ""
  }
</div>`
      : `<button class="wishlist-btn" data-id="${id}">${
          wishlistIds.includes(String(id)) ? "❤️" : "🤍"
        }</button>`;

  return `
<div class="property" data-id="${id}">
  ${
    firstImage
      ? `<img src="${firstImage}" alt="Имот" loading="lazy">`
      : ""
  }
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

// ======================================================
// MODAL - OPEN PROPERTY DETAILS (BG + fallback)
// ======================================================
let currentPropertyImages = [];
let currentImageIndex = 0;

async function openPropertyDetails(property) {
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "-";
  };

  // TRANSLATIONS & FALLBACKS
  const category = CATEGORY_LABELS_BG[property.category] || property.category || "-";
  const type = TYPE_LABELS_BG[property.type] || property.type || "-";
  const title = property.title || "-";
  const price = property.price != null ? property.price + "€" : "-";
  const bedrooms = property.bedrooms != null ? property.bedrooms : "-";
  const bathrooms = property.bathrooms != null ? property.bathrooms : "-";
  const size = property.size != null ? property.size + " м²" : "-";
  const description = property.description || "-";

  set("propTitle", title);
  set("propPrice", price);
  set("propType", type);
  set("propBedrooms", bedrooms);
  set("propBathrooms", bathrooms);
  set("propArea", size);
  set("propDescription", description);

  currentPropertyImages = [];
  if (property.firstImage) currentPropertyImages.push(property.firstImage);

  currentImageIndex = 0;

  // fetch KV images if not fetched
  if (!property._fetchedImages) {
    try {
      const res = await fetch(`${API_URL}/properties/${property.id}/images`);
      if (res.ok) {
        const data = await res.json(); // { images: [...] }
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

  updateModalImage();
  propertyModal.style.display = "flex";
}

// ======================================================
// PROPERTY CARD → OPEN MODAL
// ======================================================
function attachPropertyCardListeners() {
  propertyContainer.querySelectorAll(".property").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.dataset.id;
      const property = propertiesData.find((p) => p.id == id);
      if (!property) return showToast("Имотът не е намерен!");

      openPropertyDetails(property);
    });
  });
}

// ======================================================
// ADMIN BUTTONS
// ======================================================
function attachAdminListeners() {
  propertyContainer.querySelectorAll(".wishlist-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await toggleWishlist(btn.dataset.id);
    });
  });

  if (role === "admin") {
    propertyContainer.querySelectorAll(".delete-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm("Изтриване на имота?")) deleteProperty(btn.dataset.id);
      })
    );

    propertyContainer
      .querySelectorAll(".toggle-status-btn")
      .forEach((btn) =>
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleRentalStatus(btn.dataset.id);
        })
      );
  }
}

// ======================================================
// MODAL - STATIC LISTENERS
// ======================================================
function setupModalStaticListeners() {
  if (!propertyModal) return;

  const closeBtn = propertyModal.querySelector(".close");
  const prevBtn = propertyModal.querySelector("#prevImageBtn");
  const nextBtn = propertyModal.querySelector("#nextImageBtn");

  closeBtn?.addEventListener("click", () => (propertyModal.style.display = "none"));
  propertyModal.addEventListener("click", (e) => {
    if (e.target === propertyModal) propertyModal.style.display = "none";
  });

  prevBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!currentPropertyImages.length) return;
    currentImageIndex =
      (currentImageIndex - 1 + currentPropertyImages.length) %
      currentPropertyImages.length;
    updateModalImage();
  });

  nextBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!currentPropertyImages.length) return;
    currentImageIndex =
      (currentImageIndex + 1) % currentPropertyImages.length;
    updateModalImage();
  });
}

// ======================================================
// MODAL IMAGE UPDATE
// ======================================================
function updateModalImage() {
  const img = document.getElementById("propImage");
  const dots = document.getElementById("propImageDots");
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
      dot.addEventListener("click", () => {
        currentImageIndex = i;
        updateModalImage();
      });
      dots.appendChild(dot);
    });
  }
}

// ======================================================
// WISHLIST
// ======================================================
export async function loadWishlist() {
  if (!username || !token) return (wishlistIds = []);

  try {
    const res = await fetch(`${API_URL}/wishlists/${username}`, {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();
    wishlistIds = data.items || [];
  } catch {
    wishlistIds = [];
  }
}

export async function toggleWishlist(id) {
  if (!username || !token) return showToast("Трябва да сте влезли!");
  const action = wishlistIds.includes(id) ? "remove" : "add";

  const res = await fetch(`${API_URL}/wishlists/${username}/${action}`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ propertyId: id }),
  });

  const data = await res.json();
  if (!data.success) return showToast("Грешка при актуализиране на списъка с любими");

  if (action === "add") wishlistIds.push(id);
  else wishlistIds = wishlistIds.filter((x) => x !== id);

  loadProperties();
}

// ======================================================
// ADMIN
// ======================================================
async function deleteProperty(id) {
  await fetch(`${API_URL}/properties/${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
  showToast("Имотът беше изтрит!");
  loadProperties();
}

async function toggleRentalStatus(id) {
  await fetch(`${API_URL}/properties/${id}/status`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "toggle" }),
  });

  showToast("Статусът беше актуализиран!");
  loadProperties();
}

// ======================================================
// FILTERS
// ======================================================
function setupFilterListeners() {
  const btn = document.getElementById("applyFilters");
  if (!btn) return;

  btn.addEventListener("click", () => {
    let filtered = [...propertiesData];

    const minPrice = Number(document.getElementById("filterMinPrice").value);
    const maxPrice = Number(document.getElementById("filterMaxPrice").value);
    const type = document.getElementById("filterType").value;
    const cat = document.getElementById("filterCategory").value;

    filtered = filtered.filter((p) => {
      if (!isNaN(minPrice) && minPrice > 0 && p.price < minPrice)
        return false;
      if (!isNaN(maxPrice) && maxPrice > 0 && p.price > maxPrice)
        return false;
      if (type && type !== "" && p.type !== type) return false;
      if (cat && cat !== "" && p.category !== cat) return false;
      return true;
    });

    renderProperties(filtered);
  });
}

// ======================================================
// READY
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
  initProperties();
});
