import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { Link } from "react-router-dom";

const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"#b45309", flexShrink: 0}}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconPlaceholder = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: "var(--text-muted)"}}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

export default function ProductList() {
  const [products, setProducts]      = useState([]);
  const [categorias, setCategorias]  = useState([]);
  const [filtroCategoria, setFiltro] = useState("");
  const [filtroStatus, setFiltroSt]  = useState("ativo");
  const [loading, setLoading]        = useState(true);
  const [alertaAberto, setAlerta]    = useState(true);
  const [expiryCount, setExpiryCount] = useState(0);
  const [expiryBanner, setExpiryBanner] = useState(true);

  // Restock modal state
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockQty, setRestockQty]         = useState("");
  const [restockExpiry, setRestockExpiry]   = useState("");
  const [restockCode, setRestockCode]       = useState("");
  const [restockLoading, setRestockLoading] = useState(false);
  const [restockError, setRestockError]     = useState("");
  const [restockSuccess, setRestockSuccess] = useState("");

  // Batches modal state
  const [batchProduct, setBatchProduct] = useState(null);
  const [batches, setBatches]           = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);

  async function fetchAll() {
    setLoading(true);
    try {
      const params = {};
      if (filtroCategoria) params.categoria = filtroCategoria;
      const [pRes, cRes, eRes] = await Promise.all([
        api.get("/api/products", { params }),
        api.get("/api/products/categorias"),
        api.get("/api/products/expiring-alerts", { params: { days: 7 } }).catch(() => ({ data: { total_produtos: 0 } })),
      ]);
      setProducts(pRes.data);
      setCategorias(cRes.data || []);
      setExpiryCount(eRes.data?.total_produtos || 0);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, [filtroCategoria]);

  async function toggleStatus(p) {
    const rota = p.status === "ativo"
      ? `/api/products/${p.id}/inactivate`
      : `/api/products/${p.id}/activate`;
    await api.patch(rota);
    fetchAll();
  }

  async function openBatches(p) {
    setBatchProduct(p);
    setBatchLoading(true);
    try {
      const res = await api.get(`/api/products/${p.id}/batches`);
      setBatches(res.data.lotes || []);
    } catch {
      setBatches([]);
    } finally {
      setBatchLoading(false);
    }
  }

  async function handleRestock(e) {
    e.preventDefault();
    if (!restockProduct) return;
    setRestockLoading(true);
    setRestockError("");
    setRestockSuccess("");
    try {
      const payload = { quantity: parseInt(restockQty, 10) };
      if (restockProduct.controla_validade) {
        if (!restockExpiry) throw new Error("Informe a data de validade do lote.");
        payload.expiry_date = restockExpiry;
        if (restockCode) payload.batch_code = restockCode;
      }
      await api.post(`/api/products/${restockProduct.id}/restock`, payload);
      setRestockSuccess("Estoque reposto com sucesso!");
      setTimeout(() => {
        setRestockProduct(null);
        setRestockQty("");
        setRestockExpiry("");
        setRestockCode("");
        setRestockSuccess("");
        fetchAll();
      }, 1200);
    } catch (err) {
      setRestockError(err.response?.data?.erro || err.message || "Erro ao repor estoque.");
    } finally {
      setRestockLoading(false);
    }
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  const estoquesBaixos = products.filter(p => p.status === "ativo" && p.quantidade <= p.estoque_minimo);
  const visibles = products.filter(p => filtroStatus === "todos" ? true : p.status === filtroStatus);
  const fmtMoeda = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="page-content">
      {/* Topo / Cabeçalho */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Catálogo &amp; Estoque</h1>
          <p className="subtitle">Gestão de mercadorias cadastradas no seu mercado</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {expiryCount > 0 && (
            <Link
              to="/produtos/alertas-validade"
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                fontSize: "0.8125rem", fontWeight: 600, padding: "0.5rem 0.875rem",
                background: "rgba(234,88,12,0.1)", color: "#ea580c",
                border: "1px solid rgba(234,88,12,0.3)", borderRadius: "var(--radius-sm)",
                textDecoration: "none"
              }}
            >
              🗓️ {expiryCount} produto{expiryCount !== 1 ? "s" : ""} vencendo
            </Link>
          )}
          <Link to="/produtos/novo" className="btn btn-primary" style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Novo Produto
          </Link>
        </div>
      </div>

      {/* Banner Alertas de Validade */}
      {expiryCount > 0 && expiryBanner && (
        <div style={{ background: "rgba(234,88,12,0.08)", border: "1px solid rgba(234,88,12,0.25)", borderRadius: "var(--radius-sm)", padding: "0.875rem 1rem", marginBottom: "1.25rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
            <span style={{ fontSize: "1rem" }}>🗓️</span>
            <span style={{ fontSize:"0.875rem", fontWeight:500, color:"#c2410c" }}>
              {expiryCount} produto{expiryCount !== 1 ? "s" : ""} com lotes vencidos ou vencendo em até 7 dias.
              {" "}<Link to="/produtos/alertas-validade" style={{ color:"#ea580c", fontWeight:700, textDecoration:"underline" }}>Ver alertas e dar baixa →</Link>
            </span>
          </div>
          <button onClick={() => setExpiryBanner(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#c2410c", fontSize:"1.2rem", lineHeight:1 }}>×</button>
        </div>
      )}

      {/* Alerta de Estoque Baixo */}
      {estoquesBaixos.length > 0 && alertaAberto && (
        <div style={{ background:"#fffbeb", border:"1px solid #fcd34d", borderRadius:"var(--radius-sm)", padding:"0.875rem 1rem", marginBottom:"1.25rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
            <IconAlert />
            <span style={{ fontSize:"0.875rem", fontWeight:500, color:"#92400e" }}>
              {estoquesBaixos.length} produto{estoquesBaixos.length > 1 ? "s" : ""} com estoque abaixo do mínimo:
              <strong> {estoquesBaixos.slice(0,3).map(p => p.nome).join(", ")}{estoquesBaixos.length > 3 ? "..." : ""}</strong>
            </span>
          </div>
          <button onClick={() => setAlerta(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#92400e", fontSize:"1.2rem", lineHeight:1 }}>×</button>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:"0.625rem", marginBottom:"1.25rem", alignItems:"center" }}>
        <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
          <button
            onClick={() => setFiltro("")}
            className={filtroCategoria === "" ? "btn btn-primary" : "btn btn-secondary"}
            style={{ fontSize:"0.8125rem", padding:"0.3rem 0.75rem" }}
          >
            Todas Categorias
          </button>
          {categorias.map(c => (
            <button
              key={c}
              onClick={() => setFiltro(c === filtroCategoria ? "" : c)}
              className={filtroCategoria === c ? "btn btn-primary" : "btn btn-secondary"}
              style={{ fontSize:"0.8125rem", padding:"0.3rem 0.75rem" }}
            >
              {c}
            </button>
          ))}
        </div>

        <select
          value={filtroStatus}
          onChange={e => setFiltroSt(e.target.value)}
          style={{ marginLeft:"auto", fontSize:"0.8125rem", padding:"0.375rem 0.625rem", border:"1px solid var(--border-subtle)", borderRadius:"var(--radius-sm)", background:"var(--bg-surface)", color:"var(--text-main)" }}
        >
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {/* Tabela de Produtos */}
      <div className="table-container">
        {loading ? (
          <div style={{ textAlign:"center", padding:"3rem", color:"var(--text-muted)" }}>Carregando produtos...</div>
        ) : visibles.length === 0 ? (
          <div style={{ textAlign:"center", padding:"3.5rem 1rem", color:"var(--text-secondary)" }}>
            <p style={{ fontWeight: 500, marginBottom: "0.5rem" }}>Nenhum produto encontrado no catálogo.</p>
            <Link to="/produtos/novo" className="btn btn-secondary" style={{ marginTop: "0.5rem" }}>
              Cadastrar Primeiro Produto
            </Link>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: "56px", textAlign: "center" }}>Foto</th>
                <th>Mercadoria</th>
                <th>Categoria</th>
                <th style={{ textAlign:"right" }}>Preço</th>
                <th style={{ textAlign:"center" }}>Estoque</th>
                <th style={{ textAlign:"center" }}>Status</th>
                <th style={{ textAlign:"center" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((p) => {
                const baixo = p.status === "ativo" && p.quantidade <= p.estoque_minimo;
                return (
                  <tr key={p.id} style={{ background: baixo ? "rgba(254, 243, 199, 0.35)" : "transparent" }}>
                    {/* Foto */}
                    <td style={{ textAlign: "center", padding: "0.5rem" }}>
                      <div style={{ width:"40px", height:"40px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border-subtle)", backgroundColor:"var(--bg-subtle)", display:"inline-flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                        {p.imagem ? (
                          <img src={p.imagem} alt={p.nome} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => { e.currentTarget.style.display="none"; e.currentTarget.parentElement.innerHTML='📦'; }} />
                        ) : (
                          <IconPlaceholder />
                        )}
                      </div>
                    </td>

                    {/* Nome */}
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                        {baixo && <IconAlert />}
                        <div>
                          <div style={{ fontWeight:600, color:"var(--text-main)" }}>{p.nome}</div>
                          <div style={{ display:"flex", gap:"0.4rem", alignItems:"center", marginTop:"0.15rem", flexWrap:"wrap" }}>
                            <span style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>#{p.id}</span>
                            {p.barcode && (
                              <span style={{ fontSize:"0.6875rem", color:"var(--accent-text)", background:"var(--accent-subtle)", border:"1px solid var(--accent-border)", borderRadius:"var(--radius-sm)", padding:"0.05rem 0.35rem", fontFamily:"monospace" }} title="Código de barras">
                                ❚❙❘ {p.barcode}
                              </span>
                            )}
                            {p.controla_validade && (
                              <span style={{ fontSize:"0.6875rem", fontWeight:600, padding:"0.05rem 0.35rem", background:"rgba(234,88,12,0.1)", color:"#ea580c", border:"1px solid rgba(234,88,12,0.25)", borderRadius:"var(--radius-sm)" }}>
                                🗓️ Perecível
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Categoria */}
                    <td>
                      {p.categoria ? (
                        <span style={{ fontSize:"0.75rem", background:"var(--bg-subtle)", border:"1px solid var(--border-subtle)", borderRadius:"999px", padding:"0.2rem 0.625rem", color:"var(--text-secondary)", fontWeight:500 }}>
                          {p.categoria}
                        </span>
                      ) : (
                        <span style={{ color:"var(--text-muted)", fontSize:"0.8125rem" }}>—</span>
                      )}
                    </td>

                    {/* Preço */}
                    <td style={{ textAlign:"right", color:"var(--text-main)", fontWeight:600 }}>
                      {fmtMoeda(p.preco)}
                    </td>

                    {/* Quantidade */}
                    <td style={{ textAlign:"center" }}>
                      <span style={{ color: baixo ? "#b45309" : "var(--text-main)", fontWeight: baixo ? 700 : 600 }}>
                        {p.quantidade} un
                      </span>
                      <div style={{ color:"var(--text-muted)", fontSize:"0.75rem" }}>mín: {p.estoque_minimo}</div>
                    </td>

                    {/* Status */}
                    <td style={{ textAlign:"center" }}>
                      <span style={{ fontSize:"0.75rem", fontWeight:600, padding:"0.2rem 0.625rem", borderRadius:"999px", background: p.status==="ativo" ? "var(--accent-subtle)" : "var(--bg-subtle)", color: p.status==="ativo" ? "var(--accent-text)" : "var(--text-muted)", border: `1px solid ${p.status==="ativo" ? "var(--accent-border)" : "var(--border-subtle)"}` }}>
                        {p.status === "ativo" ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    {/* Ações */}
                    <td style={{ textAlign:"center" }}>
                      <div style={{ display:"flex", gap:"0.4rem", justifyContent:"center", flexWrap:"wrap" }}>
                        <Link to={`/produtos/${p.id}`} className="btn btn-secondary" style={{ fontSize:"0.75rem", padding:"0.25rem 0.5rem" }}>
                          Editar
                        </Link>
                        <button
                          onClick={() => { setRestockProduct(p); setRestockQty(""); setRestockExpiry(""); setRestockCode(""); setRestockError(""); setRestockSuccess(""); }}
                          className="btn btn-secondary"
                          style={{ fontSize:"0.75rem", padding:"0.25rem 0.5rem" }}
                        >
                          + Repor
                        </button>
                        {p.controla_validade && (
                          <button
                            onClick={() => openBatches(p)}
                            className="btn btn-secondary"
                            style={{ fontSize:"0.75rem", padding:"0.25rem 0.5rem" }}
                          >
                            Lotes
                          </button>
                        )}
                        <button onClick={() => toggleStatus(p)} className="btn btn-secondary" style={{ fontSize:"0.75rem", padding:"0.25rem 0.5rem" }}>
                          {p.status === "ativo" ? "Inativar" : "Ativar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Reposição de Estoque */}
      {restockProduct && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, padding:"1rem" }}>
          <div className="card" style={{ width:"100%", maxWidth:"400px", padding:"1.75rem" }}>
            <h2 style={{ fontSize:"1.125rem", fontWeight:700, marginBottom:"0.25rem" }}>Repor Estoque</h2>
            <p style={{ fontSize:"0.875rem", color:"var(--text-secondary)", marginBottom:"1.25rem" }}>
              <strong>{restockProduct.nome}</strong><br/>
              Estoque atual: {restockProduct.quantidade} un
              {restockProduct.controla_validade && <span style={{ color:"#ea580c", fontWeight:600 }}> · Produto perecível</span>}
            </p>

            {restockSuccess ? (
              <div style={{ padding:"1rem", background:"rgba(22,163,74,0.1)", color:"#16a34a", borderRadius:"var(--radius-sm)", textAlign:"center", fontWeight:600 }}>✅ {restockSuccess}</div>
            ) : (
              <form onSubmit={handleRestock}>
                {restockError && <div className="error-box" style={{ marginBottom:"1rem" }}>{restockError}</div>}
                <div className="form-group" style={{ marginBottom:"1rem" }}>
                  <label style={{ fontWeight:600 }}>Quantidade a Repor</label>
                  <input type="number" min="1" required value={restockQty} onChange={e => setRestockQty(e.target.value)} placeholder="Ex: 50" autoFocus />
                </div>
                {restockProduct.controla_validade && (
                  <>
                    <div className="form-group" style={{ marginBottom:"1rem" }}>
                      <label style={{ fontWeight:600 }}>Data de Validade *</label>
                      <input type="date" required value={restockExpiry} onChange={e => setRestockExpiry(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom:"1.5rem" }}>
                      <label style={{ fontWeight:600 }}>Código do Lote (Opcional)</label>
                      <input type="text" value={restockCode} onChange={e => setRestockCode(e.target.value)} placeholder="Ex: LOT-20261112" />
                    </div>
                  </>
                )}
                <div style={{ display:"flex", gap:"0.75rem" }}>
                  <button type="submit" disabled={restockLoading} className="btn btn-primary" style={{ flex:1 }}>
                    {restockLoading ? "Repondo..." : "Repor Estoque"}
                  </button>
                  <button type="button" onClick={() => setRestockProduct(null)} className="btn btn-secondary" style={{ flex:1 }}>Cancelar</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Lotes do Produto */}
      {batchProduct && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, padding:"1rem" }}>
          <div className="card" style={{ width:"100%", maxWidth:"600px", padding:"1.75rem", maxHeight:"80vh", overflow:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
              <div>
                <h2 style={{ fontSize:"1.125rem", fontWeight:700, marginBottom:"0.1rem" }}>Lotes — {batchProduct.nome}</h2>
                <div style={{ fontSize:"0.8125rem", color:"var(--text-muted)" }}>Estoque total: {batchProduct.quantidade} un</div>
              </div>
              <button onClick={() => setBatchProduct(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", fontSize:"1.4rem" }}>×</button>
            </div>

            {batchLoading ? (
              <div style={{ textAlign:"center", padding:"2rem", color:"var(--text-muted)" }}>Carregando lotes...</div>
            ) : batches.length === 0 ? (
              <div style={{ textAlign:"center", padding:"2rem", color:"var(--text-muted)" }}>Nenhum lote cadastrado.</div>
            ) : (
              <div className="table-container" style={{ border:"none", borderRadius:0, margin:0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th style={{ textAlign:"center" }}>Validade</th>
                      <th style={{ textAlign:"center" }}>Dias</th>
                      <th style={{ textAlign:"center" }}>Qtd</th>
                      <th style={{ textAlign:"center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map(b => {
                      const isExpired = b.is_expired;
                      const isUrgent = !isExpired && b.days_to_expire !== null && b.days_to_expire <= 7;
                      const rowBg = isExpired ? "rgba(220,38,38,0.07)" : isUrgent ? "rgba(234,88,12,0.07)" : "transparent";
                      return (
                        <tr key={b.id} style={{ background: rowBg }}>
                          <td style={{ color:"var(--text-secondary)", fontSize:"0.8125rem" }}>
                            {b.batch_code || <span style={{ color:"var(--text-muted)" }}>—</span>}
                          </td>
                          <td style={{ textAlign:"center", fontWeight:600, color: isExpired ? "#dc2626" : isUrgent ? "#ea580c" : "var(--text-main)" }}>
                            {fmtDate(b.expiry_date)}
                          </td>
                          <td style={{ textAlign:"center", fontSize:"0.875rem" }}>
                            {isExpired ? (
                              <span style={{ color:"#dc2626", fontWeight:700 }}>{Math.abs(b.days_to_expire)}d atrás</span>
                            ) : (
                              <span style={{ color: isUrgent ? "#ea580c" : "var(--text-secondary)", fontWeight:600 }}>+{b.days_to_expire}d</span>
                            )}
                          </td>
                          <td style={{ textAlign:"center", fontWeight:700 }}>{b.quantity} un</td>
                          <td style={{ textAlign:"center" }}>
                            <span style={{ fontSize:"0.7rem", fontWeight:600, padding:"0.15rem 0.4rem", borderRadius:"999px",
                              background: isExpired ? "rgba(220,38,38,0.12)" : isUrgent ? "rgba(234,88,12,0.12)" : "rgba(22,163,74,0.12)",
                              color: isExpired ? "#dc2626" : isUrgent ? "#ea580c" : "#16a34a"
                            }}>
                              {isExpired ? "⛔ Vencido" : isUrgent ? "⚠️ Urgente" : "✅ OK"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display:"flex", gap:"0.75rem", marginTop:"1.25rem" }}>
              <Link
                to="/produtos/alertas-validade"
                className="btn btn-secondary"
                style={{ fontSize:"0.8125rem" }}
                onClick={() => setBatchProduct(null)}
              >
                Ver Alertas Completos
              </Link>
              <button onClick={() => setBatchProduct(null)} className="btn btn-secondary" style={{ marginLeft:"auto" }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
