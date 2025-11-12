// propertyForms.js
document.addEventListener("DOMContentLoaded", () => {
  const addModal = document.getElementById("addPropertyModal");
  const form = document.getElementById("propertyForm");
  const categorySelect = document.getElementById("propertyCategory");
  const statusSelect = document.getElementById("propertyStatus");

  // Show status only for rentals
  categorySelect.addEventListener("change", () => {
    if (categorySelect.value === "rental") {
      statusSelect.style.display = "block";
    } else {
      statusSelect.style.display = "none";
    }
  });

  // Add property
  form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Convert image file to Base64
  const fileInput = document.getElementById("propertyImage");
  let imageBase64 = "";
  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    imageBase64 = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(fileInput.files[0]);
    });
  }

  const newProperty = {
    id: Date.now().toString(),
    name: document.getElementById("propertyName").value,
    location: document.getElementById("propertyLocation").value,
    price: document.getElementById("propertyPrice").value,
    category: categorySelect.value,
    type: document.getElementById("propertyType").value,
    status: categorySelect.value === "rental" ? statusSelect.value : "",
    image: imageBase64
  };

  // Save locally
  const properties = JSON.parse(localStorage.getItem("properties") || "[]");
  properties.push(newProperty);
  localStorage.setItem("properties", JSON.stringify(properties));

  // Save to backend
  try {
    const token = localStorage.getItem('token');
    await fetch('https://my-backend.martinmiskata.workers.dev/properties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(newProperty)
    });
  } catch (err) {
    console.error("Error saving property to backend:", err);
    alert("Грешка при запазване на имота на сървъра");
  }

  form.reset();
  statusSelect.style.display = "none";
  addModal.setAttribute("aria-hidden", "true");
  alert("Имотът беше добавен успешно!");
  window.dispatchEvent(new Event("propertiesUpdated"));
});


  // Edit modal logic
  const editForm = document.getElementById("editForm");
  const editCategory = document.getElementById("editCategory");
  const editStatusLabel = document.getElementById("editStatusLabel");

  editCategory.addEventListener("change", () => {
    editStatusLabel.style.display = editCategory.value === "rental" ? "block" : "none";
  });

  editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = editForm.dataset.propertyId;
    let properties = JSON.parse(localStorage.getItem("properties") || "[]");

    properties = properties.map(p =>
      p.id === id ? {
        ...p,
        name: document.getElementById("editName").value,
        location: document.getElementById("editLocation").value,
        price: document.getElementById("editPrice").value,
        category: editCategory.value,
        type: document.getElementById("editType").value,
        status: editCategory.value === "rental"
          ? document.getElementById("editStatus").value
          : "",
        image: document.getElementById("editImage").value
      } : p
    );

    localStorage.setItem("properties", JSON.stringify(properties));
    alert("Имотът е обновен успешно!");
    document.getElementById("editModal").setAttribute("aria-hidden", "true");
    window.dispatchEvent(new Event("propertiesUpdated"));
  });
  const editModal = document.getElementById('editModal');
  const closeEditModal = document.getElementById('closeEditModal');
  
  closeEditModal.addEventListener('click', () => {
    editModal.setAttribute('aria-hidden', 'true');
});

});
