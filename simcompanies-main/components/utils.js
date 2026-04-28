// TR → EN ürün adı çeviri haritası
const URUN_EN = {
  "Eldiven": "Gloves", "El Çantası": "Handbag", "Topuklu Ayakkabı": "High Heels",
  "Spor Ayakkabı": "Sneakers", "Kemer": "Belt", "Şapka": "Hat", "Ceket": "Jacket",
  "Pantolon": "Pants", "Gömlek": "Shirt", "Elbise": "Dress", "Çanta": "Bag",
  "Saat": "Watch", "Çorap": "Socks", "Bot": "Boots", "Sandalet": "Sandals",
  "Telefon": "Phone", "Bilgisayar": "Computer", "Tablet": "Tablet", "TV": "TV",
  "Kamera": "Camera", "Kulaklık": "Headphones", "Klavye": "Keyboard",
  "Su": "Water", "Enerji": "Energy", "Tahıl": "Grain", "Sebze": "Vegetables",
  "Meyve": "Fruit", "Bal": "Honey", "Çiçek": "Flowers", "Orman Ürünleri": "Forest Products",
  "Kömür": "Coal", "Petrol": "Oil", "Demir Cevheri": "Iron Ore", "Boksit": "Bauxite",
  "Kireçtaşı": "Limestone", "Kum": "Sand", "Mineral": "Minerals",
  "Cam": "Glass", "Demir": "Iron", "Aluminyum": "Aluminum", "Çelik": "Steel",
  "Çimento": "Cement", "Un": "Flour", "Şeker": "Sugar", "Et": "Meat",
  "Süt": "Milk", "Tereyağı": "Butter", "Odun": "Wood", "Kağıt": "Paper",
  "Kumaş": "Fabric", "Deri": "Leather", "Plastik": "Plastic",
  "Elektronik Bileşenler": "Electronic Components", "Motor": "Engine",
  "Lastik": "Tire", "Boya": "Paint", "Kimyasal": "Chemicals", "İlaç": "Medicine",
  "Gübre": "Fertilizer", "Tarım Makinesi": "Agricultural Machine",
  "Gıda": "Food", "İçecek": "Beverage", "Dizel": "Diesel",
  "Plastik Bileşen": "Plastic Component", "Çelik Kiriş": "Steel Beam",
  "Buldozer": "Bulldozer", "Pencere": "Window", "Alet Takımı": "Tool Set",
  "Kil": "Clay", "Kil Blok": "Clay Block", "Odun Blok": "Wood Block",
  "İnşaat Ekipmanı": "Construction Equipment", "Meyve Suyu": "Fruit Juice",
  "Pasta": "Cake", "Bina Malz.": "Building Mat.",
};
const URUN_TR = Object.fromEntries(Object.entries(URUN_EN).map(([k, v]) => [v, k]));

const DYNAMIC_DICT = { EN: {}, TR: {} };

// Function to translate product names
function urunCevir(ad, lang) {
  if (!ad) return ad;
  if (lang === "EN") {
    if (URUN_EN[ad]) return URUN_EN[ad];
    if (DYNAMIC_DICT.EN[ad]) return DYNAMIC_DICT.EN[ad];
    const found = Object.values(URUN_KIND).find(u =>
      u.tr === ad || u.tr?.toLowerCase() === ad.toLowerCase() ||
      u.tr2 === ad || u.tr2?.toLowerCase() === ad.toLowerCase()
    );
    if (found?.name) return found.name;
    return ad;
  }
  if (lang === "TR") {
    if (URUN_TR[ad]) return URUN_TR[ad];
    if (DYNAMIC_DICT.TR[ad]) return DYNAMIC_DICT.TR[ad];
    const found = Object.values(URUN_KIND).find(u =>
      u.name === ad || u.name?.toLowerCase() === ad.toLowerCase()
    );
    if (found?.tr) return found.tr;
    return ad;
  }
  return ad;
}

// Function to translate category names
function katName(cat, L, lang) {
  if (!cat) return "";
  const lowerCat = cat.toLowerCase();
  const m = {
    "sales": L.katSales, "government orders deposit": L.katGovDep, "government orders": L.katGov,
    "fees": L.katFees, "taxes": L.katTax, "contract": L.katContract, "market": L.katMarket,
    "retail": L.katRetail, "transport": L.katTransport, "salary": L.katSalary, "dividend": L.katDiv,
    "loan": L.katLoan, "interest": L.katInt, "accounting": L.katAcc,
    "building": L.katBuild, "construction": L.katBuild,
    "research": L.katRes, "investment": L.katInv,
    "trading": L.katSales,
    "satışlar": L.katSales, "satislar": L.katSales, "perakende": L.katRetail,
    "pazar": L.katMarket, "kontrat": L.katContract, "ticaret": L.katSales,
    "nakliye": L.katTransport, "maaş": L.katSalary, "maas": L.katSalary,
    "vergi": L.katTax, "vergiler": L.katTax, "faiz": L.katInt,
    "temettü": L.katDiv, "temettu": L.katDiv, "kredi": L.katLoan,
    "muhasebe": L.katAcc, "bina": L.katBuild, "araştırma": L.katRes, "arastirma": L.katRes,
    "yatırım": L.katInv, "yatirim": L.katInv, "ücret": L.katFees, "ucret": L.katFees,
    "devlet siparişleri": L.katGov, "devlet siparisleri": L.katGov,
    "devlet sipariş depozitosu": L.katGovDep, "devlet siparis depozitosu": L.katGovDep
  };
  if (m[lowerCat]) return m[lowerCat];
  if (DYNAMIC_DICT[lang] && DYNAMIC_DICT[lang][cat]) return DYNAMIC_DICT[lang][cat];
  return cat;
}

function numFmt(n, compact = false) {
  if (n == null || isNaN(n)) return "—"; n = +n;
  if (compact && Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (compact && Math.abs(n) >= 1e3) return Math.round(n / 1e3) + "K";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(n);
}
function fmtDate(s) { return s ? (s + "").slice(5, 10).replace("-", "/") : ""; }
function pf(x) { return parseFloat(x) || 0; }

function makeStyles(t) {
  return {
    page: { minHeight: "100vh", background: t.page, fontFamily: FONT_FAMILY, color: t.text },
    panel: { background: t.panel, border: `1px solid ${t.panelBorder}`, borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: t.page === DARK.page ? "0 2px 8px rgba(0, 0, 0, 0.2)" : "0 2px 8px rgba(0, 0, 0, 0.04)" },
    sectionTitle: { fontSize: 11, color: t.textMuted, letterSpacing: 1.5, marginBottom: 20, textTransform: "uppercase", fontWeight: 700 },
    th: { padding: "12px 16px", textAlign: "right", color: t.textMuted, fontSize: 10, letterSpacing: 0.5, fontWeight: 700, whiteSpace: "nowrap", borderBottom: `1px solid ${t.panelBorder}`, background: t.tableHeaderBg },
    empty: { textAlign: "center", padding: "80px 20px", color: t.textFaint, fontSize: 13 },
  };
}
function td(color, t) { return { padding: "12px 16px", color: color || t.text, textAlign: "right", fontSize: 12, borderBottom: `1px solid ${t.panelBorder}`, fontWeight: 500 }; }

function urunAdi(kind, lang) {
  const u = URUN_KIND[kind];
  if (!u) return "?";
  return (lang === "TR" && u.tr) ? u.tr : u.name;
}

function UrunImg({ file, size = 24, style = {} }) {
  const [err, setErr] = React.useState(false);
  if (err || !file) return h("div", { style: { width: size, height: size, background: DARK.inputBorder, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.5, flexShrink: 0, ...style } }, "📦");
  return h("img", {
    src: IMG_BASE + file + ".png",
    style: { width: size, height: size, objectFit: "contain", flexShrink: 0, borderRadius: 2, ...style },
    onError: () => setErr(true)
  });
}
