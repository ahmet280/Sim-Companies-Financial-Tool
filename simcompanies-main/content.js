// Sim Companies Dashboard - Content Script v3
const API_BASE = "https://www.simcompanies.com/api";

async function fetchJSON(url) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function fetchCSV(url) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => {
    let val = h.trim().replace(/"/g, "");
    let low = val.toLowerCase();
    if (low === "para" || low === "miktar") return "Money";
    if (low === "kategori") return "Category";
    if (low === "açıklama" || low === "aciklama") return "Description";
    if (low === "zaman damgası" || low === "zaman damgasi") return "Timestamp";
    if (low === "detaylar" || low === "detay") return "Details";
    return val;
  });
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const obj = {};
    let cur = "", q = false, col = 0;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { q = !q; cur += c; }
      else if (c === ',' && !q) {
        obj[headers[col]] = cur.replace(/^"|"$/g, "").trim();
        cur = ""; col++;
      } else { cur += c; }
    }
    obj[headers[col]] = cur.replace(/^"|"$/g, "").trim();
    return obj;
  });
}

async function fetchCompanyData(company) {
  const companyId = company?.id;
  const companyName = company?.company || "My Company";
  const realmId = company?.realmId ?? 0;

  const realmStr = realmId === 0 ? "r1" : "r2";

  const [
    pastFinancesRes,
    balanceSheetRes,
    incomeStatementRes,
    cashflowRes,
    ledgerTrRes,
    ledgerEnRes,
    storageRes,
    warehouseTrRes,
    warehouseEnRes,
    retailInfoRes,
    marketTickerRes,
  ] = await Promise.allSettled([
    fetchJSON(`${API_BASE}/v3/companies/me/past-finances/?realm=${realmId}`),
    fetchJSON(`${API_BASE}/v2/companies/me/balance-sheet/`),
    fetchJSON(`${API_BASE}/v2/companies/me/income-statement/`),
    fetchJSON(`${API_BASE}/v2/companies/me/cashflow-statement/`),
    fetchCSV(`https://www.simcompanies.com/tr/csv/account-history/${companyId}/`),
    fetchCSV(`https://www.simcompanies.com/en/csv/account-history/${companyId}/`),
    fetchJSON(`${API_BASE}/v3/resources/${companyId}/`),
    fetchCSV(`https://www.simcompanies.com/tr/csv/warehouse/`),
    fetchCSV(`https://www.simcompanies.com/en/csv/warehouse/`),
    fetchJSON(`${API_BASE}/v4/${realmId}/resources-retail-info/`),
    fetchJSON(`${API_BASE}/v3/market-ticker/${realmId}/`)
  ]);

  const result = { companyId, companyName, realmId };

  if (pastFinancesRes.status === "fulfilled" && pastFinancesRes.value?.length)
    result.bilanco = pastFinancesRes.value;
  if (balanceSheetRes.status === "fulfilled")
    result.balanceSheet = balanceSheetRes.value;
  if (incomeStatementRes.status === "fulfilled")
    result.incomeStatement = incomeStatementRes.value;
  if (cashflowRes.status === "fulfilled")
    result.cashflow = cashflowRes.value;
  // /tr/ önce dene, yoksa /en/ fallback
  const ledgerTrText = ledgerTrRes.status === "fulfilled" ? ledgerTrRes.value : null;
  const ledgerEnText = ledgerEnRes.status === "fulfilled" ? ledgerEnRes.value : null;
  const ledgerText = (ledgerTrText && !ledgerTrText.trim().startsWith("<")) ? ledgerTrText
    : (ledgerEnText && !ledgerEnText.trim().startsWith("<")) ? ledgerEnText
      : null;
  if (ledgerText) result.ledger = parseCSV(ledgerText);
  if (storageRes.status === "fulfilled") result.storage = storageRes.value;

  // Warehouse CSV (depo değerleme) - hem TR hem EN çek
  const whTrText = warehouseTrRes.status === "fulfilled" ? warehouseTrRes.value : null;
  const whEnText = warehouseEnRes.status === "fulfilled" ? warehouseEnRes.value : null;
  if (whTrText && !whTrText.trim().startsWith("<")) result.warehouseTR = parseCSV(whTrText);
  if (whEnText && !whEnText.trim().startsWith("<")) result.warehouseEN = parseCSV(whEnText);
  result.warehouseCSV = result.warehouseTR || result.warehouseEN;

  // Retail info (perakende fiyatları - fallback)
  if (retailInfoRes.status === "fulfilled" && Array.isArray(retailInfoRes.value))
    result.retailInfo = retailInfoRes.value;

  // Market ticker (borsa fiyatları - gerçek VWAP'a yakın)
  if (marketTickerRes.status === "fulfilled" && Array.isArray(marketTickerRes.value))
    result.marketTicker = marketTickerRes.value;

  return result;
}

async function fetchAllData() {
  try {
    const companies = await fetchJSON(`${API_BASE}/v2/players/me/companies/`);
    const allCompanies = Array.isArray(companies) ? companies : [companies];
    if (!allCompanies.length) throw new Error("No company found.");

    // DOM'dan aktif realm'ı oku
    const companyLink = document.querySelector('a[href*="/company/"]');
    const match = companyLink?.href.match(/\/company\/(\d+)\//);
    const activeRealmId = match ? parseInt(match[1]) : 0;

    // Sadece aktif şirketi çek
    const activeCompanyDef = allCompanies.find(c => c.realmId === activeRealmId) || allCompanies[0];
    const activeCompany = await fetchCompanyData(activeCompanyDef);

    return {
      success: true,
      companies: [activeCompany],
      bilanco: activeCompany.bilanco,
      balanceSheet: activeCompany.balanceSheet,
      incomeStatement: activeCompany.incomeStatement,
      cashflow: activeCompany.cashflow,
      ledger: activeCompany.ledger,
      storage: activeCompany.storage,
      warehouseCSV: activeCompany.warehouseCSV,
      warehouseTR: activeCompany.warehouseTR,
      warehouseEN: activeCompany.warehouseEN,
      retailInfo: activeCompany.retailInfo,
      marketTicker: activeCompany.marketTicker,
      companyName: activeCompany.companyName,
      companyRealm: activeCompany.realmId,
    };

  } catch (e) {
    return { success: false, error: e.message };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "FETCH_DATA") {
    fetchAllData().then(sendResponse);
    return true;
  }
  if (msg.action === "PING") {
    sendResponse({ ok: true });
    return true;
  }
});