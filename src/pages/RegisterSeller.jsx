import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useNavigate, Link } from "react-router-dom";

/* ── Ícones SVG inline ── */
const IconStore = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconText = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
  </svg>
);
const IconId = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);
const IconPhone = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 7l10 7 10-7" />
  </svg>
);
const IconLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const IconEyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const SpinnerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const styles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .reg-page-anim {
    animation: fadeSlideIn 0.3s ease;
  }
  .reg-input-wrap {
    position: relative;
  }
  .reg-input-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
    display: flex;
    align-items: center;
  }
  .reg-input-wrap input {
    padding-left: 2.25rem !important;
  }
  .reg-eye-btn {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    padding: 0;
    transition: color 0.15s;
  }
  .reg-eye-btn:hover { color: var(--text-main); }
  .reg-step-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    background: var(--accent-subtle);
    border: 1px solid var(--accent-border);
    color: var(--accent-text);
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.75rem;
    margin-bottom: 1.5rem;
  }
  .reg-back-link {
    color: var(--accent);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.8125rem;
    position: relative;
    display: inline-block;
  }
  .reg-back-link::after {
    content: "";
    position: absolute;
    width: 0;
    height: 1.5px;
    bottom: -1px;
    left: 0;
    background-color: var(--accent);
    transition: width 0.2s ease;
  }
  .reg-back-link:hover::after { width: 100%; }
`;

export default function RegisterSeller() {
  const [formData, setFormData] = useState({ nome: "", cnpj: "", email: "", celular: "", senha: "" });
  const [showSenha, setShowSenha] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/dashboard");
  }, [navigate]);

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/api/sellers", formData);
      navigate("/activate");
    } catch (err) {
      setError(err.response?.data?.erro || "Erro ao realizar cadastro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  return (
    <>
      <style>{styles}</style>
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--bg-app)",
          padding: "2rem 1.5rem",
        }}
      >
        <div className="reg-page-anim" style={{ width: "100%", maxWidth: "480px" }}>

          {/* Topo */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                backgroundColor: "var(--accent)",
                borderRadius: "var(--radius-sm)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                marginBottom: "1rem",
                boxShadow: "0 4px 16px rgba(15,118,110,0.35)",
              }}
            >
              <IconStore />
            </div>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 700, letterSpacing: "-0.025em", color: "var(--text-main)" }}>
              Cadastrar Novo Mercado
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              Crie sua conta para gerenciar estoque e vendas
            </p>
          </div>

          {/* Badge de etapa */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className="reg-step-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
              </svg>
              Etapa 1 de 2 — Dados do estabelecimento
            </div>
          </div>

          {error && (
            <div className="error-box" style={{ marginBottom: "1.25rem" }}>
              {error}
            </div>
          )}

          <div className="card" style={{ padding: "1.875rem" }}>
            <form onSubmit={handleRegister}>

              {/* Nome */}
              <div className="form-group">
                <label>Nome do Estabelecimento</label>
                <div className="reg-input-wrap">
                  <span className="reg-input-icon"><IconText /></span>
                  <input type="text" placeholder="Ex: Mercearia Santa Luzia" required value={formData.nome} onChange={set("nome")} />
                </div>
              </div>

              {/* CNPJ + Celular */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label>CNPJ</label>
                  <div className="reg-input-wrap">
                    <span className="reg-input-icon"><IconId /></span>
                    <input type="text" placeholder="00.000.000/0001-00" required value={formData.cnpj} onChange={set("cnpj")} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Celular (WhatsApp)</label>
                  <div className="reg-input-wrap">
                    <span className="reg-input-icon"><IconPhone /></span>
                    <input type="text" placeholder="+5511999999999" required value={formData.celular} onChange={set("celular")} />
                  </div>
                </div>
              </div>

              {/* E-mail */}
              <div className="form-group">
                <label>E-mail Corporativo</label>
                <div className="reg-input-wrap">
                  <span className="reg-input-icon"><IconMail /></span>
                  <input type="email" placeholder="contato@mercado.com" required value={formData.email} onChange={set("email")} />
                </div>
              </div>

              {/* Senha */}
              <div className="form-group">
                <label>Senha de Acesso</label>
                <div className="reg-input-wrap">
                  <span className="reg-input-icon"><IconLock /></span>
                  <input
                    type={showSenha ? "text" : "password"}
                    placeholder="Defina uma senha forte"
                    required
                    value={formData.senha}
                    onChange={set("senha")}
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <button type="button" className="reg-eye-btn" onClick={() => setShowSenha(v => !v)} tabIndex={-1} title={showSenha ? "Ocultar" : "Mostrar"}>
                    {showSenha ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                disabled={loading}
              >
                {loading ? (<><SpinnerIcon />Cadastrando...</>) : "Criar Conta do Mercado"}
              </button>
            </form>

            <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              Já possui uma conta?{" "}
              <Link to="/" className="reg-back-link">Fazer Login</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
