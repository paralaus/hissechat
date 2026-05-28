const DEFAULT_LANGUAGE = "tr";
const SUPPORTED_LANGUAGES = ["tr", "en"];
const LOCALE_URLS = {
  tr: "./tr.json",
  en: "./en.json",
};
const LANG_QUERY_PARAM = "lang";
const LANG_STORAGE_KEY = "hissechat_lang";
const API_BASE = window.HISSECHAT_API_BASE || "http://localhost:3000/v1";

let localeData = null;
let currentLanguage = DEFAULT_LANGUAGE;

const el = {
  eyebrow: document.getElementById("adminEyebrow"),
  title: document.getElementById("adminTitle"),
  adminStatus: document.getElementById("adminStatus"),
  summaryTitle: document.getElementById("summaryTitle"),
  topResultsTitle: document.getElementById("topResultsTitle"),
  traitsTitle: document.getElementById("traitsTitle"),
  recentTitle: document.getElementById("recentTitle"),
  summaryList: document.getElementById("summaryList"),
  topResultsList: document.getElementById("topResultsList"),
  traitsList: document.getElementById("traitsList"),
  recentList: document.getElementById("recentList"),
  languageToggleBtn: document.getElementById("languageToggleBtn"),
};

function getByPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function t(path, fallback) {
  const value = getByPath(localeData, path);
  return typeof value === "string" ? value : fallback;
}

function formatText(template, vars = {}) {
  return Object.entries(vars).reduce(
    (output, [key, value]) => output.replaceAll(`{${key}}`, String(value)),
    template
  );
}

function tf(path, fallback, vars = {}) {
  return formatText(t(path, fallback), vars);
}

function resolveInitialLanguage() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get(LANG_QUERY_PARAM);
  if (SUPPORTED_LANGUAGES.includes(fromQuery)) {
    return fromQuery;
  }

  const fromStorage = window.localStorage.getItem(LANG_STORAGE_KEY);
  if (SUPPORTED_LANGUAGES.includes(fromStorage)) {
    return fromStorage;
  }

  return DEFAULT_LANGUAGE;
}

function setLanguage(nextLanguage) {
  if (!SUPPORTED_LANGUAGES.includes(nextLanguage)) {
    return;
  }

  window.localStorage.setItem(LANG_STORAGE_KEY, nextLanguage);
  const url = new URL(window.location.href);
  url.searchParams.set(LANG_QUERY_PARAM, nextLanguage);
  window.location.href = url.toString();
}

async function loadLocale(language) {
  const localeUrl = LOCALE_URLS[language] || LOCALE_URLS[DEFAULT_LANGUAGE];
  try {
    const response = await fetch(localeUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Locale load failed with status ${response.status}`);
    }
    localeData = await response.json();
  } catch (error) {
    localeData = null;
  }
}

function clearAndAppend(listEl, values) {
  listEl.innerHTML = "";
  values.forEach((value) => {
    const li = document.createElement("li");
    li.textContent = value;
    listEl.appendChild(li);
  });
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString(currentLanguage === "tr" ? "tr-TR" : "en-US");
}

function applyStaticTexts() {
  document.documentElement.lang = currentLanguage;
  document.title = t("admin.documentTitle", document.title);
  el.eyebrow.textContent = t("admin.eyebrow", el.eyebrow.textContent);
  el.title.textContent = t("admin.title", el.title.textContent);
  el.summaryTitle.textContent = t("admin.summaryTitle", el.summaryTitle.textContent);
  el.topResultsTitle.textContent = t("admin.topResultsTitle", el.topResultsTitle.textContent);
  el.traitsTitle.textContent = t("admin.traitsTitle", el.traitsTitle.textContent);
  el.recentTitle.textContent = t("admin.recentTitle", el.recentTitle.textContent);
  el.adminStatus.textContent = t("admin.messages.loading", el.adminStatus.textContent);
  el.languageToggleBtn.textContent = t(
    "admin.buttons.languageToggle",
    currentLanguage === "tr" ? "EN" : "TR"
  );
}

async function loadAdmin() {
  try {
    const [statsRes, recentRes] = await Promise.all([
      fetch(`${API_BASE}/investor-quiz/stats?days=30&limit=7`),
      fetch(`${API_BASE}/investor-quiz/submissions/recent?limit=15`),
    ]);

    if (!statsRes.ok || !recentRes.ok) {
      throw new Error("Request failed");
    }

    const stats = await statsRes.json();
    const recent = await recentRes.json();

    el.adminStatus.textContent = t("admin.messages.updated", "Veriler güncel.");

    clearAndAppend(el.summaryList, [
      tf("admin.summary.total", "Toplam Kayıt (30 gün): {count}", { count: stats.totalSubmissions || 0 }),
      tf("admin.summary.topResult", "En Yüksek Sonuç: {title}", { title: stats.topResults?.[0]?.title || "-" }),
      tf("admin.summary.reportTime", "Rapor Üretim Zamanı: {time}", {
        time: new Date().toLocaleString(currentLanguage === "tr" ? "tr-TR" : "en-US"),
      }),
    ]);

    clearAndAppend(
      el.topResultsList,
      (stats.topResults || []).map((item) =>
        tf("admin.items.topResult", "{title}: {count} kişi (%{percentage})", {
          title: item.title,
          count: item.count,
          percentage: item.percentage,
        })
      )
    );

    const traits = stats.traitAverages || {};
    clearAndAppend(el.traitsList, [
      tf("admin.traits.risk", "Risk Ortalaması: %{value}", { value: traits.risk || 0 }),
      tf("admin.traits.patience", "Sabır Ortalaması: %{value}", { value: traits.patience || 0 }),
      tf("admin.traits.fomo", "FOMO Ortalaması: %{value}", { value: traits.fomo || 0 }),
      tf("admin.traits.resilience", "Kriz Dayanıklılığı Ortalaması: %{value}", { value: traits.resilience || 0 }),
      tf("admin.traits.manipulation", "Manipülasyona Açıklık Ortalaması: %{value}", {
        value: traits.manipulation || 0,
      }),
      tf("admin.traits.ego", "Ego Ortalaması: %{value}", { value: traits.ego || 0 }),
    ]);

    clearAndAppend(
      el.recentList,
      (recent.results || []).map((item) =>
        tf("admin.items.recent", "{resultTitle} | Risk: {risk} | Tarih: {date}", {
          resultTitle: item.resultTitle,
          risk: item.riskLabel || "-",
          date: formatDate(item.createdAt),
        })
      )
    );
  } catch (error) {
    el.adminStatus.textContent = t(
      "admin.messages.loadFailed",
      "Admin verileri yüklenemedi. Backend bağlantısını kontrol et."
    );
  }
}

async function initAdminApp() {
  currentLanguage = resolveInitialLanguage();
  await loadLocale(currentLanguage);
  applyStaticTexts();
  el.languageToggleBtn.addEventListener("click", () => {
    const nextLanguage = currentLanguage === "tr" ? "en" : "tr";
    setLanguage(nextLanguage);
  });
  await loadAdmin();
}

initAdminApp();
