import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { Link } from "react-router-dom";

export default function SalesList() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroForma, setFiltroForma] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  
  // Modal de Cancelamento
  const [saleParaCancelar, setSaleParaCancelar] = useState(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [cancelando, setCancelando] = useState(false);
  const [cancelError, setCancelError] = useState("");

  async function loadSales() {
    setLoading(true);
    try {
      const params = {};
      if (filtroForma) params.forma = filtroForma;
      if (dataInicio) params.inicio = dataInicio;
      if (dataFim) params.fim = dataFim;

      const response = await api.get("/api/sales", { params });
      setSales(response.data);
    } catch (err) {
      console.error("Erro ao carregar vendas", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
  }, [filtroForma, dataInicio, dataFim]);

  async function handleExportCSV() {
    try {
      const params = new URLSearchParams();
      if (filtroForma) params.append("forma", filtroForma);
      if (dataInicio) params.append("inicio", dataInicio);
      if (dataFim) params.append("fim", dataFim);

      const res = await api.get(`/api/sales/export?${params.toString()}`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `relatorio_vendas_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Erro ao exportar CSV de vendas.");
    }
  }

  async function confirmarCancelamento(e) {
    e.preventDefault();
    if (!saleParaCancelar) return;
    setCancelando(true);
    setCancelError("");

    try {
      await api.patch(`/api/sales/${saleParaCancelar.id}/cancel`, {
        motivo: motivoCancelamento,
      });
      setSaleParaCancelar(null);
      setMotivoCancelamento("");
      loadSales();
    } catch (err) {
      setCancelError(err.response?.data?.erro || "Erro ao cancelar venda.");
    } finally {
      setCancelando(false);
    }
  }

  const badgeForma = (forma) => {
    const map = {
      dinheiro: { label: "Dinheiro", bg: "#fef3c7", color: "#92400e" },
      pix: { label: "PIX", bg: "#ecfdf5", color: "#065f46" },
      debito: { label: "Débito", bg: "#eff6ff", color: "#1e40af" },
      credito: { label: "Crédito", bg: "#f5f3ff", color: "#5b21b6" },
    };
    const item = map[forma] || { label: forma || "Outro", bg: "var(--bg-subtle)", color: "var(--text-secondary)" };
    return (
      <span style={{
        fontSize: "0.75rem",
        fontWeight: 600,
        padding: "0.2rem 0.5rem",
        borderRadius: "var(--radius-sm)",
        background: item.bg,
        color: item.color,
      }}>
        {item.label}
      </span>
    );
  };

  const fmtBRL = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="page-content">
      {/* Topo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Histórico de Vendas</h1>
          <p className="subtitle">
            {sales.length} {sales.length === 1 ? "venda encontrada" : "vendas encontradas"}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={handleExportCSV} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar CSV
          </button>
          <Link to="/vendas/nova" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nova Venda
          </Link>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="card" style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 500 }}>Período:</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            style={{ fontSize: "0.8125rem", padding: "0.35rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", color: "var(--text-main)" }}
          />
          <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>até</span>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            style={{ fontSize: "0.8125rem", padding: "0.35rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", color: "var(--text-main)" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 500 }}>Pagamento:</label>
          <select
            value={filtroForma}
            onChange={(e) => setFiltroForma(e.target.value)}
            style={{ fontSize: "0.8125rem", padding: "0.35rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", color: "var(--text-main)" }}
          >
            <option value="">Todos</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="pix">PIX</option>
            <option value="debito">Cartão Débito</option>
            <option value="credito">Cartão Crédito</option>
          </select>
        </div>

        {(filtroForma || dataInicio || dataFim) && (
          <button
            onClick={() => { setFiltroForma(""); setDataInicio(""); setDataFim(""); }}
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem", padding: "0.35rem 0.625rem", marginLeft: "auto" }}
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Tabela de Vendas */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Data & Horário</th>
              <th>Produto</th>
              <th style={{ textAlign: "center" }}>Qtd</th>
              <th>Pagamento</th>
              <th style={{ textAlign: "right" }}>Preço Un.</th>
              <th style={{ textAlign: "right" }}>Desconto</th>
              <th style={{ textAlign: "right" }}>Total</th>
              <th style={{ textAlign: "center" }}>Status</th>
              <th style={{ textAlign: "center" }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
                  Carregando histórico de vendas...
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "3.5rem 1rem", color: "var(--text-secondary)" }}>
                  <p style={{ fontWeight: 500, marginBottom: "0.5rem" }}>Nenhuma venda encontrada para os filtros aplicados.</p>
                  <Link to="/vendas/nova" className="btn btn-secondary" style={{ marginTop: "0.5rem" }}>
                    Registrar Venda
                  </Link>
                </td>
              </tr>
            ) : (
              sales.map((sale) => {
                const isCancelada = sale.status === "cancelada";
                const dataFormatada = new Date(sale.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                });
                const horaFormatada = new Date(sale.created_at).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <tr key={sale.id} style={{ opacity: isCancelada ? 0.6 : 1, background: isCancelada ? "rgba(0,0,0,0.01)" : "transparent" }}>
                    <td>
                      <div style={{ fontWeight: 500, color: "var(--text-main)", textDecoration: isCancelada ? "line-through" : "none" }}>
                        {dataFormatada}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>às {horaFormatada}</div>
                    </td>

                    <td>
                      <span style={{ fontWeight: 600, color: "var(--text-main)", textDecoration: isCancelada ? "line-through" : "none" }}>
                        {sale.produto_nome || `Produto #${sale.product_id}`}
                      </span>
                    </td>

                    <td style={{ textAlign: "center", fontWeight: 500 }}>
                      {sale.quantidade} un
                    </td>

                    <td>
                      {badgeForma(sale.forma_pagamento)}
                    </td>

                    <td style={{ textAlign: "right", color: "var(--text-secondary)" }}>
                      {fmtBRL(sale.preco_venda)}
                    </td>

                    <td style={{ textAlign: "right", color: sale.desconto > 0 ? "#b45309" : "var(--text-muted)", fontSize: "0.8125rem" }}>
                      {sale.desconto > 0 ? `- ${fmtBRL(sale.desconto)}` : "—"}
                    </td>

                    <td style={{ textAlign: "right", fontWeight: 700, color: isCancelada ? "var(--text-muted)" : "var(--accent)" }}>
                      {fmtBRL(sale.total ?? (sale.quantidade * sale.preco_venda - (sale.desconto || 0)))}
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <span style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        padding: "0.2rem 0.5rem",
                        borderRadius: "999px",
                        background: isCancelada ? "#fee2e2" : "var(--accent-subtle)",
                        color: isCancelada ? "#991b1b" : "var(--accent-text)",
                        border: `1px solid ${isCancelada ? "#fca5a5" : "var(--accent-border)"}`
                      }}>
                        {isCancelada ? "Cancelada" : "Ativa"}
                      </span>
                    </td>

                    <td style={{ textAlign: "center" }}>
                      {!isCancelada && (
                        <button
                          onClick={() => setSaleParaCancelar(sale)}
                          className="btn btn-secondary"
                          style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", color: "#dc2626" }}
                          title="Cancelar venda e estornar estoque"
                        >
                          Cancelar
                        </button>
                      )}
                      {isCancelada && sale.motivo_cancelamento && (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }} title={sale.motivo_cancelamento}>
                          Motivo reg.
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Cancelar Venda */}
      {saleParaCancelar && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "1rem",
        }}>
          <div className="card" style={{ maxWidth: "420px", width: "100%", padding: "1.75rem", animation: "fadeSlideIn 0.2s ease" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem", color: "#991b1b" }}>
              Confirmar Cancelamento de Venda
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Ao cancelar a venda do produto <strong>{saleParaCancelar.produto_nome}</strong> ({saleParaCancelar.quantidade} un), o estoque correspondente será estornado automaticamente.
            </p>

            {cancelError && <div className="error-box" style={{ marginBottom: "1rem" }}>{cancelError}</div>}

            <form onSubmit={confirmarCancelamento}>
              <div className="form-group">
                <label>Motivo do Cancelamento (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Devolução pelo cliente / Erro de digitação"
                  value={motivoCancelamento}
                  onChange={(e) => setMotivoCancelamento(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSaleParaCancelar(null)}
                  disabled={cancelando}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: "#dc2626", borderColor: "#dc2626" }}
                  disabled={cancelando}
                >
                  {cancelando ? "Cancelando..." : "Confirmar Estorno"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
