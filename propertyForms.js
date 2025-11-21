// propertyForms.js
import { loadProperties } from './properties.js';
import { showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';

document.addEventListener("DOMContentLoaded", () => {
  const addModal = document.getElementById("addPropertyModal");
  const addForm = document.getElementById("propertyForm");
  const addCategory = document.getElementById("propertyCategory");
  const addStatus = document.getElementById("propertyStatus");
  const imageUploads = document.getElementById('imageUploads');
  const addImageBtn = document.getElementById('addImageBtn');

  if (!addForm || !addModal || !addCategory || !addStatus || !imageUploads || !addImageBtn) return;

  // --------------------
  // Show/hide status for rental
  // --------------------
  addCategory.addEventListener("change", () => {
    addStatus.style.display = addCategory.value === "rental" ? "block" : "none";
  });

  // --------------------
  // Manage multiple images
  // --------------------
  let allImages = [];

  // Function to render previews
  const renderPreviews = () => {
    imageUploads.innerHTML = '';
    allImages.forEach((file, idx) => {
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
      preview.src = URL.createObjectURL(file);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = '×';
      removeBtn.style.fontSize = '18px';
      removeBtn.style.cursor = 'pointer';
      removeBtn.style.border = 'none';
      removeBtn.style.background = 'transparent';
      removeBtn.style.color = '#f00';

      removeBtn.addEventListener('click', () => {
        allImages.splice(idx, 1);
        renderPreviews();
      });

      wrapper.appendChild(preview);
      wrapper.appendChild(removeBtn);
      imageUploads.appendChild(wrapper);
    });
  };

  // Click "Add Image" -> trigger hidden file input
  addImageBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.addEventListener('change', () => {
      if (input.files && input.files[0]) {
        allImages.push(input.files[0]);
        renderPreviews();
      }
    });

    input.click();
  });

  // --------------------
  // Close modal
  // --------------------
  const closeAddModal = () => {
    addModal.setAttribute("aria-hidden", "true");
    addForm.reset();
    allImages = [];
    imageUploads.innerHTML = '';
    addStatus.style.display = "none";
  };
  addModal.querySelector(".close")?.addEventListener("click", closeAddModal);

  // --------------------
  // Submit form
  // --------------------
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

    const formData = new FormData();
    formData.append('title', title);
    formData.append('name', title); // match properties.js display
    formData.append('description', description);
    formData.append('price', price);
    formData.append('type', type);
    formData.append('bedrooms', bedrooms);
    formData.append('bathrooms', bathrooms);
    formData.append('size', size);
    formData.append('year', year);
    formData.append('category', category);
    formData.append('status', status);

    allImages.forEach(file => {
      formData.append('images', file);
    });

    try {
      const res = await fetch(`${API_URL}/properties`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: formData
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
