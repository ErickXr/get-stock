import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useNavigate, Link } from "react-router-dom";

export default function ActivateSeller() {
  const [celular, setCelular] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/dashboard");
  }, [navigate]);

  async function handleActivate(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    try {
      await api.post("/api/sellers/activate", { celular, codigo });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.erro || "Código inválido ou erro ao validar ativação.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (!celular) {
      setError("Informe o celular no campo acima para reenviar o código.");
      return;
    }
    setResending(true);
    setError("");
    setInfo("");
    try {
      const response = await api.post("/api/sellers/resend-code", { celular });
      setInfo(response.data.mensagem || "Código reenviado com sucesso via WhatsApp.");
    } catch (err) {
      setError(err.response?.data?.erro || "Erro ao reenviar o código. Verifique o número.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-app)",
        padding: "1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Topo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              backgroundColor: "var(--accent-primary)",
              borderRadius: "var(--radius-sm)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              marginBottom: "0.75rem",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Ativar Conta do Mercado
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.15rem" }}>
            Insira o código de 4 dígitos enviado via WhatsApp
          </p>
        </div>

        {error && (
          <div className="error-box" style={{ marginBottom: "1.25rem" }}>
            {error}
          </div>
        )}

        {info && (
          <div className="info-box" style={{ marginBottom: "1.25rem" }}>
            {info}
          </div>
        )}

        <div className="card" style={{ padding: "1.75rem" }}>
          <form onSubmit={handleActivate}>
            <div className="form-group">
              <label>Celular Cadastrado (WhatsApp)</label>
              <input
                type="text"
                placeholder="+5511999999999"
                required
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Código de Ativação</label>
              <input
                type="text"
                placeholder="0000"
                required
                maxLength={6}
                style={{ letterSpacing: "0.2em", textAlign: "center", fontWeight: 700, fontSize: "1.125rem" }}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "0.5rem" }} disabled={loading}>
              {loading ? "Validando..." : "Confirmar Ativação"}
            </button>
          </form>

          <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            Não recebeu a mensagem?{" "}
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resending}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent-link)",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
                fontSize: "0.8125rem",
              }}
            >
              {resending ? "Reenviando..." : "Solicitar novo código"}
            </button>
          </div>

          <div style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.8125rem" }}>
            <Link to="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
              Voltar ao Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
