import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Kategórie podľa kľúčových slov v názve produktu
function detectCategory(name = "", category = "") {
  const n = (name + " " + category).toLowerCase();
  if (n.includes("plen") || n.includes("ubrousky") || n.includes("přebalování") || n.includes("kojení") || n.includes("dudlík") || n.includes("mimink") || n.includes("kojenec") || n.includes("babylove") || n.includes("výživa") || n.includes("mléčná") || n.includes("beba")) return "👶 Pro miminka";
  if (n.includes("vlasy") || n.includes("šampon") || n.includes("kondicionér") || n.includes("vlasov")) return "💆 Vlasová péče";
  if (n.includes("zubní") || n.includes("zub") || n.includes("kartáček") || n.includes("mezizubní") || n.includes("ústní") || n.includes("jazyk")) return "🦷 Péče o zuby";
  if (n.includes("vitamín") || n.includes("vitamin") || n.includes("minerál") || n.includes("doplněk") || n.includes("magnesium") || n.includes("elektrolyt") || n.includes("omega") || n.includes("gummies")) return "💊 Vitamíny & doplňky";
  if (n.includes("náplast") || n.includes("obvaz") || n.includes("lékárn") || n.includes("zdraví") || n.includes("kontaktní čočky") || n.includes("roztok na kontakt")) return "🩹 Zdraví & lékárnička";
  if (n.includes("sprchový") || n.includes("mýdlo") || n.includes("deodorant") || n.includes("tělové") || n.includes("tělový") || n.includes("tělo")) return "🛁 Péče o tělo";
  if (n.includes("krém") || n.includes("pleť") || n.includes("sérum") || n.includes("micelární") || n.includes("maска") || n.includes("pleťov")) return "✨ Péče o pleť";
  if (n.includes("make-up") || n.includes("rtěnk") || n.includes("řasenk") || n.includes("oční stín") || n.includes("dekorativ") || n.includes("kosmetik")) return "💄 Dekorativní kosmetika";
  if (n.includes("prací") || n.includes("aviváž") || n.includes("čisticí") || n.includes("mycí") || n.includes("mytí") || n.includes("úklid") || n.includes("WC") || n.includes("koupelna")) return "🧹 Čisticí prostředky";
  if (n.includes("toaletní papír") || n.includes("kapesník") || n.includes("hygien")) return "🧻 Hygiena";
  if (n.includes("parfém") || n.includes("vůně") || n.includes("svíčk") || n.includes("osvěžovač")) return "🌸 Vůně & parfumy";
  if (n.includes("holení") || n.includes("epilace") || n.includes("depilace") || n.includes("žiletk")) return "✂️ Holení & epilace";
  if (n.includes("krmivo") || n.includes("mazlíč") || n.includes("pes") || n.includes("kočk")) return "🐾 Pro zvířata";
  if (n.includes("bio") || n.includes("organic")) return "🌿 Bio & přírodní";
  return "🏷️ Ostatní";
}

const STORE_COLORS = {
  rossmann: "#e30613", dm: "#e30613", teta: "#e91e8c",
  lidl: "#0050aa", albert: "#e4002b", billa: "#cd0a2f",
  penny: "#cd1719", tesco: "#00539f", kaufland: "#e30613",
  globus: "#006a38",
};

function getStoreColor(name = "") {
  const key = Object.keys(STORE_COLORS).find(k => name.toLowerCase().includes(k));
  return key ? STORE_COLORS[key] : "#6366f1";
}

export default function App() {
  const [deals, setDeals] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("Vše");
  const [catFilter, setCatFilter] = useState("Vše");
  const [sortCol, setSortCol] = useState("discount");
  const [sortDir, setSortDir] = useState("desc");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [view, setView] = useState("table"); // table | grid

  useEffect(() => { fetchDeals(); }, []);

  useEffect(() => {
    let result = deals.map(d => ({ ...d, _cat: detectCategory(d.name, d.category) }));
    if (search) result = result.filter(d => d.name?.toLowerCase().includes(search.toLowerCase()) || d.brand?.toLowerCase().includes(search.toLowerCase()));
    if (storeFilter !== "Vše") result = result.filter(d => d.store === storeFilter);
    if (catFilter !== "Vše") result = result.filter(d => d._cat === catFilter);
    result.sort((a, b) => {
      let va = a[sortCol] ?? (sortDir === "desc" ? -1 : 999), vb = b[sortCol] ?? (sortDir === "desc" ? -1 : 999);
      return sortDir === "asc" ? va - vb : vb - va;
    });
    setFiltered(result);
  }, [deals, search, storeFilter, catFilter, sortCol, sortDir]);

  async function fetchDeals() {
    setLoading(true);
    const { data } = await supabase.from("deals").select("*").order("discount", { ascending: false });
    if (data) {
      setDeals(data);
      if (data[0]) setLastUpdate(new Date(data[0].updated_at));
    }
    setLoading(false);
  }

  const stores = ["Vše", ...new Set(deals.map(d => d.store).filter(Boolean)).keys()].slice(0, 20);
  const allCats = ["Vše", ...new Set(deals.map(d => detectCategory(d.name, d.category)).filter(Boolean))];
  const catCounts = Object.fromEntries(allCats.map(c => [c, c === "Vše" ? deals.length : deals.filter(d => detectCategory(d.name, d.category) === c).length]));

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  }

  const SortArrow = ({ col }) => sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : "↕";

  return (
    <div style={{ minHeight: "100vh", background: "#f4f3f0", fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --red: #e63022; --dark: #1a1a2e; --mid: #2d2d44; --light: #f4f3f0; --white: #ffffff; }
        .deal-row:hover { background: #fff !important; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .deal-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
        .deal-card { transition: all 0.2s ease; }
        .filter-btn { transition: all 0.15s; }
        .filter-btn:hover { opacity: 0.85; }
        .sort-th { cursor: pointer; user-select: none; }
        .sort-th:hover { background: rgba(255,255,255,0.05) !important; }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }
      `}</style>

      {/* HEADER */}
      <header style={{ background: "var(--dark)", borderBottom: "3px solid var(--red)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <h1 style={{ fontFamily: "'DM Serif Display', serif", color: "#fff", fontSize: 28, fontWeight: 400, letterSpacing: "-0.5px" }}>
                  Akční <span style={{ color: "var(--red)" }}>Ceny</span>
                </h1>
                <span style={{ color: "#4ade80", fontSize: 12, fontWeight: 600, background: "rgba(74,222,128,0.15)", padding: "2px 8px", borderRadius: 20 }}>
                  ● {deals.length} akcí
                </span>
              </div>
              <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
                {lastUpdate ? `Aktualizováno ${lastUpdate.toLocaleDateString("cs-CZ")} ${lastUpdate.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}` : "Načítám..."}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["table", "grid"].map(v => (
                <button key={v} onClick={() => setView(v)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: view === v ? "var(--red)" : "transparent", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                  {v === "table" ? "≡ Tabulka" : "⊞ Karty"}
                </button>
              ))}
              <button onClick={fetchDeals} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#fff", cursor: "pointer", fontSize: 13 }}>
                ↺ Obnovit
              </button>
            </div>
          </div>

          {/* SEARCH + FILTERS */}
          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14 }}>🔍</span>
              <input placeholder="Hledat produkt nebo značku..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: "100%", padding: "10px 12px 10px 36px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 14, outline: "none" }} />
            </div>
            <select value={storeFilter} onChange={e => setStoreFilter(e.target.value)}
              style={{ padding: "10px 14px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 13, cursor: "pointer", outline: "none" }}>
              {["Vše", ...new Set(deals.map(d => d.store).filter(Boolean))].map(s => <option key={s} value={s} style={{ background: "#1a1a2e" }}>{s === "Vše" ? "Všechny obchody" : s}</option>)}
            </select>
          </div>

          {/* CATEGORY TABS */}
          <div style={{ marginTop: 14, display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {allCats.map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)} className="filter-btn"
                style={{ whiteSpace: "nowrap", padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.15)", background: catFilter === cat ? "var(--red)" : "rgba(255,255,255,0.06)", color: catFilter === cat ? "#fff" : "#94a3b8", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
                {cat} {catFilter !== cat && catCounts[cat] ? <span style={{ opacity: 0.6 }}>({catCounts[cat]})</span> : ""}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: "#94a3b8" }}>
            <div style={{ fontSize: 40, marginBottom: 16, animation: "spin 1s linear infinite" }}>⟳</div>
            <p style={{ fontSize: 15 }}>Načítám akce...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ color: "#6b7280", fontSize: 16 }}>Žádné akce nenalezeny</p>
          </div>
        ) : view === "table" ? (
          <>
            <div style={{ marginBottom: 12, fontSize: 13, color: "#6b7280" }}>
              Zobrazeno <strong style={{ color: "#374151" }}>{filtered.length}</strong> z {deals.length} akcí
            </div>
            <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "var(--dark)", color: "#94a3b8", textTransform: "uppercase", fontSize: 11, letterSpacing: "0.06em" }}>
                      {[
                        { key: "name", label: "Produkt", align: "left" },
                        { key: "store", label: "Obchod", align: "left" },
                        { key: "brand", label: "Značka", align: "left" },
                        { key: "_cat", label: "Kategorie", align: "left" },
                        { key: "price", label: "Akční cena", align: "right" },
                        { key: "old_price", label: "Původní", align: "right" },
                        { key: "discount", label: "Sleva", align: "right" },
                        { key: "valid_to", label: "Platí do", align: "left" },
                        { key: "source_url", label: "Odkaz", align: "center" },
                      ].map(col => (
                        <th key={col.key} className="sort-th" onClick={() => col.key !== "source_url" && toggleSort(col.key)}
                          style={{ padding: "12px 16px", textAlign: col.align, fontWeight: 600, whiteSpace: "nowrap", borderBottom: "2px solid rgba(255,255,255,0.05)" }}>
                          {col.label} {col.key !== "source_url" && <span style={{ opacity: 0.5, fontSize: 10 }}><SortArrow col={col.key} /></span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((deal, i) => {
                      const color = getStoreColor(deal.store);
                      return (
                        <tr key={deal.id} className="deal-row" style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={{ padding: "11px 16px", fontWeight: 500, color: "#111827", maxWidth: 280 }}>
                            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={deal.name}>{deal.name}</div>
                          </td>
                          <td style={{ padding: "11px 16px" }}>
                            <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, color, background: color + "15", border: `1px solid ${color}30` }}>
                              {deal.store}
                            </span>
                          </td>
                          <td style={{ padding: "11px 16px", color: "#374151", fontSize: 12 }}>{deal.brand || "—"}</td>
                          <td style={{ padding: "11px 16px", fontSize: 11, color: "#6b7280", whiteSpace: "nowrap" }}>{deal._cat}</td>
                          <td style={{ padding: "11px 16px", textAlign: "right", fontWeight: 700, color: "var(--red)", fontVariantNumeric: "tabular-nums" }}>
                            {deal.price ? deal.price.toFixed(2).replace(".", ",") + " Kč" : "—"}
                          </td>
                          <td style={{ padding: "11px 16px", textAlign: "right", color: "#9ca3af", fontSize: 12, textDecoration: deal.old_price ? "line-through" : "none", fontVariantNumeric: "tabular-nums" }}>
                            {deal.old_price ? deal.old_price.toFixed(2).replace(".", ",") + " Kč" : "—"}
                          </td>
                          <td style={{ padding: "11px 16px", textAlign: "right" }}>
                            {deal.discount ? (
                              <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#fff", background: deal.discount >= 30 ? "#dc2626" : deal.discount >= 15 ? "#ea580c" : "#ca8a04" }}>
                                −{deal.discount}%
                              </span>
                            ) : "—"}
                          </td>
                          <td style={{ padding: "11px 16px", color: "#6b7280", fontSize: 12, whiteSpace: "nowrap" }}>
                            {deal.valid_to ? new Date(deal.valid_to).toLocaleDateString("cs-CZ") : "—"}
                          </td>
                          <td style={{ padding: "11px 16px", textAlign: "center" }}>
                            {deal.source_url ? (
                              <a href={deal.source_url} target="_blank" rel="noopener noreferrer"
                                style={{ color: "var(--red)", textDecoration: "none", fontSize: 16 }} title="Otevřít v obchodě">↗</a>
                            ) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          // GRID VIEW
          <>
            <div style={{ marginBottom: 12, fontSize: 13, color: "#6b7280" }}>
              Zobrazeno <strong style={{ color: "#374151" }}>{filtered.length}</strong> z {deals.length} akcí
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {filtered.map(deal => {
                const color = getStoreColor(deal.store);
                return (
                  <div key={deal.id} className="deal-card" style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", cursor: "pointer" }}
                    onClick={() => deal.source_url && window.open(deal.source_url, "_blank")}>
                    <div style={{ height: 4, background: color }} />
                    <div style={{ padding: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, color, background: color + "15", fontWeight: 700 }}>{deal.store}</span>
                        {deal.discount && (
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", background: deal.discount >= 30 ? "#dc2626" : "#ea580c", padding: "3px 8px", borderRadius: 6 }}>−{deal.discount}%</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>{deal._cat}</div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111827", lineHeight: 1.4, marginBottom: 4 }}>{deal.name}</h3>
                      {deal.brand && <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 12 }}>{deal.brand}</div>}
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: "auto" }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: "var(--red)" }}>
                          {deal.price ? deal.price.toFixed(2).replace(".", ",") + " Kč" : "—"}
                        </span>
                        {deal.old_price && (
                          <span style={{ fontSize: 13, color: "#9ca3af", textDecoration: "line-through" }}>
                            {deal.old_price.toFixed(2).replace(".", ",") + " Kč"}
                          </span>
                        )}
                      </div>
                      {deal.valid_to && (
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
                          Platí do {new Date(deal.valid_to).toLocaleDateString("cs-CZ")}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
