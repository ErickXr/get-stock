import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { Link } from "react-router-dom";

// Componente SVG puro para o Sparkline
function Sparkline({ data, height = 50, color = "#0f766e" }) {
  if (!data || data.length < 2) {
    return null;
  }

  const values = data.map((d) => d.total);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min === 0 ? 1 : max - min;
  const width = 240;
  const paddingY = 6;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - paddingY - ((d.total - min) / range) * (height - paddingY * 2);
    return { x, y, val: d.total, label: d.label };
  });

  const pointsString = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints = `${points[0].x},${height} ${pointsString} ${points[points.length - 1].x},${height}`;

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "240px" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: `${height}px`, overflow: "visible" }}
      >
        <defs>
          <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <polygon points={areaPoints} fill="url(#sparklineGrad)" />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pointsString}
        />
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="3.5"
            fill="#ffffff"
            stroke={color}
            strokeWidth="2"
          />
        )}
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({ total_estoque: 0, valor_total_vendido: 0, total_vendas: 0, produtos_estoque_baixo: 0 });
  const [trendData, setTrendData] = useState({ trend: [], percentage_change: 0, period_total: 0 });
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const seller = JSON.parse(localStorage.getItem("seller") || "null");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const nome = seller?.nome || user?.nome || "Operador";
  const nivel = seller ? "admin" : (user?.nivel || "operador");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsRes, trendRes, topRes] = await Promise.all([
          api.get("/api/dashboard"),
          api.get("/api/dashboard/revenue-trend?days=7"),
          api.get("/api/dashboard/top-products?limit=5"),
        ]);
        setStats(statsRes.data);
        setTrendData(trendRes.data);
        setTopProducts(topRes.data || []);
      } catch (err) {
        console.error("Erro ao carregar dados do dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const dataHoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const isTrendPositive = trendData.percentage_change >= 0;

  return (
    <div className="page-content">
      {/* Topo / Contexto Dinâmico */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>{saudacao}, {nome} 👋</h1>
          <p className="subtitle" style={{ textTransform: "capitalize" }}>
            {dataHoje} • Painel Operacional Ativo
          </p>
        </div>

        <div className="badge badge-accent" style={{ padding: "0.4rem 0.75rem", fontSize: "0.8125rem" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent)" }} />
          Mercado Sincronizado
        </div>
      </div>

      {/* Grid de Indicadores */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "1.25rem", marginBottom: "2rem" }}>
        
        {/* Card Hero: Receita Acumulada */}
        <div className="stat-card stat-card-hero" style={{ gridColumn: "span 6" }}>
          <div className="stat-label">
            <span>Receita Acumulada</span>
            <div className="stat-icon-wrapper stat-icon-teal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "0.75rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div className="stat-value stat-value-accent" style={{ fontSize: "2rem" }}>
                R$ {(stats.valor_total_vendido || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.625rem" }}>
                <span className={`trend-indicator ${isTrendPositive ? "trend-up" : "trend-down"}`}>
                  {isTrendPositive ? "↑ +" : "↓ "}
                  {trendData.percentage_change}%
                </span>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  vs. 7 dias anteriores
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem", textAlign: "right" }}>
                Tendência últimos 7 dias
              </div>
              <Sparkline data={trendData.trend} height={46} color="#0f766e" />
            </div>
          </div>
        </div>

        {/* Card Itens em Estoque */}
        <div className="stat-card" style={{ gridColumn: "span 3" }}>
          <div className="stat-label">
            <span>Itens em Estoque</span>
            <div className="stat-icon-wrapper stat-icon-amber">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
            </div>
          </div>
          <div className="stat-value" style={{ marginTop: "0.75rem" }}>
            {stats.total_estoque}
          </div>
          <div className="stat-subtext">
            {stats.produtos_estoque_baixo > 0 ? (
              <span style={{ color: "#b45309", fontWeight: 600 }}>⚠️ {stats.produtos_estoque_baixo} com estoque baixo</span>
            ) : (
              "Unidades disponíveis"
            )}
          </div>
        </div>

        {/* Card Total de Vendas */}
        <div className="stat-card" style={{ gridColumn: "span 3" }}>
          <div className="stat-label">
            <span>Vendas Realizadas</span>
            <div className="stat-icon-wrapper stat-icon-slate">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
          </div>
          <div className="stat-value" style={{ marginTop: "0.75rem" }}>
            {stats.total_vendas || 0}
          </div>
          <div className="stat-subtext">
            Transações ativas
          </div>
        </div>
      </div>

      {/* Grid Meio: Produtos Mais Vendidos + Destaques */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "1.25rem", marginBottom: "2.5rem" }}>
        
        {/* Top 5 Produtos Mais Vendidos */}
        <div className="card" style={{ gridColumn: "span 7", padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h3 style={{ fontSize: "1.0625rem", fontWeight: 700 }}>Mais Vendidos</h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Produtos de maior saída</p>
            </div>
            <Link to="/vendas" style={{ fontSize: "0.8125rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
              Ver Vendas →
            </Link>
          </div>

          {topProducts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
              Nenhuma venda registrada ainda.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {topProducts.map((p, idx) => (
                <div key={p.product_id || idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", marginBottom: "0.3rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                      {idx + 1}. {p.nome}
                    </span>
                    <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                      {p.total_vendido} un
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "6px", backgroundColor: "var(--bg-subtle)", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{
                      width: `${p.pct}%`,
                      height: "100%",
                      backgroundColor: idx === 0 ? "var(--accent)" : "var(--accent-hover)",
                      borderRadius: "999px",
                      transition: "width 0.4s ease"
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumo de Estoque Crítico */}
        <div className="card" style={{ gridColumn: "span 5", padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.25rem" }}>📦</span>
              <h3 style={{ fontSize: "1.0625rem", fontWeight: 700 }}>Alerta de Reposição</h3>
            </div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {stats.produtos_estoque_baixo > 0 ? (
                <>Existem <strong>{stats.produtos_estoque_baixo}</strong> produtos atingindo o nível de estoque mínimo configurado.</>
              ) : (
                <>Todos os seus produtos ativos estão com estoque acima do limite mínimo.</>
              )}
            </p>
          </div>

          <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
            <Link
              to="/produtos"
              className="btn btn-secondary"
              style={{ width: "100%", textAlign: "center", justifyContent: "center", display: "flex" }}
            >
              Gerenciar Estoque
            </Link>
          </div>
        </div>
      </div>

      {/* Seção de Atalhos Rápidos */}
      <div style={{ marginBottom: "1rem" }}>
        <h2>Ações Rápidas</h2>
        <p className="subtitle">Operações prioritárias do dia a dia</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
        {/* Registrar Venda */}
        <Link to="/vendas/nova" className="action-card">
          <div className="action-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.9375rem", marginBottom: "0.15rem" }}>Registrar Venda</div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Nova saída de itens no balcão</div>
          </div>
        </Link>

        {/* Consultar Estoque */}
        <Link to="/produtos" className="action-card">
          <div className="action-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.9375rem", marginBottom: "0.15rem" }}>Consultar Estoque</div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Listagem completa de mercadorias</div>
          </div>
        </Link>

        {/* Novo Produto (Admin ou Gerente) */}
        {(nivel === "admin" || nivel === "gerente") && (
          <Link to="/produtos/novo" className="action-card">
            <div className="action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9375rem", marginBottom: "0.15rem" }}>Novo Produto</div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Cadastrar item no catálogo</div>
            </div>
          </Link>
        )}

        {/* Equipe & Acessos (Admin ou Gerente) */}
        {(nivel === "admin" || nivel === "gerente") && (
          <Link to="/funcionarios" className="action-card">
            <div className="action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9375rem", marginBottom: "0.15rem" }}>Equipe & Acessos</div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Controle de colaboradores</div>
            </div>
          </Link>
        )}
      </div>

      <style>{`
        @media (max-width: 960px) {
          .stat-card-hero {
            grid-column: span 12 !important;
          }
          .stat-card {
            grid-column: span 6 !important;
          }
          .card[style*="grid-column: span 7"],
          .card[style*="grid-column: span 5"] {
            grid-column: span 12 !important;
          }
        }
        @media (max-width: 600px) {
          .stat-card {
            grid-column: span 12 !important;
          }
        }
      `}</style>
    </div>
  );
}
