// i18n.js
export const translations = {
  bg: {
    wishlist: "Любими",
    login: "Вход",
    register: "Регистрация",
    logout: "Изход",
    addProperty: "Добави имот",
    editProperty: "Редактирай имот",
    saveChanges: "Запази промени",
    filters: "Филтрирай",
    location: "Локация",
    minPrice: "Мин. цена",
    maxPrice: "Макс. цена",
    allTypes: "Всички типове",
    allCategories: "Всички категории",
    allStatus: "Всички статуси",
    manageTickets: "Управление на тикети",
    selectTicket: "Изберете тикет",
    status: "Статус:",
    deleteTicket: "Изтрий тикет",
    sendMessage: "Изпратете съобщение до нас",
    name: "Вашето име",
    email: "Вашият имейл",
    message: "Съобщение",
    submit: "Изпрати"
  },
  en: {
    wishlist: "Wishlist",
    login: "Login",
    register: "Register",
    logout: "Logout",
    addProperty: "Add Property",
    editProperty: "Edit Property",
    saveChanges: "Save Changes",
    filters: "Filter",
    location: "Location",
    minPrice: "Min Price",
    maxPrice: "Max Price",
    allTypes: "All Types",
    allCategories: "All Categories",
    allStatus: "All Statuses",
    manageTickets: "Manage Tickets",
    selectTicket: "Select Ticket",
    status: "Status:",
    deleteTicket: "Delete Ticket",
    sendMessage: "Send us a message",
    name: "Your Name",
    email: "Your Email",
    message: "Message",
    submit: "Send"
  },
  tr: {
    wishlist: "Favoriler",
    login: "Giriş",
    register: "Kayıt",
    logout: "Çıkış",
    addProperty: "Mülk Ekle",
    editProperty: "Mülkü Düzenle",
    saveChanges: "Değişiklikleri Kaydet",
    filters: "Filtrele",
    location: "Konum",
    minPrice: "Min. Fiyat",
    maxPrice: "Maks. Fiyat",
    allTypes: "Tüm Türler",
    allCategories: "Tüm Kategoriler",
    allStatus: "Tüm Durumlar",
    manageTickets: "Biletleri Yönet",
    selectTicket: "Bilet Seç",
    status: "Durum:",
    deleteTicket: "Bileti Sil",
    sendMessage: "Bize mesaj gönderin",
    name: "Adınız",
    email: "E-posta",
    message: "Mesaj",
    submit: "Gönder"
  },
  el: {
    wishlist: "Λίστα Αγαπημένων",
    login: "Σύνδεση",
    register: "Εγγραφή",
    logout: "Έξοδος",
    addProperty: "Προσθήκη Ακινήτου",
    editProperty: "Επεξεργασία Ακινήτου",
    saveChanges: "Αποθήκευση Αλλαγών",
    filters: "Φιλτράρισμα",
    location: "Τοποθεσία",
    minPrice: "Ελάχιστη Τιμή",
    maxPrice: "Μέγιστη Τιμή",
    allTypes: "Όλοι οι Τύποι",
    allCategories: "Όλες οι Κατηγορίες",
    allStatus: "Όλες οι Καταστάσεις",
    manageTickets: "Διαχείριση Εισητηρίων",
    selectTicket: "Επιλέξτε Εισιτήριο",
    status: "Κατάσταση:",
    deleteTicket: "Διαγραφή Εισητηρίου",
    sendMessage: "Στείλτε μας μήνυμα",
    name: "Το Όνομά Σας",
    email: "Το Email Σας",
    message: "Μήνυμα",
    submit: "Αποστολή"
  }
};

// Function to set language
export function setLanguage(lang) {
  const elements = document.querySelectorAll('[data-key]');
  elements.forEach(el => {
    if (!el) return;
    const key = el.getAttribute('data-key');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  // Update dropdown button
  const dropdownBtn = document.querySelector('.lang-dropdown > button');
  if (dropdownBtn) {
    const flagMap = {
      bg: 'bg',
      en: 'gb',
      tr: 'tr',
      el: 'gr'
    };
    const textMap = { bg: 'Български', en: 'English', tr: 'Turkish', el: 'Greek' };
    dropdownBtn.innerHTML = `<img src="https://flagcdn.com/w20/${flagMap[lang]}.png" class="flag"> ${textMap[lang]}`;
  }
}

// Initialize language dropdown
export function initLanguageDropdown() {
  const items = document.querySelectorAll('.lang-dropdown-content div[data-lang]');
  items.forEach(item => {
    item.addEventListener('click', () => {
      const lang = item.getAttribute('data-lang');
      setLanguage(lang);
    });
  });
}
