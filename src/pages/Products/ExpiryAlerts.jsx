import React, { useEffect, useState, useCallback } from "react";
import { api } from "../../services/api";
import { Link, useNavigate } from "react-router-dom";

const URGENCY_STYLE = {
  vencido:  { bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.25)",  text: "#dc2626",  label: "Vencido",           icon: "⛔" },
  urgente:  { bg: "rgba(234,88,12,0.08)",  border: "rgba(234,88,12,0.25)",  text: "#ea580c",  label: "Vence em ≤7 dias",  icon: "⚠️" },
  atencao:  { bg: "rgba(202,138,4,0.08)",  border: "rgba(202,138,4,0.25)",  text: "#ca8a04",  label: "Vence em ≤15 dias", icon: "⚡" },
  ok:       { bg: "transparent",           border: "var(--border-subtle)", text: "var(--text-secondary)", label: "OK",  icon: "✅" },
};

function fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function ExpiryAlerts() {
  const [alerts, setAlerts]       = useState([]);
  const [days, setDays]           = useState(7);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [writeOff, setWriteOff]   = useState(null); // { batch, product_nome }
  const [woQty, setWoQty]         = useState("");
  const [woReason, setWoReason]   = useState("Vencido");
  const [woLoading, setWoLoading] = useState(false);
  const [woError, setWoError]     = useState("");
  const [woSuccess, setWoSuccess] = useState("");

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/products/expiring-alerts", { params: { days } });
      setAlerts(res.data.alertas || []);
    } catch (err) {
      setError("Erro ao carregar alertas de validade.");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  async function handleWriteOff(e) {
    e.preventDefault();
    if (!writeOff) return;
    setWoLoading(true);
    setWoError("");
    setWoSuccess("");
    try {
      const qty = parseInt(woQty, 10);
      if (!qty || qty <= 0) throw new Error("Informe uma quantidade válida.");
      await api.post(`/api/batches/${writeOff.batch.id}/write-off`, {
        quantity: qty,
        reason: woReason
      });
      setWoSuccess("Baixa registrada com sucesso!");
      setTimeout(() => {
        setWriteOff(null);
        setWoQty("");
        setWoReason("Vencido");
        setWoSuccess("");
        loadAlerts();
      }, 1500);
    } catch (err) {
      setWoError(err.response?.data?.erro || err.message || "Erro ao registrar baixa.");
    } finally {
      setWoLoading(false);
    }
  }

  const totalExpired = alerts.filter(a => a.has_expired).length;
  const totalUrgent  = alerts.filter(a => a.has_urgent && !a.has_expired).length;

  return (
    <div className="page-content" style={{ maxWidth: "1100px" }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Alertas de Validade</h1>
          <p className="subtitle">Produtos perecíveis vencidos ou próximos do vencimento</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <label style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 500 }}>
            Janela de alerta:
          </label>
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            style={{ fontSize: "0.8125rem", padding: "0.35rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", color: "var(--text-main)" }}
          >
            <option value={7}>7 dias</option>
            <option value={15}>15 dias</option>
            <option value={30}>30 dias</option>
          </select>
          <Link to="/produtos" className="btn btn-secondary" style={{ fontSize: "0.8125rem" }}>
            ← Catálogo
          </Link>
        </div>
      </div>

      {/* Cards de resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="card" style={{ padding: "1rem", borderLeft: "3px solid #dc2626" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Produtos Vencidos</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#dc2626" }}>{totalExpired}</div>
        </div>
        <div className="card" style={{ padding: "1rem", borderLeft: "3px solid #ea580c" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Vencendo em ≤7 dias</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ea580c" }}>{totalUrgent}</div>
        </div>
        <div className="card" style={{ padding: "1rem", borderLeft: "3px solid var(--accent)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Total de Produtos em Alerta</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent)" }}>{alerts.length}</div>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: "1rem" }}>{error}</div>}

      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          Carregando alertas...
        </div>
      ) : alerts.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✅</div>
          <div style={{ fontWeight: 700, color: "var(--text-main)", marginBottom: "0.25rem" }}>
            Nenhum alerta de validade!
          </div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Todos os produtos perecíveis estão dentro do prazo de {days} dias.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {alerts.map(alert => {
            const worstUrgency = alert.has_expired ? "vencido" : alert.has_urgent ? "urgente" : "atencao";
            const style = URGENCY_STYLE[worstUrgency];
            return (
              <div
                key={alert.product_id}
                className="card"
                style={{ borderLeft: `3px solid ${style.border}`, background: style.bg, padding: "1.25rem" }}
              >
                {/* Cabeçalho do produto */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.1rem" }}>{style.icon}</span>
                    <span style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "1rem" }}>
                      {alert.product_nome}
                    </span>
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 600, padding: "0.15rem 0.5rem",
                      background: style.border, color: style.text,
                      borderRadius: "999px", border: `1px solid ${style.border}`
                    }}>
                      {style.label}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    {alert.batches.length} lote{alert.batches.length !== 1 ? "s" : ""}
                  </div>
                </div>

                {/* Tabela de lotes */}
                <div className="table-container" style={{ border: "none", borderRadius: 0, margin: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Lote / Código</th>
                        <th style={{ textAlign: "center" }}>Validade</th>
                        <th style={{ textAlign: "center" }}>Dias</th>
                        <th style={{ textAlign: "center" }}>Qtd</th>
                        <th style={{ textAlign: "center" }}>Status</th>
                        <th style={{ textAlign: "center" }}>Baixa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alert.batches.map(batch => {
                        const bs = URGENCY_STYLE[batch.urgency] || URGENCY_STYLE.ok;
                        return (
                          <tr key={batch.id} style={{ background: bs.bg }}>
                            <td style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                              {batch.batch_code || <span style={{ color: "var(--text-muted)" }}>Sem código</span>}
                            </td>
                            <td style={{ textAlign: "center", fontWeight: 600, color: bs.text }}>
                              {fmtDate(batch.expiry_date)}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {batch.is_expired ? (
                                <span style={{ color: "#dc2626", fontWeight: 700 }}>
                                  {Math.abs(batch.days_to_expire)}d atrás
                                </span>
                              ) : (
                                <span style={{ color: bs.text, fontWeight: 600 }}>
                                  +{batch.days_to_expire}d
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: "center", fontWeight: 700 }}>
                              {batch.quantity}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span style={{
                                fontSize: "0.7rem", fontWeight: 600, padding: "0.15rem 0.4rem",
                                background: bs.border, color: bs.text,
                                borderRadius: "999px"
                              }}>
                                {bs.icon} {bs.label}
                              </span>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                type="button"
                                onClick={() => { setWriteOff({ batch, product_nome: alert.product_nome }); setWoQty(""); setWoError(""); setWoSuccess(""); }}
                                style={{
                                  fontSize: "0.75rem", fontWeight: 600, padding: "0.25rem 0.6rem",
                                  background: "#dc2626", color: "white", border: "none",
                                  borderRadius: "var(--radius-sm)", cursor: "pointer"
                                }}
                              >
                                Dar Baixa
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Baixa por Perda */}
      {writeOff && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem"
        }}>
          <div className="card" style={{ width: "100%", maxWidth: "420px", padding: "1.75rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.25rem" }}>
              Baixa por Perda / Vencimento
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              Produto: <strong>{writeOff.product_nome}</strong><br/>
              Lote: <strong>{writeOff.batch.batch_code || "Sem código"}</strong> — Validade: <strong>{fmtDate(writeOff.batch.expiry_date)}</strong><br/>
              Estoque atual do lote: <strong>{writeOff.batch.quantity} un</strong>
            </p>

            {woSuccess ? (
              <div style={{ padding: "1rem", background: "rgba(22,163,74,0.1)", color: "#16a34a", borderRadius: "var(--radius-sm)", textAlign: "center", fontWeight: 600 }}>
                ✅ {woSuccess}
              </div>
            ) : (
              <form onSubmit={handleWriteOff}>
                {woError && <div className="error-box" style={{ marginBottom: "1rem" }}>{woError}</div>}

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label style={{ fontWeight: 600 }}>Quantidade a Baixar</label>
                  <input
                    type="number"
                    min="1"
                    max={writeOff.batch.quantity}
                    required
                    value={woQty}
                    onChange={e => setWoQty(e.target.value)}
                    placeholder={`Máx: ${writeOff.batch.quantity}`}
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label style={{ fontWeight: 600 }}>Motivo</label>
                  <select
                    value={woReason}
                    onChange={e => setWoReason(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--bg-surface)", color: "var(--text-main)", fontFamily: "inherit", fontSize: "0.875rem" }}
                  >
                    <option value="Vencido">Vencido</option>
                    <option value="Avaria">Avaria</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button type="submit" disabled={woLoading} className="btn btn-primary" style={{ flex: 1 }}>
                    {woLoading ? "Registrando..." : "Confirmar Baixa"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWriteOff(null)}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
