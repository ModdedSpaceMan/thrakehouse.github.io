import { showToast } from "./ui.js";
import { renderPropertyCard, toggleWishlist as mainToggleWishlist } from "./properties.js";

const wishlistContainer = document.getElementById("wishlistProperties");
const username = localStorage.getItem("username");

let propertiesData = [];
let wishlistIds = [];

// Fetch properties and images
async function fetchProperties() {
  try {
    console.log("Fetching properties...");

    const res = await fetch("https://my-backend.martinmiskata.workers.dev/properties");
    console.log('Properties response:', res);  // Log response for properties
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    console.log('Fetched property data:', data); // Log the fetched data
    
    if (!Array.isArray(data.items)) throw new Error("Expected array");

    // Backend only returned IDs
    if (typeof data.items[0] === "string" || typeof data.items[0] === "number") {
      console.log("Backend returned only property IDs, fetching details...");

      const props = await Promise.all(
        data.items.map(async (id) => {
          console.log(`Fetching details for property ID: ${id}`); // Log each property ID
          const r = await fetch(`https://my-backend.martinmiskata.workers.dev/properties/${id}`);
          if (!r.ok) throw new Error(`Failed to fetch property ${id}`);
          const p = await r.json();

          // Fetch extra images from the backend
          console.log(`Fetching extra images for property ${id}`); // Log the fetch request
          const extraImgsRes = await fetch(
            `https://my-backend.martinmiskata.workers.dev/properties/${id}/images`
          );
          console.log(`Extra images response for property ${id}:`, extraImgsRes);  // Log the response
          const extraImgs = extraImgsRes.ok ? await extraImgsRes.json() : [];
          console.log(`Extra images for property ${id}:`, extraImgs);  // Log the fetched images

          return {
            ...p,
            firstImage: p.firstImage || extraImgs.images[0] || "",
            restImages: p.restImages || extraImgs.images.slice(1) || [],
            _fetchedImages: true,
          };
        })
      );
      console.log("Fetched all properties with images.");
      return props;
    }

    // Backend already returned full objects with images
    console.log("Backend returned full property objects with images");
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
  console.log("Loading wishlist...");

  if (!username) {
    wishlistContainer.innerHTML = "<p>Трябва да сте влезли, за да видите wishlist.</p>";
    return;
  }

  try {
    // Fetch the full properties with images
    propertiesData = await fetchProperties();
    console.log("Fetched properties data:", propertiesData);

    const res = await fetch(
      `https://my-backend.martinmiskata.workers.dev/wishlists/${username}`,
      { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
    );
    console.log('Wishlist response:', res);  // Log the response for the wishlist
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    console.log('Wishlist data:', data);  // Log the data for wishlist
    
    const validIds = propertiesData.map((p) => String(p.id));
    wishlistIds = (data.items || []).filter((id) => validIds.includes(String(id)));
    
    console.log("Wishlist IDs:", wishlistIds);  // Log the wishlist IDs

    renderWishlist();
  } catch (err) {
    console.error(err);
    wishlistContainer.innerHTML = "<p>Грешка при зареждане на wishlist.</p>";
  }
}

// Render wishlist using renderPropertyCard()
export function renderWishlist() {
  console.log("Rendering wishlist...");

  if (!wishlistContainer) return;

  const savedProps = propertiesData.filter((p) =>
    wishlistIds.includes(String(p.id))
  );

  if (!savedProps.length) {
    wishlistContainer.innerHTML = "<p>Вашият списък е празен.</p>";
    return;
  }

  console.log('Rendering the properties:', savedProps);
  wishlistContainer.innerHTML = savedProps.map((p) => renderPropertyCard(p)).join("");

  attachListeners();
  initLazyLoading(); // Ensure lazy loading works after rendering
}

// Lazy-load images (same as in properties.js)
function initLazyLoading() {
  const lazyImages = document.querySelectorAll(".lazy-img");

  if (lazyImages.length === 0) return;

  console.log(`Lazy loading images:`, lazyImages);

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
  console.log("Attaching listeners to wishlist items...");
  wishlistContainer.querySelectorAll(".property").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") return;

      const id = card.dataset.id;
      const property = propertiesData.find((p) => p.id == id);

      if (!property) return showToast("Не може да се зареди имотът");

      console.log(`Property card clicked:`, card);
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
