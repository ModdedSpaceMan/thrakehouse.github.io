// propertyForms.js
import { loadProperties } from './properties.js';
import { showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';

document.addEventListener("DOMContentLoaded", () => {
  const addModal = document.getElementById("addPropertyModal");
  const addForm = document.getElementById("propertyForm");
  const addCategory = document.getElementById("propertyCategory");
  const addImageInput = document.getElementById("propertyImage");
  let addBase64Image = "";

  if (!addForm || !addModal || !addCategory || !addImageInput) return;

  let addStatus = document.getElementById("propertyStatus");
  addCategory.addEventListener("change", () => {
    addStatus.style.display = addCategory.value === "rental" ? "block" : "none";
  });

// --- Dynamic image uploads for Add Property Modal ---
const addImageBtn = document.getElementById('addImageBtn');
const imageUploads = document.getElementById('imageUploads');

if (addImageBtn && imageUploads) {
  addImageBtn.addEventListener('click', () => {
    // Create a wrapper for input + preview + remove button
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.marginTop = '5px';

    // New file input
    const newInput = document.createElement('input');
    newInput.type = 'file';
    newInput.name = 'propertyImages[]';
    newInput.accept = 'image/*';
    newInput.style.marginRight = '10px';

    // Preview image
    const preview = document.createElement('img');
    preview.style.width = '80px';
    preview.style.height = '80px';
    preview.style.objectFit = 'cover';
    preview.style.borderRadius = '4px';
    preview.style.display = 'none';
    preview.style.marginRight = '10px';

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '×';
    removeBtn.style.fontSize = '18px';
    removeBtn.style.cursor = 'pointer';
    removeBtn.style.border = 'none';
    removeBtn.style.background = 'transparent';
    removeBtn.style.color = '#f00';

    removeBtn.addEventListener('click', () => {
      wrapper.remove();
    });

    // Show preview when file is selected
    newInput.addEventListener('change', () => {
      if (newInput.files && newInput.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
          preview.src = e.target.result;
          preview.style.display = 'block';
        };
        reader.readAsDataURL(newInput.files[0]);
      }
    });

    wrapper.appendChild(newInput);
    wrapper.appendChild(preview);
    wrapper.appendChild(removeBtn);

    imageUploads.appendChild(wrapper);
  });
}

// --- Optional: handle initial file input preview if already present ---
const initialInput = imageUploads.querySelector('input[type="file"]');
if (initialInput) {
  const preview = document.createElement('img');
  preview.style.width = '80px';
  preview.style.height = '80px';
  preview.style.objectFit = 'cover';
  preview.style.borderRadius = '4px';
  preview.style.display = 'none';
  preview.style.marginLeft = '10px';
  initialInput.parentNode.appendChild(preview);

  initialInput.addEventListener('change', () => {
    if (initialInput.files && initialInput.files[0]) {
      const reader = new FileReader();
      reader.onload = e => {
        preview.src = e.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(initialInput.files[0]);
    }
  });
}

  const closeAddModal = () => {
    addModal.setAttribute("aria-hidden", "true");
    addForm.reset();
    addBase64Image = "";
    addStatus.style.display = "none";
  };
  addModal.querySelector(".close")?.addEventListener("click", closeAddModal);

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
      images: addBase64Image ? [addBase64Image] : [],
      amenities: []
    };

    try {
      const res = await fetch(`${API_URL}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ property: newProperty }) // <-- FIXED
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
