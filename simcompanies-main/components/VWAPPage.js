function VWAPPage({ warehouseCSV, warehouseTR, warehouseEN, retailInfo, marketTicker, storage, t, styles, L, lang }) {
  const isDark = t.page === DARK.page;
  const Tt = (p) => h(TT, { ...p, t });

  // ── Yardımcı: storage item'ından kindId ve imageFile çıkar ──────────────
  const extractKindInfo = (item) => {
    if (!item) return { kindId: null, imageFile: null, apiName: "" };
    const isObj = typeof item.kind === "object" && item.kind !== null;
    const kindId = isObj
      ? (item.kind.db_letter ?? item.kind.dbLetter ?? item.kind.id ?? null)
      : (item.kind ?? null);
    const rawImg = isObj ? (item.kind.image || "") : "";
    const imageFile = rawImg.replace(/^.*\//, "").replace(/\.png$/, "") || null;
    const apiName = isObj ? (item.kind.name || "") : "";
    return { kindId, imageFile, apiName };
  };

  // ── Market Ticker VWAP haritası: kindId → fiyat ──────────────────────────
  const tickerImageMap = useMemo(() => {
    const map = {};
    if (marketTicker?.length) {
      marketTicker.forEach(item => {
        if (item.kind != null && item.image)
          map[item.kind] = item.image.replace(/^images\/resources\//, "").replace(/\.png$/, "");
      });
    }
    return map;
  }, [marketTicker]);

  // ── VWAP haritası: kindId → fiyat ────────────────────────────────────────
  const vwapMap = useMemo(() => {
    const map = {};
    if (marketTicker?.length) {
      marketTicker.forEach(item => {
        if (item.kind != null && item.price > 0) map[item.kind] = item.price;
      });
    }
    if (!Object.keys(map).length && retailInfo?.length) {
      retailInfo.forEach(item => {
        if (item.dbLetter != null && item.averagePrice > 0)
          map[item.dbLetter] = item.averagePrice;
      });
    }
    return map;
  }, [marketTicker, retailInfo]);
  // -- CSV index: storage[idx] = csvRows[idx] (ayni sira garantisi)
  const csvRows = useMemo(() => {
    const rows = warehouseEN?.length ? warehouseEN
      : warehouseTR?.length ? warehouseTR
        : (warehouseCSV ?? []);
    return rows.map(row => ({
      quality: parseInt(row.Quality) || 0,
      amount: parseFloat(row.Amount) || 0,
      totalCost: (parseFloat(row["Cost labor"]) || 0)
        + (parseFloat(row["Cost management"]) || 0)
        + (parseFloat(row["Cost 3rd party"]) || 0)
        + (parseFloat(row["Cost material 1"]) || 0)
        + (parseFloat(row["Cost material 2"]) || 0)
        + (parseFloat(row["Cost material 3"]) || 0)
        + (parseFloat(row["Cost material 4"]) || 0)
        + (parseFloat(row["Cost material 5"]) || 0),
    }));
  }, [warehouseCSV, warehouseTR, warehouseEN]);

  // -- Isim bazli fallback: csvRows[idx] basarisiz olursa devreye girer.
  const csvCostMap = useMemo(() => {
    const map = {};
    const EXTRA = {
      "İnşaat Gereci": 111, "Construction Units": 111,
      "Kereste": 108, "Planks": 108,
      "Silikon": 16, "Silicon": 16,
      "Taşıma": 13, "Transport": 13,
      "Lüks Saat": 70, "Gold Watch": 70,
      "Ramazan Şekeri": 152, "Ramadan Sweets": 152,
      "Altın Külçe": 69, "Golden Bars": 69,
    };
    const nameToId = (name) => {
      if (!name) return null;
      if (EXTRA[name]) return EXTRA[name];
      const low = name.toLowerCase();
      for (const [id, info] of Object.entries(URUN_KIND)) {
        if (info.name === name || info.tr === name) return parseInt(id);
      }
      for (const [id, info] of Object.entries(URUN_KIND)) {
        if (info.name.toLowerCase() === low || info.tr.toLowerCase() === low) return parseInt(id);
      }
      const norm = s => s.toLowerCase().replace(/lar[\u0131i]?$|ler[\u0131i]?$|s$/g, "").trim();
      const nName = norm(name);
      for (const [id, info] of Object.entries(URUN_KIND)) {
        if (norm(info.name) === nName || norm(info.tr) === nName) return parseInt(id);
      }
      return null;
    };
    const processRows = (rows) => {
      if (!rows?.length) return;
      rows.forEach(row => {
        const resName = (row.Resource || "").trim();
        const quality = parseInt(row.Quality) || 0;
        const amount = parseFloat(row.Amount) || 0;
        if (!resName || amount <= 0) return;
        const kindId = nameToId(resName);
        if (!kindId) return;
        const key = `${kindId}_${quality}`;
        if (map[key]) return;
        const totalCost = (parseFloat(row["Cost labor"]) || 0)
          + (parseFloat(row["Cost management"]) || 0)
          + (parseFloat(row["Cost 3rd party"]) || 0)
          + (parseFloat(row["Cost material 1"]) || 0)
          + (parseFloat(row["Cost material 2"]) || 0)
          + (parseFloat(row["Cost material 3"]) || 0)
          + (parseFloat(row["Cost material 4"]) || 0)
          + (parseFloat(row["Cost material 5"]) || 0);
        map[key] = { totalCost, amount };
      });
    };
    // EN önce, TR sonra, genel CSV en sona (fallback)
    processRows(warehouseEN);
    processRows(warehouseTR);
    processRows(warehouseCSV);
    return map;
  }, [warehouseCSV, warehouseTR, warehouseEN]);

  // ── Ana işlem: Storage API → tüm depo ürünleri ─────────────────────────
  const processed = useMemo(() => {
    if (!storage?.length) return null;

    const seen = new Set();
    const items = storage.map((item, idx) => {
      const amount = parseFloat(item.amount) || 0;
      if (amount <= 0) return null;

      const { kindId, imageFile: storageImg, apiName } = extractKindInfo(item);
      const quality = item.quality ?? 0;
      if (kindId == null) return null;

      // Aynı kindId+quality çiftini bir kez ekle
      const dedupKey = `${kindId}_${quality}`;
      if (seen.has(dedupKey)) return null;
      seen.add(dedupKey);

      const ukind = URUN_KIND[kindId];
      const fileForImage = storageImg || tickerImageMap[kindId] || ukind?.file || null;
      const displayName = lang === "TR"
        ? (ukind?.tr || apiName || ukind?.name || String(kindId))
        : (ukind?.name || apiName || String(kindId));

      // ── Maliyet çözümleme (3 katmanlı)
      // 1) Storage API'nin kendi alanı (unit_cost, uv, cost ...)
      // 2) Index eşleştirmesi: csvRows[idx] — quality doğrulamasıyla
      // 3) İsim bazlı harita (csvCostMap) — son çare
      let totalCost = 0, unitCost = 0;
      const rawUnitCost = item.unit_cost ?? item.unitCost ?? item.uv ?? item.cost ?? item.unit_price ?? null;
      if (rawUnitCost != null && rawUnitCost > 0) {
        unitCost = parseFloat(rawUnitCost);
        totalCost = unitCost * amount;
      } else if (csvRows[idx]?.totalCost > 0 && csvRows[idx].quality === quality) {
        totalCost = csvRows[idx].totalCost;
        unitCost = amount > 0 ? totalCost / amount : 0;
      } else {
        const costEntry = csvCostMap[dedupKey] ?? csvCostMap[`${kindId}_0`];
        totalCost = costEntry?.totalCost ?? 0;
        unitCost = amount > 0 ? totalCost / amount : 0;
      }

      // VWAP ve hesaplamalar
      const vwap = vwapMap[kindId] ?? 0;
      const target85 = vwap * 0.85;
      const vaPerUnit = vwap > 0 ? target85 - unitCost : 0;
      const vaTotal = vaPerUnit * amount;
      const marketValue = vwap * amount;

      return {
        displayName, quality, amount, unitCost, totalCost,
        file: fileForImage, kindId,
        vwap, target85, vaPerUnit, vaTotal, marketValue,
        status: vwap === 0 ? "nodata" : vaPerUnit >= 0 ? "profit" : "loss",
      };
    }).filter(Boolean);

    if (!items.length) return null;

    items.sort((a, b) => {
      if (a.vwap > 0 && b.vwap === 0) return -1;
      if (a.vwap === 0 && b.vwap > 0) return 1;
      return b.vaTotal - a.vaTotal;
    });

    const totalVA = items.reduce((s, i) => s + i.vaTotal, 0);
    const totalCostAll = items.reduce((s, i) => s + i.totalCost, 0);
    const totalMV = items.reduce((s, i) => s + i.marketValue, 0);
    const profitCount = items.filter(i => i.status === "profit").length;
    const lossCount = items.filter(i => i.status === "loss").length;

    const barData = [...items]
      .sort((a, b) => Math.abs(b.vaTotal) - Math.abs(a.vaTotal))
      .slice(0, 10)
      .map(i => ({ name: i.displayName + (i.quality > 0 ? " Q" + i.quality : ""), value: Math.round(i.vaTotal) }));

    const profitTotal = items.filter(i => i.status === "profit").reduce((s, i) => s + i.vaTotal, 0);
    const lossTotal = items.filter(i => i.status === "loss").reduce((s, i) => s + Math.abs(i.vaTotal), 0);
    const pieData = [
      { name: L.vKarliTag, value: Math.round(Math.abs(profitTotal)) },
      { name: L.vZararliTag, value: Math.round(Math.abs(lossTotal)) },
    ].filter(d => d.value > 0);

    return { items, totalVA, totalCostAll, totalMV, profitCount, lossCount, barData, pieData };
  }, [storage, csvRows, csvCostMap, vwapMap, tickerImageMap, lang, L]);

  if (!processed) {
    return h("div", { style: styles.empty },
      h("div", { style: { fontSize: 24, marginBottom: 10 } }, "📊"),
      h("div", { style: { fontSize: 11 } }, L.vEmpty)
    );
  }

  const { items, totalVA, totalCostAll, totalMV, profitCount, lossCount, barData, pieData } = processed;
  const PIE_COLORS = [C.primary, C.red];

  return h("div", null,
    h("div", { style: styles.sectionTitle }, L.vTitle),

    // Aciklama
    h("div", { style: { ...styles.panel, padding: "8px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, borderLeft: "3px solid #7c3aed" } },
      h("span", { style: { fontSize: 14 } }, "ℹ️"),
      h("span", { style: { fontSize: 9, color: t.textMuted, letterSpacing: 0.5 } }, L.vAciklama)
    ),

    // Stat Cards
    h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 } },
      h(StatCard, {
        label: L.vTopVA,
        value: (totalVA >= 0 ? "+" : "") + "$" + numFmt(totalVA, true),
        color: totalVA >= 0 ? C.primary : C.red, t
      }),
      h(StatCard, {
        label: L.vTopMV,
        value: "$" + numFmt(totalMV, true),
        sub: L.cToplamMal + ": $" + numFmt(totalCostAll, true),
        color: C.blue, t
      }),
      h(StatCard, {
        label: L.vKarli,
        value: profitCount,
        sub: items.length + " " + L.wUrunCesidi.toLowerCase(),
        color: C.primary, t
      }),
      h(StatCard, {
        label: L.vZararli,
        value: lossCount,
        color: C.red, t
      })
    ),

    // Grafik satiri
    h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 14, marginBottom: 16 } },

      // Pie
      h("div", { style: styles.panel },
        h("div", { style: styles.sectionTitle }, L.vPie),
        h(ResponsiveContainer, { width: "100%", height: 200 },
          h(PieChart, { margin: { top: 5, right: 5, left: 5, bottom: 5 } },
            h(Pie, { data: pieData, cx: "50%", cy: "50%", innerRadius: 50, outerRadius: 85, dataKey: "value", nameKey: "name" },
              ...pieData.map((_, i) => h(Cell, { key: i, fill: PIE_COLORS[i % PIE_COLORS.length] }))
            ),
            h(Tooltip, { content: h(Tt) })
          )
        ),
        // Center text
        h("div", { style: { textAlign: "center", marginTop: -95, marginBottom: 55, pointerEvents: "none" } },
          h("div", { style: { fontSize: 12, fontWeight: 700, color: totalVA >= 0 ? C.primary : C.red } },
            (totalVA >= 0 ? "+" : "") + "$" + numFmt(Math.abs(totalVA), true)
          ),
          h("div", { style: { fontSize: 8, color: t.textFaint, marginTop: 2 } }, "VA")
        )
      ),

      // Bar
      h("div", { style: styles.panel },
        h("div", { style: styles.sectionTitle }, L.vBar),
        h(ResponsiveContainer, { width: "100%", height: 230 },
          h(BarChart, { data: barData, layout: "vertical", margin: { top: 4, right: 20, left: 4, bottom: 4 } },
            h(CartesianGrid, { strokeDasharray: "3 3", stroke: t.gridLine, horizontal: false }),
            h(XAxis, { type: "number", tick: { fill: t.axisColor, fontSize: 8 }, tickFormatter: v => numFmt(v, true), axisLine: false, tickLine: false }),
            h(YAxis, {
              type: "category", dataKey: "name",
              tick: { fill: t.axisColor, fontSize: 8, fontFamily: FONT_FAMILY },
              width: Math.min(120, Math.max(70, barData.length ? Math.max(...barData.map(d => (d.name || "").length)) * 5.5 : 70)),
              tickLine: false, axisLine: false,
              tickFormatter: v => v && v.length > 16 ? v.slice(0, 14) + "…" : v
            }),
            h(Tooltip, { content: h(Tt) }),
            h(Bar, { dataKey: "value", name: "VA", radius: [0, 4, 4, 0], barSize: 16 },
              ...barData.map((d, i) => h(Cell, { key: i, fill: d.value >= 0 ? C.primary : C.red }))
            )
          )
        )
      )
    ),

    // Ana Tablo
    h("div", { style: styles.panel },
      h("div", { style: styles.sectionTitle }, L.vTablo),
      h("div", { style: { overflowX: "auto", maxWidth: "100%" } },
        h("table", { style: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed" } },
          h("thead", null,
            h("tr", { style: { background: isDark ? DARK.tableHeaderBg : LIGHT.tableHeaderBg } },
              ...[L.wUrun, L.wKalite, L.wAdet, L.vBirimMal, L.vVwap, L.vHedef, L.vVaBirim, L.vVaTop, L.vDurum].map((hd, i) => {
                const cols = [C.primary, C.purple, C.blue, C.amber, C.cyan, C.green, C.amber, C.primary, C.purple];
                return h("th", {
                  key: i,
                  style: {
                    padding: "8px 6px", textAlign: i === 0 ? "left" : "right",
                    color: cols[i], fontSize: 9, letterSpacing: 1, fontWeight: 700,
                    whiteSpace: "nowrap",
                    borderBottom: `2px solid ${cols[i]}`,
                    borderTop: `2px solid ${cols[i]}`,
                    background: `${cols[i]}18`,
                  }
                }, hd);
              })
            )
          ),
          h("tbody", null,
            ...items.map((item, ri) => {
              const rowBg = ri % 2 === 0
                ? (isDark ? "transparent" : LIGHT.rowDefaultBg)
                : (isDark ? DARK.rowAltBg : LIGHT.rowAltBg);
              const vaColor = item.status === "nodata" ? t.textFaint : (item.vaPerUnit >= 0 ? C.primary : C.red);

              return h("tr", { key: ri, style: { background: rowBg } },
                // Urun
                h("td", { style: { padding: "7px 6px", borderBottom: `1px solid ${t.panelBorder}`, display: "flex", alignItems: "center", gap: 6 } },
                  h(UrunImg, { file: item.file, size: 20 }),
                  h("span", { style: { fontSize: 10, fontWeight: 600, color: C.primary } }, item.displayName)
                ),
                // Kalite
                h("td", { style: { padding: "7px 6px", textAlign: "right", fontSize: 10, color: C.purple, borderBottom: `1px solid ${t.panelBorder}`, fontWeight: 600 } },
                  item.quality > 0 ? h("span", { style: { background: "#7c3aed20", padding: "2px 6px", borderRadius: 4 } }, "Q" + item.quality) : "—"
                ),
                // Adet
                h("td", { style: { padding: "7px 6px", textAlign: "right", fontSize: 10, color: C.blue, borderBottom: `1px solid ${t.panelBorder}`, fontWeight: 600 } }, numFmt(item.amount)),
                // Birim Maliyet
                h("td", { style: { padding: "7px 6px", textAlign: "right", fontSize: 10, color: C.amber, borderBottom: `1px solid ${t.panelBorder}` } }, "$" + numFmt(item.unitCost)),
                // VWAP
                h("td", { style: { padding: "7px 6px", textAlign: "right", fontSize: 10, color: item.vwap > 0 ? C.cyan : t.textFaint, borderBottom: `1px solid ${t.panelBorder}`, fontWeight: 600 } },
                  item.vwap > 0 ? "$" + numFmt(item.vwap) : "—"
                ),
                // Hedef %85
                h("td", { style: { padding: "7px 6px", textAlign: "right", fontSize: 10, color: item.vwap > 0 ? C.green : t.textFaint, borderBottom: `1px solid ${t.panelBorder}` } },
                  item.vwap > 0 ? "$" + numFmt(item.target85) : "—"
                ),
                // VA/Birim
                h("td", { style: { padding: "7px 6px", textAlign: "right", fontSize: 10, color: vaColor, borderBottom: `1px solid ${t.panelBorder}`, fontWeight: 600 } },
                  item.vwap > 0 ? ((item.vaPerUnit >= 0 ? "+" : "") + "$" + numFmt(item.vaPerUnit)) : "—"
                ),
                // VA Toplam
                h("td", { style: { padding: "7px 6px", textAlign: "right", fontSize: 11, color: vaColor, borderBottom: `1px solid ${t.panelBorder}`, fontWeight: 700 } },
                  item.vwap > 0 ? ((item.vaTotal >= 0 ? "+" : "") + "$" + numFmt(item.vaTotal, true)) : "—"
                ),
                // Durum
                h("td", { style: { padding: "7px 6px", textAlign: "right", fontSize: 9, borderBottom: `1px solid ${t.panelBorder}` } },
                  h("span", {
                    style: {
                      display: "inline-block", padding: "2px 8px", borderRadius: 10,
                      background: item.status === "profit" ? "#00d4a820" : item.status === "loss" ? "#ef444420" : (isDark ? "#ffffff10" : "#00000010"),
                      color: item.status === "profit" ? C.primary : item.status === "loss" ? C.red : t.textFaint,
                      fontWeight: 600, fontSize: 8, letterSpacing: 0.5,
                    }
                  }, item.status === "profit" ? ("✓ " + L.vKarliTag) : item.status === "loss" ? ("✗ " + L.vZararliTag) : "— N/A")
                )
              );
            }),
            // Toplam satiri
            h("tr", { style: { background: isDark ? (totalVA >= 0 ? DARK.goalPositiveBg : DARK.goalNegativeBg) : (totalVA >= 0 ? LIGHT.goalPositiveBg : LIGHT.goalNegativeBg) } },
              h("td", { colSpan: 6, style: { padding: "9px 6px", fontSize: 11, fontWeight: 700, color: totalVA >= 0 ? C.primary : C.red, borderTop: `2px solid ${totalVA >= 0 ? "#00d4a840" : "#ef444440"}`, letterSpacing: 1 } }, L.vToplamVA),
              h("td", null),
              h("td", { style: { padding: "9px 6px", textAlign: "right", fontSize: 12, fontWeight: 700, color: totalVA >= 0 ? C.primary : C.red, borderTop: `2px solid ${totalVA >= 0 ? "#00d4a840" : "#ef444440"}` } },
                (totalVA >= 0 ? "+" : "") + "$" + numFmt(totalVA, true)
              ),
              h("td", null)
            )
          )
        )
      )
    )
  );
}
