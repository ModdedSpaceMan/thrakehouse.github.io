// propertyForms.js
import { loadProperties } from './properties.js';
import { openModal, closeModal, showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';

document.addEventListener("DOMContentLoaded", () => {
  const addModal = document.getElementById("addPropertyModal");
  const form = document.getElementById("propertyForm");
  const categorySelect = document.getElementById("propertyCategory");
  const statusSelect = document.getElementById("propertyStatus");
  const imageInput = document.getElementById("propertyImage");
  let base64Image = "";

  if (!form || !addModal || !categorySelect || !statusSelect || !imageInput) return;

  // Show/hide status select only for rentals
  categorySelect.addEventListener("change", () => {
    if (statusSelect) {
      statusSelect.style.display = categorySelect.value === "rental" ? "block" : "none";
    }
  });

  // Convert image to base64 on select
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => base64Image = reader.result;
    reader.readAsDataURL(file);
  });

  // Close modal function
  const closeAddModal = () => {
    addModal.setAttribute("aria-hidden", "true");
    form.reset();
    base64Image = "";
    statusSelect.style.display = "none";
  };

  // Optional: Close button inside modal
  const closeBtn = addModal.querySelector(".close");
  closeBtn?.addEventListener("click", closeAddModal);

  // Submit Add Property form
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("propertyName")?.value.trim();
    const location = document.getElementById("propertyLocation")?.value.trim();
    const price = parseFloat(document.getElementById("propertyPrice")?.value) || 0;
    const type = document.getElementById("propertyType")?.value;
    const category = categorySelect?.value;
    const status = category === "rental" ? statusSelect?.value : "";

    if (!name || !location || !type || !category) {
      showToast("Моля, попълнете всички задължителни полета!");
      return;
    }

    const newProperty = {
      name,
      location,
      price,
      type,
      category,
      status,
      image: base64Image
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

      // Trigger re-render
      window.dispatchEvent(new Event("propertiesUpdated"));
      await loadProperties();

    } catch (err) {
      console.error(err);
      showToast("Грешка при добавяне на имота");
    }
  });
});
