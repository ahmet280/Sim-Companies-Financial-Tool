function HedefPage({ bilancoData, gelirData, t, styles, L, lang }) {
  const [hedefler, setHedefler] = React.useState([]);
  const [yeniHedef, setYeniHedef] = React.useState("");
  const [yeniAd, setYeniAd] = React.useState("");
  const [yeniTip, setYeniTip] = React.useState("sirketDegeri");
  const [form, setForm] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  const HEDEF_TURLERI = {
    sirketDegeri: { key: 'sirketDegeri', label: L.cSirketDeger, dataKey: 'total', format: v => '$' + numFmt(v, true), isCurrency: true, lowerIsBetter: false },
    nakit: { key: 'nakit', label: L.cNakit, dataKey: 'nakit', format: v => '$' + numFmt(v, true), isCurrency: true, lowerIsBetter: false },
    binaDegeri: { key: 'binaDegeri', label: L.cBina, dataKey: 'binalar', format: v => '$' + numFmt(v, true), isCurrency: true, lowerIsBetter: false },
    rank: { key: 'rank', label: L.cRank, dataKey: 'rank', format: v => "#" + numFmt(v), isCurrency: false, lowerIsBetter: true },
    gunlukKar: { key: 'gunlukKar', label: L.cGunluk, dataKey: 'gunlukOrt', format: v => '$' + numFmt(v, true), isCurrency: true, lowerIsBetter: false },
  };

  const parseHedefDeger = (str) => {
    if (!str) return 0;
    const s = String(str).toLowerCase().replace(/,/g, "");
    const num = parseFloat(s);
    if (s.includes('b')) return num * 1e9;
    if (s.includes('m')) return num * 1e6;
    if (s.includes('k')) return num * 1e3;
    return num;
  };

  const son = bilancoData.length ? bilancoData[bilancoData.length - 1] : null;

  const gunlukOrt = React.useMemo(() => {
    if (gelirData.length < 7) return 0;
    const son30 = gelirData.slice(-30);
    const pozitif = son30.filter(d => d.net > 0);
    if (!pozitif.length) return 0;
    return pozitif.reduce((s, d) => s + d.net, 0) / son30.length;
  }, [gelirData]);

  const getMevcutDeger = (type) => {
    const tKey = type || 'sirketDegeri';
    if (!son && tKey !== 'gunlukKar') return 0;
    switch (tKey) {
      case 'sirketDegeri': return son.total;
      case 'nakit': return son.nakit;
      case 'binaDegeri': return son.binalar;
      case 'rank': return son.rank;
      case 'gunlukKar': return gunlukOrt;
      default: return son.total;
    }
  };

  React.useEffect(() => {
    try {
      chrome.storage.local.get(["simHedefler"], res => {
        if (res.simHedefler) setHedefler(res.simHedefler);
        setLoaded(true);
      });
    } catch (e) { setLoaded(true); }
  }, []);

  const kaydet = (liste) => {
    setHedefler(liste);
    try { chrome.storage.local.set({ simHedefler: liste }); } catch (e) { }
  };

  const hedefEkle = () => {
    const tur = HEDEF_TURLERI[yeniTip];
    const mevcutDeger = getMevcutDeger(yeniTip);
    const val = parseHedefDeger(yeniHedef);

    if (!val || (tur.lowerIsBetter ? val >= mevcutDeger : val <= mevcutDeger)) return;

    const yeni = {
      id: Date.now(),
      ad: yeniAd.trim() || tur.label,
      type: yeniTip,
      hedef: val,
      baslangic: mevcutDeger,
      baslangicTarih: son?.date || "—",
      olusturma: new Date().toLocaleDateString("tr-TR"),
    };
    kaydet([...hedefler, yeni]);
    setYeniHedef(""); setYeniAd(""); setYeniTip("sirketDegeri"); setForm(false);
  };

  const hedefSil = (id) => kaydet(hedefler.filter(h => h.id !== id));

  const Tt = (p) => h(TT, { ...p, t });
  const isDark = t.page === DARK.page;

  if (!loaded) return h("div", { style: styles.empty }, "...");
  if (!bilancoData.length) return h("div", { style: styles.empty }, L.emptyGenel);

  return h("div", null,
    h("div", { style: styles.sectionTitle }, L.sHedef),

    hedefler.length === 0
      ? h("div", { style: { ...styles.panel, textAlign: "center", color: t.textFaint, padding: "30px 20px", fontSize: 11 } }, L.hedefYok)
      : h("div", null, ...hedefler.map(hdf => {
        const typeKey = hdf.type || 'sirketDegeri';
        const tur = HEDEF_TURLERI[typeKey] || HEDEF_TURLERI.sirketDegeri;
        const mevcutDeger = getMevcutDeger(typeKey);

        let ilerleme;
        if (tur.lowerIsBetter) {
          ilerleme = (hdf.baslangic - mevcutDeger) / (hdf.baslangic - hdf.hedef) * 100;
        } else {
          ilerleme = (mevcutDeger - hdf.baslangic) / (hdf.hedef - hdf.baslangic) * 100;
        }
        ilerleme = Math.min(100, Math.max(0, ilerleme));

        const kalan = tur.lowerIsBetter ? mevcutDeger - hdf.hedef : hdf.hedef - mevcutDeger;
        const tamamlandi = tur.lowerIsBetter ? mevcutDeger <= hdf.hedef : mevcutDeger >= hdf.hedef;

        const gunlukArtis = hdf.type === 'gunlukKar' ? 0 : gunlukOrt;
        const gunKaldi = !tur.lowerIsBetter && gunlukArtis > 0 ? Math.ceil(kalan / gunlukArtis) : null;

        const barColor = tamamlandi ? C.primary : ilerleme > 66 ? C.green : ilerleme > 33 ? C.amber : C.blue;

        const trendData = (hdf.type === 'gunlukKar' ? gelirData.slice(-60) : bilancoData.slice(-60)).map(d => ({
          date: d.date,
          value: hdf.type === 'gunlukKar' ? d.net : d[tur.dataKey],
        }));
        const grafik = trendData.map(d => ({ ...d, hedef: hdf.hedef }));

        return h("div", { key: hdf.id, style: { ...styles.panel, marginBottom: 14 } },
          h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 } },
            h("div", null,
              h("div", { style: { fontSize: 12, fontWeight: 700, color: C.primary, letterSpacing: 1 } }, hdf.ad),
              h("div", { style: { fontSize: 9, color: t.textFaint, marginTop: 2 } },
                h("span", { style: { color: t.textSub, fontWeight: 600 } }, tur.label),
                " · " + hdf.olusturma + " · " + L.hedefBaslangic + ": " + tur.format(hdf.baslangic)
              )
            ),
            tamamlandi
              ? h("div", { style: { fontSize: 10, color: C.primary, fontWeight: 700, padding: "4px 10px", border: "1px solid #00d4a840", borderRadius: 20 } }, "✓ " + L.hedefTamamlandi)
              : h("button", { onClick: () => hedefSil(hdf.id), style: { background: "none", border: `1px solid ${isDark ? DARK.inputBorder : "#c0d8e8"}`, borderRadius: 6, cursor: "pointer", padding: "4px 10px", fontSize: 9, color: C.red, fontFamily: FONT_FAMILY } }, L.hedefSil)
          ),

          h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 14 } },
            h(StatCard, { label: L.hedefMevcut, value: tur.format(mevcutDeger), color: C.primary, t }),
            h(StatCard, { label: L.hedefHdf, value: tur.format(hdf.hedef), color: C.purple, t }),
            tamamlandi
              ? h(StatCard, { label: L.hedefKalan, value: "✓", color: C.primary, t })
              : h(StatCard, {
                label: L.hedefKalan, value: tur.format(kalan), color: C.amber, t,
                sub: gunKaldi != null ? gunKaldi + " " + L.hedefGunKaldi : null
              })
          ),

          h("div", { style: { marginBottom: 14 } },
            h("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 6 } },
              h("span", { style: { fontSize: 9, color: t.textMuted, letterSpacing: 1 } }, L.hedefIlerleme),
              h("span", { style: { fontSize: 11, fontWeight: 700, color: barColor } }, "%" + ilerleme.toFixed(1))
            ),
            h("div", { style: { height: 14, background: isDark ? DARK.inputBg : LIGHT.inputBg, borderRadius: 8, overflow: "hidden", position: "relative" } },
              h("div", {
                style: {
                  height: "100%",
                  width: ilerleme + "%",
                  background: tamamlandi
                    ? "linear-gradient(90deg,#00d4a8,#10b981)"
                    : ilerleme > 66
                      ? "linear-gradient(90deg,#10b981,#00d4a8)"
                      : ilerleme > 33
                        ? "linear-gradient(90deg,#3b82f6,#f59e0b)"
                        : "linear-gradient(90deg,#1e40af,#3b82f6)",
                  borderRadius: 8,
                  transition: "width 0.8s ease",
                  boxShadow: `0 0 10px ${barColor}60`,
                }
              }),
              ilerleme > 12 && h("div", {
                style: {
                  position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                  fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: 0.5,
                  textShadow: "0 1px 3px rgba(0,0,0,0.5)"
                }
              }, "%" + ilerleme.toFixed(1))
            ),
            h("div", { style: { position: "relative", height: 16, marginTop: 3 } },
              ...[25, 50, 75, 100].map(m =>
                h("div", {
                  key: m, style: {
                    position: "absolute", left: m + "%", transform: "translateX(-50%)",
                    fontSize: 8, color: ilerleme >= m ? barColor : t.textFaint,
                    fontWeight: ilerleme >= m ? 700 : 400,
                  }
                }, m === 100 ? "🏆" : m + "%")
              )
            )
          ),

          gunlukArtis > 0 && !tamamlandi && !tur.lowerIsBetter && h("div", {
            style: {
              background: isDark ? DARK.inputBg : LIGHT.sectionInfoBg,
              border: `1px solid ${isDark ? DARK.sectionInfoBorder : LIGHT.sectionInfoBorder}`,
              borderRadius: 8, padding: "8px 12px", marginBottom: 14,
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }
          },
            h("span", { style: { fontSize: 9, color: t.textMuted, letterSpacing: 1 } }, L.hedefGunlukOrt),
            h("span", { style: { fontSize: 12, fontWeight: 700, color: C.green } }, "+" + numFmt(Math.round(gunlukArtis), true) + "/" + (lang === "TR" ? "gün" : "day"))
          ),

          h("div", { style: { marginTop: 4 } },
            h("div", { style: { fontSize: 9, color: t.textMuted, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" } }, L.hedefTrend),
            h(ResponsiveContainer, { width: "100%", height: 160 },
              h(ComposedChart, { data: grafik, margin: { top: 5, right: 10, left: 0, bottom: 5 } },
                h("defs", null,
                  h("linearGradient", { id: "hg" + hdf.id, x1: "0", y1: "0", x2: "0", y2: "1" },
                    h("stop", { offset: "5%", stopColor: C.primary, stopOpacity: 0.25 }),
                    h("stop", { offset: "95%", stopColor: C.primary, stopOpacity: 0 })
                  )
                ),
                h(CartesianGrid, { strokeDasharray: "3 3", stroke: t.gridLine }),
                h(XAxis, { dataKey: "date", tick: { fill: t.axisColor, fontSize: 8 } }),
                h(YAxis, { tick: { fill: t.axisColor, fontSize: 8 }, tickFormatter: v => numFmt(v, true), domain: ["auto", "auto"] }),
                h(Tooltip, { content: h(Tt) }),
                h(Area, { type: "monotone", dataKey: "value", name: tur.label, stroke: C.primary, fill: `url(#hg${hdf.id})`, strokeWidth: 2, dot: false }),
                h(Line, { type: "monotone", dataKey: "hedef", name: L.hedefHdf, stroke: C.purple, strokeWidth: 2, strokeDasharray: "6 3", dot: false })
              )
            )
          )
        );
      })),

    !form
      ? h("button", {
        onClick: () => setForm(true),
        style: {
          display: "block", width: "100%", padding: "11px",
          background: "none",
          border: `2px dashed ${isDark ? DARK.inputBorder : LIGHT.inputBorder}`,
          borderRadius: 10, cursor: "pointer",
          fontSize: 10, color: t.textMuted, letterSpacing: 1,
          fontFamily: FONT_FAMILY,
          transition: "all .2s",
        }
      }, L.hedefEkle)
      : h("div", { style: { ...styles.panel, border: `1px solid #7c3aed40` } },
        h("div", { style: { fontSize: 9, color: C.purple, letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" } }, L.hedefEkle.replace("+ ", "")),
        h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 10 } },
          h("div", null,
            h("div", { style: { fontSize: 9, color: t.textMuted, marginBottom: 4 } }, L.hedefTuru),
            h("select", {
              value: yeniTip,
              onChange: e => setYeniTip(e.target.value),
              style: {
                background: isDark ? DARK.page : LIGHT.inputBg,
                border: `1px solid ${isDark ? DARK.inputBorder : LIGHT.inputBorder}`,
                borderRadius: 8, padding: "8px 12px", fontSize: 11,
                color: t.text, fontFamily: FONT_FAMILY, outline: "none", width: "100%"
              }
            }, ...Object.values(HEDEF_TURLERI).map(tur => h("option", { key: tur.key, value: tur.key }, tur.label)))
          ),
          h("div", null,
            h("div", { style: { fontSize: 9, color: t.textMuted, marginBottom: 4 } }, L.hedefAd),
            h("input", {
              type: "text",
              placeholder: L.hedefAd,
              value: yeniAd,
              onInput: e => setYeniAd(e.target.value),
              style: {
                background: isDark ? DARK.page : LIGHT.inputBg,
                border: `1px solid ${isDark ? DARK.inputBorder : LIGHT.inputBorder}`,
                borderRadius: 8, padding: "8px 12px", fontSize: 11,
                color: t.text, fontFamily: FONT_FAMILY, outline: "none", width: "100%"
              }
            })
          ),
          h("div", null,
            h("div", { style: { fontSize: 9, color: t.textMuted, marginBottom: 4 } }, L.hedefGir),
            h("input", {
              type: "text",
              placeholder: L.hedefGir + " (örn: 50M, 1B)",
              value: yeniHedef,
              onInput: e => setYeniHedef(e.target.value),
              style: {
                background: isDark ? DARK.page : LIGHT.inputBg,
                border: `1px solid ${(HEDEF_TURLERI[yeniTip].lowerIsBetter ? parseHedefDeger(yeniHedef) > 0 && parseHedefDeger(yeniHedef) < getMevcutDeger(yeniTip) : parseHedefDeger(yeniHedef) > getMevcutDeger(yeniTip)) ? C.purple : DARK.inputBorder}`,
                borderRadius: 8, padding: "8px 12px", fontSize: 11,
                color: t.text, fontFamily: FONT_FAMILY, outline: "none", width: "100%"
              }
            })
          )
        ),
        h("div", { style: { fontSize: 9, color: t.textFaint, marginBottom: 12 } },
          L.hedefMevcut + ": " + HEDEF_TURLERI[yeniTip].format(getMevcutDeger(yeniTip)) + " · " + L.hedefGir + ": " + (parseHedefDeger(yeniHedef) > 0 ? HEDEF_TURLERI[yeniTip].format(parseHedefDeger(yeniHedef)) : "—")
        ),
        h("div", { style: { display: "flex", gap: 8 } },
          h("button", {
            onClick: hedefEkle,
            style: {
              flex: 1, padding: "9px", background: "linear-gradient(90deg,#4c1d95,#7c3aed)",
              border: "none", borderRadius: 8, cursor: "pointer",
              fontSize: 10, color: "#fff", fontWeight: 700, letterSpacing: 1,
              fontFamily: FONT_FAMILY,
              opacity: (HEDEF_TURLERI[yeniTip].lowerIsBetter ? parseHedefDeger(yeniHedef) < getMevcutDeger(yeniTip) : parseHedefDeger(yeniHedef) > getMevcutDeger(yeniTip)) ? 1 : 0.4,
            }
          }, L.hedefKaydet),
          h("button", {
            onClick: () => { setForm(false); setYeniHedef(""); setYeniAd(""); setYeniTip("sirketDegeri"); },
            style: {
              padding: "9px 16px", background: "none",
              border: `1px solid ${isDark ? DARK.inputBorder : LIGHT.inputBorder}`,
              borderRadius: 8, cursor: "pointer", fontSize: 10, color: t.textMuted,
              fontFamily: FONT_FAMILY,
            }
          }, "✕")
        )
      )
  );
}
