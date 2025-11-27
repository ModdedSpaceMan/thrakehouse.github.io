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
}

// -----------------------------------------------------------
// Lazy-load Base64 images
// -----------------------------------------------------------
function initLazyLoading() {
  const lazyImages = document.querySelectorAll(".lazy-img");

  const lazyObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;

        // MOVE data-src → src
        if (img.dataset.src) {
          img.src = img.dataset.src;
        }

        img.classList.remove("lazy-img");
        lazyObserver.unobserve(img);
      }
    });
  });

  lazyImages.forEach(img => lazyObserver.observe(img));
}

// -----------------------------------------------------------
// Attach click listeners
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
