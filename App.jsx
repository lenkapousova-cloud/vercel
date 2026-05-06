import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const STORE_COLORS = {
  rossmann: { color: "#e30613", bg: "#fff0f0" },
  lidl:     { color: "#0050aa", bg: "#eef4ff" },
  albert:   { color: "#e4002b", bg: "#fff0f3" },
  billa:    { color: "#cd0a2f", bg: "#fff0f2" },
  penny:    { color: "#cd1719", bg: "#fff1f1" },
  tesco:    { color: "#00539f", bg: "#eef3ff" },
  kaufland: { color: "#e30613", bg: "#fff0f0" },
  globus:   { color: "#006a38", bg: "#eefff5" },
  dm:       { color: "#e30613", bg: "#fff0f0" },
  teta:     { color: "#e91e8c", bg: "#ffeef7" },
};

function storeStyle(name) {
  if (!name) return { color: "#6b7280", bg: "#f3f4f6" };
  const key = Object.keys(STORE_COLORS).find(k => name.toLowerCase().includes(k));
  return key ? STORE_COLORS[key] : { color: "#6b7280", bg: "#f3f4f6" };
}

export default function App() {
  const [deals, setDeals] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("Vše");
  const [sortCol, setSortCol] = useState("discount");
  const [sortDir, setSortDir] = useState("desc");
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => { fetchDeals(); }, []);

  useEffect(() => {
    let result = [...deals];
    if (search) result = result.filter(d => d.name?.toLowerCase().includes(search.toLowerCase()));
    if (storeFilter !== "Vše") result = result.filter(d => d.store === storeFilter);
    result.sort((a, b) => {
      let va = a[sortCol] ?? 0, vb = b[sortCol] ?? 0;
      if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb, "cs") : vb.localeCompare(va, "cs");
      return sortDir === "asc" ? va - vb : vb - va;
    });
    setFiltered(result);
  }, [deals, search, storeFilter, sortCol, sortDir]);

  async function fetchDeals() {
    setLoading(true);
    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .order("discount", { ascending: false });
    if (!error && data) {
      setDeals(data);
      if (data.length > 0) setLastUpdate(new Date(data[0].updated_at));
    }
    setLoading(false);
  }

  const stores = ["Vše", ...new Set(deals.map(d => d.store).filter(Boolean))];

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  }

  const SortIcon = ({ col }) => sortCol === col ? (sortDir === "asc" ? " ▲" : " ▼") : " ⇅";

  return (
    <div style={{ minHeight: "100vh", background: "#f8f8fb", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; margin: 0; } .row:hover { background: #f0f4ff !important; } .th { cursor: pointer; user-select: none; } .th:hover { background: #1a2540; }`}</style>

      {/* Header */}
      <header style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", padding: "24px", borderBottom: "3px solid #dc2626" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>🏷️</span>
            <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>Akční Ceny — Drogerie</h1>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 13 }}>
            {lastUpdate ? `Poslední aktualizace: ${lastUpdate.toLocaleString("cs-CZ")}` : "Načítání..."}
            {deals.length > 0 && <span style={{ marginLeft: 12, color: "#4ade80" }}>● {deals.length} akcí</span>}
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            placeholder="🔍 Hledat produkt..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none" }}
          />
          <select
            value={storeFilter}
            onChange={e => setStoreFilter(e.target.value)}
            style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, background: "#fff", cursor: "pointer" }}
          >
            {stores.map(s => <option key={s}>{s}</option>)}
          </select>
          <button
            onClick={fetchDeals}
            style={{ padding: "10px 18px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            🔄 Obnovit
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <p>Načítám akce...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>😕</div>
            <p>Žádné akce nenalezeny</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 10, fontSize: 13, color: "#64748b" }}>
              Zobrazeno <strong>{filtered.length}</strong> z {deals.length} akcí
            </div>
            <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#0f172a", color: "#cbd5e1" }}>
                      {[
                        { key: "name", label: "Produkt" },
                        { key: "store", label: "Obchod" },
                        { key: "price", label: "Akční cena" },
                        { key: "old_price", label: "Původní cena" },
                        { key: "discount", label: "Sleva" },
                        { key: "valid_to", label: "Platí do" },
                      ].map(col => (
                        <th key={col.key} className="th" onClick={() => handleSort(col.key)}
                          style={{ padding: "11px 14px", textAlign: col.key === "price" || col.key === "old_price" || col.key === "discount" ? "right" : "left", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                          {col.label}<SortIcon col={col.key} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((deal, i) => {
                      const s = storeStyle(deal.store);
                      return (
                        <tr key={deal.id} className="row" style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                          <td style={{ padding: "10px 14px", fontWeight: 500, color: "#0f172a" }}>{deal.name}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.color}22` }}>{deal.store}</span>
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#dc2626", fontFamily: "monospace" }}>
                            {deal.price ? `${deal.price.toFixed(2).replace(".", ",")} Kč` : "—"}
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8", textDecoration: deal.old_price ? "line-through" : "none", fontFamily: "monospace" }}>
                            {deal.old_price ? `${deal.old_price.toFixed(2).replace(".", ",")} Kč` : "—"}
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right" }}>
                            {deal.discount ? (
                              <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 5, fontSize: 11, fontWeight: 700, color: "#fff", background: deal.discount >= 30 ? "#dc2626" : deal.discount >= 15 ? "#ea580c" : "#ca8a04" }}>
                                −{deal.discount}%
                              </span>
                            ) : "—"}
                          </td>
                          <td style={{ padding: "10px 14px", color: "#64748b", fontSize: 12 }}>
                            {deal.valid_to ? new Date(deal.valid_to).toLocaleDateString("cs-CZ") : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
