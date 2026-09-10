import React from "react";
import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterSeller() {
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    email: "",
    celular: "",
    senha: "",
  });
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
      alert("Cadastro realizado! Verifique seu código de ativação no WhatsApp. 📱");
      navigate("/activate");
    } catch (err) {
      const errorMsg = err.response?.data?.erro || "Erro ao realizar cadastro. Tente novamente.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem', background: 'var(--background)' }} className="animate-in">
      <div className="glass-card" style={{ width: '100%', maxWidth: '550px', padding: '3rem' }}>
        <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'var(--primary-soft)', borderRadius: '16px', color: 'var(--primary)', marginBottom: '1.5rem' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Criar Nova Conta</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Comece a gerenciar seu mercado hoje mesmo.</p>
        </header>
        
        {error && (
          <div className="badge badge-danger" style={{ width: '100%', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Nome do Estabelecimento</label>
            <input
              type="text"
              placeholder="Ex: Mercadinho do Bairro"
              required
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>CNPJ</label>
              <input
                type="text"
                placeholder="00.000.000/0001-00"
                required
                onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Celular (WhatsApp)</label>
              <input
                type="text"
                placeholder="+5511999999999"
                required
                onChange={(e) => setFormData({...formData, celular: e.target.value})}
              />
            </div>
          </div>

          <div className="form-group">
            <label>E-mail Corporativo</label>
            <input
              type="email"
              placeholder="contato@mercado.com"
              required
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Senha de Acesso</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              onChange={(e) => setFormData({...formData, senha: e.target.value})}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1.25rem' }} disabled={loading}>
            {loading ? "Processando..." : "Criar Minha Conta"}
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.9375rem', color: 'var(--text-muted)' }}>
          Já possui cadastro? <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>Fazer Login</Link>
        </div>
      </div>
    </div>
  );
}
