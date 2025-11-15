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

  // --- EDIT PROPERTY HANDLING ---
document.addEventListener("DOMContentLoaded", () => {
  const editModal = document.getElementById('editPropertyModal');
  const editForm = document.getElementById('editPropertyForm');
  const editName = document.getElementById('editPropertyName');
  const editLocation = document.getElementById('editPropertyLocation');
  const editPrice = document.getElementById('editPropertyPrice');
  const editType = document.getElementById('editPropertyType');
  const editCategory = document.getElementById('editPropertyCategory');
  const editStatus = document.getElementById('editPropertyStatus');
  const editImage = document.getElementById('editPropertyImage');
  const editImagePreview = document.getElementById('editPropertyImagePreview');

  let editBase64Image = "";

  if (!editModal || !editForm) return;

  // --- Open edit modal with property data ---
  window.openEditModal = async (property) => {
    if (!property) return;

    editModal.setAttribute('aria-hidden', 'false');
    editModal.dataset.propertyId = property.id;

    editName.value = property.name || "";
    editLocation.value = property.location || "";
    editPrice.value = property.price || "";
    editType.value = property.type || "";
    editCategory.value = property.category || "";
    editStatus.value = property.status || "";

    editBase64Image = property.image || "";
    editImagePreview.src = property.image || "";
  };

  // --- Close edit modal ---
  const closeEditModal = () => {
    editModal.setAttribute('aria-hidden', 'true');
    editModal.dataset.propertyId = '';
    editForm.reset();
    editBase64Image = "";
    editImagePreview.src = "";
  };

  const closeBtn = editModal.querySelector(".close");
  closeBtn?.addEventListener("click", closeEditModal);

  // --- Handle image input for preview ---
  editImage.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      editBase64Image = reader.result;
      editImagePreview.src = editBase64Image;
    };
    reader.readAsDataURL(file);
  });

  // --- Submit edit form ---
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const propertyId = editModal.dataset.propertyId;
    if (!propertyId) return showToast("Не е избран имот за редакция!");

    const updatedProperty = {
      name: editName.value.trim(),
      location: editLocation.value.trim(),
      price: parseFloat(editPrice.value) || 0,
      type: editType.value,
      category: editCategory.value,
      status: editCategory.value === "rental" ? editStatus.value : "",
      image: editBase64Image
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
      if (!res.ok) throw new Error(data.message || "Грешка при редакция на имота");

      showToast("Имотът беше редактиран успешно!");
      closeEditModal();

      // Refresh properties list
      window.dispatchEvent(new Event("propertiesUpdated"));
      await loadProperties();
    } catch (err) {
      console.error(err);
      showToast("Грешка при редакция на имота");
    }
  });
});
