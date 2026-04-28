function MasterDataPage({ bilancoData, gelirData, t, styles, L }) {
  if (!bilancoData.length) return h("div", { style: styles.empty }, L.emptyBilanco);
  const [view, setView] = React.useState("balance");

  const mergedData = React.useMemo(() => {
    const gelirMap = {};
    gelirData.forEach(g => { gelirMap[g.date] = g; });
    return [...bilancoData].reverse().slice(0, 60).map(b => ({
      ...b,
      net: gelirMap[b.date]?.net ?? null,
      kumulatif: gelirMap[b.date]?.kumulatif ?? null,
    }));
  }, [bilancoData, gelirData]);

  const son = bilancoData[bilancoData.length - 1];
  const Tt = (p) => h(TT, { ...p, t });

  const vBtn = (id, label) => h("button", {
    key: id,
    onClick: () => setView(id),
    style: {
      background: view === id ? `${C.primary}15` : "transparent",
      border: `1px solid ${view === id ? C.primary : t.panelBorder}`,
      borderRadius: 6, 
      cursor: "pointer", 
      padding: "5px 14px",
      fontSize: 9, 
      letterSpacing: 1,
      color: view === id ? C.primary : t.textMuted,
      fontFamily: FONT_FAMILY,
      transition: "all .15s",
    }
  }, label);

  const COLS = {
    date: { key: "date", label: L.colTarih, color: "C.dateColor", fmt: v => v },
    nakit: { key: "nakit", label: L.colNakit, color: "C.primary", fmt: v => numFmt(v) },
    stok: { key: "stok", label: L.colStok, color: "C.amber", fmt: v => numFmt(v) },
    binalar: { key: "binalar", label: L.colBina, color: "C.blue", fmt: v => numFmt(v) },
    patent: { key: "patentler", label: L.colPatent, color: "C.purple", fmt: v => numFmt(v) },
    total: { key: "total", label: L.colToplam, color: "C.primary", fmt: v => numFmt(v), bold: true },
    rank: { key: "rank", label: L.colRank, color: "C.slate", fmt: v => "#" + numFmt(v) },
    net: { key: "net", label: L.colDegChange, color: "C.green", fmt: v => v == null ? "—" : numFmt(v), dynamic: true },
    kumul: { key: "kumulatif", label: L.colCumul, color: "C.cyan", fmt: v => v == null ? "—" : numFmt(v) },
    curA: { key: "currentAssets", label: L.colDong, color: "C.orange", fmt: v => numFmt(v) },
    nonCurA: { key: "nonCurrentAssets", label: L.colDongD, color: "C.pink", fmt: v => numFmt(v) },
  };

  const viewCols = {
    balance: ["date", "nakit", "stok", "binalar", "patent", "total", "rank"],
    change: ["date", "net", "kumul", "total"],
    assets: ["date", "nakit", "stok", "curA", "nonCurA", "total"],
    full: ["date", "nakit", "stok", "total", "rank", "net", "kumul"],
  };
  const activeCols = viewCols[view].map(k => COLS[k]);

  const ChartSection = () => {
    if (view === "balance") return h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 } },
      h("div", { style: styles.panel },
        h("div", { style: styles.sectionTitle }, L.grVarlikNakit),
        h(ResponsiveContainer, { width: "100%", height: 150 },
          h(LineChart, { data: bilancoData.slice(-60), margin: { top: 5, right: 5, left: 0, bottom: 5 } },
            h(CartesianGrid, { strokeDasharray: "3 3", stroke: t.gridLine }),
            h(XAxis, { dataKey: "date", tick: { fill: t.axisColor, fontSize: 8 } }),
            h(YAxis, { tick: { fill: t.axisColor, fontSize: 8 }, tickFormatter: v => numFmt(v, true) }),
            h(Tooltip, { content: h(Tt) }),
            h(Line, { type: "monotone", dataKey: "total", name: L.cToplam, stroke: "#3b82f6", strokeWidth: 2, dot: false }),
            h(Line, { type: "monotone", dataKey: "nakit", name: L.cNakit, stroke: "#10b981", strokeWidth: 1, strokeDasharray: "4 4", dot: false })
          )
        )
      ),
      h("div", { style: styles.panel },
        h("div", { style: styles.sectionTitle }, L.grVarlikDag),
        h(ResponsiveContainer, { width: "100%", height: 130 },
          h(PieChart, { margin: { top: 5, right: 5, left: 5, bottom: 5 } },
            h(Pie, {
              data: [
                { name: L.cNakit, value: son.nakit }, { name: L.cStok, value: son.stok },
                { name: L.cBina, value: son.binalar }, { name: L.cPatent, value: son.patentler }
              ].filter(d => d.value > 0), cx: "50%", cy: "50%", innerRadius: 35, outerRadius: 60, dataKey: "value", nameKey: "name"
            },
              ...([son.nakit, son.stok, son.binalar, son.patentler]).filter(v => v > 0).map((_, i) => h(Cell, { key: i, fill: COLORS[i % COLORS.length] }))
            ),
            h(Tooltip, { content: h(Tt) })
          )
        ),
        h("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 4 } },
          ...[L.cNakit, L.cStok, L.cBina, L.cPatent].map((name, i) =>
            h("div", { key: i, style: { display: "flex", alignItems: "center", gap: 3 } },
              h("div", { style: { width: 6, height: 6, borderRadius: 1, background: COLORS[i] } }),
              h("span", { style: { fontSize: 8, color: t.textMuted } }, name)
            )
          )
        )
      )
    );

    if (view === "change") return h("div", { style: styles.panel, marginBottom: 12 },
      h("div", { style: styles.sectionTitle }, L.grDegTrend),
      h(ResponsiveContainer, { width: "100%", height: 150 },
        h(BarChart, { data: gelirData.slice(-30), margin: { top: 5, right: 5, left: 0, bottom: 5 } },
          h(CartesianGrid, { strokeDasharray: "3 3", stroke: t.gridLine }),
          h(XAxis, { dataKey: "date", tick: { fill: t.axisColor, fontSize: 8 } }),
          h(YAxis, { tick: { fill: t.axisColor, fontSize: 8 }, tickFormatter: v => numFmt(v, true) }),
          h(Tooltip, { content: h(Tt) }),
          h(Bar, { dataKey: "net", name: L.colDeg }, ...gelirData.slice(-30).map((e, i) => h(Cell, { key: i, fill: e.net >= 0 ? "#3b82f6" : "#ef4444" })))
        )
      )
    );

    if (view === "assets") return h("div", { style: styles.panel, marginBottom: 12 },
      h("div", { style: styles.sectionTitle }, L.grStok),
      h(ResponsiveContainer, { width: "100%", height: 150 },
        h(AreaChart, { data: bilancoData.slice(-60), margin: { top: 5, right: 5, left: 0, bottom: 5 } },
          h("defs", null,
            h("linearGradient", { id: "ug2", x1: "0", y1: "0", x2: "0", y2: "1" }, 
              h("stop", { offset: "5%", stopColor: "#f59e0b", stopOpacity: 0.3 }), 
              h("stop", { offset: "95%", stopColor: "#f59e0b", stopOpacity: 0 })
            ),
            h("linearGradient", { id: "ug3", x1: "0", y1: "0", x2: "0", y2: "1" }, 
              h("stop", { offset: "5%", stopColor: "#3b82f6", stopOpacity: 0.3 }), 
              h("stop", { offset: "95%", stopColor: "#3b82f6", stopOpacity: 0 })
            )
          ),
          h(CartesianGrid, { strokeDasharray: "3 3", stroke: t.gridLine }),
          h(XAxis, { dataKey: "date", tick: { fill: t.axisColor, fontSize: 8 } }),
          h(YAxis, { tick: { fill: t.axisColor, fontSize: 8 }, tickFormatter: v => numFmt(v, true) }),
          h(Tooltip, { content: h(Tt) }),
          h(Area, { type: "monotone", dataKey: "stok", name: L.cStok, stroke: "#f59e0b", fill: "url(#ug2)", strokeWidth: 2, dot: false }),
          h(Area, { type: "monotone", dataKey: "nakit", name: L.cNakit, stroke: "#3b82f6", fill: "url(#ug3)", strokeWidth: 1, dot: false })
        )
      )
    );

    if (view === "full") return h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 } },
      h("div", { style: styles.panel },
        h("div", { style: styles.sectionTitle }, L.grVarlikNakit),
        h(ResponsiveContainer, { width: "100%", height: 130 },
          h(LineChart, { data: bilancoData.slice(-60), margin: { top: 5, right: 5, left: 0, bottom: 5 } },
            h(CartesianGrid, { strokeDasharray: "3 3", stroke: t.gridLine }),
            h(XAxis, { dataKey: "date", tick: { fill: t.axisColor, fontSize: 8 } }),
            h(YAxis, { tick: { fill: t.axisColor, fontSize: 8 }, tickFormatter: v => numFmt(v, true) }),
            h(Tooltip, { content: h(Tt) }),
            h(Line, { type: "monotone", dataKey: "total", name: L.cToplam, stroke: "#3b82f6", strokeWidth: 2, dot: false }),
            h(Line, { type: "monotone", dataKey: "nakit", name: L.cNakit, stroke: "#10b981", strokeWidth: 1, strokeDasharray: "4 4", dot: false })
          )
        )
      ),
      h("div", { style: styles.panel },
        h("div", { style: styles.sectionTitle }, L.grDegTrend),
        h(ResponsiveContainer, { width: "100%", height: 130 },
          h(BarChart, { data: gelirData.slice(-30), margin: { top: 5, right: 5, left: 0, bottom: 5 } },
            h(CartesianGrid, { strokeDasharray: "3 3", stroke: t.gridLine }),
            h(XAxis, { dataKey: "date", tick: { fill: t.axisColor, fontSize: 8 } }),
            h(YAxis, { tick: { fill: t.axisColor, fontSize: 8 }, tickFormatter: v => numFmt(v, true) }),
            h(Tooltip, { content: h(Tt) }),
            h(Bar, { dataKey: "net", name: L.colDeg }, ...gelirData.slice(-30).map((e, i) => h(Cell, { key: i, fill: e.net >= 0 ? "#3b82f6" : "#ef4444" })))
          )
        )
      )
    );

    return null;
  };

  return h("div", null,
    h("div", { style: { display: "flex", gap: 8, marginBottom: 14, alignItems: "center" } },
      h("div", { style: { fontSize: 9, color: t.textMuted, letterSpacing: 1, marginRight: 4 } }, L.tblMaster + " →"),
      vBtn("balance", L.vBalance),
      vBtn("change", L.vChange),
      vBtn("assets", L.vAssets),
      vBtn("full", L.vFull),
    ),
    h(ChartSection),
    h("div", { style: styles.panel },
      h("div", { style: { overflowX: "hidden", maxWidth: "100%", width: "100%" } },
        h("table", { style: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed" } },
          h("thead", null,
            h("tr", { style: { background: t.tableHeaderBg } },
              ...activeCols.map((col, ci) =>
                h("th", {
                  key: col.key, style: {
                    padding: "8px 8px",
                    textAlign: ci === 0 ? "left" : "right",
                    color: t.text,
                    fontSize: 9,
                    letterSpacing: 1,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    borderBottom: `2px solid ${C.primary}`,
                    borderTop: `2px solid ${C.primary}`,
                    borderLeft: `2px solid ${C.primary}50`,
                    background: `${C.primary}18`,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }
                }, col.label)
              )
            )
          ),
          h("tbody", null,
            ...mergedData.map((row, i) => {
              const rowBg = i % 2 === 0 ? t.rowDefaultBg : t.rowAltBg;
              return h("tr", {
                key: i,
                style: { background: rowBg, transition: "background .1s" },
              },
                ...activeCols.map((col, ci) => {
                  const val = row[col.key];
                  const isDate = ci === 0;
                  const isTotal = col.bold;
                  
                  let cellColor = t.text;
                  if (col.dynamic && col.key === "net") {
                    cellColor = val == null ? t.textMuted : val >= 0 ? C.success : C.danger;
                  } else if (isDate) {
                    cellColor = t.textMuted;
                  }
                  
                  const cellBg = isDate ? "transparent" : `${C.primary}08`;
                  
                  return h("td", {
                    key: col.key,
                    style: {
                      padding: "7px 8px",
                      color: cellColor,
                      textAlign: isDate ? "left" : "right",
                      fontSize: isTotal ? 11 : 10,
                      fontWeight: isTotal ? 700 : (isDate ? 500 : 500),
                      borderBottom: `1px solid ${t.panelBorder}`,
                      borderLeft: `2px solid ${C.primary}50`,
                      background: cellBg,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      letterSpacing: isDate ? 0.5 : 0,
                    }
                  }, col.fmt(val));
                })
              );
            })
          )
        )
      )
    )
  );
}


