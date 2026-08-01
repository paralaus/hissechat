const API_BASE = window.HISSECHAT_API_BASE || "https://hissechat-4u7pv.ondigitalocean.app/v1";

const form = document.getElementById("preorderForm");
const successCard = document.getElementById("successCard");
const submitBtn = document.getElementById("submitBtn");
const formError = document.getElementById("formError");

function clearErrors() {
  form.querySelectorAll(".error-text").forEach((el) => (el.textContent = ""));
}

function setError(fieldName, message) {
  const el = form.querySelector(`[data-error-for="${fieldName}"]`);
  if (el) {
    el.textContent = message;
  }
}

function getCheckboxValues(name) {
  return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((el) => el.value);
}

function validate(values) {
  let isValid = true;

  if (!values.fullName.trim()) {
    setError("fullName", "Ad Soyad zorunludur.");
    isValid = false;
  }
  if (!values.contactPreferences.length) {
    setError("contactPreferences", "Lütfen en az bir iletişim tercihi seçin.");
    isValid = false;
  }
  if (!values.phone.trim()) {
    setError("phone", "Cep telefonu zorunludur.");
    isValid = false;
  }
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    setError("email", "Geçerli bir e-posta adresi giriniz.");
    isValid = false;
  }

  return isValid;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearErrors();
  formError.textContent = "";

  const values = {
    fullName: form.fullName.value,
    contactPreferences: getCheckboxValues("contactPreferences"),
    phone: form.phone.value,
    email: form.email.value.trim(),
  };

  if (!validate(values)) {
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Gönderiliyor...";

  try {
    const response = await fetch(`${API_BASE}/book-preorder`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.message || "Form gönderilemedi.");
    }

    form.classList.add("hidden");
    successCard.classList.remove("hidden");
    window.scrollTo({top: 0, behavior: "smooth"});
  } catch (error) {
    formError.textContent = error.message || "Bir hata oluştu, lütfen tekrar deneyin.";
    submitBtn.disabled = false;
    submitBtn.textContent = "Ön Talep Oluştur";
  }
});
