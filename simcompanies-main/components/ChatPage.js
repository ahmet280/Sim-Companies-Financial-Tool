// ═══════════════════════════════════════════════════════════════
// CHAT FILTER PAGE — Buy/Sell mesajlarını filtrele
// ═══════════════════════════════════════════════════════════════

function ChatPage({ t, styles, L, realmId }) {
  const [filterType, setFilterType] = useState("buy");
  const [productId, setProductId] = useState("");
  const [selectedQualities, setSelectedQualities] = useState([]);
  const [cutoffHours, setCutoffHours] = useState(8);
  const [chatType, setChatType] = useState("global");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pagesFetched, setPagesFetched] = useState(0);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  // refresh interval   (5dk)
  const [refreshIntervalMinutes, setRefreshIntervalMinutes] = useState(5);
  const [lastResultCount, setLastResultCount] = useState(0);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [lastMessageId, setLastMessageId] = useState(null);
  const abortControllerRef = useRef(null);
  const intervalRef = useRef(null);

  const recipeMap = useMemo(() => buildRecipeMap(), []);
  const productOptions = useMemo(() => {
    const arr = Array.from(recipeMap.entries()).map(([id, name]) => ({ id, name }));
    return arr.sort((a, b) => a.name.localeCompare(b.name));
  }, [recipeMap]);

  const qualityOptions = ["Q1", "Q2", "Q3", "Q4", "Q5"];

  const handleSearch = async (isAutoRefresh = false) => {
    if (!productId) {
      setError(L.chatNoProduct || "Please select a product");
      return;
    }

    setError(null);
    if (!isAutoRefresh) {
      setResults([]);
      setPagesFetched(0);
    }
    setIsSearching(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const result = await searchChatMinimal({
        filterType,
        productId: Number(productId),
        selectedQualities,
        targetCount: 30,
        cutoffHours: Number(cutoffHours) || 8,
        maxPages: 50,
        signal: abortControllerRef.current.signal,
        realmId: realmId || 0,
        chatroom: chatType === "aero" ? "https://www.simcompanies.com/api/v2/chatroom/X/" : null,
      });

      const newCount = result.matches.length;
      
      // Yeni mesaj kontrolü - en son mesajın ID'sine bakarak
      if (isAutoRefresh && result.matches.length > 0) {
        const newestMessageId = result.matches[0].id;
        
        // Eğer daha önce bir mesaj ID'si varsa ve yeni mesaj farklıysa
        if (lastMessageId !== null && newestMessageId !== lastMessageId && newestMessageId > lastMessageId) {
          // Kaç yeni mesaj geldiğini hesapla
          let newMsgCount = 0;
          for (const msg of result.matches) {
            if (msg.id > lastMessageId) {
              newMsgCount++;
            } else {
              break;
            }
          }
          
          if (newMsgCount > 0) {
            setNewMessagesCount(newMsgCount);
            // Ses çal
            try {
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              oscillator.frequency.value = 800;
              oscillator.type = 'sine';
              gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
              oscillator.start(audioContext.currentTime);
              oscillator.stop(audioContext.currentTime + 0.3);
            } catch (e) {
              console.warn('Audio notification failed:', e);
            }
          }
        }
        
        // En son mesaj ID'sini güncelle
        setLastMessageId(newestMessageId);
      }
      
      setResults(result.matches);
      setPagesFetched(result.pagesFetched);
      setLastResultCount(newCount);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsSearching(false);
    }
  };

  const toggleQuality = (q) => {
    setSelectedQualities((prev) =>
      prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q]
    );
  };

  const selectedProduct = productOptions.find(p => p.id === Number(productId));

  useEffect(() => {
    if (autoRefresh && productId && !isSearching) {
      intervalRef.current = setInterval(() => {
        handleSearch(true);
      }, refreshIntervalMinutes * 60 * 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, refreshIntervalMinutes, productId, isSearching]);

  useEffect(() => {
    if (newMessagesCount > 0) {
      const timer = setTimeout(() => setNewMessagesCount(0), 5000);
      return () => clearTimeout(timer);
    }
  }, [newMessagesCount]);

  return h("div", { style: { display: "flex", flexDirection: "column", gap: 24, maxWidth: 1200, margin: "0 auto" } },
    h("div", { className: "chat-layout", style: { display: "grid", gap: 24, alignItems: "start" } },
      h("div", { className: "chat-filters" },
        h("div", { style: styles.panel },
          h("div", { style: { marginBottom: 20 } },
            h("label", { style: { display: "block", marginBottom: 12, color: t.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" } }, L.chatFilters || "Filter Type"),
            h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },
              h("button", {
                onClick: () => setFilterType("buy"),
                className: "btn",
                style: {
                  background: filterType === "buy" ? C.primary : t.btnBg,
                  border: `1px solid ${filterType === "buy" ? C.primary : t.btnBorder}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  padding: "12px",
                  fontSize: 12,
                  color: filterType === "buy" ? "#fff" : t.btnColor,
                  fontFamily: FONT_FAMILY,
                  fontWeight: 700,
                  transition: "all 0.2s ease",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                },
              }, "🛒 BUY"),
              h("button", {
                onClick: () => setFilterType("sell"),
                className: "btn",
                style: {
                  background: filterType === "sell" ? C.primary : t.btnBg,
                  border: `1px solid ${filterType === "sell" ? C.primary : t.btnBorder}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  padding: "12px",
                  fontSize: 12,
                  color: filterType === "sell" ? "#fff" : t.btnColor,
                  fontFamily: FONT_FAMILY,
                  fontWeight: 700,
                  transition: "all 0.2s ease",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                },
              }, "💰 SELL")
            )
          ),

          h("div", { style: { marginBottom: 20 } },
            h("label", { style: { display: "block", marginBottom: 12, color: t.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" } }, "📦 " + (L.chatProduct || "Product")),
            h("select", {
              value: productId,
              onChange: (e) => setProductId(e.target.value),
              style: {
                width: "100%",
                padding: "12px 14px",
                background: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                borderRadius: 8,
                color: t.text,
                fontSize: 12,
                fontFamily: FONT_FAMILY,
                fontWeight: 600,
                cursor: "pointer",
              },
            },
              h("option", { value: "" }, L.chatSelectProduct || "Select a product..."),
              ...productOptions.map((p) =>
                h("option", { key: p.id, value: p.id }, p.name)
              )
            )
          ),

          h("div", { style: { marginBottom: 20 } },
            h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },
              h("button", {
                onClick: () => setChatType("global"),
                className: "btn",
                style: {
                  background: chatType === "global" ? C.primary : t.btnBg,
                  border: `1px solid ${chatType === "global" ? C.primary : t.btnBorder}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  padding: "12px",
                  fontSize: 12,
                  color: chatType === "global" ? "#fff" : t.btnColor,
                  fontFamily: FONT_FAMILY,
                  fontWeight: 700,
                  transition: "all 0.2s ease",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                },
              }, "🌍 Global"),
              h("button", {
                onClick: () => setChatType("aero"),
                className: "btn",
                style: {
                  background: chatType === "aero" ? C.primary : t.btnBg,
                  border: `1px solid ${chatType === "aero" ? C.primary : t.btnBorder}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  padding: "12px",
                  fontSize: 12,
                  color: chatType === "aero" ? "#fff" : t.btnColor,
                  fontFamily: FONT_FAMILY,
                  fontWeight: 700,
                  transition: "all 0.2s ease",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                },
              }, "✈️ Aero")
            )
          ),

          h("div", { style: { marginBottom: 20 } },
            h("label", { style: { display: "block", marginBottom: 12, color: t.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" } }, "⭐ " + (L.chatQuality || "Quality")),
            h("div", { style: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 } },
              ...qualityOptions.map((q) =>
                h("button", {
                  key: q,
                  onClick: () => toggleQuality(q),
                  className: "btn",
                  style: {
                    padding: "10px",
                    background: selectedQualities.includes(q) ? C.primary : t.btnBg,
                    border: `1px solid ${selectedQualities.includes(q) ? C.primary : t.btnBorder}`,
                    borderRadius: 8,
                    fontSize: 12,
                    color: selectedQualities.includes(q) ? "#fff" : t.text,
                    fontWeight: selectedQualities.includes(q) ? 700 : 600,
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    fontFamily: FONT_FAMILY,
                  },
                }, q)
              )
            )
          ),

          h("div", { style: { marginBottom: 20 } },
            h("label", { style: { display: "block", marginBottom: 12, color: t.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" } }, "⏱️ " + (L.chatCutoffHours || "Time Range (hours)")),
            h("input", {
              type: "number",
              min: "1",
              max: "168",
              value: cutoffHours,
              onChange: (e) => setCutoffHours(e.target.value),
              style: {
                width: "100%",
                padding: "12px 14px",
                background: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                borderRadius: 8,
                color: t.text,
                fontSize: 12,
                fontFamily: FONT_FAMILY,
                fontWeight: 600,
              },
              placeholder: "8"
            })
          ),

          h("div", { style: { marginBottom: 20, paddingTop: 20, borderTop: `1px solid ${t.panelBorder}` } },
            h("label", { style: { display: "block", marginBottom: 12, color: t.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" } }, "🔔 " + (L.chatAutoRefresh || "Auto Refresh")),
            h("div", { style: { display: "flex", alignItems: "stretch", gap: 8, marginBottom: 12 } },
              h("button", {
                onClick: () => setAutoRefresh(!autoRefresh),
                className: "btn",
                style: {
                  background: autoRefresh ? C.success : t.btnBg,
                  border: `1px solid ${autoRefresh ? C.success : t.btnBorder}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  padding: "12px 16px",
                  fontSize: 11,
                  color: autoRefresh ? "#fff" : t.btnColor,
                  fontFamily: FONT_FAMILY,
                  fontWeight: 700,
                  transition: "all 0.2s ease",
                  flex: 1,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                },
              }, autoRefresh ? "✓ ON" : "○ OFF"),
                h("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "0 12px", background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8 } },
                h("input", {
                  type: "number",
                  min: "1",
                  max: "60",
                  value: refreshIntervalMinutes,
                  onChange: (e) => setRefreshIntervalMinutes(Number(e.target.value) || 1),
                  disabled: !autoRefresh,
                  style: {
                    width: "50px",
                    padding: "8px 4px",
                    background: "transparent",
                    border: "none",
                    color: t.text,
                    fontSize: 13,
                    fontFamily: FONT_FAMILY,
                    fontWeight: 700,
                    textAlign: "center",
                    outline: "none",
                  },
                }),
                h("span", { style: { fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: "uppercase" } }, "min")
              )
            ),
            autoRefresh && h("div", { style: { fontSize: 10, color: C.success, fontWeight: 600, padding: "8px 12px", background: `${C.success}10`, borderRadius: 6, display: "flex", alignItems: "center", gap: 6 } }, 
              h("span", null, "🔄"),
              h("span", null, L.chatAutoRefreshInfo || "Automatically checks for new messages")
            )
          ),

          h("div", { style: { display: "flex", gap: 12 } },
            h("button", {
              onClick: () => handleSearch(false),
              disabled: isSearching,
              className: "btn",
              style: {
                background: isSearching ? t.btnBg : C.primary,
                color: isSearching ? t.btnColor : "#fff",
                border: `1px solid ${isSearching ? t.btnBorder : C.primary}`,
                cursor: isSearching ? "not-allowed" : "pointer",
                flex: 1,
                padding: "14px 20px",
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 8,
                fontFamily: FONT_FAMILY,
                transition: "all 0.2s ease",
                textTransform: "uppercase",
                letterSpacing: 1,
              },
            }, isSearching ? "🔍 " + (L.chatSearching || "Searching...") : "🔍 " + (L.chatSearch || "Search")),
            
            isSearching && h("button", {
              onClick: handleStop,
              className: "btn",
              style: {
                background: C.danger,
                color: "#fff",
                border: `1px solid ${C.danger}`,
                padding: "14px 20px",
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 8,
                fontFamily: FONT_FAMILY,
                cursor: "pointer",
                transition: "all 0.2s ease",
              },
            }, "⏹")
          ),

          (pagesFetched > 0 || error) && h("div", { style: { marginTop: 20, paddingTop: 20, borderTop: `1px solid ${t.panelBorder}` } },
            pagesFetched > 0 && h("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 10 } },
              h("span", { style: { fontSize: 11, color: t.textMuted, fontWeight: 600 } }, L.chatPagesFetched || "Pages"),
              h("span", { style: { fontSize: 12, color: t.text, fontWeight: 700 } }, pagesFetched)
            ),
            results.length > 0 && h("div", { style: { display: "flex", justifyContent: "space-between" } },
              h("span", { style: { fontSize: 11, color: t.textMuted, fontWeight: 600 } }, L.chatResults || "Results"),
              h("span", { style: { fontSize: 12, color: C.primary, fontWeight: 700 } }, results.length)
            ),
            error && h("div", { style: { marginTop: 12, padding: 14, background: t.errorBg, borderRadius: 8, fontSize: 11, color: C.danger, border: `1px solid ${C.danger}`, fontWeight: 600 } }, error)
          )
        )
      ),

      h("div", null,
        results.length === 0 && !isSearching && !error && h("div", { style: { ...styles.panel, padding: 80, textAlign: "center" } },
          h("div", { style: { fontSize: 56, marginBottom: 20, opacity: 0.2 } }, "💬"),
          h("div", { style: { fontSize: 14, color: t.textMuted, fontWeight: 600, marginBottom: 10 } }, L.chatSelectProduct || "Select a product to start"),
          h("div", { style: { fontSize: 12, color: t.textFaint, fontWeight: 500 } }, "Choose filters and click search")
        ),

        pagesFetched > 0 && results.length === 0 && !isSearching && h("div", { style: { ...styles.panel, background: t.errorBg, border: `1px solid ${C.warning}` } },
          h("div", { style: { fontSize: 13, fontWeight: 700, color: C.warning, marginBottom: 16 } }, "🔍 Debug: Çekilen Mesajlar"),
          h("div", { style: { fontSize: 11, color: t.text, fontFamily: "monospace", maxHeight: 300, overflow: "auto", padding: 16, background: t.inputBg, borderRadius: 8, border: `1px solid ${t.inputBorder}` } },
            h("pre", { style: { margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" } }, 
              JSON.stringify({ pagesFetched, resultsCount: results.length, chatType, filterType, productId }, null, 2)
            )
          )
        ),

        results.length > 0 && h("div", null,
          newMessagesCount > 0 && h("div", { 
            style: { 
              ...styles.panel, 
              background: `${C.success}15`,
              border: `2px solid ${C.success}`,
              marginBottom: 20,
              padding: "18px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              animation: "pulse 1s ease-in-out infinite"
            } 
          },
            h("div", { style: { display: "flex", alignItems: "center", gap: 16 } },
              h("div", { style: { width: 48, height: 48, borderRadius: 12, background: C.success, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 } }, "🔔"),
              h("div", null,
                h("div", { style: { fontSize: 14, fontWeight: 700, color: C.success, marginBottom: 4, letterSpacing: 0.3 } }, `+${newMessagesCount} New Messages!`),
                h("div", { style: { fontSize: 11, color: t.textMuted, fontWeight: 600 } }, "New messages detected in the last refresh")
              )
            ),
            h("button", {
              onClick: () => setNewMessagesCount(0),
              style: { background: "transparent", border: "none", color: t.textMuted, cursor: "pointer", fontSize: 18, padding: 8, lineHeight: 1, transition: "color 0.2s ease" },
              onMouseEnter: (e) => e.currentTarget.style.color = t.text,
              onMouseLeave: (e) => e.currentTarget.style.color = t.textMuted,
            }, "×")
          ),

          h("div", { style: { ...styles.panel, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 } },
            h("div", null,
              h("div", { style: { fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 } }, 
                `${results.length} ${L.chatResults || "Results"}`,
                autoRefresh && h("span", { style: { fontSize: 10, padding: "4px 8px", background: `${C.success}20`, border: `1px solid ${C.success}`, borderRadius: 6, color: C.success, fontWeight: 700, letterSpacing: 0.5 } }, "🔄 LIVE")
              ),
              selectedProduct && h("div", { style: { fontSize: 11, color: t.textMuted, fontWeight: 600 } }, 
                `${filterType.toUpperCase()} • ${selectedProduct.name}${selectedQualities.length > 0 ? ` • ${selectedQualities.join(", ")}` : ""}`
              )
            ),
            h("div", { style: { fontSize: 11, color: t.textFaint, fontWeight: 600 } }, `Last ${cutoffHours}h`)
          ),

          h("div", { style: { display: "flex", flexDirection: "column", gap: 16 } },
            ...results.map((msg, idx) =>
              h("div", { key: msg.id || idx, style: styles.panel },
                h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 } },
                  h("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
                    h("div", { style: { width: 40, height: 40, borderRadius: 10, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff" } }, 
                      msg.company.charAt(0).toUpperCase()
                    ),
                    h("div", null,
                      h("div", { style: { fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 4 } }, msg.company),
                      h("div", { style: { fontSize: 10, color: t.textMuted, fontWeight: 600 } }, 
                        msg.datetime ? new Date(msg.datetime).toLocaleString() : ""
                      )
                    )
                  ),
                  h("div", { 
                    style: { 
                      padding: "6px 12px", 
                      background: filterType === "buy" ? `${C.success}10` : `${C.warning}10`,
                      border: `1px solid ${filterType === "buy" ? C.success : C.warning}`,
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      color: filterType === "buy" ? C.success : C.warning,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    } 
                  }, filterType)
                ),
                h("div", { 
                  style: { 
                    fontSize: 12, 
                    color: t.text, 
                    lineHeight: 1.7, 
                    fontWeight: 500,
                    padding: "14px 16px",
                    background: t.inputBg,
                    borderRadius: 8,
                    border: `1px solid ${t.inputBorder}`,
                  } 
                }, msg.bodyPretty)
              )
            )
          )
        )
      )
    )
  );
}
