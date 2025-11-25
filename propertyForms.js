import { loadProperties } from './properties.js';
import { showToast } from './ui.js';

const API_URL = "https://my-backend.martinmiskata.workers.dev";

document.addEventListener("DOMContentLoaded", () => {
  console.log("propertyForms.js loaded");

  const addModal = document.getElementById("addPropertyModal");
  const addForm = document.getElementById("addPropertyForm");
  const addCategory = document.getElementById("propertyCategory");
  const addStatus = document.getElementById("propertyStatus");
  const propertyImageInput = document.getElementById("propertyImage");
  const addMoreImagesBtn = document.getElementById("addMoreImagesBtn");
  const imagePreviews = document.getElementById("imagePreviews");
  const statusContainer = document.getElementById("statusContainer");

  let allImages = [];

  // Show/hide rent status
  statusContainer.style.display = "none";
  addCategory.addEventListener("change", () => {
    statusContainer.style.display = addCategory.value === "rent" ? "block" : "none";
  });

  // Add images
  addMoreImagesBtn.addEventListener("click", () => propertyImageInput.click());

  propertyImageInput.addEventListener("change", () => {
    Array.from(propertyImageInput.files).forEach(file => {
      allImages.push(file);

      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.alignItems = "center";
      wrapper.style.marginTop = "6px";

      const img = document.createElement("img");
      img.style.width = "80px";
      img.style.height = "80px";
      img.style.objectFit = "cover";
      img.style.borderRadius = "6px";
      img.style.marginRight = "10px";

      const reader = new FileReader();
      reader.onload = e => img.src = e.target.result;
      reader.readAsDataURL(file);

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "×";
      removeBtn.style.color = "red";
      removeBtn.style.fontSize = "20px";
      removeBtn.style.border = "none";
      removeBtn.style.background = "transparent";
      removeBtn.style.cursor = "pointer";

      removeBtn.addEventListener("click", () => {
        allImages = allImages.filter(f => f !== file);
        wrapper.remove();
      });

      wrapper.appendChild(img);
      wrapper.appendChild(removeBtn);
      imagePreviews.appendChild(wrapper);
    });

    propertyImageInput.value = "";
  });

  const closeAddModal = () => {
    addModal.setAttribute("aria-hidden", "true");
    addForm.reset();
    allImages = [];
    imagePreviews.innerHTML = "";
    statusContainer.style.display = "none";
  };

  document.getElementById("closeAddModal").addEventListener("click", closeAddModal);

  // Compress → Base64
  function fileToBase64(file, maxDim = 1024, quality = 0.7) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  // Submit form
  addForm.addEventListener("submit", async e => {
    e.preventDefault();

    const title = document.getElementById("propertyTitle").value;
    const description = document.getElementById("propertyDescription").value;
    const price = parseFloat(document.getElementById("propertyPrice").value) || 0;
    const type = document.getElementById("propertyType").value;
    const bedrooms = parseInt(document.getElementById("propertyBedrooms").value) || 0;
    const bathrooms = parseInt(document.getElementById("propertyBathrooms").value) || 0;
    const size = parseFloat(document.getElementById("propertyArea").value) || 0;
    const year = parseInt(document.getElementById("propertyYear").value) || 0;
    const category = addCategory.value;
    const status = category === "rent" ? addStatus.value : "";

    if (!title || !type || !category) {
      return showToast("Please fill all required fields!");
    }

    // Convert all selected images to Base64 data URLs
    const base64Images = [];
    for (const file of allImages) {
      const b64 = await fileToBase64(file);
      base64Images.push(b64);
    }

    if (!base64Images.length) return showToast("Please select at least one image!");

    const firstImage = base64Images[0];
    const restImages = base64Images.slice(1);

    // Step 1: POST property with firstImage only
    let newProperty;
    try {
      const res = await fetch(`${API_URL}/properties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify({ property: { 
          title, description, price, type, bedrooms, bathrooms, size, year,
          category, status, amenities: [], firstImage
        }})
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      newProperty = data.property;
    } catch (err) {
      console.error(err);
      return showToast("Failed to add property!");
    }

    // Step 2: POST remaining images to IMAGES_KV if any
    if (restImages.length) {
      try {
        await fetch(`${API_URL}/properties/${newProperty.id}/images`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token")
          },
          body: JSON.stringify({ images: restImages })
        });
      } catch (err) {
        console.error(err);
        showToast("Property added but failed to save extra images!");
      }
    }

    showToast("Property added!");
    closeAddModal();
    loadProperties();
  });
});
