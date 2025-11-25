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
// INIT
// ======================================================
export async function initProperties() {
  await loadWishlist();
  await loadProperties();
  setupFilterListeners();
  setupModalStaticListeners();

  window.addEventListener("propertiesUpdated", loadProperties);
  window.openPropertyDetails = openPropertyDetails;
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
      firstImage: p.images?.[0] || "",
      restImages: p.images?.slice(1) || [],
      _fetchedImages: false,
    }));

    renderProperties(propertiesData);
    return propertiesData;
  } catch (err) {
    console.error("Error loading properties:", err);
    propertyContainer.innerHTML = "<p>Error loading properties.</p>";
    return [];
  }
}

// ======================================================
// RENDER PROPERTIES
// ======================================================
export function renderProperties(properties) {
  if (!properties || properties.length === 0) {
    propertyContainer.innerHTML = "<p>No properties found.</p>";
    return;
  }

  propertyContainer.innerHTML = properties.map((p) => {
    const id = p.id ?? "-";
    const firstImage = p.firstImage ?? "";

    const adminButtons = role === "admin"
      ? `<div class="admin-buttons-right">
           <button class="wishlist-btn" data-id="${id}">${wishlistIds.includes(String(id)) ? "❤️" : "🤍"}</button>
           <button class="delete-btn" data-id="${id}">Delete</button>
           ${p.category === "rent" ? `<button class="toggle-status-btn" data-id="${id}">${p.status === "free" ? "Occupied" : "Free"}</button>` : ""}
         </div>`
      : `<button class="wishlist-btn" data-id="${id}">${wishlistIds.includes(String(id)) ? "❤️" : "🤍"}</button>`;

    return `
      <div class="property" data-id="${id}">
        ${firstImage ? `<img class="property-card-img" src="${firstImage}" alt="Property image" loading="lazy">` : ""}
        <div class="property-content">
          <div class="property-id-box">ID: ${id}</div>
          <h3>${p.title}</h3>
          <p><strong>Price:</strong> ${p.price}€</p>
          <p><strong>Category:</strong> ${p.category}</p>
          <p><strong>Type:</strong> ${p.type}</p>
          <p><strong>Bedrooms:</strong> ${p.bedrooms}</p>
          <p><strong>Bathrooms:</strong> ${p.bathrooms}</p>
          <p><strong>Size:</strong> ${p.size} m²</p>
          <div class="property-actions">${adminButtons}</div>
        </div>
      </div>
    `;
  }).join("");

  attachPropertyCardListeners();
  attachAdminListeners();
}

// ======================================================
// MODAL - OPEN PROPERTY DETAILS
// ======================================================
let currentPropertyImages = [];
let currentImageIndex = 0;

async function openPropertyDetails(property) {
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "-";
  };

  set("propTitle", property.title);
  set("propPrice", property.price + "€");
  set("propType", property.type);
  set("propBedrooms", property.bedrooms);
  set("propBathrooms", property.bathrooms);
  set("propArea", property.size + " m²");
  set("propDescription", property.description);

  // Lazy fetch rest images if not yet fetched
  if (!property._fetchedImages) {
    try {
      const res = await fetch(`${API_URL}/properties/${property.id}/images`);
      if (res.ok) {
        const data = await res.json();
        property.restImages = data.images || [];
      }
    } catch (err) {
      console.error("Failed to load extra images:", err);
      property.restImages = [];
    }
    property._fetchedImages = true;
  }

  currentPropertyImages = property.firstImage ? [property.firstImage, ...property.restImages] : [...property.restImages];
  currentImageIndex = 0;

  updateModalImage();
  propertyModal.style.display = "flex";
}

// ======================================================
// PROPERTY CARD → OPEN MODAL
// ======================================================
function attachPropertyCardListeners() {
  propertyContainer.querySelectorAll(".property").forEach((el) => {
    el.addEventListener("click", async () => {
      const id = el.dataset.id;
      const property = propertiesData.find((p) => p.id == id);
      if (!property) return showToast("Property not found!");
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
        if (confirm("Delete property?")) deleteProperty(btn.dataset.id);
      })
    );

    propertyContainer.querySelectorAll(".toggle-status-btn").forEach((btn) =>
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
    currentImageIndex = (currentImageIndex - 1 + currentPropertyImages.length) % currentPropertyImages.length;
    updateModalImage();
  });

  nextBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!currentPropertyImages.length) return;
    currentImageIndex = (currentImageIndex + 1) % currentPropertyImages.length;
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
  img.loading = "lazy";

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
  if (!username || !token) return showToast("You must be logged in!");
  const action = wishlistIds.includes(id) ? "remove" : "add";

  const res = await fetch(`${API_URL}/wishlists/${username}/${action}`, {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ propertyId: id }),
  });
  const data = await res.json();
  if (!data.success) return showToast("Error updating wishlist");

  if (action === "add") wishlistIds.push(id);
  else wishlistIds = wishlistIds.filter((x) => x !== id);

  loadProperties();
}

// ======================================================
// ADMIN
// ======================================================
async function deleteProperty(id) {
  await fetch(`${API_URL}/properties/${id}`, { method: "DELETE", headers: { Authorization: "Bearer " + token } });
  showToast("Deleted!");
  loadProperties();
}

async function toggleRentalStatus(id) {
  await fetch(`${API_URL}/properties/${id}/status`, {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "toggle" }),
  });
  showToast("Status updated!");
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
      if (!isNaN(minPrice) && minPrice > 0 && p.price < minPrice) return false;
      if (!isNaN(maxPrice) && maxPrice > 0 && p.price > maxPrice) return false;
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
