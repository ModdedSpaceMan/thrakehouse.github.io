import { showToast } from "./ui.js";
import { renderPropertyCard, toggleWishlist as mainToggleWishlist } from "./properties.js";

const wishlistContainer = document.getElementById("wishlistProperties");
const username = localStorage.getItem("username");

let propertiesData = [];
let wishlistIds = [];

// Fetch properties and images (first time fetch, no extra images yet)
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

          return {
            ...p,
            firstImage: p.firstImage || "",
            restImages: p.restImages || [],
            _fetchedImages: false, // No extra images yet
          };
        })
      );
      return props;
    }

    // Backend already returned full objects with images
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

// Load wishlist and fetch properties
export async function loadWishlist() {
  if (!username) {
    wishlistContainer.innerHTML = "<p>Трябва да сте влезли, за да видите wishlist.</p>";
    return;
  }

  try {
    // Fetch the full properties with images
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

// Render wishlist using renderPropertyCard()
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
  initLazyLoading(); // <-- Ensure lazy loading works after rendering
}

// Lazy-load images (same as in properties.js)
function initLazyLoading() {
  const lazyImages = document.querySelectorAll(".lazy-img");

  if (lazyImages.length === 0) return;

  // Check if IntersectionObserver is supported
  if ('IntersectionObserver' in window) {
    const lazyObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        const img = entry.target;

        if (entry.isIntersecting) {
          if (img.dataset.src) {
            img.src = img.dataset.src;  // Set actual image source
            img.removeAttribute("data-src");  // Remove lazy loading marker
          }
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: "200px",
    });

    lazyImages.forEach(img => {
      lazyObserver.observe(img);
    });
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    lazyImages.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
      }
    });
  }
}

// Attach listeners to wishlist items
function attachListeners() {
  wishlistContainer.querySelectorAll(".property").forEach((card) => {
    card.addEventListener("click", async (e) => {
      if (e.target.tagName === "BUTTON") return;

      const id = card.dataset.id;
      const property = propertiesData.find((p) => p.id == id);

      if (!property) return showToast("Не може да се зареди имотът");

      // If extra images haven't been fetched yet, load them
      if (!property._fetchedImages) {
        const extraImgsRes = await fetch(
          `https://my-backend.martinmiskata.workers.dev/properties/${id}/images`
        );
        const extraImgs = extraImgsRes.ok ? await extraImgsRes.json() : [];

        // Update the property with extra images
        property.restImages = extraImgs;
        property._fetchedImages = true;
      }

      // Open property details (with extra images now available)
      window.openPropertyDetails(property);
    });
  });

  wishlistContainer.querySelectorAll(".wishlist-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await mainToggleWishlist(btn.dataset.id);
      loadWishlist(); // Refresh wishlist after toggle
    });
  });
}

// Initialize wishlist on page load
document.addEventListener("DOMContentLoaded", loadWishlist);
