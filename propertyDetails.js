


// propertyDetails.js
export async function openPropertyDetails(property) {
  const CATEGORY_LABELS_BG = { rent: "Наем", sale: "Продажба" };
  const TYPE_LABELS_BG = {
    apartment: "Апартамент",
    house: "Къща",
    villa: "Вила",
    farm: "Земеделски имот",
    plot: "Парцел",
  };

  const loader = document.getElementById("globalLoader");
  loader.style.display = "flex";

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

  loader.style.display = "none";

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
        dot.addEventListener("click", (e) => {
          e.stopPropagation();
          currentImageIndex = i;
          updateModalImage();
        });
        dots.appendChild(dot);
      });
    }
  }

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

  updateModalImage();
  propertyModal.style.display = "flex";
}
