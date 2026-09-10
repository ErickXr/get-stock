import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Link } from "react-router-dom";

export default function Profile() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    celular: "",
    cnpj: "",
    senha: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await api.get("/api/sellers/me");
        const data = response.data;
        setFormData({
            nome: data.nome || "",
            email: data.email || "",
            celular: data.celular || "",
            cnpj: data.cnpj || "",
            senha: ""
        });
      } catch (err) {
        console.error("Erro ao carregar perfil", err);
        setMessage({ text: "Erro ao carregar dados do perfil.", type: "danger" });
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const payload = { ...formData };
      if (!payload.senha) delete payload.senha;

      await api.put("/api/sellers/me", payload);
      setMessage({ text: "Perfil atualizado com sucesso! ✨", type: "success" });
      setFormData(prev => ({ ...prev, senha: "" }));
    } catch (err) {
      console.error("Erro ao salvar", err);
      const errorMsg = err.response?.data?.erro || "Erro ao atualizar perfil.";
      setMessage({ text: errorMsg, type: "danger" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="container animate-in">Carregando dados...</div>;

  return (
    <div className="container animate-in" style={{ maxWidth: '900px' }}>
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          Configurações
        </p>
        <h1 style={{ marginBottom: '0.5rem' }}>Dados do <span style={{ color: 'var(--primary)' }}>Mercado</span></h1>
        <p style={{ color: 'var(--text-muted)' }}>Mantenha as informações do seu negócio atualizadas.</p>
      </header>

      {message.text && (
        <div className={`badge badge-${message.type}`} style={{ width: '100%', padding: '1.25rem', marginBottom: '2rem', textAlign: 'center', fontSize: '1rem', borderRadius: '12px', border: '1px solid currentColor' }}>
          {message.text}
        </div>
      )}

      <div className="glass-card">
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>Nome do Mini Mercado</label>
            <input 
              type="text" 
              value={formData.nome} 
              onChange={e => setFormData({...formData, nome: e.target.value})} 
              required 
              placeholder="Nome da sua loja"
            />
          </div>

          <div className="form-group">
            <label>CNPJ</label>
            <input 
              type="text" 
              value={formData.cnpj} 
              onChange={e => setFormData({...formData, cnpj: e.target.value})} 
              required 
              placeholder="00.000.000/0001-00"
            />
          </div>

          <div className="form-group">
            <label>E-mail Corporativo</label>
            <input 
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              required 
              placeholder="seu@email.com"
            />
          </div>

          <div className="form-group">
            <label>Celular / WhatsApp</label>
            <input 
              type="text" 
              value={formData.celular} 
              onChange={e => setFormData({...formData, celular: e.target.value})} 
              required 
              placeholder="+55 11 99999-9999"
            />
          </div>

          <div className="form-group form-grid-full">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
               <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }}></div>
               <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Segurança</span>
               <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }}></div>
            </div>
          </div>

          <div className="form-group form-grid-full" style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
            <label style={{ textAlign: 'center' }}>Nova Senha (deixe em branco para manter a atual)</label>
            <input 
              type="password" 
              value={formData.senha} 
              onChange={e => setFormData({...formData, senha: e.target.value})} 
              autoComplete="new-password"
              style={{ textAlign: 'center' }}
              placeholder="••••••••"
            />
          </div>

          <div className="form-grid-full" style={{ display: 'flex', gap: '1.25rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 2 }}>
              {saving ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 2s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.21-8.58"></path></svg>
                  Salvando Dados...
                </>
              ) : "Salvar Alterações"}
            </button>
            <Link to="/dashboard" className="btn btn-secondary" style={{ flex: 1 }}>
              Cancelar
            </Link>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
