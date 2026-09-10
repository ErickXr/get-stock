import React from "react";
import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState({ total_estoque: 0, valor_total_vendido: 0 });
  const [loading, setLoading] = useState(true);
  const seller = JSON.parse(localStorage.getItem("seller") || "{}");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await api.get("/api/dashboard");
        setStats(response.data);
      } catch (err) {
        console.error("Erro ao carregar dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) return <div className="container animate-in">Carregando painel...</div>;

  return (
    <div className="container animate-in">
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            Visão Geral
          </p>
          <h1>Olá, {seller.nome || 'Parceiro'}! 👋</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Bem-vindo ao seu centro de gestão do GestStock.</p>
        </div>
        <div style={{ padding: '0.5rem 1rem', background: 'white', borderRadius: '12px', border: '1px solid var(--border-light)', fontSize: '0.875rem', fontWeight: 600 }}>
          📅 {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Estoque Card */}
        <div className="glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '1rem' }}>
                Itens em Estoque
              </div>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
                {stats.total_estoque}
              </div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--accent-soft)', borderRadius: '12px', color: 'var(--accent)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>
            </div>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.875rem', fontWeight: 600 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
            Atualizado agora
          </div>
        </div>

        {/* Receita Card */}
        <div className="glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '1rem' }}>
                Receita Total
              </div>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
                <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>R$</span> {stats.valor_total_vendido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--primary-soft)', borderRadius: '12px', color: 'var(--primary)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.875rem', fontWeight: 600 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            Vendas confirmadas
          </div>
        </div>
      </div>

      <section style={{ marginTop: '4rem' }}>
        <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4 4 4"></path><path d="M3.34 19a10 10 0 1 1 17.32 0"></path></svg>
          Ações Rápidas
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <button className="btn glass-card" style={{ padding: '1.5rem', textAlign: 'left', alignItems: 'flex-start', border: '1px solid var(--border-light)' }} onClick={() => window.location.href='/produtos/novo'}>
            <div style={{ padding: '0.5rem', background: 'var(--primary-soft)', borderRadius: '10px', color: 'var(--primary)', marginBottom: '1rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem' }}>Novo Produto</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 400 }}>Adicione itens ao seu estoque hoje.</div>
          </button>

          <button className="btn glass-card" style={{ padding: '1.5rem', textAlign: 'left', alignItems: 'flex-start', border: '1px solid var(--border-light)' }} onClick={() => window.location.href='/vendas/nova'}>
            <div style={{ padding: '0.5rem', background: 'var(--secondary-soft)', borderRadius: '10px', color: 'var(--secondary)', marginBottom: '1rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem' }}>Registrar Venda</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 400 }}>Vendeu algo? Registre aqui agora.</div>
          </button>

          <button className="btn glass-card" style={{ padding: '1.5rem', textAlign: 'left', alignItems: 'flex-start', border: '1px solid var(--border-light)' }} onClick={() => window.location.href='/perfil'}>
            <div style={{ padding: '0.5rem', background: 'var(--accent-soft)', borderRadius: '10px', color: 'var(--accent)', marginBottom: '1rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem' }}>Configurações</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 400 }}>Gerencie os dados do seu mercado.</div>
          </button>
        </div>
      </section>
    </div>
  );
}
