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

  // Show status only for rentals
  categorySelect.addEventListener("change", () => {
    statusSelect.style.display = categorySelect.value === "rental" ? "block" : "none";
  });

  // Convert image to base64 on select
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => base64Image = reader.result;
    reader.readAsDataURL(file);
  });

  // Add property
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newProperty = {
      name: document.getElementById("propertyName").value,
      location: document.getElementById("propertyLocation").value,
      price: document.getElementById("propertyPrice").value,
      category: categorySelect.value,
      type: document.getElementById("propertyType").value,
      status: categorySelect.value === "rental" ? statusSelect.value : "",
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
      form.reset();
      base64Image = "";
      statusSelect.style.display = "none";
      addModal.setAttribute("aria-hidden", "true");

      // Trigger re-render
      window.dispatchEvent(new Event("propertiesUpdated"));
      await loadProperties();

    } catch (err) {
      console.error(err);
      showToast("Грешка при добавяне на имота");
    }
  });
});
