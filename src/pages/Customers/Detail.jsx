import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useParams, Link } from "react-router-dom";

export default function CustomerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal de Pagamento
  const [showModal, setShowModal] = useState(false);
  const [valorPagamento, setValorPagamento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("dinheiro");
  const [observacaoPagamento, setObservacaoPagamento] = useState("");
  const [salvandoPagamento, setSalvandoPagamento] = useState(false);
  const [erroPagamento, setErroPagamento] = useState("");

  const seller = JSON.parse(localStorage.getItem("seller") || "null");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const nivel = seller ? "admin" : (user?.nivel || "operador");
  const podeGerenciar = nivel === "admin" || nivel === "gerente";

  async function loadStatement() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/api/customers/${id}/statement`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.erro || "Erro ao carregar extrato do cliente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatement();
  }, [id]);

  function fmtBRL(val) {
    return (Number(val) || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function fmtData(isoStr) {
    if (!isoStr) return "—";
    try {
      const d = new Date(isoStr);
      return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })} às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    } catch {
      return isoStr;
    }
  }

  function abrirModal() {
    if (!data?.customer) return;
    setValorPagamento(data.customer.saldo_devedor.toFixed(2));
    setFormaPagamento("dinheiro");
    setObservacaoPagamento("");
    setErroPagamento("");
    setShowModal(true);
  }

  async function handleConfirmarPagamento(e) {
    e.preventDefault();
    if (!data?.customer) return;

    const valorNum = parseFloat(valorPagamento.replace(",", "."));
    if (isNaN(valorNum) || valorNum <= 0) {
      setErroPagamento("Informe um valor válido e positivo.");
      return;
    }

    if (valorNum > data.customer.saldo_devedor) {
      setErroPagamento(`O valor não pode exceder a dívida de ${fmtBRL(data.customer.saldo_devedor)}.`);
      return;
    }

    setSalvandoPagamento(true);
    setErroPagamento("");

    try {
      await api.post(`/api/customers/${id}/payments`, {
        amount: valorNum,
        payment_method: formaPagamento,
        note: observacaoPagamento
      });

      setShowModal(false);
      loadStatement();
    } catch (err) {
      setErroPagamento(err.response?.data?.erro || "Erro ao registrar pagamento.");
    } finally {
      setSalvandoPagamento(false);
    }
  }

  if (loading) {
    return (
      <div className="page-content">
        <p style={{ color: "var(--text-muted)" }}>Carregando extrato do cliente...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-content">
        <Link to="/clientes" style={{ fontSize: "0.8125rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
          ← Voltar para Clientes
        </Link>
        <div className="error-box" style={{ marginTop: "1rem" }}>
          {error || "Cliente não encontrado."}
        </div>
      </div>
    );
  }

  const { customer, timeline } = data;
  const pctUso = customer.percentual_uso || 0;
  const corBarra = pctUso > 90 ? "#dc2626" : pctUso > 70 ? "#d97706" : "var(--accent)";

  return (
    <div className="page-content">
      {/* Topo / Voltar & Cabeçalho */}
      <div style={{ marginBottom: "1.75rem" }}>
        <Link to="/clientes" style={{ fontSize: "0.8125rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.75rem" }}>
          ← Voltar para Todos os Clientes
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <h1 style={{ marginBottom: 0 }}>{customer.name}</h1>
              <span style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                padding: "0.2rem 0.55rem",
                borderRadius: "999px",
                background: customer.active ? "var(--accent-subtle)" : "var(--bg-subtle)",
                color: customer.active ? "var(--accent-text)" : "var(--text-muted)",
                border: `1px solid ${customer.active ? "var(--accent-border)" : "var(--border-subtle)"}`
              }}>
                {customer.active ? "Cliente Ativo" : "Cliente Inativo"}
              </span>
            </div>
            <p className="subtitle" style={{ marginTop: "0.25rem" }}>
              📞 {customer.phone} {customer.cpf ? `• CPF: ${customer.cpf}` : ""} • Cliente desde {new Date(customer.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            {customer.saldo_devedor > 0 && (
              <button
                type="button"
                onClick={abrirModal}
                className="btn btn-primary"
                style={{ background: "#16a34a", borderColor: "#16a34a" }}
              >
                💰 Receber Pagamento
              </button>
            )}
            {podeGerenciar && (
              <Link to={`/clientes/${customer.id}/editar`} className="btn btn-secondary">
                ✏️ Editar Cliente
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Cartão de Limite & Saldo Devedor */}
      <div className="card" style={{ padding: "1.75rem", marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem" }}>
          Situação da Conta Fiado
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
              Limite Total Aprovado
            </div>
            <div style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--text-main)", marginTop: "0.35rem" }}>
              {fmtBRL(customer.credit_limit)}
            </div>
          </div>

          <div style={{ background: customer.saldo_devedor > 0 ? "rgba(239, 68, 68, 0.08)" : "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-sm)", border: `1px solid ${customer.saldo_devedor > 0 ? "rgba(239, 68, 68, 0.25)" : "var(--border-subtle)"}` }}>
            <div style={{ fontSize: "0.75rem", color: customer.saldo_devedor > 0 ? "#dc2626" : "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
              Saldo Devedor Atual
            </div>
            <div style={{ fontSize: "1.375rem", fontWeight: 700, color: customer.saldo_devedor > 0 ? "#dc2626" : "#16a34a", marginTop: "0.35rem" }}>
              {fmtBRL(customer.saldo_devedor)}
            </div>
          </div>

          <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
              Limite Disponível p/ Compras
            </div>
            <div style={{ fontSize: "1.375rem", fontWeight: 700, color: customer.limite_disponivel > 0 ? "var(--accent)" : "var(--text-muted)", marginTop: "0.35rem" }}>
              {fmtBRL(customer.limite_disponivel)}
            </div>
          </div>
        </div>

        {/* Barra de Uso do Limite */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
            <span>Uso do Limite de Crédito</span>
            <span style={{ fontWeight: 600, color: corBarra }}>
              {customer.credit_limit > 0 ? `${pctUso}% consumido` : "Sem limite configurado"}
            </span>
          </div>
          <div style={{ height: "10px", width: "100%", background: "var(--bg-subtle)", borderRadius: "999px", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, pctUso)}%`,
                background: corBarra,
                borderRadius: "999px",
                transition: "width 0.4s ease-in-out"
              }}
            />
          </div>
        </div>
      </div>

      {/* Extrato Cronológico de Movimentações */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h3 style={{ fontSize: "1.0625rem", fontWeight: 700 }}>Extrato da Caderneta</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Histórico cronológico de compras no fiado e pagamentos efetuados
            </p>
          </div>
        </div>

        {timeline.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            Nenhuma movimentação registrada na conta fiado deste cliente.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Data & Hora</th>
                  <th>Tipo / Operação</th>
                  <th>Descrição / Detalhes</th>
                  <th>Operador / Responsável</th>
                  <th style={{ textAlign: "right" }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((item, idx) => {
                  const isPagamento = item.type === "pagamento_recebido";
                  const isCancelada = item.status === "cancelada";

                  return (
                    <tr
                      key={`${item.type}-${item.id}-${idx}`}
                      style={{
                        opacity: isCancelada ? 0.6 : 1,
                        background: isPagamento ? "rgba(22, 163, 74, 0.03)" : "transparent"
                      }}
                    >
                      <td>
                        <div style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-main)" }}>
                          {fmtData(item.date)}
                        </div>
                      </td>

                      <td>
                        {isPagamento ? (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            padding: "0.2rem 0.5rem",
                            borderRadius: "999px",
                            background: "rgba(22, 163, 74, 0.12)",
                            color: "#16a34a",
                            border: "1px solid rgba(22, 163, 74, 0.25)"
                          }}>
                            ✓ Pagamento Recebido
                          </span>
                        ) : (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            padding: "0.2rem 0.5rem",
                            borderRadius: "999px",
                            background: isCancelada ? "rgba(239, 68, 68, 0.12)" : "rgba(15, 118, 110, 0.12)",
                            color: isCancelada ? "#dc2626" : "var(--accent)",
                            border: `1px solid ${isCancelada ? "rgba(239, 68, 68, 0.25)" : "rgba(15, 118, 110, 0.25)"}`
                          }}>
                            {isCancelada ? "✕ Compra Cancelada" : "🛒 Compra no Fiado"}
                          </span>
                        )}
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-main)", textDecoration: isCancelada ? "line-through" : "none" }}>
                          {item.items_summary}
                        </div>
                        {item.note && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {item.note}
                          </div>
                        )}
                      </td>

                      <td>
                        <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                          {item.operator}
                        </span>
                      </td>

                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        {isPagamento ? (
                          <span style={{ color: "#16a34a" }}>
                            - {fmtBRL(item.amount)}
                          </span>
                        ) : (
                          <span style={{ color: isCancelada ? "var(--text-muted)" : "#dc2626", textDecoration: isCancelada ? "line-through" : "none" }}>
                            + {fmtBRL(item.amount)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Recebimento de Pagamento */}
      {showModal && (
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
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Receber Pagamento</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: "var(--bg-subtle)", padding: "0.85rem", borderRadius: "var(--radius-sm)", marginBottom: "1.25rem", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{customer.name}</div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                Saldo Devedor Atual: <strong style={{ color: "#dc2626" }}>{fmtBRL(customer.saldo_devedor)}</strong>
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
                  max={customer.saldo_devedor}
                  value={valorPagamento}
                  onChange={(e) => setValorPagamento(e.target.value)}
                  placeholder="0,00"
                  required
                  autoFocus
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Máximo: {fmtBRL(customer.saldo_devedor)}
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
                  placeholder="Ex: Quitação parcial da caderneta"
                  value={observacaoPagamento}
                  onChange={(e) => setObservacaoPagamento(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
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
