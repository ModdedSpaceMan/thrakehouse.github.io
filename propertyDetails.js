// Labels for category and type in Bulgarian
const CATEGORY_LABELS_BG = { rent: "Наем", sale: "Продажба" };
const TYPE_LABELS_BG = {
  apartment: "Апартамент",
  house: "Къща",
  villa: "Вила",
  farm: "Земеделски имот",
  plot: "Парцел",
};

// Function to open and display property details
export async function openPropertyDetails(property) {
  // Get the property modal element (make sure it's defined in HTML)
  const propertyModal = document.getElementById("propertyModal");
  const loader = document.getElementById("globalLoader");

  // Show loader while fetching data
  loader.style.display = "flex";

  // Helper function to set text content of elements by ID
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "-";
  };

  // Set property details like title, price, type, etc.
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

  // Initialize the array of images to display
  let currentPropertyImages = [];
  if (property.firstImage) currentPropertyImages.push(property.firstImage);

  // Fetch extra images if not already fetched
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

  // Preload all images to ensure smooth modal experience
  await Promise.all(
    currentPropertyImages.map(
      (src) =>
        new Promise((res) => {
          const img = new Image();
          img.onload = res;
          img.onerror = res;
          img.src = src;
        })
    )
  );

  // Hide the loader after the images are loaded
  loader.style.display = "none";

  // Image navigation logic
  let currentImageIndex = 0;
  const img = document.getElementById("propImage");
  const dots = document.getElementById("propImageDots");

  // Function to update the modal image and dots
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
        dot.addEventListener("click", (e) => {
          e.stopPropagation();
          currentImageIndex = i;
          updateModalImage();
        });
        dots.appendChild(dot);
      });
    }
  }

  // Event listeners for image navigation (previous and next)
  const prevBtn = propertyModal.querySelector("#prevImageBtn");
  const nextBtn = propertyModal.querySelector("#nextImageBtn");

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

  // Initial image update
  updateModalImage();

  // Show the modal
  propertyModal.style.display = "flex";
}
