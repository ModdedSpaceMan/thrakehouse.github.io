// propertyForms.js (UPDATED: removed location and added new fields)
import { loadProperties } from './properties.js';
import { showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';

document.addEventListener("DOMContentLoaded", () => {
  const addModal = document.getElementById("addPropertyModal");
  const addForm = document.getElementById("propertyForm");
  const addCategory = document.getElementById("propertyCategory");
  const addImageInput = document.getElementById("propertyImage");
  let addBase64Image = "";

  if (addForm && addModal && addCategory && addImageInput) {

    let addStatus = document.getElementById("propertyStatus");
    if (!addStatus) {
      addStatus = document.createElement("select");
      addStatus.id = "propertyStatus";
      addStatus.innerHTML = `
        <option value="">Изберете статус</option>
        <option value="free">Свободен</option>
        <option value="taken">Зает</option>
      `;
      addCategory.insertAdjacentElement("afterend", addStatus);
      addStatus.style.display = "none";
    }

    addCategory.addEventListener("change", () => {
      addStatus.style.display = addCategory.value === "rental" ? "block" : "none";
    });

    addImageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => addBase64Image = reader.result;
      reader.readAsDataURL(file);
    });

    const closeAddModal = () => {
      addModal.setAttribute("aria-hidden", "true");
      addForm.reset();
      addBase64Image = "";
      addStatus.style.display = "none";
    };

    const addCloseBtn = addModal.querySelector(".close");
    addCloseBtn?.addEventListener("click", closeAddModal);

    addForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = document.getElementById("propertyName")?.value.trim();
      const description = document.getElementById("propertyDescription")?.value.trim();
      const price = parseFloat(document.getElementById("propertyPrice")?.value) || 0;
      const bedrooms = parseInt(document.getElementById("propertyBedrooms")?.value) || 0;
      const bathrooms = parseInt(document.getElementById("propertyBathrooms")?.value) || 0;
      const size = parseFloat(document.getElementById("propertySize")?.value) || 0;
      const category = addCategory?.value;
      const status = category === "rental" ? addStatus?.value : "";

      if (!title || !category) {
        return showToast("Моля, попълнете всички задължителни полета!");
      }

      const newProperty = {
        title,
        description,
        price,
        bedrooms,
        bathrooms,
        size,
        images: addBase64Image ? [addBase64Image] : [],
        amenities: [],
        category,
        status
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
  }
});
