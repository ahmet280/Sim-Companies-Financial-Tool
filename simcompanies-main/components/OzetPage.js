function OzetPage({ bilancoData, gelirData, cashflow, t, styles, L, lang }) {
  if (!bilancoData.length) return h("div", { style: styles.empty }, L.emptyGenel);
  const son = bilancoData[bilancoData.length - 1], ilk = bilancoData[0];
  const prev = bilancoData.length > 1 ? bilancoData[bilancoData.length - 2] : null;
  const buyume = ilk.total > 0 ? (son.total - ilk.total) / ilk.total * 100 : 0;
  const nakitDeg = prev ? son.nakit - prev.nakit : 0;

  const modelingData = useMemo(() => {
    const last7Gelir = gelirData.slice(-7);
    const avgDailyNet = last7Gelir.length > 0 
      ? last7Gelir.reduce((s, d) => s + d.net, 0) / last7Gelir.length 
      : 0;
    const opEx = cashflow ? (Math.abs(cashflow.wages || 0) + Math.abs(cashflow.administration || 0)) / 2 : 0;
    const isHealthy = avgDailyNet >= 0;
    const burn = !isHealthy ? Math.abs(avgDailyNet) : 0;
    const runway = burn > 0 ? son.nakit / burn : Infinity;
    return { burn, runway, isHealthy, avgDailyNet, monthlyEst: avgDailyNet * 30, opEx };
  }, [gelirData, son.nakit, cashflow]);

  const Tt = (p) => h(TT, { ...p, t });
  const son30 = bilancoData.slice(-30);
  
  return h("div", null,
    h("div", { style: styles.sectionTitle }, L.sGenel),
    h("div", { className: "stat-grid", style: { marginBottom: 16 } },
      h(StatCard, { label: L.cToplam, value: numFmt(son.total, true), sub: L.cGuncel, color: C.primary, t }),
      h(StatCard, { label: L.cNakit, value: numFmt(son.nakit, true), sub: (nakitDeg >= 0 ? "▲ " : "▼ ") + numFmt(Math.abs(nakitDeg), true), color: C.success, t }),
      h(StatCard, { label: L.cStok, value: numFmt(son.stok, true), color: C.warning, t }),
      h(StatCard, { label: L.cRank, value: "#" + numFmt(son.rank), color: C.secondary, t }),
      h(StatCard, { label: L.cBina, value: numFmt(son.binalar, true), color: C.blue, t }),
      h(StatCard, { label: L.cPatent, value: numFmt(son.patentler, true), color: C.purple, t }),
      h(StatCard, { label: L.cBuyume, value: "%" + buyume.toFixed(1), sub: bilancoData.length + " " + L.cGunde, color: buyume >= 0 ? C.primary : C.danger, t }),
      gelirData.length > 0 && h(StatCard, { label: L.cGunluk, value: numFmt(gelirData[gelirData.length - 1]?.net, true), color: C.primary, t })
    ),
    h("div", { style: { ...styles.panel, border: `1px solid ${C.secondary}30`, background: t.modelingBg, borderRadius: 12 } },
      h("div", { style: { ...styles.sectionTitle, color: C.secondary } }, L.sModelleme),
      h("div", { className: "stat-grid" },
        h(StatCard, { 
          label: L.cRunway, 
          value: modelingData.runway === Infinity 
            ? (lang === "TR" ? "SÜRDÜRÜLEBİLİR" : "SUSTAINABLE") 
            : Math.ceil(modelingData.runway) + " " + (lang === "TR" ? "Gün" : "Days"),
          sub: modelingData.isHealthy ? (lang === "TR" ? "pozitif akış" : "positive flow") : L.cRunwaySub,
          color: modelingData.isHealthy ? C.primary : C.warning, t 
        }),
        h(StatCard, { 
          label: modelingData.isHealthy ? (lang === "TR" ? "GÜNLÜK BÜYÜME" : "DAILY GROWTH") : L.cBurn, 
          value: "$" + numFmt(Math.abs(modelingData.avgDailyNet), true),
          sub: modelingData.isHealthy ? (lang === "TR" ? "net kâr ort." : "net profit avg.") : L.cBurnSub,
          color: modelingData.isHealthy ? C.primary : C.danger, t 
        }),
        h("div", { style: { gridColumn: "1 / -1", padding: "16px 20px", background: t.modelingBg, borderRadius: 10, display: "flex", alignItems: "center", gap: 16, border: `1px solid ${t.panelBorder}` } },
          h("div", { style: { width: 48, height: 48, borderRadius: 12, background: `${C.secondary}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 } }, modelingData.isHealthy ? "🚀" : "⚠️"),
          h("div", { style: { minWidth: 0, flex: 1 } },
            h("div", { style: { fontSize: 12, fontWeight: 700, color: t.text, marginBottom: 4 } }, lang === "TR" ? "FİNANSAL PROJEKSİYON" : "FINANCIAL PROJECTION"),
            h("div", { style: { fontSize: 11, color: t.textMuted, lineHeight: 1.6 } }, 
              modelingData.isHealthy 
                ? (lang === "TR" 
                    ? `Şirketiniz aylık ortalama ${numFmt(modelingData.monthlyEst, true)} büyüme trendinde. Operasyonel maliyetler kontrol altında.` 
                    : `Monthly growth trend is ${numFmt(modelingData.monthlyEst, true)}. OpEx is under control.`)
                : (lang === "TR" 
                    ? `Mevcut yanma oranıyla nakit ömrünüz ${Math.ceil(modelingData.runway)} gün. Acil nakit girişi veya maliyet optimizasyonu gerekebilir.` 
                    : `Cash runway is ${Math.ceil(modelingData.runway)} days. Cash injection or cost optimization recommended.`)
            )
          )
        )
      )
    ),
    h("div", { style: styles.panel },
      h("div", { style: styles.sectionTitle }, L.grTrend),
      h(ResponsiveContainer, { width: "100%", height: 155 },
        h(AreaChart, { data: son30, margin: { top: 5, right: 5, left: 0, bottom: 5 } },
          h("defs", null, 
            h("linearGradient", { id: "ag", x1: "0", y1: "0", x2: "0", y2: "1" }, 
              h("stop", { offset: "5%", stopColor: "#3b82f6", stopOpacity: 0.3 }), 
              h("stop", { offset: "95%", stopColor: "#3b82f6", stopOpacity: 0 })
            )
          ),
          h(CartesianGrid, { strokeDasharray: "3 3", stroke: t.gridLine }),
          h(XAxis, { dataKey: "date", tick: { fill: t.axisColor, fontSize: 8 } }),
          h(YAxis, { tick: { fill: t.axisColor, fontSize: 8 }, tickFormatter: v => numFmt(v, true) }),
          h(Tooltip, { content: h(Tt) }),
          h(Area, { type: "monotone", dataKey: "total", name: L.cToplam, stroke: "#3b82f6", fill: "url(#ag)", strokeWidth: 2, dot: false })
        )
      )
    ),
    gelirData.length > 0 && h("div", { style: styles.panel },
      h("div", { style: styles.sectionTitle }, L.grDegisim),
      h(ResponsiveContainer, { width: "100%", height: 155 },
        h(BarChart, { data: gelirData.slice(-30), margin: { top: 5, right: 5, left: 0, bottom: 5 } },
          h(CartesianGrid, { strokeDasharray: "3 3", stroke: t.gridLine }),
          h(XAxis, { dataKey: "date", tick: { fill: t.axisColor, fontSize: 8 } }),
          h(YAxis, { tick: { fill: t.axisColor, fontSize: 8 }, tickFormatter: v => numFmt(v, true) }),
          h(Tooltip, { content: h(Tt) }),
          h(Bar, { dataKey: "net", name: L.colDeg, label: false, children: gelirData.slice(-30).map((e, i) => h(Cell, { key: i, fill: e.net >= 0 ? "#3b82f6" : "#ef4444" })) })
        )
      )
    )
  );
}

