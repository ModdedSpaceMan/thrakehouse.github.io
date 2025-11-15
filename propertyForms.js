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

  // --------------------
// EDIT PROPERTY LOGIC
// --------------------
document.addEventListener("DOMContentLoaded", () => {
  const editModal = document.getElementById("editPropertyModal");
  const editForm = document.getElementById("editPropertyForm");
  const editImageInput = document.getElementById("editPropertyImage");
  const editImagePreview = document.getElementById("editPropertyImagePreview");
  let editBase64Image = "";

  if (!editModal || !editForm || !editImageInput) return;

  // Close edit modal function
  function closeEditModal() {
    editModal.setAttribute("aria-hidden", "true");
    editModal.dataset.propertyId = "";
    editForm.reset();
    editBase64Image = "";
    if (editImagePreview) editImagePreview.src = "";
  }
  window.closeEditModal = closeEditModal; // Make accessible from HTML onclick

  const closeBtn = editModal.querySelector(".close");
  closeBtn?.addEventListener("click", closeEditModal);

  // Convert new image to base64
  editImageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      editBase64Image = reader.result;
      if (editImagePreview) editImagePreview.src = editBase64Image;
    };
    reader.readAsDataURL(file);
  });

  // Function to open modal and load existing property
  window.openEditModal = async function (propertyId) {
    if (!propertyId) return;
    try {
      const res = await fetch(`${API_URL}/properties`);
      const properties = await res.json();
      const prop = properties.find(p => p.id === propertyId);
      if (!prop) return;

      editModal.dataset.propertyId = propertyId;
      editForm.elements["editPropertyName"].value = prop.name || "";
      editForm.elements["editPropertyLocation"].value = prop.location || "";
      editForm.elements["editPropertyPrice"].value = prop.price || "";
      editForm.elements["editPropertyType"].value = prop.type || "";
      editForm.elements["editPropertyCategory"].value = prop.category || "";
      editForm.elements["editPropertyStatus"].value = prop.status || "";

      // Show image preview if exists
      editBase64Image = prop.image || "";
      if (editImagePreview) editImagePreview.src = editBase64Image;

      editModal.setAttribute("aria-hidden", "false");
    } catch (err) {
      console.error("Failed to load property for editing:", err);
    }
  };

  // Submit edit form
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const propertyId = editModal.dataset.propertyId;
    if (!propertyId) return;

    const updatedProperty = {
      name: editForm.elements["editPropertyName"].value.trim(),
      location: editForm.elements["editPropertyLocation"].value.trim(),
      price: parseFloat(editForm.elements["editPropertyPrice"].value) || 0,
      type: editForm.elements["editPropertyType"].value,
      category: editForm.elements["editPropertyCategory"].value,
      status: editForm.elements["editPropertyCategory"].value === "rental"
        ? editForm.elements["editPropertyStatus"].value
        : "",
      image: editBase64Image
    };

    try {
      const res = await fetch(`${API_URL}/properties/${propertyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify({ property: updatedProperty })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update property");

      showToast("Имотът беше успешно редактиран!");
      closeEditModal();

      // Trigger re-render
      window.dispatchEvent(new Event("propertiesUpdated"));
      await loadProperties();
    } catch (err) {
      console.error(err);
      showToast("Грешка при редактиране на имота");
    }
  });
});

