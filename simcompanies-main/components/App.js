function App() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [activeTab, setActiveTab] = useState("ozet");
  const [darkMode, setDarkMode] = useState(true);
  const [lang, setLang] = useState("EN");
  const [showTabMenu, setShowTabMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tabMenuRef = useRef(null);
  
  const t = darkMode ? DARK : LIGHT;
  const styles = makeStyles(t);
  const L = T[lang];

  // Detect mobile/small screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 600);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close tab menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tabMenuRef.current && !tabMenuRef.current.contains(event.target)) {
        setShowTabMenu(false);
      }
    };
    if (showTabMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTabMenu]);

  const fetchData = useCallback(async () => {
    setStatus("loading"); setError(null);
    try {
      const tabs = await chrome.tabs.query({ url: "https://www.simcompanies.com/*" });
      if (!tabs.length) throw new Error(L.errNoTab);
      const result = await chrome.tabs.sendMessage(tabs[0].id, { action: "FETCH_DATA" });
      if (!result?.success) throw new Error(result?.error || L.errNoData);
      setRawData(result); setStatus("ready");
    } catch (e) { setError(e.message); setStatus("idle"); }
  }, [L]);
  const bilancoData = useMemo(() => {
    if (!rawData?.bilanco) return [];
    const arr = Array.isArray(rawData.bilanco) ? rawData.bilanco : [rawData.bilanco];
    return arr.map(r => ({ date: fmtDate(r.date), nakit: pf(r.cashAndReceivables), stok: pf(r.inventory), binalar: pf(r.buildings), patentler: pf(r.patents), total: pf(r.total), currentAssets: pf(r.currentAssets), nonCurrentAssets: pf(r.nonCurrentAssets), rank: pf(r.rank) }));
  }, [rawData?.bilanco]);

  const gelirData = useMemo(() => {
    if (bilancoData.length < 2) return [];
    let k = 0; const res = [];
    for (let i = 1; i < bilancoData.length; i++) {
      const net = bilancoData[i].total - bilancoData[i - 1].total;
      k += net;
      res.push({ date: bilancoData[i].date, net, kumulatif: k, total: bilancoData[i].total });
    }
    return res;
  }, [bilancoData]);

  const nakitData = useMemo(() => {
    if (bilancoData.length < 2) return [];
    return bilancoData.map((d, i) => ({
      ...d,
      nakitDeg: i > 0 ? d.nakit - bilancoData[i - 1].nakit : 0,
    }));
  }, [bilancoData]);
  if (status !== "ready") return h(LoadScreen, { status, onFetch: fetchData, error, t, styles, L });
  
  const TABS = [
    { id: "ozet", label: "◈ " + L.t1 },
    { id: "sirket", label: "📈 " + L.t7 },
    { id: "veri", label: "⬡ " + L.tVeri },
    { id: "nakit", label: "⇄ " + L.t4 },
    { id: "urun", label: "📦 " + L.t6 },
    { id: "chat", label: "💬 " + L.tChat },
    { id: "hedef", label: "🎯 " + L.tHedef },
    { id: "vwap", label: "📈 " + L.t9 },
  ];
  
  const activeTabData = TABS.find(tab => tab.id === activeTab);
  
  const props = { t, styles, L, lang, realmId: rawData?.companyRealm ?? 0 };
  function renderContent() {
    switch (activeTab) {
      case "ozet": return h(OzetPage, { bilancoData, gelirData, cashflow: rawData?.cashflow, ...props });
      case "sirket": return h(SirketPage, { data: bilancoData, gelirData, cashflow: rawData?.cashflow, ...props });
      case "veri": return h(MasterDataPage, { bilancoData, gelirData, ...props });
      case "nakit": return h(NakitPage, { data: nakitData, cashflow: rawData?.cashflow, ledger: rawData?.ledger, ...props });
      case "urun": return h(UrunPage, { ledger: rawData?.ledger, lang, ...props });
      case "chat": return h(ChatPage, { ...props });
      case "hedef": return h(HedefPage, { bilancoData, gelirData, ...props });
      case "vwap": return h(VWAPPage, { warehouseCSV: rawData?.warehouseCSV, warehouseTR: rawData?.warehouseTR, warehouseEN: rawData?.warehouseEN, retailInfo: rawData?.retailInfo, marketTicker: rawData?.marketTicker, storage: rawData?.storage, ...props });
      default: return null;
    }
  }
  const btnS = (extra = {}) => ({ 
    background: t.btnBg, 
    border: `1px solid ${t.btnBorder}`, 
    borderRadius: 6, 
    cursor: "pointer", 
    padding: "8px 16px", 
    fontSize: 11, 
    color: t.btnColor, 
    fontFamily: FONT_FAMILY, 
    fontWeight: 600, 
    transition: "all 0.2s ease", 
    ...extra 
  });
  return h("div", { style: { display: "flex", flexDirection: "column", height: "100vh", background: t.page } },
    h("div", { className: "app-content", style: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" } },
      status !== "ready" ? h(LoadScreen, { status, onFetch: fetchData, error, t, styles, L }) : h("div", { style: { display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" } },
        // Header
        h("div", { className: "app-header", style: { background: t.header, borderBottom: `1px solid ${t.headerBorder}`, padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, flexWrap: "wrap", gap: "20px" } },
          h("div", { style: { display: "flex", alignItems: "center", gap: 20, minWidth: 0 } },
            h("div", { 
              style: { 
                width: 56, 
                height: 56, 
                borderRadius: 16, 
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                flexShrink: 0,
                boxShadow: `0 8px 24px ${C.primary}40, 0 4px 8px ${C.primary}20`,
                position: "relative",
                overflow: "hidden",
              } 
            }, 
              h("div", { style: { position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)" } }),
              h("div", { style: { position: "relative", fontWeight: 900, color: "#fff", letterSpacing: -1 } }, "SC")
            ),
            h("div", { style: { display: "flex", flexDirection: "column", gap: 4, minWidth: 0 } },
              h("div", { className: "title", style: { fontSize: 24, fontWeight: 800, color: t.text, letterSpacing: -0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1, background: `linear-gradient(135deg, ${t.text} 0%, ${t.textMuted} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" } }, APP_TITLE),
              h("div", { style: { fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: 2, textTransform: "uppercase", opacity: 0.8 } }, "Analytics Dashboard")
            )
          ),
          h("div", { style: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" } },
            h("button", { 
              onClick: fetchData, 
              className: "btn", 
              style: btnS({ 
                fontSize: 11, 
                padding: "11px 20px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 700,
                borderRadius: 10,
                transition: "all 0.3s ease",
              }) 
            }, 
              h("span", { style: { fontSize: 16, fontWeight: 700 } }, "↻"),
              h("span", null, L.refresh)
            ),
            h("button", { 
              onClick: () => setDarkMode(d => !d), 
              className: "btn", 
              style: btnS({ 
                borderRadius: 10, 
                padding: "11px 20px", 
                fontSize: 11,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 700,
                transition: "all 0.3s ease",
              }) 
            }, 
              h("span", { style: { fontSize: 16 } }, darkMode ? "☀" : "☾"),
              h("span", null, darkMode ? L.light : L.dark)
            ),
            h("button", { 
              onClick: () => setLang(l => l === "TR" ? "EN" : "TR"), 
              className: "btn", 
              style: btnS({ 
                borderRadius: 10, 
                padding: "11px 24px", 
                fontWeight: 800, 
                fontSize: 12, 
                border: "none", 
                color: "#fff", 
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
                boxShadow: `0 4px 12px ${C.primary}40, 0 2px 4px ${C.primary}20`,
                letterSpacing: 1,
                transition: "all 0.3s ease",
              }) 
            }, L.langSwitch)
          )
        ),
        // Tabs
        isMobile 
          ? h("div", { 
              className: "tab-bar", 
              style: { 
                display: "flex", 
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: `2px solid ${t.tabBorder}`, 
                padding: "12px 28px", 
                background: t.tabBar, 
                flexShrink: 0,
                position: "relative",
              } 
            },
            // Active tab display
            h("div", { 
              style: { 
                fontSize: 12, 
                fontWeight: 700, 
                color: C.primary,
                letterSpacing: 0.3,
              } 
            }, activeTabData?.label || ""),
            
            // Dropdown button
            h("div", { ref: tabMenuRef, style: { position: "relative" } },
              h("button", {
                onClick: () => setShowTabMenu(!showTabMenu),
                className: "btn",
                style: {
                  background: t.btnBg,
                  border: `1px solid ${t.btnBorder}`,
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: 16,
                  color: t.text,
                  display: "flex",
                  alignItems: "center",
                  transition: "all 0.2s ease",
                }
              }, "⋯"),
              
              // Dropdown menu
              showTabMenu && h("div", {
                style: {
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  background: t.panel,
                  border: `1px solid ${t.panelBorder}`,
                  borderRadius: 12,
                  boxShadow: t.page === DARK.page 
                    ? "0 8px 24px rgba(0, 0, 0, 0.4)" 
                    : "0 8px 24px rgba(0, 0, 0, 0.12)",
                  minWidth: 200,
                  maxHeight: "70vh",
                  overflowY: "auto",
                  zIndex: 1000,
                  animation: "slideUp 0.2s ease",
                }
              },
                ...TABS.map(tab => h("button", {
                  key: tab.id,
                  onClick: () => {
                    setActiveTab(tab.id);
                    setShowTabMenu(false);
                  },
                  style: {
                    width: "100%",
                    background: activeTab === tab.id ? `${C.primary}10` : "transparent",
                    border: "none",
                    borderBottom: `1px solid ${t.panelBorder}`,
                    padding: "14px 20px",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: activeTab === tab.id ? 700 : 600,
                    color: activeTab === tab.id ? C.primary : t.text,
                    transition: "all 0.2s ease",
                    fontFamily: FONT_FAMILY,
                    letterSpacing: 0.3,
                  },
                  onMouseEnter: (e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.background = `${C.primary}05`;
                    }
                  },
                  onMouseLeave: (e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.background = "transparent";
                    }
                  },
                }, tab.label))
              )
            )
          )
          : h("div", { 
              className: "tab-bar", 
              style: { 
                display: "flex", 
                borderBottom: `2px solid ${t.tabBorder}`, 
                padding: "0 28px", 
                overflowX: "auto", 
                overflowY: "hidden", 
                background: t.tabBar, 
                flexShrink: 0, 
                WebkitOverflowScrolling: "touch",
                gap: "4px",
              } 
            },
            ...TABS.map(tab => h("button", { 
              key: tab.id, 
              onClick: () => setActiveTab(tab.id), 
              style: { 
                background: activeTab === tab.id ? `${C.primary}08` : "transparent", 
                border: "none", 
                cursor: "pointer", 
                padding: "16px 20px", 
                fontSize: 11, 
                letterSpacing: 0.3, 
                whiteSpace: "nowrap", 
                color: activeTab === tab.id ? C.primary : t.tabInactive, 
                borderBottom: activeTab === tab.id ? `3px solid ${C.primary}` : "3px solid transparent", 
                fontFamily: FONT_FAMILY, 
                transition: "all 0.2s ease", 
                flexShrink: 0, 
                fontWeight: activeTab === tab.id ? 700 : 600,
                borderRadius: "4px 4px 0 0",
              } 
            }, tab.label))
          ),
        // Content
        h("div", { className: "content-area", style: { flex: 1, padding: "24px", overflowY: "auto", overflowX: "hidden" } }, renderContent())
      )
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(h(App));

