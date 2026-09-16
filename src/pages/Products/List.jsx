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

  async function fetchAll() {
    setLoading(true);
    try {
      const params = {};
      if (filtroCategoria) params.categoria = filtroCategoria;
      const [pRes, cRes] = await Promise.all([
        api.get("/api/products", { params }),
        api.get("/api/products/categorias"),
      ]);
      setProducts(pRes.data);
      setCategorias(cRes.data || []);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, [filtroCategoria]);

  async function toggleStatus(p) {
    const rota = p.status === "ativo"
      ? `/api/products/${p.id}/inactivate`
      : `/api/products/${p.id}/activate`;
    await api.patch(rota);
    fetchAll();
  }

  const estoquesBaixos = products.filter(p => p.status === "ativo" && p.quantidade <= p.estoque_minimo);
  const visibles = products.filter(p => filtroStatus === "todos" ? true : p.status === filtroStatus);
  const fmtMoeda = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="page-content">
      {/* Topo / Cabeçalho */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Catálogo & Estoque</h1>
          <p className="subtitle">Gestão de mercadorias cadastradas no seu mercado</p>
        </div>
        <Link to="/produtos/novo" className="btn btn-primary" style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo Produto
        </Link>
      </div>

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

      {/* Tabela de Produtos com Foto */}
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
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-subtle)",
                        backgroundColor: "var(--bg-subtle)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden"
                      }}>
                        {p.imagem ? (
                          <img
                            src={p.imagem}
                            alt={p.nome}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                              // Se der erro ao carregar imagem externa, mostra placeholder
                              e.currentTarget.style.display = "none";
                              e.currentTarget.parentElement.innerHTML = '📦';
                            }}
                          />
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
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>#{p.id}</div>
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

                    {/* Quantidade / Estoque Mínimo */}
                    <td style={{ textAlign:"center" }}>
                      <span style={{ color: baixo ? "#b45309" : "var(--text-main)", fontWeight: baixo ? 700 : 600 }}>
                        {p.quantidade} un
                      </span>
                      <div style={{ color:"var(--text-muted)", fontSize:"0.75rem" }}>
                        mín: {p.estoque_minimo}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ textAlign:"center" }}>
                      <span style={{
                        fontSize:"0.75rem",
                        fontWeight:600,
                        padding:"0.2rem 0.625rem",
                        borderRadius:"999px",
                        background: p.status === "ativo" ? "var(--accent-subtle)" : "var(--bg-subtle)",
                        color: p.status === "ativo" ? "var(--accent-text)" : "var(--text-muted)",
                        border: `1px solid ${p.status === "ativo" ? "var(--accent-border)" : "var(--border-subtle)"}`
                      }}>
                        {p.status === "ativo" ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    {/* Ações */}
                    <td style={{ textAlign:"center" }}>
                      <div style={{ display:"flex", gap:"0.4rem", justifyContent: "center" }}>
                        <Link to={`/produtos/${p.id}`} className="btn btn-secondary" style={{ fontSize:"0.75rem", padding:"0.25rem 0.5rem" }}>
                          Editar
                        </Link>
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
    </div>
  );
}
