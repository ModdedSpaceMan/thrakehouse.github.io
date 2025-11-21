// properties.js
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

  window.addEventListener("propertiesUpdated", loadProperties);

  setupModalStaticListeners();

  // Expose globally for wishlist page
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
    propertiesData = data;

    renderProperties(data);
    return data;
  } catch (err) {
    console.error("Грешка при зареждане на имоти:", err);
    propertyContainer.innerHTML = "<p>Грешка при зареждане.</p>";
    return [];
  }
}

// ======================================================
// RENDER PROPERTIES
// ======================================================
export function renderProperties(properties) {
  if (!propertyContainer) return;

  if (!properties.length) {
    propertyContainer.innerHTML = "<p>Няма налични имоти.</p>";
    return;
  }

  const typeTranslations = {
    apartment: "Апартамент",
    house: "Къща",
    villa: "Вила",
    farm: "Земеделски имот",
    regulated: "Земя в регулация",
    plot: "Парцел",
  };

  propertyContainer.innerHTML = properties
    .map((p) => {
      const id = p.id ?? "-";
      const image = p.images?.length ? p.images[0] : "";

      const adminButtons =
        role === "admin"
          ? `
        <div class="admin-buttons-right">
          <button class="wishlist-btn" data-id="${id}">${
              wishlistIds.includes(String(id)) ? "❤️" : "🤍"
            }</button>
          <button class="delete-btn" data-id="${id}">Изтрий</button>
          ${
            p.category === "rental"
              ? `<button class="toggle-status-btn" data-id="${id}">${
                  p.status === "free" ? "Зает" : "Свободен"
                }</button>`
              : ""
          }
        </div>`
          : `<button class="wishlist-btn" data-id="${id}">${
              wishlistIds.includes(String(id)) ? "❤️" : "🤍"
            }</button>`;

      return `
        <div class="property" data-id="${id}">
          ${image ? `<img src="${image}">` : ""}
          <div class="property-content">
            <h3>${p.title}</h3>
            <p><strong>Цена:</strong> ${p.price} лв</p>
            <p><strong>Категория:</strong> ${p.category}</p>
            <p><strong>Тип:</strong> ${typeTranslations[p.type] || p.type}</p>
            <p><strong>Спални:</strong> ${p.bedrooms}</p>
            <p><strong>Бани:</strong> ${p.bathrooms}</p>
            <p><strong>Площ:</strong> ${p.size} m²</p>
            ${
              p.category === "rental"
                ? `<p><strong>Статус:</strong> ${p.status}</p>`
                : ""
            }
          </div>
          <div class="property-actions">${adminButtons}</div>
        </div>`;
    })
    .join("");

  attachPropertyCardListeners();
  attachAdminListeners();
}

// ======================================================
// PROPERTY CARD → OPEN MODAL
// ======================================================
function attachPropertyCardListeners() {
  propertyContainer.querySelectorAll(".property").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.dataset.id;
      const property = propertiesData.find((p) => p.id == id);

      if (!property) return showToast("Не е намерен имот!");

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
        if (confirm("Изтриване?")) deleteProperty(btn.dataset.id);
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
// MODAL (STATIC LISTENERS — ADD ONCE!)
// ======================================================
let currentPropertyImages = [];
let currentImageIndex = 0;

function setupModalStaticListeners() {
  const closeBtn = propertyModal.querySelector(".close");
  const prevBtn = propertyModal.querySelector("#prevImageBtn");
  const nextBtn = propertyModal.querySelector("#nextImageBtn");

  closeBtn.addEventListener("click", () => (propertyModal.style.display = "none"));
  propertyModal.addEventListener("click", (e) => {
    if (e.target === propertyModal) propertyModal.style.display = "none";
  });

  if (prevBtn)
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!currentPropertyImages.length) return;
      currentImageIndex =
        (currentImageIndex - 1 + currentPropertyImages.length) % currentPropertyImages.length;
      updateModalImage();
    });

  if (nextBtn)
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!currentPropertyImages.length) return;
      currentImageIndex = (currentImageIndex + 1) % currentPropertyImages.length;
      updateModalImage();
    });
}

// ======================================================
// OPEN MODAL
// ======================================================
function openPropertyDetails(property) {
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "-";
  };

  set("propTitle", property.title);
  set("propPrice", property.price + " лева");
  set("propCategory", property.category);
  set("propStatus", property.status);
  set("propType", property.type);
  set("propBedrooms", property.bedrooms);
  set("propBathrooms", property.bathrooms);
  set("propArea", property.size + " m²");
  set("propYear", property.year);
  set("propDescription", property.description);

  currentPropertyImages = property.images || [];
  currentImageIndex = 0;

  updateModalImage();

  propertyModal.style.display = "flex";
}

// ======================================================
// UPDATE IMAGE + DOTS
// ======================================================
function updateModalImage() {
  const img = document.getElementById("propImage");
  const dots = document.getElementById("propImageDots");

  if (!img) return;

  if (!currentPropertyImages.length) {
    img.style.display = "none";
    dots.innerHTML = "";
    return;
  }

  img.style.display = "block";
  img.src = currentPropertyImages[currentImageIndex];

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

    const propsRes = await fetch(`${API_URL}/properties`);
    const props = await propsRes.json();

    const valid = props.map((p) => p.id);
    wishlistIds = (data.items || []).filter((id) => valid.includes(id));
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

  if (!data.success) return showToast("Грешка");

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

  showToast("Изтрито!");
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

  showToast("Статус обновен!");
  loadProperties();
}

// ======================================================
// FILTERS
// ======================================================
function setupFilterListeners() {
  const btn = document.getElementById("applyFilters");
  if (!btn) return;

  btn.addEventListener("click", () => {
    // Always start from full properties
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
document.addEventListener("DOMContentLoaded", initProperties);
