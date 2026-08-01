const API_BASE = window.HISSECHAT_API_BASE || "https://hissechat-4u7pv.ondigitalocean.app/v1";

const statusText = document.getElementById("statusText");
const submissionsList = document.getElementById("submissionsList");
const totalResultsText = document.getElementById("totalResultsText");
const pageIndicator = document.getElementById("pageIndicator");
const limitSelect = document.getElementById("limitSelect");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let state = {
  page: 1,
  limit: 20,
  totalPages: 1,
};

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("tr-TR");
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value == null ? "" : String(value);
  return div.innerHTML;
}

function fieldRow(label, value) {
  const isEmpty = value === undefined || value === null || value === "";
  return `
    <div class="field-row">
      <div class="field-label">${escapeHtml(label)}</div>
      <div class="field-value ${isEmpty ? "empty" : ""}">${isEmpty ? "-" : escapeHtml(value)}</div>
    </div>
  `;
}

function renderSubmission(item) {
  const preferences = Array.isArray(item.contactPreferences)
    ? item.contactPreferences.map((p) => `<span class="badge">${escapeHtml(p)}</span>`).join(" ")
    : "";

  return `
    <div class="submission-card">
      <div class="submission-header">
        <span class="submission-name">${escapeHtml(item.fullName)}</span>
        <span class="submission-date">${formatDate(item.createdAt)}</span>
      </div>
      <div class="submission-grid">
        ${fieldRow("Telefon", item.phone)}
        ${fieldRow("E-posta", item.email)}
        <div class="field-row">
          <div class="field-label">İletişim Tercihi</div>
          <div class="field-value">${preferences || "-"}</div>
        </div>
      </div>
    </div>
  `;
}

async function loadSubmissions() {
  statusText.textContent = "Yükleniyor...";
  try {
    const response = await fetch(
      `${API_BASE}/book-preorder/public?page=${state.page}&limit=${state.limit}&sortBy=createdAt:desc`
    );
    if (!response.ok) {
      throw new Error("Veriler alınamadı");
    }
    const data = await response.json();

    state.totalPages = data.totalPages || 1;

    if (!data.results || data.results.length === 0) {
      submissionsList.innerHTML = `<p class="small-muted">Henüz kayıt yok.</p>`;
    } else {
      submissionsList.innerHTML = data.results.map(renderSubmission).join("");
    }

    totalResultsText.textContent = `Toplam ${data.totalResults || 0} sonuç`;
    pageIndicator.textContent = `Sayfa ${data.page || state.page} / ${state.totalPages}`;
    prevBtn.disabled = state.page <= 1;
    nextBtn.disabled = state.page >= state.totalPages;

    statusText.textContent = `Son güncelleme: ${new Date().toLocaleString("tr-TR")}`;
  } catch (error) {
    statusText.textContent = "Veriler yüklenemedi. Backend bağlantısını kontrol edin.";
    submissionsList.innerHTML = "";
  }
}

prevBtn.addEventListener("click", () => {
  if (state.page > 1) {
    state.page -= 1;
    loadSubmissions();
  }
});

nextBtn.addEventListener("click", () => {
  if (state.page < state.totalPages) {
    state.page += 1;
    loadSubmissions();
  }
});

limitSelect.addEventListener("change", () => {
  state.limit = Number(limitSelect.value);
  state.page = 1;
  loadSubmissions();
});

loadSubmissions();
