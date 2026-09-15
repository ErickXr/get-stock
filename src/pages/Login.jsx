import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useNavigate, Link } from "react-router-dom";

/* ── Ícones SVG inline ── */
const IconStore = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 7l10 7 10-7" />
  </svg>
);

const IconLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
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
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .login-card {
    transition: box-shadow 0.2s ease;
  }
  .login-card:hover {
    box-shadow: 0 4px 24px rgba(0,0,0,0.09);
  }
  .login-tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding: 0.4375rem 0.5rem;
    border: none;
    border-radius: calc(var(--radius-sm) - 2px);
    font-family: inherit;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
  }
  .login-tab-btn:hover:not(.active) {
    background-color: rgba(15,118,110,0.07);
    color: var(--text-main);
  }
  .login-input-wrap {
    position: relative;
  }
  .login-input-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
    display: flex;
    align-items: center;
  }
  .login-input-wrap input {
    padding-left: 2.25rem !important;
  }
  .login-eye-btn {
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
  .login-eye-btn:hover { color: var(--text-main); }
  .login-link {
    color: var(--accent);
    text-decoration: none;
    font-weight: 600;
    position: relative;
  }
  .login-link::after {
    content: "";
    position: absolute;
    width: 0;
    height: 1.5px;
    bottom: -1px;
    left: 0;
    background-color: var(--accent);
    transition: width 0.2s ease;
  }
  .login-link:hover::after { width: 100%; }
  .form-content-anim {
    animation: fadeSlideIn 0.22s ease;
  }
  .login-divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 1.25rem 0 0;
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  .login-divider::before,
  .login-divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--border-subtle);
  }
  .login-register-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1rem;
    font-size: 0.8125rem;
    color: var(--text-secondary);
  }
  .register-hint-card {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.875rem;
    background: var(--accent-subtle);
    border: 1px solid var(--accent-border);
    border-radius: var(--radius-sm);
    padding: 0.75rem 1rem;
    text-decoration: none;
    color: var(--text-main);
    transition: var(--transition);
    cursor: pointer;
  }
  .register-hint-card:hover {
    background: #d0f4ef;
    border-color: var(--accent);
    transform: translateY(-1px);
    box-shadow: 0 2px 10px rgba(15,118,110,0.14);
  }
  .register-hint-icon {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
    background: var(--accent);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .register-hint-text {
    flex: 1;
  }
  .register-hint-text strong {
    display: block;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-main);
  }
  .register-hint-text span {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
  .register-hint-arrow {
    color: var(--accent);
  }
`;

export default function Login() {
  const [aba, setAba] = useState("mercado");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/dashboard");
  }, [navigate]);

  function switchAba(nova) {
    if (nova === aba) return;
    setAba(nova);
    setError("");
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const rota = aba === "mercado" ? "/api/sellers/login" : "/api/users/login";
      const response = await api.post(rota, { email, senha });

      localStorage.clear();
      localStorage.setItem("token", response.data.token);
      if (aba === "mercado") {
        localStorage.setItem("seller", JSON.stringify({ ...response.data.seller, nivel: "admin" }));
      } else {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.erro || "Credenciais inválidas. Verifique seu e-mail e senha.");
    } finally {
      setLoading(false);
    }
  }

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
          padding: "1.5rem",
        }}
      >
        <div style={{ width: "100%", maxWidth: "390px" }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                backgroundColor: "var(--accent)",
                borderRadius: "var(--radius-sm)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                marginBottom: "0.875rem",
                boxShadow: "0 4px 14px rgba(15,118,110,0.35)",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 700, letterSpacing: "-0.025em", color: "var(--text-main)" }}>
              GestStock
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.2rem" }}>
              Gestão de estoque e vendas para mercados
            </p>
          </div>

          {/* Card */}
          <div className="card login-card" style={{ padding: "1.875rem" }}>

            {/* Seletor de Perfil */}
            <div style={{ marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem" }}>
                Acessar como
              </p>
              <div
                style={{
                  display: "flex",
                  backgroundColor: "var(--bg-subtle)",
                  borderRadius: "var(--radius-sm)",
                  padding: "3px",
                  gap: "2px",
                }}
              >
                <button
                  type="button"
                  className={"login-tab-btn" + (aba === "mercado" ? " active" : "")}
                  onClick={() => switchAba("mercado")}
                  style={{
                    backgroundColor: aba === "mercado" ? "var(--bg-surface)" : "transparent",
                    color: aba === "mercado" ? "var(--accent)" : "var(--text-secondary)",
                    boxShadow: aba === "mercado" ? "var(--shadow-xs)" : "none",
                  }}
                >
                  <IconStore />
                  Dono do Mercado
                </button>
                <button
                  type="button"
                  className={"login-tab-btn" + (aba === "funcionario" ? " active" : "")}
                  onClick={() => switchAba("funcionario")}
                  style={{
                    backgroundColor: aba === "funcionario" ? "var(--bg-surface)" : "transparent",
                    color: aba === "funcionario" ? "var(--accent)" : "var(--text-secondary)",
                    boxShadow: aba === "funcionario" ? "var(--shadow-xs)" : "none",
                  }}
                >
                  <IconUser />
                  Funcionário
                </button>
              </div>
            </div>

            {/* Conteúdo com animação ao trocar de aba */}
            <div key={aba} className="form-content-anim">
              {error && (
                <div className="error-box" style={{ marginBottom: "1.25rem" }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin}>
                {/* Campo E-mail */}
                <div className="form-group">
                  <label>E-mail</label>
                  <div className="login-input-wrap">
                    <span className="login-input-icon"><IconMail /></span>
                    <input
                      type="email"
                      placeholder="nome@mercado.com"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Campo Senha */}
                <div className="form-group">
                  <label>Senha</label>
                  <div className="login-input-wrap">
                    <span className="login-input-icon"><IconLock /></span>
                    <input
                      type={showSenha ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      style={{ paddingRight: "2.5rem" }}
                    />
                    <button
                      type="button"
                      className="login-eye-btn"
                      onClick={() => setShowSenha((v) => !v)}
                      tabIndex={-1}
                      title={showSenha ? "Ocultar senha" : "Mostrar senha"}
                    >
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
                  {loading ? (
                    <>
                      <SpinnerIcon />
                      Entrando...
                    </>
                  ) : (
                    "Acessar Sistema"
                  )}
                </button>
              </form>

              {/* Link de cadastro — só na aba Dono */}
              {aba === "mercado" && (
                <>
                  <div className="login-divider">ou</div>
                  <div className="login-register-row">
                    <span>Ainda não tem uma conta?</span>
                    <Link to="/register" className="register-hint-card">
                      <div className="register-hint-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                      </div>
                      <div className="register-hint-text">
                        <strong>Cadastrar meu mercado</strong>
                        <span>Crie sua conta gratuitamente</span>
                      </div>
                      <div className="register-hint-arrow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    </Link>
                  </div>
                </>
              )}

              {/* Hint funcionário */}
              {aba === "funcionario" && (
                <p style={{ marginTop: "1.25rem", fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
                  Suas credenciais foram fornecidas pelo administrador do seu mercado.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
