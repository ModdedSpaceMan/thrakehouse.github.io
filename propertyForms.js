// propertyForms.js
import { loadProperties } from './properties.js';
import { showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';

document.addEventListener("DOMContentLoaded", () => {
  const addModal = document.getElementById("addPropertyModal");
  const addForm = document.getElementById("propertyForm");
  const addCategory = document.getElementById("propertyCategory");
  const addStatus = document.getElementById("propertyStatus");
  const propertyImageInput = document.getElementById('propertyImage');
  const addMoreImagesBtn = document.getElementById('addMoreImagesBtn');
  const imagePreviews = document.getElementById('imagePreviews');

  if (!addForm || !addModal || !addCategory || !propertyImageInput || !addMoreImagesBtn || !imagePreviews) return;

  let allImages = [];

  // Show/hide rental status
  addCategory.addEventListener("change", () => {
    if (addStatus) addStatus.style.display = addCategory.value === "rental" ? "block" : "none";
  });

  // --- Add More Images Button ---
  addMoreImagesBtn.addEventListener('click', () => {
    propertyImageInput.click();
  });

  // Handle file selection
  propertyImageInput.addEventListener('change', () => {
    if (!propertyImageInput.files) return;

    Array.from(propertyImageInput.files).forEach(file => {
      allImages.push(file);

      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.marginTop = '5px';

      const preview = document.createElement('img');
      preview.style.width = '80px';
      preview.style.height = '80px';
      preview.style.objectFit = 'cover';
      preview.style.borderRadius = '4px';
      preview.style.marginRight = '10px';

      const reader = new FileReader();
      reader.onload = e => preview.src = e.target.result;
      reader.readAsDataURL(file);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = '×';
      removeBtn.style.fontSize = '18px';
      removeBtn.style.cursor = 'pointer';
      removeBtn.style.border = 'none';
      removeBtn.style.background = 'transparent';
      removeBtn.style.color = '#f00';

      removeBtn.addEventListener('click', () => {
        const idx = allImages.indexOf(file);
        if (idx > -1) allImages.splice(idx, 1);
        wrapper.remove();
      });

      wrapper.appendChild(preview);
      wrapper.appendChild(removeBtn);
      imagePreviews.appendChild(wrapper);
    });

    propertyImageInput.value = ''; // allow selecting same files again
  });

  // --- Close Modal ---
  const closeAddModal = () => {
    addModal.setAttribute("aria-hidden", "true");
    addForm.reset();
    allImages = [];
    imagePreviews.innerHTML = '';
    if (addStatus) addStatus.style.display = "none";
  };
  addModal.querySelector(".close")?.addEventListener("click", closeAddModal);

  // --- Form Submission ---
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

    // Convert all selected files to base64
    const base64Images = await Promise.all(
      allImages.map(file => new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.readAsDataURL(file);
      }))
    );

    const newProperty = {
      title,
      name: title,
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
