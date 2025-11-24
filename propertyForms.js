import { loadProperties } from './properties.js';
import { showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';

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

  if (!addForm || !addModal) {
    console.error("Modal or form missing.");
    return;
  }

  let allImages = [];

  // ---- CATEGORY LOGIC ----
  statusContainer.style.display = "none";
  addCategory.addEventListener("change", () => {
    statusContainer.style.display = addCategory.value === "rent" ? "block" : "none";
  });

  // ---- IMAGE UPLOAD ----
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
      reader.onload = e => (img.src = e.target.result);
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

  // ---- CLOSE MODAL ----
  const closeAddModal = () => {
    addModal.setAttribute("aria-hidden", "true");
    addForm.reset();
    allImages = [];
    imagePreviews.innerHTML = "";
    statusContainer.style.display = "none";
  };

  document.getElementById("closeAddModal").addEventListener("click", closeAddModal);

  // ---- FORM SUBMIT ----
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("propertyTitle").value.trim();
    const description = document.getElementById("propertyDescription").value.trim();
    const price = parseFloat(document.getElementById("propertyPrice").value) || 0;
    const type = document.getElementById("propertyType").value;
    const bedrooms = parseInt(document.getElementById("propertyBedrooms").value) || 0;
    const bathrooms = parseInt(document.getElementById("propertyBathrooms").value) || 0;
    const size = parseFloat(document.getElementById("propertyArea").value) || 0;
    const year = parseInt(document.getElementById("propertyYear").value) || 0;
    const category = addCategory.value;
    const status = category === "rent" ? addStatus.value : "";

    if (!title || !type || !category) {
      return showToast("Моля, попълнете всички задължителни полета!");
    }

    // ---- Upload images one by one to Worker KV ----
    const uploadedImageKeys = [];
    for (let i = 0; i < allImages.length; i++) {
      const file = allImages[i];
      const formData = new FormData();
      formData.append("image", file);
      formData.append("propertyId", crypto.randomUUID()); // unique ID for this property

      try {
        const res = await fetch(`${API_URL}/upload-image`, {
          method: "POST",
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token")
          },
          body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Image upload failed");

        uploadedImageKeys.push(data.key); // KV key returned from Worker
      } catch (err) {
        console.error("Failed to upload image:", err);
        showToast("Грешка при качване на изображение");
        return;
      }
    }

    // ---- Save property metadata ----
    const newProperty = {
      title,
      description,
      price,
      type,
      bedrooms,
      bathrooms,
      size,
      year,
      category,
      status,
      images: uploadedImageKeys,
      amenities: []
    };

    try {
      const res = await fetch(`${API_URL}/properties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify({ property: newProperty })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add property");

      showToast("Имотът беше добавен успешно!");
      closeAddModal();
      window.dispatchEvent(new Event("propertiesUpdated"));
      await loadProperties();

    } catch (err) {
      console.error(err);
      showToast("Грешка при добавяне на имота");
    }
  });
});
