import { showToast } from "./ui.js";
import { renderPropertyCard, toggleWishlist as mainToggleWishlist } from "./properties.js";
import { openPropertyDetails } from "./propertyDetails.js";  // Import the function

const wishlistContainer = document.getElementById("wishlistProperties");
const username = localStorage.getItem("username");

let propertiesData = [];
let wishlistIds = [];

// Fetch properties and images
async function fetchProperties() {
  console.log("Fetching properties...");

  try {
    const res = await fetch("https://my-backend.martinmiskata.workers.dev/properties");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    if (!Array.isArray(data.items)) throw new Error("Expected array");

    // Backend only returned IDs
    if (typeof data.items[0] === "string" || typeof data.items[0] === "number") {
      console.log("Backend returned only property IDs, fetching details...");
      
      const props = await Promise.all(
        data.items.map(async (id) => {
          const r = await fetch(`https://my-backend.martinmiskata.workers.dev/properties/${id}`);
          if (!r.ok) throw new Error(`Failed to fetch property ${id}`);
          const p = await r.json();
          
          // Initialize property images if not already fetched
          console.log(p._fetchedImages);  // Log the flag to see its value
          if (!p._fetchedImages) {
            console.log(`Fetching extra images for property ${id}`);
            try {
              const extraImgsRes = await fetch(
                `https://my-backend.martinmiskata.workers.dev/properties/${id}/images`
              );
              if (extraImgsRes.ok) {
                const extraImgs = await extraImgsRes.json();
                if (Array.isArray(extraImgs.images)) {
                  p.restImages = extraImgs.images;
                  p.firstImage = p.firstImage || extraImgs.images[0] || "";
                }
              }
            } catch (err) {
              console.error("Failed to load extra images:", err);
            }
            p._fetchedImages = true;  // Mark images as fetched
          }

          return p;
        })
      );
      console.log("Fetched all properties with images.");
      return props;
    }

    // Backend already returned full objects with images
    console.log("Backend returned full property objects with images");
    
    // Ensure _fetchedImages is false to force image fetching
    return data.items.map((p) => ({
      ...p,
      firstImage: p.firstImage || p.images?.[0] || "",
      restImages: p.restImages || p.images?.slice(1) || [],
      _fetchedImages: false, // Ensure we always fetch extra images
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

// Lazy-load images
function initLazyLoading() {
  const lazyImages = document.querySelectorAll("img.lazy-img");

  if (lazyImages.length === 0) return;

  // Check if IntersectionObserver is supported (modern browsers)
  if ('IntersectionObserver' in window) {
    const lazyObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        const img = entry.target;

        if (entry.isIntersecting) {
          if (img.dataset.src) {
            img.src = img.dataset.src;  // Set actual image source
            img.removeAttribute("data-src");  // Remove lazy loading marker
          }
          observer.unobserve(img);  // Stop observing after loading
        }
      });
    }, {
      rootMargin: "200px",  // Trigger loading before the image comes into view
    });

    lazyImages.forEach(img => {
      lazyObserver.observe(img);  // Observe each lazy image
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
    card.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") return;

      const id = card.dataset.id;
      const property = propertiesData.find((p) => p.id == id);

      if (!property) return showToast("Не може да се зареди имотът");

      openPropertyDetails(property);  // Use openPropertyDetails here
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
