import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { Link } from "react-router-dom";

export default function CustomersList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos"); // 'todos', 'com_divida', 'ativos', 'inativos'
  
  // Modal de Recebimento Rápido
  const [clienteRecebimento, setClienteRecebimento] = useState(null);
  const [valorPagamento, setValorPagamento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("dinheiro");
  const [observacaoPagamento, setObservacaoPagamento] = useState("");
  const [salvandoPagamento, setSalvandoPagamento] = useState(false);
  const [erroPagamento, setErroPagamento] = useState("");

  const seller = JSON.parse(localStorage.getItem("seller") || "null");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const nivel = seller ? "admin" : (user?.nivel || "operador");
  const podeGerenciar = nivel === "admin" || nivel === "gerente";

  async function fetchCustomers() {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (search) params.search = search;
      const res = await api.get("/api/customers", { params });
      setCustomers(res.data);
    } catch (err) {
      setError(err.response?.data?.erro || "Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  function fmtBRL(val) {
    return (Number(val) || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  const clientesFiltrados = customers.filter(c => {
    if (filtroStatus === "com_divida") return c.saldo_devedor > 0;
    if (filtroStatus === "ativos") return c.active;
    if (filtroStatus === "inativos") return !c.active;
    return true;
  });

  const totalEmAberto = customers.reduce((acc, c) => acc + (c.saldo_devedor || 0), 0);
  const totalDevedores = customers.filter(c => c.saldo_devedor > 0).length;

  function abrirModalReceber(c) {
    setClienteRecebimento(c);
    setValorPagamento(c.saldo_devedor.toFixed(2));
    setFormaPagamento("dinheiro");
    setObservacaoPagamento("");
    setErroPagamento("");
  }

  async function handleConfirmarPagamento(e) {
    e.preventDefault();
    if (!clienteRecebimento) return;

    const valorNum = parseFloat(valorPagamento.replace(",", "."));
    if (isNaN(valorNum) || valorNum <= 0) {
      setErroPagamento("Informe um valor válido e positivo.");
      return;
    }

    if (valorNum > clienteRecebimento.saldo_devedor) {
      setErroPagamento(`O valor não pode exceder o saldo devedor de ${fmtBRL(clienteRecebimento.saldo_devedor)}.`);
      return;
    }

    setSalvandoPagamento(true);
    setErroPagamento("");

    try {
      await api.post(`/api/customers/${clienteRecebimento.id}/payments`, {
        amount: valorNum,
        payment_method: formaPagamento,
        note: observacaoPagamento
      });

      setClienteRecebimento(null);
      fetchCustomers();
    } catch (err) {
      setErroPagamento(err.response?.data?.erro || "Erro ao registrar pagamento.");
    } finally {
      setSalvandoPagamento(false);
    }
  }

  return (
    <div className="page-content">
      {/* Topo / Título & Ações */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Clientes & Caderneta (Fiado)</h1>
          <p className="subtitle">
            Gestão de contas fiado, limites de crédito e recebimento de pagamentos
          </p>
        </div>

        {podeGerenciar && (
          <Link to="/clientes/novo" className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Novo Cliente
          </Link>
        )}
      </div>

      {/* Cards de Resumo Rápido */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
        <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid var(--accent)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>
            Total de Clientes
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.4rem", color: "var(--text-main)" }}>
            {customers.length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {customers.filter(c => c.active).length} ativos no sistema
          </div>
        </div>

        <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid #dc2626" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>
            Total a Receber (Fiado)
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.4rem", color: totalEmAberto > 0 ? "#dc2626" : "var(--text-main)" }}>
            {fmtBRL(totalEmAberto)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {totalDevedores} {totalDevedores === 1 ? "cliente com débito" : "clientes com débito"}
          </div>
        </div>

        <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid #16a34a" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>
            Clientes em Dia
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.4rem", color: "#16a34a" }}>
            {customers.filter(c => c.active && c.saldo_devedor === 0).length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Sem pendências financeiras
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="card" style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "0.75rem", flex: 1, minWidth: "260px" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "380px" }}>
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", paddingLeft: "2.25rem" }}
            />
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 500 }}>Filtrar:</span>
          <div style={{ display: "flex", background: "var(--bg-subtle)", borderRadius: "var(--radius-sm)", padding: "0.2rem", border: "1px solid var(--border-subtle)" }}>
            {[
              { id: "todos", label: "Todos" },
              { id: "com_divida", label: `Com Débito (${totalDevedores})` },
              { id: "ativos", label: "Ativos" },
              { id: "inativos", label: "Inativos" },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFiltroStatus(tab.id)}
                style={{
                  border: "none",
                  background: filtroStatus === tab.id ? "var(--bg-surface)" : "transparent",
                  color: filtroStatus === tab.id ? "var(--accent)" : "var(--text-secondary)",
                  fontWeight: filtroStatus === tab.id ? 600 : 500,
                  fontSize: "0.75rem",
                  padding: "0.35rem 0.65rem",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  boxShadow: filtroStatus === tab.id ? "var(--shadow-xs)" : "none",
                  transition: "var(--transition)"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: "1.5rem" }}>{error}</div>}

      {/* Tabela de Clientes */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contato / Documento</th>
              <th style={{ textAlign: "right" }}>Limite de Crédito</th>
              <th style={{ textAlign: "right" }}>Saldo Devedor</th>
              <th style={{ textAlign: "right" }}>Disponível</th>
              <th style={{ textAlign: "center" }}>Situação</th>
              <th style={{ textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                  Carregando clientes...
                </td>
              </tr>
            ) : clientesFiltrados.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                  {search ? `Nenhum cliente encontrado para "${search}".` : "Nenhum cliente cadastrado nesta categoria."}
                </td>
              </tr>
            ) : (
              clientesFiltrados.map(c => {
                const temDivida = c.saldo_devedor > 0;
                return (
                  <tr key={c.id} style={{ opacity: c.active ? 1 : 0.6 }}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                        <Link to={`/clientes/${c.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                          {c.name}
                        </Link>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        Cód. #{c.id}
                      </div>
                    </td>

                    <td>
                      <div style={{ color: "var(--text-main)", fontSize: "0.875rem" }}>
                        📞 {c.phone}
                      </div>
                      {c.cpf && (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          CPF: {c.cpf}
                        </div>
                      )}
                    </td>

                    <td style={{ textAlign: "right", fontWeight: 500 }}>
                      {fmtBRL(c.credit_limit)}
                    </td>

                    <td style={{ textAlign: "right" }}>
                      {temDivida ? (
                        <div style={{ display: "inline-block", textAlign: "right" }}>
                          <span style={{
                            display: "inline-block",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "999px",
                            fontSize: "0.8125rem",
                            fontWeight: 700,
                            background: "rgba(239, 68, 68, 0.12)",
                            color: "#dc2626",
                            border: "1px solid rgba(239, 68, 68, 0.25)"
                          }}>
                            {fmtBRL(c.saldo_devedor)}
                          </span>
                          {c.credit_limit > 0 && (
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                              {c.percentual_uso}% do limite
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#16a34a", fontSize: "0.8125rem", fontWeight: 600 }}>
                          Em dia (R$ 0,00)
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: "right", fontWeight: 600, color: c.limite_disponivel > 0 ? "var(--accent)" : "var(--text-muted)" }}>
                      {fmtBRL(c.limite_disponivel)}
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <span style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        padding: "0.2rem 0.5rem",
                        borderRadius: "999px",
                        background: c.active ? "var(--accent-subtle)" : "var(--bg-subtle)",
                        color: c.active ? "var(--accent-text)" : "var(--text-muted)",
                        border: `1px solid ${c.active ? "var(--accent-border)" : "var(--border-subtle)"}`
                      }}>
                        {c.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center" }}>
                        {temDivida && (
                          <button
                            type="button"
                            onClick={() => abrirModalReceber(c)}
                            className="btn btn-primary"
                            style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", background: "#16a34a", borderColor: "#16a34a" }}
                            title="Receber pagamento deste cliente"
                          >
                            💰 Receber
                          </button>
                        )}
                        <Link
                          to={`/clientes/${c.id}`}
                          className="btn btn-secondary"
                          style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                          title="Ver extrato completo e movimentações"
                        >
                          Extrato
                        </Link>
                        {podeGerenciar && (
                          <Link
                            to={`/clientes/${c.id}/editar`}
                            className="btn btn-secondary"
                            style={{ fontSize: "0.75rem", padding: "0.3rem 0.5rem" }}
                            title="Editar dados cadastrais e limite"
                          >
                            ✏️
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Recebimento de Pagamento */}
      {clienteRecebimento && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1rem"
        }}>
          <div className="card" style={{ maxWidth: "460px", width: "100%", padding: "1.75rem", borderRadius: "var(--radius-lg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Receber Pagamento (Fiado)</h3>
              <button
                type="button"
                onClick={() => setClienteRecebimento(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: "var(--bg-subtle)", padding: "0.85rem", borderRadius: "var(--radius-sm)", marginBottom: "1.25rem", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{clienteRecebimento.name}</div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                Saldo Devedor Atual: <strong style={{ color: "#dc2626" }}>{fmtBRL(clienteRecebimento.saldo_devedor)}</strong>
              </div>
            </div>

            {erroPagamento && <div className="error-box" style={{ marginBottom: "1rem" }}>{erroPagamento}</div>}

            <form onSubmit={handleConfirmarPagamento}>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Valor a Receber (R$)*</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={clienteRecebimento.saldo_devedor}
                  value={valorPagamento}
                  onChange={(e) => setValorPagamento(e.target.value)}
                  placeholder="0,00"
                  required
                  autoFocus
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Máximo permitido: {fmtBRL(clienteRecebimento.saldo_devedor)}
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Forma de Pagamento*</label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  required
                >
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">PIX</option>
                  <option value="debito">Cartão de Débito</option>
                  <option value="credito">Cartão de Crédito</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label>Observação (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Pagamento parcial da semana"
                  value={observacaoPagamento}
                  onChange={(e) => setObservacaoPagamento(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setClienteRecebimento(null)}
                  disabled={salvandoPagamento}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: "#16a34a", borderColor: "#16a34a" }}
                  disabled={salvandoPagamento}
                >
                  {salvandoPagamento ? "Registrando..." : "Confirmar Recebimento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
