import { showToast } from "./ui.js";
import { renderPropertyCard, toggleWishlist as mainToggleWishlist } from "./properties.js";

const wishlistContainer = document.getElementById("wishlistProperties");
const username = localStorage.getItem("username");

let propertiesData = [];
let wishlistIds = [];

// -----------------------------------------------------------
// Fetch ALL properties and include image arrays properly
// -----------------------------------------------------------
async function fetchProperties() {
  try {
    const res = await fetch("https://my-backend.martinmiskata.workers.dev/properties");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (!Array.isArray(data.items)) throw new Error("Expected array");

    // Backend only returned IDs
    if (typeof data.items[0] === "string" || typeof data.items[0] === "number") {
      const props = await Promise.all(
        data.items.map(async (id) => {
          const r = await fetch(`https://my-backend.martinmiskata.workers.dev/properties/${id}`);
          if (!r.ok) throw new Error(`Failed to fetch property ${id}`);
          const p = await r.json();

          // Load full images
          const extraImgsRes = await fetch(
            `https://my-backend.martinmiskata.workers.dev/properties/${id}/images`
          );
          const extraImgs = extraImgsRes.ok ? await extraImgsRes.json() : [];

          return {
            ...p,
            firstImage: p.firstImage || extraImgs[0] || "",
            restImages: p.restImages || extraImgs.slice(1) || [],
            _fetchedImages: true,
          };
        })
      );
      return props;
    }

    // Backend already returned full objects
    return data.items.map((p) => ({
      ...p,
      firstImage: p.firstImage || p.images?.[0] || "",
      restImages: p.restImages || p.images?.slice(1) || [],
      _fetchedImages: true,
    }));
  } catch (err) {
    console.error("Failed to fetch properties:", err);
    return [];
  }
}

// -----------------------------------------------------------
// Load wishlist
// -----------------------------------------------------------
export async function loadWishlist() {
  if (!username) {
    wishlistContainer.innerHTML = "<p>Трябва да сте влезли, за да видите wishlist.</p>";
    return;
  }

  try {
    propertiesData = await fetchProperties();
    console.log("Fetched properties:", propertiesData);

    const res = await fetch(
      `https://my-backend.martinmiskata.workers.dev/wishlists/${username}`,
      { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const validIds = propertiesData.map((p) => String(p.id));

    wishlistIds = (data.items || []).filter((id) => validIds.includes(String(id)));

    console.log("Wishlist IDs:", wishlistIds);

    renderWishlist();
  } catch (err) {
    console.error(err);
    wishlistContainer.innerHTML = "<p>Грешка при зареждане на wishlist.</p>";
  }
}

// -----------------------------------------------------------
// Render wishlist using SHARED renderPropertyCard()
// -----------------------------------------------------------
export function renderWishlist() {
  if (!wishlistContainer) return;

  const savedProps = propertiesData.filter((p) =>
    wishlistIds.includes(String(p.id))
  );

  if (!savedProps.length) {
    wishlistContainer.innerHTML = "<p>Вашият списък е празен.</p>";
    return;
  }

  wishlistContainer.innerHTML = savedProps.map((p) => renderPropertyCard(p)).join("");

  attachListeners();
  initLazyLoading(); // <-- Lazy loading ENABLED
  attachCarouselListeners(); // <-- Attach carousel listeners
}

// -----------------------------------------------------------
// Lazy-load Base64 images
// -----------------------------------------------------------
function initLazyLoading() {
  const lazyImages = document.querySelectorAll(".lazy-img");

  const lazyObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const img = entry.target;

      if (img.dataset.src) {
        // If Base64 or normal image, move to src
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
      }

      img.classList.remove("lazy-img");
      lazyObserver.unobserve(img);
    });
  });

  lazyImages.forEach(img => {
    // If the image is already visible or Base64 above the fold
    if (!img.dataset.src.startsWith("http")) {
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
      img.classList.remove("lazy-img");
      return;
    }

    lazyObserver.observe(img);
  });
}

// -----------------------------------------------------------
// Attach image carousel listeners (for next and prev buttons)
// -----------------------------------------------------------
function attachCarouselListeners() {
  const cards = document.querySelectorAll('.property');

  cards.forEach(card => {
    const prevBtn = card.querySelector('.prev');
    const nextBtn = card.querySelector('.next');
    const mainImage = card.querySelector('.main-image');
    const carouselImages = card.querySelectorAll('.carousel-image');
    let currentIndex = 0;

    if (carouselImages.length > 0) {
      carouselImages[0].style.display = 'block'; // Show first image
    }

    // Prev Button Click Handler
    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        carouselImages[currentIndex].style.display = 'none';
        currentIndex--;
        carouselImages[currentIndex].style.display = 'block';
      }
    });

    // Next Button Click Handler
    nextBtn.addEventListener('click', () => {
      if (currentIndex < carouselImages.length - 1) {
        carouselImages[currentIndex].style.display = 'none';
        currentIndex++;
        carouselImages[currentIndex].style.display = 'block';
      }
    });
  });
}

// -----------------------------------------------------------
// Attach click listeners for property cards and wishlist buttons
// -----------------------------------------------------------
function attachListeners() {
  wishlistContainer.querySelectorAll(".property").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") return;

      const id = card.dataset.id;
      const property = propertiesData.find((p) => p.id == id);

      if (!property) return showToast("Не може да се зареди имотът");

      window.openPropertyDetails(property);
    });
  });

  wishlistContainer.querySelectorAll(".wishlist-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await mainToggleWishlist(btn.dataset.id);
      loadWishlist();
    });
  });
}

// -----------------------------------------------------------
// Init
// -----------------------------------------------------------
document.addEventListener("DOMContentLoaded", loadWishlist);
