// ═══════════════════════════════════════════════════════════════
// CONSTANTS — Merkezi yapılandırma sistemi (Hardcoded değer yok!)
// ═══════════════════════════════════════════════════════════════

// ── Uygulama Yapılandırması ────────────────────────────────────
const APP_CONFIG = {
  version: "v 1.2.0",
  title: "SIM COMPANIES",
  fontFamily: "'Roboto Condensed',sans-serif",
  rateLimitMs: 5 * 60 * 1000,
};

// Geriye dönük uyumluluk için
const APP_VERSION = APP_CONFIG.version;
const APP_TITLE = APP_CONFIG.title;
const FONT_FAMILY = APP_CONFIG.fontFamily;
const RATE_LIMIT_MS = APP_CONFIG.rateLimitMs;

// ── Renk Sistemi (Özelleştirilebilir) ──────────────────────────
const COLOR_PALETTE = {
  primary: "#2563eb",
  secondary: "#4f46e5",
  success: "#059669",
  warning: "#d97706",
  danger: "#dc2626",
  info: "#0891b2",
  slate: "#475569",
  gray: "#6b7280",
  darkText: "#0f172a",
  blue: "#2563eb",
  indigo: "#4f46e5",
  purple: "#7c3aed",
  cyan: "#0891b2",
  teal: "#0d9488",
  emerald: "#059669",
  amber: "#d97706",
  orange: "#ea580c",
};

// Geriye dönük uyumluluk için
const C = COLOR_PALETTE;

// ── Grafik Renk Şemaları ───────────────────────────────────────
const CHART_COLORS = {
  default: [
    COLOR_PALETTE.blue,
    COLOR_PALETTE.indigo,
    COLOR_PALETTE.cyan,
    COLOR_PALETTE.teal,
    COLOR_PALETTE.emerald,
    COLOR_PALETTE.amber,
  ],
  vwapColumns: [
    COLOR_PALETTE.blue,
    COLOR_PALETTE.indigo,
    COLOR_PALETTE.cyan,
    COLOR_PALETTE.teal,
    COLOR_PALETTE.emerald,
    COLOR_PALETTE.purple,
    COLOR_PALETTE.amber,
    COLOR_PALETTE.blue,
    COLOR_PALETTE.indigo,
  ],
  vwapPie: [COLOR_PALETTE.blue, COLOR_PALETTE.danger],
};

// Geriye dönük uyumluluk için
const COLORS = CHART_COLORS.default;
const VWAP_COL_COLORS = CHART_COLORS.vwapColumns;
const VWAP_PIE_COLORS = CHART_COLORS.vwapPie;

// ── Tema Yapılandırması (Dark) ─────────────────────────────────
const DARK_THEME = {
  // Ana renkler
  page: "#121212",
  panel: "#1a1a1a",
  panelBorder: "#2a2a2a",
  header: "#1a1a1a",
  headerBorder: "#2a2a2a",
  tabBar: "#121212",
  tabBorder: "#2a2a2a",
  
  // Metin renkleri
  text: "#ffffff",
  textMuted: "#888888",
  textFaint: "#666666",
  textSub: "#cccccc",
  
  // Kart renkleri
  cardBg: "#1a1a1a",
  cardLabel: "#888888",
  cardSub: "#666666",
  
  // Tooltip
  tooltipBg: "#1f1f1f",
  tooltipBorder: "#2a2a2a",
  tooltipTitle: "#cccccc",
  
  // Diğer UI elemanları
  srcCardBg: "#1a1a1a",
  progBg: "#2a2a2a",
  tabDisabled: "#404040",
  tabInactive: "#666666",
  gridLine: "#2a2a2a",
  axisColor: "#666666",
  
  // Tablo
  rowAltBg: "#1f1f1f",
  rowDefaultBg: "transparent",
  tableHeaderBg: "#1f1f1f",
  
  // Input & Butonlar
  inputBg: "#1f1f1f",
  inputBorder: "#2a2a2a",
  btnBg: "#1f1f1f",
  btnBorder: "#2a2a2a",
  btnColor: "#cccccc",
  btnAccentBg: COLOR_PALETTE.primary,
  
  // LoadScreen
  subtitleColor: "#666666",
  instructionColor: "#888888",
  versionBg: "#1a1a1a",
  versionBorder: "#2a2a2a",
  versionColor: "#666666",
  loadBtnGrad: COLOR_PALETTE.primary,
  loadBtnBorder: COLOR_PALETTE.primary,
  headerGrad: "#1a1a1a",
  spinnerBorder: "#2a2a2a",
  errorBg: "#1f1f1f",
  loadScreenBg: "#121212",
  
  // Dekoratif (kullanılmıyor ama geriye dönük uyumluluk için)
  dotGrid: "none",
  ringColor: "transparent",
  ring2Color: "transparent",
  cornerColor: "transparent",
  globeOcean: "#121212",
  globeLand: "#2a2a2a",
  globeStroke: COLOR_PALETTE.primary,
  atmInner: "transparent",
  atmMid: "transparent",
  globeEdge: "transparent",
  starColor: (b) => `rgba(136,136,136,${b * 0.3})`,
  twinkleColor: (a) => `rgba(136,136,136,${a * 0.3})`,
  
  // Özel bölümler
  modelingBg: "#1f1f1f",
  sectionInfoBg: "#1a1a1a",
  sectionInfoBorder: "#2a2a2a",
  goalPositiveBg: "#1a1a1a",
  goalNegativeBg: "#1a1a1a",
};

// ── Tema Yapılandırması (Light) ────────────────────────────────
const LIGHT_THEME = {
  // Ana renkler
  page: "#fafafa",
  panel: "#ffffff",
  panelBorder: "#e8e8e8",
  header: "#ffffff",
  headerBorder: "#e8e8e8",
  tabBar: "#fafafa",
  tabBorder: "#e8e8e8",
  
  // Metin renkleri
  text: "#1a1a1a",
  textMuted: "#666666",
  textFaint: "#888888",
  textSub: "#333333",
  
  // Kart renkleri
  cardBg: "#ffffff",
  cardLabel: "#666666",
  cardSub: "#888888",
  
  // Tooltip
  tooltipBg: "#ffffff",
  tooltipBorder: "#e8e8e8",
  tooltipTitle: "#333333",
  
  // Diğer UI elemanları
  srcCardBg: "#ffffff",
  progBg: "#e8e8e8",
  tabDisabled: "#cccccc",
  tabInactive: "#888888",
  gridLine: "#e8e8e8",
  axisColor: "#888888",
  
  // Tablo
  rowAltBg: "#f5f5f5",
  rowDefaultBg: "#ffffff",
  tableHeaderBg: "#f5f5f5",
  
  // Input & Butonlar
  inputBg: "#f5f5f5",
  inputBorder: "#e8e8e8",
  btnBg: "#f5f5f5",
  btnBorder: "#e8e8e8",
  btnColor: "#333333",
  btnAccentBg: COLOR_PALETTE.primary,
  
  // LoadScreen
  subtitleColor: "#888888",
  instructionColor: "#666666",
  versionBg: "#ffffff",
  versionBorder: "#e8e8e8",
  versionColor: "#888888",
  loadBtnGrad: COLOR_PALETTE.primary,
  loadBtnBorder: COLOR_PALETTE.primary,
  headerGrad: "#ffffff",
  spinnerBorder: "#e8e8e8",
  errorBg: "#fff5f5",
  loadScreenBg: "#fafafa",
  
  // Dekoratif (kullanılmıyor ama geriye dönük uyumluluk için)
  dotGrid: "none",
  ringColor: "transparent",
  ring2Color: "transparent",
  cornerColor: "transparent",
  globeOcean: "#fafafa",
  globeLand: "#e8e8e8",
  globeStroke: COLOR_PALETTE.primary,
  atmInner: "transparent",
  atmMid: "transparent",
  globeEdge: "transparent",
  starColor: (b) => `rgba(102,102,102,${b * 0.3})`,
  twinkleColor: (a) => `rgba(102,102,102,${a * 0.3})`,
  
  // Özel bölümler
  modelingBg: "#f5f5f5",
  sectionInfoBg: "#ffffff",
  sectionInfoBorder: "#e8e8e8",
  goalPositiveBg: "#ffffff",
  goalNegativeBg: "#ffffff",
};

// Geriye dönük uyumluluk için
const DARK = DARK_THEME;
const LIGHT = LIGHT_THEME;

// ── Dış Kaynaklar ──────────────────────────────────────────────
const EXTERNAL_RESOURCES = {
  imageBase: "https://www.simcompanies.com/static/images/resources/",
  earthTexture: "https://cdn.jsdelivr.net/npm/three-globe@2.34.2/example/img/earth-blue-marble.jpg",
};

// Geriye dönük uyumluluk için
const IMG_BASE = EXTERNAL_RESOURCES.imageBase;
const EARTH_TEXTURE_URL = EXTERNAL_RESOURCES.earthTexture;

// ── Globe Yapılandırması (kullanılmıyor ama geriye dönük uyumluluk) ─
const GLOBE_CONFIG = {
  width: 280,
  height: 280,
  radius: 130,
  displayWidth: 460,
  displayHeight: 460,
  opacity: 0.6,
  rotationSpeed: 0.003,
  starCount: 250,
  twinkleChance: 0.15,
};

// Geriye dönük uyumluluk için
const GLOBE = {
  W: GLOBE_CONFIG.width,
  H: GLOBE_CONFIG.height,
  R: GLOBE_CONFIG.radius,
  displayW: GLOBE_CONFIG.displayWidth,
  displayH: GLOBE_CONFIG.displayHeight,
  opacity: GLOBE_CONFIG.opacity,
  rotSpeed: GLOBE_CONFIG.rotationSpeed,
  starCount: GLOBE_CONFIG.starCount,
  twinkleChance: GLOBE_CONFIG.twinkleChance,
};

// ═══════════════════════════════════════════════════════════════
// ÖZELLEŞTIRME NOTLARI:
// ═══════════════════════════════════════════════════════════════
// 
// Bu dosyayı özelleştirmek için:
// 
// 1. APP_CONFIG: Uygulama başlığı, versiyon, font
// 2. COLOR_PALETTE: Tüm renkleri buradan değiştir
// 3. CHART_COLORS: Grafik renk şemalarını özelleştir
// 4. DARK_THEME / LIGHT_THEME: Tema renklerini ayarla
// 5. EXTERNAL_RESOURCES: API ve CDN URL'lerini güncelle
// 
// Tüm değişiklikler otomatik olarak tüm uygulamaya yansır!
// ═══════════════════════════════════════════════════════════════
