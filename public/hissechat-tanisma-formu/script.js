const API_BASE = window.HISSECHAT_API_BASE || "https://hissechat-4u7pv.ondigitalocean.app/v1";

const form = document.getElementById("introForm");
const successCard = document.getElementById("successCard");
const submitBtn = document.getElementById("submitBtn");
const formError = document.getElementById("formError");

const expectationsOtherCheckbox = document.getElementById("expectationsOtherCheckbox");
const expectationsOtherWrap = document.getElementById("expectationsOtherWrap");
const referredByEvet = document.getElementById("referredByEvet");
const referredByRadios = form.querySelectorAll('input[name="referredBy"]');
const referrerNameWrap = document.getElementById("referrerNameWrap");

function toggleExpectationsOther() {
  expectationsOtherWrap.classList.toggle("hidden", !expectationsOtherCheckbox.checked);
}

function toggleReferrerName() {
  referrerNameWrap.classList.toggle("hidden", !referredByEvet.checked);
}

expectationsOtherCheckbox.addEventListener("change", toggleExpectationsOther);
referredByRadios.forEach((radio) => radio.addEventListener("change", toggleReferrerName));

function clearErrors() {
  form.querySelectorAll(".error-text").forEach((el) => (el.textContent = ""));
}

function setError(fieldName, message) {
  const el = form.querySelector(`[data-error-for="${fieldName}"]`);
  if (el) {
    el.textContent = message;
  }
}

function getRadioValue(name) {
  const checked = form.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : "";
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
  if (!values.phone.trim()) {
    setError("phone", "Telefon numarası zorunludur.");
    isValid = false;
  }
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    setError("email", "Geçerli bir e-posta adresi giriniz.");
    isValid = false;
  }
  if (!values.portfolioSize) {
    setError("portfolioSize", "Lütfen bir seçenek işaretleyin.");
    isValid = false;
  }
  if (!values.hasBistInvestment) {
    setError("hasBistInvestment", "Lütfen bir seçenek işaretleyin.");
    isValid = false;
  }
  if (!values.tradingApproach) {
    setError("tradingApproach", "Lütfen bir seçenek işaretleyin.");
    isValid = false;
  }
  if (!values.tradingExperience) {
    setError("tradingExperience", "Lütfen bir seçenek işaretleyin.");
    isValid = false;
  }
  if (!values.expectations.length) {
    setError("expectations", "Lütfen en az bir seçenek işaretleyin.");
    isValid = false;
  }
  if (!values.referredBy) {
    setError("referredBy", "Lütfen bir seçenek işaretleyin.");
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
    phone: form.phone.value,
    email: form.email.value.trim(),
    portfolioSize: getRadioValue("portfolioSize"),
    hasBistInvestment: getRadioValue("hasBistInvestment"),
    trackedStocks: form.trackedStocks.value.trim(),
    tradingApproach: getRadioValue("tradingApproach"),
    tradingExperience: getRadioValue("tradingExperience"),
    expectations: getCheckboxValues("expectations"),
    expectationsOther: document.getElementById("expectationsOther").value.trim(),
    referredBy: getRadioValue("referredBy"),
    referrerName: document.getElementById("referrerName").value.trim(),
  };

  if (!validate(values)) {
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Gönderiliyor...";

  try {
    const response = await fetch(`${API_BASE}/intro-form`, {
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
    submitBtn.textContent = "Formu Gönder";
  }
});
