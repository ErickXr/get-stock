import React from "react";
import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/dashboard");
  }, [navigate]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/api/sellers/login", {
        email,
        senha,
      });

      localStorage.clear(); 
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("seller", JSON.stringify(response.data.seller));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.erro || "Falha na autenticação. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem', background: 'var(--background)' }} className="animate-in">
      <div className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '3.5rem 3rem' }}>
        <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', padding: '1.25rem', background: 'var(--primary)', borderRadius: '20px', color: 'white', marginBottom: '1.5rem', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Gest<span style={{ color: 'var(--primary)' }}>Stock</span></h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 500 }}>Acesse seu painel de mercado</p>
        </header>
        
        {error && (
          <div className="badge badge-danger" style={{ width: '100%', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>E-mail Corporativo</label>
            <input
              type="email"
              placeholder="seu@email.com"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label style={{ margin: 0 }}>Senha</label>
              <Link to="#" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Esqueceu a senha?</Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              required
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1.25rem' }} disabled={loading}>
            {loading ? "Entrando..." : "Entrar no Dashboard"}
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.9375rem', color: 'var(--text-muted)' }}>
          Ainda não tem uma conta? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>Cadastre-se</Link>
        </div>
      </div>
    </div>
  );
}