// propertyForms.js
import { loadProperties } from './properties.js';
import { showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';

document.addEventListener("DOMContentLoaded", () => {
  const addModal = document.getElementById("addPropertyModal");
  const addForm = document.getElementById("propertyForm");
  const addCategory = document.getElementById("propertyCategory");
  const addStatus = document.getElementById("propertyStatus");
  const imageUploads = document.getElementById("imageUploads");
  const addImageBtn = document.getElementById("addImageBtn");

  if (!addForm || !addModal || !addCategory || !imageUploads || !addImageBtn) return;

  let allImages = []; // store all uploaded images

  // Show/hide status for rental category
  addCategory.addEventListener("change", () => {
    addStatus.style.display = addCategory.value === "rental" ? "block" : "none";
  });

  // --- Dynamic Image Uploads ---
  addImageBtn.addEventListener("click", () => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.marginTop = '5px';

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none'; // hidden

    const preview = document.createElement('img');
    preview.style.width = '80px';
    preview.style.height = '80px';
    preview.style.objectFit = 'cover';
    preview.style.borderRadius = '4px';
    preview.style.marginRight = '10px';
    preview.style.display = 'none';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '×';
    removeBtn.style.fontSize = '18px';
    removeBtn.style.cursor = 'pointer';
    removeBtn.style.border = 'none';
    removeBtn.style.background = 'transparent';
    removeBtn.style.color = '#f00';

    let file;
    input.addEventListener('change', () => {
      if (input.files && input.files[0]) {
        file = input.files[0];
        allImages.push(file);

        const reader = new FileReader();
        reader.onload = e => {
          preview.src = e.target.result;
          preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });

    removeBtn.addEventListener('click', () => {
      if (file) {
        const idx = allImages.indexOf(file);
        if (idx > -1) allImages.splice(idx, 1);
      }
      wrapper.remove();
    });

    wrapper.appendChild(input);
    wrapper.appendChild(preview);
    wrapper.appendChild(removeBtn);
    imageUploads.appendChild(wrapper);

    input.click(); // trigger file selection
  });

  // --- Close modal ---
  const closeAddModal = () => {
    addModal.setAttribute("aria-hidden", "true");
    addForm.reset();
    allImages = [];
    addStatus.style.display = "none";
    imageUploads.innerHTML = ""; // clear previews
  };
  addModal.querySelector(".close")?.addEventListener("click", closeAddModal);

  // --- Submit form ---
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("propertyName")?.value.trim();
    const description = document.getElementById("propertyDescription")?.value.trim();
    const price = parseFloat(document.getElementById("propertyPrice")?.value) || 0;
    const type = document.getElementById("propertyType")?.value;
    const bedrooms = parseInt(document.getElementById("propertyBedrooms")?.value) || 0;
    const bathrooms = parseInt(document.getElementById("propertyBathrooms")?.value) || 0;
    const size = parseFloat(document.getElementById("propertySize")?.value) || 0;
    const year = parseInt(document.getElementById("propertyYear")?.value) || 0;
    const category = addCategory.value;
    const status = category === "rental" ? addStatus.value : "";

    if (!title || !type || !category) {
      return showToast("Моля, попълнете всички задължителни полета!");
    }

    // Convert all selected images to base64
    const imagePromises = allImages.map(file => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = e => reject(e);
      reader.readAsDataURL(file);
    }));

    let base64Images = [];
    try {
      base64Images = await Promise.all(imagePromises);
    } catch (err) {
      console.error("Failed to read images:", err);
    }

    const newProperty = {
      title,
      name: title,      // match properties.js display
      description,
      price,
      type,
      bedrooms,
      bathrooms,
      size,
      year,
      category,
      status,
      images: base64Images,
      amenities: []
    };

    try {
      const res = await fetch(`${API_URL}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
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
