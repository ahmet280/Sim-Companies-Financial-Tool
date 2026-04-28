const { useState, useCallback, useMemo, useEffect, useRef, createElement: h } = React;
const { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } = Recharts;

function StatCard({ label, value, sub, color = C.primary, trend, t }) {
  const isDark = t.page === DARK.page;
  const borderColor = isDark ? "#2a2a2a" : "#e8e8e8";
  const bgColor = isDark ? "#1a1a1a" : "#ffffff";
  
  return h("div", {
    className: "stat-card",
    style: {
      background: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: 8,
      padding: "20px",
      position: "relative",
      overflow: "hidden",
      boxShadow: isDark 
        ? "0 2px 8px rgba(0, 0, 0, 0.2)" 
        : "0 2px 8px rgba(0, 0, 0, 0.04)",
    }
  },
    // Minimal accent line
    h("div", {
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: color,
      }
    }),
    
    h("div", { 
      style: { 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "flex-start",
      } 
    },
      h("div", { style: { flex: 1 } },
        h("div", { 
          style: { 
            fontSize: 10, 
            color: isDark ? "#888" : "#666", 
            textTransform: "uppercase", 
            letterSpacing: 1.5, 
            marginBottom: 12, 
            fontWeight: 600,
          } 
        }, label),
        h("div", { 
          style: { 
            fontSize: 28, 
            fontWeight: 700, 
            color: isDark ? "#fff" : "#1a1a1a", 
            letterSpacing: -0.5, 
            lineHeight: 1,
            marginBottom: 8,
          } 
        }, value),
        sub && h("div", { 
          style: { 
            fontSize: 11, 
            color: isDark ? "#666" : "#888", 
            fontWeight: 500,
          } 
        }, sub)
      ),
      trend != null && h("div", {
        style: {
          fontSize: 11,
          fontWeight: 700,
          color: trend >= 0 ? C.success : C.danger,
          background: isDark 
            ? (trend >= 0 ? "rgba(5, 150, 105, 0.1)" : "rgba(220, 38, 38, 0.1)")
            : (trend >= 0 ? "rgba(5, 150, 105, 0.08)" : "rgba(220, 38, 38, 0.08)"),
          padding: "6px 10px",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }
      }, (trend >= 0 ? "↑" : "↓") + " " + Math.abs(trend).toFixed(1) + "%")
    )
  );
}

function TT({ active, payload, label, t }) {
  if (!active || !payload?.length) return null;
  return h("div", { 
    style: { 
      background: t.tooltipBg, 
      border: `1px solid ${t.tooltipBorder}`, 
      borderRadius: 8, 
      padding: "12px 16px", 
      boxShadow: t.page === DARK.page ? "0 4px 12px rgba(0, 0, 0, 0.3)" : "0 4px 12px rgba(0, 0, 0, 0.1)" 
    } 
  },
    h("div", { style: { color: t.tooltipTitle, fontSize: 11, marginBottom: 8, fontWeight: 700 } }, label),
    ...payload.map((p, i) => h("div", { key: i, style: { color: p.color || C.primary, fontSize: 12, fontWeight: 600, marginTop: 4 } }, p.name + ": " + numFmt(p.value)))
  );
}

// ═══════════════════════════════════════════════════════════════
// CHAT UTILITIES — Chat filter için yardımcı fonksiyonlar
// ═══════════════════════════════════════════════════════════════

const BUY_REGEX = /\b(buy\w*)\b/i;
const SELL_REGEX = /\b(sell\w*)\b/i;

// recipes.json'dan Map oluştur
function buildRecipeMap() {
  const map = new Map();
  for (const r of Array.isArray(recipes) ? recipes : []) {
    const id = Number(r?.id);
    const name = String(r?.name || "").trim();
    if (Number.isFinite(id) && name) {
      map.set(id, name);
    }
  }
  return map;
}

// API sayfalama URL'i oluştur (realmId ile)
function buildChatPageUrl(realmId = 0, fromId = null) {
  const realm = realmId === 1 ? "E" : "S"; // 1 = Enterprise (E), 0 = Standard (S)
  const baseUrl = `https://www.simcompanies.com/api/v2/chatroom/${realm}/`;
  
  if (fromId === null || fromId === undefined || fromId === "") {
    return baseUrl;
  }
  const n = Number(fromId);
  if (!Number.isFinite(n)) {
    return baseUrl;
  }
  return `${baseUrl}from-id/${n}/`;
}

// Chatroom sayfasından mesajları çek (background script üzerinden)
async function fetchChatroomMessages(chatroomUrl, signal) {
  try {
    // URL'den realm'ı belirle (S veya X)
    let realm = "S"; // Default Standard
    if (chatroomUrl.includes("/X/") || chatroomUrl.includes("Enterprise")) {
      realm = "X";
    }
    
    // API endpoint'i oluştur
    const apiUrl = `https://www.simcompanies.com/api/v2/chatroom/${realm}/`;
    
    // Background script'e mesaj gönder
    const response = await new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new Error("AbortError"));
        return;
      }

      chrome.runtime.sendMessage(
        { action: "FETCH_CHATROOM_MESSAGES", url: apiUrl },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        }
      );
    });

    if (!response?.success) {
      throw new Error(response?.error || "Failed to fetch chatroom messages");
    }

    return response.messages || [];
  } catch (err) {
    if (err.message === "AbortError") {
      const abortError = new Error("AbortError");
      abortError.name = "AbortError";
      throw abortError;
    }
    console.error("Chatroom fetch failed:", err);
    throw new Error(`Failed to fetch chatroom: ${err.message}`);
  }
}

// Kalite filtrelerini normalize et
function normalizeQualities(selectedQualities = []) {
  if (!Array.isArray(selectedQualities)) return [];
  return selectedQualities.filter((q) => typeof q === "string" && q.trim());
}

// Filtreleri oluştur
function buildChatSearchFilters({ filterType = "buy", productId, selectedQualities = [] } = {}) {
  const qualities = normalizeQualities(selectedQualities);
  const pid = Number(productId);

  return {
    typeRegex: filterType === "sell" ? SELL_REGEX : BUY_REGEX,
    productRegex: Number.isFinite(pid) ? new RegExp(`:re-${pid}:`, "i") : null,
    qualityRegex: qualities.length ? new RegExp(`\\b(${qualities.join("|")})\\b`, "i") : null,
  };
}

// Tek mesaj eşleşmesi kontrol et
function messageMatchesFilters(message, filters) {
  // Eğer hiç filter yoksa (chatroom'dan tüm mesajları çek), hepsini kabul et
  if (!filters?.typeRegex && !filters?.productRegex && !filters?.qualityRegex) {
    return true;
  }

  const body = String(message?.body || "");
  if (!body) return false;

  // Type filter varsa kontrol et
  if (filters?.typeRegex && !filters.typeRegex.test(body)) {
    return false;
  }

  // Product filter varsa kontrol et
  if (filters?.productRegex && !filters.productRegex.test(body)) {
    return false;
  }

  // Quality filter varsa kontrol et
  if (filters?.qualityRegex && !filters.qualityRegex.test(body)) {
    return false;
  }

  return true;
}

// Chat API isteği
async function requestMessages(url, signal) {
  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      signal,
    });

    if (!response.ok) {
      // Daha detaylı hata mesajı
      const errorText = await response.text().catch(() => "");
      throw new Error(`Chat API error: ${response.status} - ${response.statusText}${errorText ? ` (${errorText})` : ""}`);
    }

    return response.json();
  } catch (err) {
    if (err.name === "AbortError") {
      throw err;
    }
    // URL'i hata mesajına ekle (debug için)
    console.error("Chat API Request Failed:", url, err);
    throw new Error(`${err.message} - URL: ${url}`);
  }
}

// :re-id: tokenlarını ürün adına çevir
function formatBodyWithRecipes(body, recipeMap) {
  return String(body || "").replace(/:re-(\d+):/g, (raw, id) => {
    const recipeName = recipeMap.get(Number(id));
    return recipeName ? `[${recipeName}]` : raw;
  });
}

// Ana arama fonksiyonu
async function searchChatMinimal({
  filterType = "buy",
  productId,
  selectedQualities = [],
  targetCount = 30,
  cutoffHours = 8,
  maxPages = 50,
  signal,
  realmId = 0, // 0 = Standard (S), 1 = Enterprise (E)
  chatroom = null, // Belirli bir chatroom URL'i (örn: "https://www.simcompanies.com/tr/messages/chatroom_Aerospace%20sales/")
} = {}) {
  const filters = buildChatSearchFilters({ filterType, productId, selectedQualities });
  const recipeMap = buildRecipeMap();
  const cutoffTime = Date.now() - cutoffHours * 60 * 60 * 1000;

  const matches = [];
  let pagesFetched = 0;

  // Eğer chatroom URL'i verilmişse, HTML'den parse et
  if (chatroom) {
    try {
      const messages = await fetchChatroomMessages(chatroom, signal);
      pagesFetched = 1;

      for (const message of messages) {
        const ts = new Date(message?.datetime || 0).getTime();
        if (Number.isFinite(ts) && ts < cutoffTime) {
          continue;
        }

        if (messageMatchesFilters(message, filters)) {
          const messageId = Number(message?.id);
          matches.push({
            id: Number.isFinite(messageId) ? messageId : null,
            datetime: message?.datetime || null,
            company: String(message?.sender?.company || ""),
            bodyRaw: String(message?.body || ""),
            bodyPretty: formatBodyWithRecipes(message?.body, recipeMap),
          });
        }

        if (matches.length >= targetCount) break;
      }

      return { matches, pagesFetched };
    } catch (err) {
      if (err.name !== "AbortError") {
        throw new Error(`Chatroom fetch failed: ${err.message}`);
      }
      throw err;
    }
  }

  // API üzerinden sayfalama ile çek (eski yöntem)
  let url = buildChatPageUrl(realmId);

  while (pagesFetched < maxPages && matches.length < targetCount) {
    if (signal?.aborted) break;

    const messages = await requestMessages(url, signal);
    pagesFetched += 1;

    if (!Array.isArray(messages) || messages.length === 0) break;

    let smallestId = null;
    let reachedCutoff = false;

    for (const message of messages) {
      const ts = new Date(message?.datetime || 0).getTime();
      if (Number.isFinite(ts) && ts < cutoffTime) {
        reachedCutoff = true;
        break;
      }

      const messageId = Number(message?.id);
      if (Number.isFinite(messageId) && (smallestId === null || messageId < smallestId)) {
        smallestId = messageId;
      }

      if (messageMatchesFilters(message, filters)) {
        matches.push({
          id: Number.isFinite(messageId) ? messageId : null,
          datetime: message?.datetime || null,
          company: String(message?.sender?.company || ""),
          bodyRaw: String(message?.body || ""),
          bodyPretty: formatBodyWithRecipes(message?.body, recipeMap),
        });
      }

      if (matches.length >= targetCount) break;
    }

    if (reachedCutoff) break;
    if (!Number.isFinite(Number(smallestId))) break;

    url = buildChatPageUrl(realmId, smallestId);
  }

  return { matches, pagesFetched };
}
