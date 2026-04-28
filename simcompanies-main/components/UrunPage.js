function UrunPage({ ledger, t, styles, L, lang }) {
  const [ceviriTetikleyici, setCeviriTetikleyici] = React.useState(0);

  // chrome.storage.local'dan kalıcı çeviri cache'ini yükle
  React.useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get(["dynDictEN", "dynDictTR"], (res) => {
        if (res.dynDictEN) Object.assign(DYNAMIC_DICT.EN, res.dynDictEN);
        if (res.dynDictTR) Object.assign(DYNAMIC_DICT.TR, res.dynDictTR);
        setCeviriTetikleyici(p => p + 1);
      });
    }
  }, []);

  const { urunler, kategoriler, gunluk, bilinmeyenler, unknownCategories } = React.useMemo(() => {
    if (!ledger?.length) return { urunler: [], kategoriler: [], gunluk: [], bilinmeyenler: [], unknownCategories: new Set() };
    const uM = {}, kM = {}, gM = {};
    const bilinmeyenKumesi = new Set();
    const unknownCategoriesSet = new Set();

    ledger.forEach(r => {
      const money = parseFloat(r.Money) || 0, cat = r.Category || "", desc = r.Description || "", tarih = (r.Timestamp || "").slice(0, 10);
      const translatedCatName = katName(cat, L, lang);
      if (translatedCatName === cat) {
        unknownCategoriesSet.add(cat);
      }
      kM[translatedCatName] = (kM[translatedCatName] || 0) + money;

      const catLow = cat.toLowerCase();
      const isSale = (catLow === "sales" || catLow === "market" || catLow === "contract" || catLow === "trading" || catLow === "retail" || catLow === "government orders" || catLow === "government orders deposit" || catLow === "government" || catLow === "satışlar" || catLow === "satislar" || catLow === "perakende" || catLow === "pazar" || catLow === "kontrat" || catLow === "ticaret") && money > 0;
      if (isSale) {
        if (!gM[tarih]) gM[tarih] = 0;
        gM[tarih] += money;
        let uaRaw = desc.replace(/\s+sat[ıi][sş]lar[ıi]?$/i, "").replace(/\s+sales?$/i, "").replace(/\s+sati[sş]i?$/i, "").trim() || desc;

        let descQty = 0;
        const qMatch = desc.match(/([\d,.]+)\s*x\s+/i);
        if (qMatch) {
          descQty = parseFloat(qMatch[1].replace(/,/g, ''));
        }

        uaRaw = uaRaw.replace(/^(Market|Pazar|Contract|Kontrat|Sales|Satışlar|Satislar):\s*/i, "").trim();
        uaRaw = uaRaw.replace(/^[\d,.]+\s*x\s+/i, "").trim();
        // TR: "Ramazan Şekeri kontratı COLDEX tarafından imzalandı" → "Ramazan Şekeri"
        uaRaw = uaRaw.replace(/\s+kontra[tı]+\s+.+$/i, "").trim();
        // EN: "Ramadan Sweets contract signed by COLDEX" → "Ramadan Sweets"
        uaRaw = uaRaw.replace(/\s+contract\s+signed\s+by\s+.+$/i, "").trim();
        // TR: "X satışları" → "X"
        uaRaw = uaRaw.replace(/\s+sat[ıi][sş]lar[ıi]?$/i, "").trim();
        // EN: "X sales" → "X"
        uaRaw = uaRaw.replace(/\s+sales?$/i, "").trim();
        // Any remaining "... tarafından ..." → strip from tarafından onwards
        uaRaw = uaRaw.replace(/\s+taraf[ıi]ndan\s+.+$/i, "").trim();
        // Any remaining "... by ..." → strip from " by " onwards
        uaRaw = uaRaw.replace(/\s+by\s+\S+.*/i, "").trim();

        if (!uM[uaRaw]) uM[uaRaw] = { gelir: 0, islem: 0, cogs: 0, adet: 0 };
        uM[uaRaw].gelir += money; uM[uaRaw].islem += 1;

        // bilmeyenler: URUN_KIND lookup'ı da başarısız olanları ekle
        if (lang === "EN" && urunCevir(uaRaw, "EN") === uaRaw) {
          bilinmeyenKumesi.add(uaRaw);
        } else if (lang === "TR" && urunCevir(uaRaw, "TR") === uaRaw) {
          bilinmeyenKumesi.add(uaRaw);
        }

        try {
          const detailsKey = Object.keys(r).find(k => k.toLowerCase().includes("detail") || k.toLowerCase().includes("detay"));
          const raw = detailsKey ? r[detailsKey] : (r.Details || Object.values(r).find(v => typeof v === 'string' && v.includes('{') && v.includes('}')) || "");

          let cl = raw.trim();
          if (cl.startsWith('"') && cl.endsWith('"')) cl = cl.slice(1, -1);
          cl = cl.replace(/""/g, '"').replace(/\\"/g, '"');

          let d = {};
          try {
            d = JSON.parse(cl) || {};
          } catch (err) { }

          const extractNum = (str, keys) => {
            const rx = new RegExp(`(?:""|"|\\\\")?(?:${keys.join('|')})(?:""|"|\\\\")?\\s*:\\s*([\\d.]+)`, 'i');
            const m = str.match(rx);
            return m ? parseFloat(m[1]) : 0;
          };

          let qty = d.amount || d.quantity || d.units || d.qty || d.count || d.sold || d.miktar || d.adet || extractNum(cl, ['amount', 'quantity', 'units', 'qty', 'count', 'sold', 'miktar', 'adet']);
          if (!qty && descQty) {
            qty = descQty;
          }

          let totalCogs = d.cogs || d.cost || d.maliyet || extractNum(cl, ['cogs', 'cost', 'maliyet']);
          let unitCogs = d.unit_cogs || d.unitCogs || d.birim_maliyet || extractNum(cl, ['unit_cogs', 'unitCogs', 'birim_maliyet']);

          if (!totalCogs && unitCogs && qty) {
            totalCogs = unitCogs * qty;
          }
          if (!qty && totalCogs && unitCogs) {
            qty = totalCogs / unitCogs;
          }

          let price = d.price || d.fiyat || extractNum(cl, ['price', 'fiyat']);
          if (!qty && price && money > 0) {
            qty = money / price;
          }

          if (totalCogs) uM[uaRaw].cogs += parseFloat(totalCogs) || 0;
          if (qty) uM[uaRaw].adet += parseFloat(qty) || 0;
        } catch (e) { }
      }
    });

    const urunler = Object.entries(uM).map(([adTR, d]) => {
      const adet = d.adet || 0;
      const ortCogs = adet > 0 ? d.cogs / adet : (d.islem > 0 ? d.cogs / d.islem : 0);
      const birimSatisFiyati = adet > 0 ? d.gelir / adet : 0;
      const birimKar = birimSatisFiyati - ortCogs;
      const brutKar = adet > 0 ? birimKar * adet : (d.gelir - d.cogs);
      const karMarji = birimSatisFiyati > 0 ? (birimKar / birimSatisFiyati) * 100 : 0;

      return {
        adTR, ad: urunCevir(adTR, lang), gelir: d.gelir, islem: d.islem, adet, ortCogs, brutKar, karMarji
      };
    }).filter(u => u.gelir > 0).sort((a, b) => b.gelir - a.gelir);

    const kategoriler = Object.entries(kM).map(([ad, toplam]) => ({ ad, toplam })).sort((a, b) => b.toplam - a.toplam);
    const gunluk = Object.entries(gM).map(([tarih, toplam]) => ({ date: tarih.slice(5).replace("-", "/"), toplam })).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
    return { urunler, kategoriler, gunluk, bilinmeyenler: Array.from(bilinmeyenKumesi), unknownCategories: unknownCategoriesSet };
  }, [ledger, L, lang, ceviriTetikleyici]);

  React.useEffect(() => {
    if (bilinmeyenler.length > 0) {
      let iptal = false;
      const cevir = async () => {
        let guncellendi = false;
        for (const kelime of bilinmeyenler) {
          try {
            const targetLang = lang === "EN" ? "en" : "tr";
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(kelime)}`;
            const res = await fetch(url);
            const data = await res.json();
            DYNAMIC_DICT[lang][kelime] = data[0][0][0];
            guncellendi = true;
          } catch (e) {
            DYNAMIC_DICT[lang][kelime] = kelime;
          }
        }
        if (!iptal && guncellendi) {
          // chrome.storage.local'a kaydet (kalıcı)
          if (typeof chrome !== "undefined" && chrome.storage?.local) {
            chrome.storage.local.set({ dynDictEN: DYNAMIC_DICT.EN, dynDictTR: DYNAMIC_DICT.TR });
          }
          setCeviriTetikleyici(prev => prev + 1);
        }
      };
      cevir();
      return () => { iptal = true; };
    }
  }, [bilinmeyenler, lang]);

  React.useEffect(() => {
    if (unknownCategories.size > 0) {
      let iptal = false;
      const cevirCategories = async () => {
        let guncellendi = false;
        for (const category of unknownCategories) {
          const staticTranslated = katName(category, L, lang);
          if (staticTranslated !== category) {
            continue;
          }
          try {
            const targetLang = lang === "EN" ? "en" : "tr";
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(category)}`;
            const res = await fetch(url);
            const data = await res.json();
            DYNAMIC_DICT[lang][category] = data[0][0][0];
            guncellendi = true;
          } catch (e) { DYNAMIC_DICT[lang][category] = category; }
        }
        if (!iptal && guncellendi) setCeviriTetikleyici(prev => prev + 1);
      };
      cevirCategories();
      return () => { iptal = true; };
    }
  }, [unknownCategories, lang, L]);

  if (!ledger?.length) return h("div", { style: styles.empty }, L.emptyUrun);

  const tS = urunler.reduce((s, u) => s + u.gelir, 0);
  const tSToplam = tS;
  const tG = kategoriler.filter(k => k.toplam < 0).reduce((s, k) => s + Math.abs(k.toplam), 0);
  const nK = tSToplam - tG;
  const best = urunler[0];
  const pasta = urunler.slice(0, 5).map(u => ({ name: u.ad, value: Math.round(u.gelir) }));
  const Tt = (p) => h(TT, { ...p, t });

  return h("div", null,
    h("div", { style: styles.sectionTitle }, L.sUrun),
    h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 } },
      h(StatCard, { label: L.cSatis, value: numFmt(tS, true), color: C.primary, t }),
      h(StatCard, { label: L.cGider, value: numFmt(tG, true), color: C.red, t }),
      h(StatCard, { label: L.cNetKar, value: numFmt(nK, true), color: nK >= 0 ? C.green : C.red, t }),
      h(StatCard, { label: L.cEnIyi, value: best?.ad || "—", sub: best ? numFmt(best.gelir, true) : "", color: C.amber, t })
    ),

    h("div", { style: styles.panel },
      h("div", { style: styles.sectionTitle }, L.grGunlukSatis),
      h(ResponsiveContainer, { width: "100%", height: 170 },
        h(BarChart, { data: gunluk, margin: { top: 5, right: 5, left: 0, bottom: 5 } },
          h(CartesianGrid, { strokeDasharray: "3 3", stroke: t.gridLine }),
          h(XAxis, { dataKey: "date", tick: { fill: t.axisColor, fontSize: 8 } }),
          h(YAxis, { tick: { fill: t.axisColor, fontSize: 8 }, tickFormatter: v => numFmt(v, true) }),
          h(Tooltip, { content: h(Tt) }),
          h(Bar, { dataKey: "toplam", name: L.colGelir, fill: C.primary, radius: [4, 4, 0, 0] })
        )
      )
    ),

    pasta.length > 0 && h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 } },
      h("div", { style: styles.panel },
        h("div", { style: styles.sectionTitle }, L.grUrunDag),
        h(ResponsiveContainer, { width: "100%", height: 190 },
          h(PieChart, { margin: { top: 5, right: 5, left: 5, bottom: 5 } },
            h(Pie, { data: pasta, cx: "50%", cy: "50%", innerRadius: 50, outerRadius: 82, dataKey: "value", nameKey: "name" },
              ...pasta.map((_, i) => h(Cell, { key: i, fill: COLORS[i % COLORS.length] }))
            ),
            h(Tooltip, { content: h(Tt) })
          )
        )
      ),
      h("div", { style: styles.panel },
        h("div", { style: styles.sectionTitle }, L.grUrunGelir),
        (() => {
          const barH = Math.max(190, pasta.length * 36 + 20);
          const maxNameLen = pasta.length ? Math.max(...pasta.map(p => (p.name || "").length)) : 0;
          const yW = Math.min(130, Math.max(80, maxNameLen * 6.5));
          return h(ResponsiveContainer, { width: "100%", height: barH },
            h(BarChart, { data: pasta, layout: "vertical", margin: { top: 4, right: 20, left: 4, bottom: 4 } },
              h(CartesianGrid, { strokeDasharray: "3 3", stroke: t.gridLine, horizontal: false }),
              h(XAxis, { type: "number", tick: { fill: t.axisColor, fontSize: 8 }, tickFormatter: v => numFmt(v, true), axisLine: false, tickLine: false }),
              h(YAxis, {
                type: "category", dataKey: "name",
                tick: { fill: t.axisColor, fontSize: 9, fontFamily: FONT_FAMILY },
                width: yW, tickLine: false, axisLine: false,
                tickFormatter: v => v && v.length > 16 ? v.slice(0, 14) + "…" : v
              }),
              h(Tooltip, { content: h(Tt) }),
              h(Bar, { dataKey: "value", name: L.colGelir, radius: [0, 4, 4, 0], barSize: 18 },
                ...pasta.map((_, i) => h(Cell, { key: i, fill: COLORS[i % COLORS.length] }))
              )
            )
          );
        })()
      )
    ),

    h("div", { style: styles.panel },
      h("div", { style: { marginBottom: 12 } },
        h("div", { style: { fontSize: 9, color: t.textMuted, letterSpacing: 2, textTransform: "uppercase" } }, L.tblUrun)
      ),
      h("div", { style: { overflowX: "auto", maxWidth: "100%" } },
        h("table", { style: { width: "100%", borderCollapse: "collapse" } },
          h("thead", null, h("tr", null, ...[L.colUrun, L.colGelir, L.colAdet, L.colCogs, L.colBrutKar, L.colKarMarji, L.colUnitEcon, L.colPay].map(x => h("th", { key: x, style: styles.th }, x)))),
          h("tbody", null, ...urunler.map((u, i) => {
            const unitProfit = u.adet > 0 ? u.brutKar / u.adet : 0;
            const unitPrice = u.adet > 0 ? u.gelir / u.adet : 0;
            return h("tr", { key: i },
              h("td", { style: { ...td(COLORS[i % COLORS.length], t), textAlign: "left", fontWeight: 700 } }, u.ad),
              h("td", { style: { ...td(C.primary, t), fontWeight: 700 } }, numFmt(u.gelir)),
              h("td", { style: td(t.text, t) }, numFmt(u.adet)),
              h("td", { style: td(C.amber, t) }, u.ortCogs > 0 ? numFmt(u.ortCogs) : "—"),
              h("td", { style: { ...td(u.brutKar >= 0 ? C.green : C.red, t), fontWeight: 700 } }, (u.brutKar >= 0 ? "+$" : "-$") + numFmt(Math.abs(u.brutKar))),
              h("td", { style: td(u.karMarji >= 0 ? C.green : C.red, t) }, u.karMarji !== 0 ? "%" + u.karMarji.toFixed(1) : "—"),
              h("td", { style: { ...td(unitProfit >= 0 ? C.green : C.red, t), minWidth: 80 } }, 
                h("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 } },
                  h("div", { style: { fontWeight: 600 } }, "$" + numFmt(unitProfit)),
                  h("div", { style: { width: "100%", height: 3, background: t.progBg, borderRadius: 2, overflow: "hidden" } },
                    h("div", { style: { width: Math.min(100, Math.abs(u.karMarji)) + "%", height: "100%", background: unitProfit >= 0 ? C.green : C.red } })
                  )
                )
              ),
              h("td", { style: td(t.text, t) }, tSToplam > 0 ? "%" + (u.gelir / tSToplam * 100).toFixed(1) : "—")
            );
          }))
        )
      )
    )
  );
}
