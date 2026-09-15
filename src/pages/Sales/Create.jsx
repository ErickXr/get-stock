import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useNavigate, Link } from "react-router-dom";

const FORMAS = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix",      label: "PIX" },
  { value: "debito",   label: "Cartao Debito" },
  { value: "credito",  label: "Cartao Credito" },
];

export default function CreateSale() {
  const [products, setProducts]     = useState([]);
  const [formData, setFormData]     = useState({ produtoId: "", quantidade: 1, forma_pagamento: "dinheiro", desconto: 0 });
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/products").then(r => {
      setProducts(r.data.filter(p => p.status === "ativo" && p.quantidade > 0));
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.produtoId) { setError("Selecione um produto."); return; }
    setLoading(true); setError("");
    try {
      await api.post("/api/sales", {
        produtoId:       parseInt(formData.produtoId),
        quantidade:      parseInt(formData.quantidade),
        forma_pagamento: formData.forma_pagamento,
        desconto:        parseFloat(formData.desconto) || 0,
      });
      navigate("/vendas");
    } catch (err) {
      setError(err.response?.data?.erro || "Erro ao registrar venda.");
    } finally { setLoading(false); }
  }

  const prod       = products.find(p => p.id === parseInt(formData.produtoId));
  const subtotal   = prod ? prod.preco * formData.quantidade : 0;
  const desconto   = parseFloat(formData.desconto) || 0;
  const total      = Math.max(0, subtotal - desconto);
  const fmtBRL     = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="page-content" style={{ maxWidth: "600px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1>Registrar Venda</h1>
        <p className="subtitle">Operacao de saida de mercadoria com baixa automatica no estoque</p>
      </div>

      {error && <div className="error-box" style={{ marginBottom: "1.5rem" }}>{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Mercadoria</label>
            <select required value={formData.produtoId} onChange={e => setFormData({ ...formData, produtoId: e.target.value })}>
              <option value="">Escolha um item disponivel...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome} - {fmtBRL(p.preco)} ({p.quantidade} un)
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Quantidade</label>
              <input
                type="number" min="1"
                max={prod ? prod.quantidade : undefined}
                value={formData.quantidade} required
                onChange={e => setFormData({ ...formData, quantidade: Math.max(1, parseInt(e.target.value) || 1) })}
              />
            </div>
            <div className="form-group">
              <label>Desconto (R$)</label>
              <input
                type="number" min="0" step="0.01" placeholder="0,00"
                value={formData.desconto}
                onChange={e => setFormData({ ...formData, desconto: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Forma de Pagamento</label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {FORMAS.map(f => (
                <button key={f.value} type="button"
                  onClick={() => setFormData({ ...formData, forma_pagamento: f.value })}
                  style={{
                    padding: "0.4rem 0.875rem", borderRadius: "var(--radius-sm)", fontSize: "0.8125rem",
                    fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                    border: `1px solid ${formData.forma_pagamento === f.value ? "var(--accent)" : "var(--border-subtle)"}`,
                    background: formData.forma_pagamento === f.value ? "var(--accent-subtle)" : "var(--bg-surface)",
                    color: formData.forma_pagamento === f.value ? "var(--accent-text)" : "var(--text-secondary)",
                    transition: "var(--transition)",
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resumo */}
          <div style={{ padding: "1rem 1.25rem", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.375rem" }}>
              <span>Subtotal</span><span>{fmtBRL(subtotal)}</span>
            </div>
            {desconto > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#b45309", marginBottom: "0.375rem" }}>
                <span>Desconto</span><span>- {fmtBRL(desconto)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.5rem", marginTop: "0.375rem" }}>
              <span style={{ fontWeight: 600, color: "var(--text-main)" }}>Total a Cobrar</span>
              <span style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>{fmtBRL(total)}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
            <button type="submit" className="btn btn-primary" disabled={loading || products.length === 0}>
              {loading ? "Processando..." : "Confirmar Venda"}
            </button>
            <Link to="/vendas" className="btn btn-secondary">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
