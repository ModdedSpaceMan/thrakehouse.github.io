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
  const statusContainer = document.getElementById("statusContainer");

  if (!addForm || !addModal || !addCategory || !propertyImageInput || !addMoreImagesBtn || !imagePreviews) return;

  // Mobile-friendly file input
  propertyImageInput.style.position = 'absolute';
  propertyImageInput.style.left = '-9999px';
  propertyImageInput.setAttribute('multiple', 'true');
  propertyImageInput.setAttribute('accept', 'image/*');

  let allImages = [];

  // Hide status by default
  statusContainer.style.display = "none";

  // Show status only for rentals
  addCategory.addEventListener("change", () => {
    statusContainer.style.display = addCategory.value === "rental" ? "block" : "none";
  });

  // --- Add More Images Button ---
  addMoreImagesBtn.addEventListener('click', () => propertyImageInput.click());

  // --- Handle file selection ---
  propertyImageInput.addEventListener('change', () => {
    if (!propertyImageInput.files) return;

    Array.from(propertyImageInput.files).forEach(file => {
      allImages.push(file);

      const wrapper = document.createElement('div');
      wrapper.style.display = 'inline-flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.margin = '5px';

      const preview = document.createElement('img');
      preview.src = URL.createObjectURL(file);
      preview.width = 80;
      preview.height = 80;
      preview.style.objectFit = 'cover';
      preview.style.borderRadius = '4px';
      preview.style.marginRight = '5px';

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = '×';
      removeBtn.style.cursor = 'pointer';
      removeBtn.style.border = 'none';
      removeBtn.style.background = 'transparent';
      removeBtn.style.color = 'red';
      removeBtn.style.fontSize = '18px';

      removeBtn.addEventListener('click', () => {
        const idx = allImages.indexOf(file);
        if (idx > -1) allImages.splice(idx, 1);
        wrapper.remove();
      });

      wrapper.appendChild(preview);
      wrapper.appendChild(removeBtn);
      imagePreviews.appendChild(wrapper);
    });

    propertyImageInput.value = ''; // allow re-selection
  });

  // --- Close Modal ---
  const closeAddModal = () => {
    addModal.setAttribute("aria-hidden", "true");
    addForm.reset();
    allImages = [];
    imagePreviews.innerHTML = '';
    statusContainer.style.display = "none";
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
