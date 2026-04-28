function NakitPage({ data, cashflow, ledger, t, styles, L }) {
  if (!data.length) return h("div", { style: styles.empty }, L.emptyNakit);
  const son = data[data.length - 1], ilk = data[0];

  const chartData = useMemo(() => {
    const s30 = data.slice(-30);
    const map = {};
    s30.forEach(d => { map[d.date] = { ...d, income: 0, expense: 0, hasLedger: false }; });
    if (ledger && ledger.length) {
      ledger.forEach(r => {
        const dStr = (r.Timestamp || "").slice(5, 10).replace("-", "/");
        if (map[dStr]) {
          const m = parseFloat(r.Money) || 0;
          if (m > 0) map[dStr].income += m;
          else map[dStr].expense += m;
          map[dStr].hasLedger = true;
        }
      });
    }
    return s30.map(d => {
      const c = map[d.date];
      if (!c.hasLedger) {
        if (c.nakitDeg > 0) c.income = c.nakitDeg;
        else if (c.nakitDeg < 0) c.expense = c.nakitDeg;
      }
      return c;
    });
  }, [data, ledger]);

  const formatKey = (k) => {
    const m = {
      revenue: L.cfRev, cogs: L.cfCogs, wages: L.cfWages, salary: L.cfSalary,
      admin: L.cfAdmin, administration: L.cfAdmin, accounting: L.cfAcc,
      transport: L.cfTrans, research: L.cfRes, buildings: L.cfBld, building: L.cfBld,
      interest: L.cfInt, bonds: L.cfBnd, marketFee: L.cfFee, taxes: L.cfTax, tax: L.cfTax,
      maintenance: L.cfMaintenance, upgrade: L.cfUpgrade, loan: L.cfLoan,
      dividend: L.cfDividend, fromRetail: L.cfFromRetail,
      cashAllIncome: L.cfCashAllIncome, cashAllExpenses: L.cfCashAllExpenses,
      toExchange: L.cfToExchange, toSuppliers: L.cfToSuppliers,
      forAccounting: L.cfForAccounting, retail: L.cfRetail,
      government: L.cfGovernment, marketSale: L.cfMarketSale, marketBuy: L.cfMarketBuy,
    };
    return m[k] || k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const SUMMARY_KEYS = new Set(['net', 'cashAllIncome', 'cashAllExpenses']);
  const cfEntries = cashflow && typeof cashflow === 'object'
    ? Object.entries(cashflow).filter(([k, v]) => typeof v === 'number' && !SUMMARY_KEYS.has(k) && v !== 0)
    : [];
  const inflows = cfEntries.filter(e => e[1] > 0).sort((a, b) => b[1] - a[1]);
  const outflows = cfEntries.filter(e => e[1] < 0).sort((a, b) => a[1] - b[1]);
  const totalInflow = (cashflow?.cashAllIncome > 0 ? cashflow.cashAllIncome : null)
    ?? inflows.reduce((s, [, v]) => s + v, 0);
  const totalOutflow = (cashflow?.cashAllExpenses < 0 ? cashflow.cashAllExpenses : null)
    ?? outflows.reduce((s, [, v]) => s + v, 0);
  const netCF = totalInflow + totalOutflow;

  const renderRow = (id, displayKey, val, color) => {
    return h("tr", { key: id },
      h("td", { style: { padding: "6px 8px", fontSize: 10, color: t.textMuted, borderBottom: `1px solid ${t.panelBorder}40` } }, displayKey),
      h("td", { style: { padding: "6px 8px", fontSize: 11, textAlign: "right", color: color || t.text, fontWeight: 700, borderBottom: `1px solid ${t.panelBorder}40` } }, numFmt(val))
    );
  };

  const NakitTT = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const inc = payload.find(p => p.dataKey === 'income');
    const exp = payload.find(p => p.dataKey === 'expense');
    const nkt = payload.find(p => p.dataKey === 'nakit');
    const nD = (inc?.value || 0) + (exp?.value || 0);
    return h("div", { style: { background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8, padding: "10px 14px", minWidth: 180, fontFamily: FONT_FAMILY, zIndex: 100 } },
      h("div", { style: { color: t.tooltipTitle, fontSize: 10, marginBottom: 6, borderBottom: `1px solid ${t.panelBorder}`, paddingBottom: 4 } }, label),
      inc && inc.value > 0 && h("div", { style: { color: inc.color, fontSize: 10, display: "flex", justifyContent: "space-between", marginBottom: 2 } },
        h("span", null, L.cfInflows || "Giriş"), h("span", { style: { fontWeight: 600 } }, "+" + numFmt(inc.value))
      ),
      exp && exp.value < 0 && h("div", { style: { color: exp.color, fontSize: 10, display: "flex", justifyContent: "space-between", marginBottom: 2 } },
        h("span", null, L.cfOutflows || "Çıkış"), h("span", { style: { fontWeight: 600 } }, numFmt(exp.value))
      ),
      h("div", { style: { color: nD >= 0 ? C.green : C.red, fontSize: 10, display: "flex", justifyContent: "space-between", marginBottom: 6, paddingBottom: 4, borderBottom: `1px dotted ${t.panelBorder}` } },
        h("span", null, L.colDegChange || "Net Değişim"), h("span", { style: { fontWeight: 700 } }, (nD >= 0 ? "+" : "") + numFmt(nD))
      ),
      nkt && h("div", { style: { color: nkt.color, fontSize: 11, display: "flex", justifyContent: "space-between" } },
        h("span", null, L.cGNakit || "Nakit"), h("span", { style: { fontWeight: 700 } }, numFmt(nkt.value))
      )
    );
  };

  const fmtCFDate = (iso) => {
    if (!iso) return "";
    try { const d = new Date(iso); return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }); } catch { return ""; }
  };
  const cfDateFrom = fmtCFDate(cashflow?.dateFrom);
  const cfDateTo = fmtCFDate(cashflow?.date);
  const cfDateRange = cfDateFrom && cfDateTo ? `${cfDateFrom} → ${cfDateTo}` : "";

  return h("div", null,
    h("div", { style: styles.sectionTitle }, L.sNakit),
    h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 } },
      h(StatCard, { label: L.cGNakit, value: numFmt(son.nakit, true), color: C.primary, t }),
      h(StatCard, { label: L.cGStok, value: numFmt(son.stok, true), color: C.amber, t }),
      h(StatCard, { label: L.cDonem, value: numFmt(ilk.nakit, true), sub: ilk.date, color: C.blue, t }),
      h(StatCard, { label: L.cNBuyume, value: numFmt(son.nakit - ilk.nakit, true), color: (son.nakit - ilk.nakit) >= 0 ? C.primary : C.red, t })
    ),
    h("div", { style: { display: "grid", gridTemplateColumns: cfEntries.length > 0 ? "1fr 1.2fr" : "1fr", gap: 14 } },
      cfEntries.length > 0 && h("div", { style: { ...styles.panel, marginBottom: 0 } },
        h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 } },
          h("div", { style: { ...styles.sectionTitle, marginBottom: 0 } }, L.sCashflow),
          cfDateRange && h("div", { style: { fontSize: 9, color: t.textMuted, background: t.page, border: `1px solid ${t.panelBorder}`, borderRadius: 6, padding: "3px 8px", letterSpacing: 0.5, fontFamily: FONT_FAMILY } }, cfDateRange)
        ),
        h("div", { style: { overflowX: "auto" } },
          h("table", { style: { width: "100%", borderCollapse: "collapse" } },
            h("tbody", null,
              inflows.length > 0 && h("tr", null, h("td", { colSpan: 2, style: { padding: "8px 8px 4px", fontSize: 9, fontWeight: 700, color: C.success, letterSpacing: 1, textTransform: "uppercase" } }, L.cfInflows)),
              ...inflows.map(([k, v]) => renderRow(k, formatKey(k), v, C.success)),
              outflows.length > 0 && h("tr", null, h("td", { colSpan: 2, style: { padding: "12px 8px 4px", fontSize: 9, fontWeight: 700, color: C.danger, letterSpacing: 1, textTransform: "uppercase" } }, L.cfOutflows)),
              ...outflows.map(([k, v]) => renderRow(k, formatKey(k), v, C.danger)),
              h("tr", null,
                h("td", { style: { padding: "10px 8px", fontSize: 11, fontWeight: 700, color: t.text, borderTop: `2px solid ${t.panelBorder}`, textTransform: "uppercase" } }, L.cfNet),
                h("td", { style: { padding: "10px 8px", fontSize: 12, fontWeight: 700, textAlign: "right", color: netCF >= 0 ? C.success : C.danger, borderTop: `2px solid ${t.panelBorder}` } }, numFmt(netCF))
              )
            )
          )
        )
      ),
      h("div", { style: { ...styles.panel, height: "100%", marginBottom: 0 } },
        h("div", { style: styles.sectionTitle }, L.grNakitDeg),
        h(ResponsiveContainer, { width: "100%", height: cfEntries.length > 0 ? 250 : 155 },
          h(ComposedChart, { data: chartData, margin: { top: 5, right: 5, left: 0, bottom: 5 }, stackOffset: "sign" },
            h(CartesianGrid, { strokeDasharray: "3 3", stroke: t.gridLine }),
            h(XAxis, { dataKey: "date", tick: { fill: t.axisColor, fontSize: 8 } }),
            h(YAxis, { yAxisId: "left", tick: { fill: t.axisColor, fontSize: 8 }, tickFormatter: v => numFmt(v, true) }),
            h(YAxis, { yAxisId: "right", orientation: "right", tick: { fill: t.axisColor, fontSize: 8 }, tickFormatter: v => numFmt(v, true) }),
            h(Tooltip, { content: h(NakitTT) }),
            h(Bar, { yAxisId: "left", dataKey: "income", name: L.cfInflows || "Gelir", fill: C.success, stackId: "a", radius: [2, 2, 0, 0] }),
            h(Bar, { yAxisId: "left", dataKey: "expense", name: L.cfOutflows || "Gider", fill: C.danger, stackId: "a", radius: [0, 0, 2, 2] }),
            h(Line, { yAxisId: "right", type: "monotone", dataKey: "nakit", name: L.cGNakit || "Nakit", stroke: C.primary, strokeWidth: 2, dot: false })
          )
        ),
        h("div", { style: { display: "flex", gap: 12, justifyContent: "center", marginTop: 12 } },
          h("div", { style: { display: "flex", alignItems: "center", gap: 5 } },
            h("div", { style: { width: 12, height: 12, borderRadius: 2, background: C.success } }),
            h("span", { style: { fontSize: 9, color: t.textMuted } }, L.cfInflows || "Gelir")
          ),
          h("div", { style: { display: "flex", alignItems: "center", gap: 5 } },
            h("div", { style: { width: 12, height: 12, borderRadius: 2, background: C.danger } }),
            h("span", { style: { fontSize: 9, color: t.textMuted } }, L.cfOutflows || "Gider")
          ),
          h("div", { style: { display: "flex", alignItems: "center", gap: 5 } },
            h("div", { style: { width: 22, height: 2.5, background: C.primary, borderRadius: 2 } }),
            h("span", { style: { fontSize: 9, color: t.textMuted } }, L.cGNakit || "Toplam Nakit")
          )
        )
      )
    )
  );
}
