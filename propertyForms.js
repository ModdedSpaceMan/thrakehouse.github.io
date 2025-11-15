// propertyForms.js
import { loadProperties } from './properties.js';
import { showToast } from './ui.js';

const API_URL = 'https://my-backend.martinmiskata.workers.dev';

document.addEventListener("DOMContentLoaded", () => {
  // -------------------- ADD PROPERTY --------------------
  const addModal = document.getElementById("addPropertyModal");
  const addForm = document.getElementById("propertyForm");
  const addCategory = document.getElementById("propertyCategory");
  const addImageInput = document.getElementById("propertyImage");
  let addBase64Image = "";

  if (addForm && addModal && addCategory && addImageInput) {
    // Dynamically create status select if it doesn't exist
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
      const name = document.getElementById("propertyName")?.value.trim();
      const location = document.getElementById("propertyLocation")?.value.trim();
      const price = parseFloat(document.getElementById("propertyPrice")?.value) || 0;
      const type = document.getElementById("propertyType")?.value;
      const category = addCategory?.value;
      const status = category === "rental" ? addStatus?.value : "";

      if (!name || !location || !type || !category) {
        return showToast("Моля, попълнете всички задължителни полета!");
      }

      const newProperty = { name, location, price, type, category, status, image: addBase64Image };

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

  // -------------------- EDIT PROPERTY --------------------
  const editModal = document.getElementById("editPropertyModal");
  const editForm = document.getElementById("editPropertyForm");
  if (!editModal || !editForm) return;

  const nameInput = document.getElementById("editPropertyName");
  const locationInput = document.getElementById("editPropertyLocation");
  const priceInput = document.getElementById("editPropertyPrice");
  const typeSelect = document.getElementById("editPropertyType");
  const categorySelect = document.getElementById("editPropertyCategory");
  const statusSelect = document.getElementById("editPropertyStatus");
  const imageInput = document.getElementById("editPropertyImage");
  const imagePreview = document.getElementById("editPropertyImagePreview");
  let currentBase64Image = "";

  const closeEditModal = () => {
    editModal.setAttribute("aria-hidden", "true");
    editForm.reset();
    imagePreview.src = "";
    currentBase64Image = "";
  };

  const editCloseBtn = editModal.querySelector(".close");
  editCloseBtn?.addEventListener("click", closeEditModal);

  categorySelect?.addEventListener("change", () => {
    statusSelect.style.display = categorySelect.value === "rental" ? "block" : "none";
  });

  imageInput?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      currentBase64Image = reader.result;
      imagePreview.src = currentBase64Image;
    };
    reader.readAsDataURL(file);
  });

  // Expose a function to open modal with property data
  window.openEditModal = async (propertyId) => {
    try {
      const res = await fetch(`${API_URL}/properties/${propertyId}`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const property = await res.json();

      nameInput.value = property.name || "";
      locationInput.value = property.location || "";
      priceInput.value = property.price || "";
      typeSelect.value = property.type || "";
      categorySelect.value = property.category || "";
      statusSelect.value = property.status || "";
      statusSelect.style.display = property.category === "rental" ? "block" : "none";

      imagePreview.src = property.image || "";
      currentBase64Image = property.image || "";

      editForm.dataset.propertyId = property.id;
      editModal.setAttribute("aria-hidden", "false");
    } catch (err) {
      console.error(err);
      showToast("Грешка при зареждане на имота");
    }
  };

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const propertyId = editForm.dataset.propertyId;
    if (!propertyId) return showToast("Невалиден имот");

    const updatedProperty = {
      name: nameInput.value.trim(),
      location: locationInput.value.trim(),
      price: parseFloat(priceInput.value) || 0,
      type: typeSelect.value,
      category: categorySelect.value,
      status: categorySelect.value === "rental" ? statusSelect.value : "",
      image: currentBase64Image
    };

    try {
      const res = await fetch(`${API_URL}/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ property: updatedProperty })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update property");

      showToast("Имотът беше редактиран успешно!");
      closeEditModal();
      window.dispatchEvent(new Event("propertiesUpdated"));
      await loadProperties();
    } catch (err) {
      console.error(err);
      showToast("Грешка при редактиране на имота");
    }
  });
});
