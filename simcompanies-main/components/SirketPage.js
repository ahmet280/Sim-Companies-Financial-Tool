function SirketPage({ data, gelirData, cashflow, t, styles, L, lang }) {
  if (!data.length) return h("div", { style: styles.empty }, L.emptyGenel);
  const isDark = t.page === DARK.page;
  const son = data[data.length - 1], ilk = data[0];
  const buyume = ilk.total > 0 ? (son.total - ilk.total) / ilk.total * 100 : 0;
  const maxDeger = Math.max(...data.map(d => d.total));
  const maxTarih = data.find(d => d.total === maxDeger)?.date || "";
  const [aralik, setAralik] = React.useState("tum");
  const gosterilen = aralik === "90" ? data.slice(-90) : aralik === "180" ? data.slice(-180) : data;

  // DuPont Analysis Calculations
  const dupont = useMemo(() => {
    if (!gelirData.length || !son) return null;
    
    // Son 7 günlük ortalamalar üzerinden daha stabil bir analiz yapalım
    const last7Gelir = gelirData.slice(-7);
    const avgDailyRevenue = last7Gelir.reduce((s, d) => s + (d.total || 0), 0) / (last7Gelir.length || 1);
    const avgDailyNet = last7Gelir.reduce((s, d) => s + (d.net || 0), 0) / (last7Gelir.length || 1);
    
    // 1. Net Profit Margin (Kâr / Gelir)
    const margin = avgDailyRevenue > 0 ? (avgDailyNet / avgDailyRevenue) : 0;
    
    // 2. Asset Turnover (Gelir / Toplam Varlık) - Günlük ciroyu yıllıklandırılmış gibi düşünmeyip doğrudan oranlıyoruz
    const turnover = son.total > 0 ? (avgDailyRevenue / son.total) : 0;
    
    // 3. Equity Multiplier (Kaldıraç) = Varlık / Özkaynak
    const pasif = Math.abs(son.total - (son.nakit + son.stok + son.binalar + son.patentler));
    const equity = son.total - pasif;
    const leverage = equity > 0 ? (son.total / equity) : 1;
    
    // 4. ROE = Margin * Turnover * Leverage
    const roe = margin * turnover * leverage * 100; // Yüzdelik gösterim için

    return {
      roe,
      margin: margin * 100,
      turnover,
      leverage,
      isHealthy: roe > 0
    };
  }, [gelirData, son]);

  const chartData = gosterilen.map(d => ({
    date: d.date,
    [L.lNakit]: Math.max(0, d.nakit),
    [L.lStok]: Math.max(0, d.stok),
    [L.lBina]: Math.max(0, d.binalar),
    [L.lPatent]: Math.max(0, d.patentler),
    [L.lPasif]: d.total - (d.nakit + d.stok + d.binalar + d.patentler) < 0 ? d.total - (d.nakit + d.stok + d.binalar + d.patentler) : 0,
    [L.lDeger]: d.total,
  }));

  const SirketTT = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const items = payload.filter(p => p.value !== 0 && p.dataKey !== L.lDeger);
    const deger = payload.find(p => p.dataKey === L.lDeger);
    return h("div", { style: { background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8, padding: "10px 14px", minWidth: 200, fontFamily: FONT_FAMILY } },
      h("div", { style: { color: t.tooltipTitle, fontSize: 10, marginBottom: 6, borderBottom: `1px solid ${t.panelBorder}`, paddingBottom: 4 } }, label),
      deger && h("div", { style: { fontSize: 11, display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 4, padding: "2px 0" } },
        h("span", { style: { color: t.text } }, L.lDeger + ":"),
        h("span", { style: { fontWeight: 700, color: C.primary } }, numFmt(deger.value, true))
      ),
      ...items.map((p, i) => p.value !== 0 && h("div", { key: i, style: { color: p.color, fontSize: 10, display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 2 } },
        h("span", null, p.dataKey + ":"),
        h("span", { style: { fontWeight: 600 } }, numFmt(Math.abs(p.value), true))
      ))
    );
  };

  const btnAralik = (id, label) => h("button", {
    onClick: () => setAralik(id),
    style: { background: aralik === id ? "#00d4a815" : "none", border: `1px solid ${aralik === id ? C.primary : t.panelBorder}`, borderRadius: 6, cursor: "pointer", padding: "4px 12px", fontSize: 9, letterSpacing: 1, color: aralik === id ? C.primary : t.textMuted, fontFamily: FONT_FAMILY }
  }, label);

  return h("div", null,
    h("div", { style: styles.sectionTitle }, L.sSirket),
    h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 14 } },
      h(StatCard, { label: L.cSirketDeger, value: numFmt(son.total, true), color: C.primary, t }),
      h(StatCard, { label: L.cBasDeger, value: numFmt(ilk.total, true), sub: ilk.date, color: C.blue, t }),
      h(StatCard, { label: L.cSirketBuyume, value: "%" + buyume.toFixed(1), sub: data.length + " " + (L.cGunde || "days"), color: buyume >= 0 ? C.primary : C.red, t }),
      h(StatCard, { label: L.cEnYuksek, value: numFmt(maxDeger, true), sub: maxTarih, color: C.amber, t })
    ),

    // DuPont Strategic Analysis Section
    dupont && h("div", { style: { ...styles.panel, border: "1px solid #00d4a840", background: "linear-gradient(135deg, rgba(0,212,168,0.05), transparent)" } },
      h("div", { style: { ...styles.sectionTitle, color: C.primary } }, L.sDupont),
      h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 } },
        h(StatCard, { 
          label: L.cROE, 
          value: "%" + dupont.roe.toFixed(2), 
          sub: lang === "TR" ? "toplam verimlilik" : "total efficiency",
          color: C.primary, t 
        }),
        h(StatCard, { 
          label: L.cKarMarji2, 
          value: "%" + dupont.margin.toFixed(1), 
          sub: lang === "TR" ? "satış kârlılığı" : "sales margin",
          color: C.green, t 
        }),
        h(StatCard, { 
          label: L.cDevirHizi, 
          value: dupont.turnover.toFixed(3) + "x", 
          sub: lang === "TR" ? "varlık hızı" : "asset speed",
          color: C.blue, t 
        }),
        h(StatCard, { 
          label: L.cKaldirac, 
          value: dupont.leverage.toFixed(2) + "x", 
          sub: lang === "TR" ? "borç etkisi" : "equity mult.",
          color: C.amber, t 
        })
      ),
      h("div", { style: { fontSize: 8, color: t.textFaint, marginTop: 10, textAlign: "center", fontStyle: "italic" } }, L.cDupontAciklama)
    ),

    h("div", { style: { ...styles.panel, padding: "16px 8px" } },
      h("div", { style: { ...styles.sectionTitle, paddingLeft: 10 } }, L.grSirket),
      h(ResponsiveContainer, { width: "100%", height: 400 },
        h(AreaChart, { data: chartData, margin: { top: 10, right: 20, left: 10, bottom: 5 }, stackOffset: "sign" },
          h("defs", null,
            h("linearGradient", { id: "gN", x1: "0", y1: "0", x2: "0", y2: "1" },
              h("stop", { offset: "5%", stopColor: C.emerald, stopOpacity: 0.9 }),
              h("stop", { offset: "95%", stopColor: C.emerald, stopOpacity: 0.7 })
            ),
            h("linearGradient", { id: "gS", x1: "0", y1: "0", x2: "0", y2: "1" },
              h("stop", { offset: "5%", stopColor: C.emeraldLt, stopOpacity: 0.85 }),
              h("stop", { offset: "95%", stopColor: C.emeraldLt, stopOpacity: 0.65 })
            ),
            h("linearGradient", { id: "gB", x1: "0", y1: "0", x2: "0", y2: "1" },
              h("stop", { offset: "5%", stopColor: C.grayMd, stopOpacity: 0.85 }),
              h("stop", { offset: "95%", stopColor: C.grayMd, stopOpacity: 0.65 })
            ),
            h("linearGradient", { id: "gP", x1: "0", y1: "0", x2: "0", y2: "1" },
              h("stop", { offset: "5%", stopColor: C.grayDk, stopOpacity: 0.85 }),
              h("stop", { offset: "95%", stopColor: C.grayDk, stopOpacity: 0.65 })
            ),
            h("linearGradient", { id: "gR", x1: "0", y1: "0", x2: "0", y2: "1" },
              h("stop", { offset: "5%", stopColor: C.red, stopOpacity: 0.85 }),
              h("stop", { offset: "95%", stopColor: C.red, stopOpacity: 0.65 })
            )
          ),
          h(CartesianGrid, { strokeDasharray: "3 3", stroke: t.gridLine }),
          h(XAxis, { dataKey: "date", tick: { fill: t.axisColor, fontSize: 9, fontFamily: FONT_FAMILY }, interval: "preserveStartEnd" }),
          h(YAxis, {
            tick: { fill: t.axisColor, fontSize: 9, fontFamily: FONT_FAMILY }, tickFormatter: v => {
              if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + "M";
              if (Math.abs(v) >= 1e3) return Math.round(v / 1e3) + "K";
              return v;
            }
          }),
          h(Tooltip, { content: h(SirketTT) }),
          h(Area, { type: "monotone", dataKey: L.lPasif, stackId: "1", stroke: C.red, fill: "url(#gR)", strokeWidth: 0 }),
          h(Area, { type: "monotone", dataKey: L.lNakit, stackId: "1", stroke: C.emerald, fill: "url(#gN)", strokeWidth: 0 }),
          h(Area, { type: "monotone", dataKey: L.lStok, stackId: "1", stroke: C.emeraldLt, fill: "url(#gS)", strokeWidth: 0 }),
          h(Area, { type: "monotone", dataKey: L.lBina, stackId: "1", stroke: C.grayMd, fill: "url(#gB)", strokeWidth: 0 }),
          h(Area, { type: "monotone", dataKey: L.lPatent, stackId: "1", stroke: C.grayDk, fill: "url(#gP)", strokeWidth: 0 }),
          h(Area, { type: "monotone", dataKey: L.lDeger, stroke: C.darkText, fill: "none", strokeWidth: 2.5, dot: false })
        )
      ),
      h("div", { style: { display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 12, paddingLeft: 10 } },
        ...[
          { color: C.darkText, label: L.lDeger, line: true },
          { color: C.grayDk, label: L.lPatent },
          { color: C.grayMd, label: L.lBina },
          { color: C.emeraldLt, label: L.lStok },
          { color: C.emerald, label: L.lNakit },
          { color: C.red, label: L.lPasif },
        ].map((item, i) => h("div", { key: i, style: { display: "flex", alignItems: "center", gap: 5 } },
          item.line
            ? h("div", { style: { width: 22, height: 2.5, background: item.color, borderRadius: 2 } })
            : h("div", { style: { width: 12, height: 12, borderRadius: 2, background: item.color } }),
          h("span", { style: { fontSize: 9, color: t.textMuted, fontFamily: FONT_FAMILY } }, item.label)
        ))
      ),
      // Buttons moved here
      h("div", { style: { display: "flex", gap: 8, justifyContent: "center", marginTop: 16, borderTop: `1px solid ${t.panelBorder}50`, paddingTop: 12 } },
        btnAralik("90", L.btn90),
        btnAralik("180", L.btn180),
        btnAralik("tum", L.btnTum)
      )
    ),
    h("div", { style: styles.panel },
      h("div", { style: styles.sectionTitle }, L.tblSirket),
      h("div", { style: { overflowX: "auto" } },
        h("table", { style: { width: "100%", borderCollapse: "collapse" } },
          h("thead", null, h("tr", null, ...[L.colTarih, L.lNakit, L.lStok, L.lBina, L.lPatent, L.colToplam, L.colRank].map(hd => h("th", { key: hd, style: styles.th }, hd)))),
          h("tbody", null, ...[...data].reverse().slice(0, 10).map((d, i) => h("tr", { key: i },
            h("td", { style: td(C.dateColor, t) }, d.date),
            h("td", { style: td(C.emerald, t) }, numFmt(d.nakit, true)),
            h("td", { style: td(C.emeraldLt, t) }, numFmt(d.stok, true)),
            h("td", { style: td(C.grayMd, t) }, numFmt(d.binalar, true)),
            h("td", { style: td(C.grayDk, t) }, numFmt(d.patentler, true)),
            h("td", { style: { ...td(C.primary, t), fontWeight: 700 } }, numFmt(d.total, true)),
            h("td", { style: td(t.textMuted, t) }, "#" + numFmt(d.rank))
          )))
        )
      )
    ),

    // Scenario Analysis Section
    h("div", { style: { ...styles.panel, border: "1px solid #f59e0b40", background: "linear-gradient(135deg, rgba(245,158,11,0.05), transparent)" } },
      h("div", { style: { ...styles.sectionTitle, color: C.amber } }, L.sSenaryo),
      h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 } },
        (() => {
          const scenarios = [
            { id: "kons", label: L.cKons, color: C.red, factor: 0.9 },
            { id: "base", label: L.cBase, color: C.primary, factor: 1.0 },
            { id: "opt", label: L.cOpt, color: C.green, factor: 1.1 }
          ];
          return scenarios.map(s => {
            const stockVal = son.stok * s.factor;
            const newVal = son.total - son.stok + stockVal;
            const diff = newVal - son.total;
            return h("div", { key: s.id, style: { padding: "12px", background: isDark ? "#0a1520" : "#fff", border: `1px solid ${s.color}30`, borderRadius: 10, textAlign: "center" } },
              h("div", { style: { fontSize: 8, color: t.textMuted, marginBottom: 6, fontWeight: 700, letterSpacing: 1 } }, s.label),
              h("div", { style: { fontSize: 14, fontWeight: 800, color: s.color, marginBottom: 4 } }, numFmt(newVal, true)),
              h("div", { style: { fontSize: 9, color: diff >= 0 ? C.green : C.red, fontWeight: 600 } }, 
                (diff >= 0 ? "+" : "") + numFmt(diff, true)
              )
            );
          });
        })()
      ),
      h("div", { style: { fontSize: 8, color: t.textFaint, marginTop: 10, textAlign: "center", fontStyle: "italic" } }, 
        lang === "TR" 
          ? "* Bu analiz, piyasadaki fiyat dalgalanmalarının elinizdeki stok değerine etkisini simüle eder." 
          : "* This analysis simulates the impact of market price fluctuations on your current stock value."
      )
    )
  );
}
