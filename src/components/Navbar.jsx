import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../services/api";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const [baixoEstoqueCount, setBaixoEstoqueCount] = useState(0);

  const seller = JSON.parse(localStorage.getItem("seller") || "null");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const nivel = seller ? "admin" : (user?.nivel || "operador");
  const nomeUsuario = seller?.nome || user?.nome || "Usuário";

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    if (!token) return;
    api.get("/api/dashboard")
      .then(res => {
        if (res.data?.produtos_estoque_baixo) {
          setBaixoEstoqueCount(res.data.produtos_estoque_baixo);
        }
      })
      .catch(() => {});
  }, [token, location.pathname]);

  function handleLogout() {
    localStorage.clear();
    navigate("/");
  }

  if (!token) return null;

  const isActive = (path) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const nivelBadgeLabel = {
    admin: "Administrador",
    gerente: "Gerente",
    operador: "Operador",
  };

  const menuItems = [
    {
      to: "/dashboard",
      label: "Visão Geral",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="3" y="16" width="7" height="5" />
        </svg>
      ),
      show: true,
    },
    {
      to: "/produtos",
      label: "Catálogo & Estoque",
      badge: baixoEstoqueCount > 0 ? baixoEstoqueCount : null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      ),
      show: true,
    },
    {
      to: "/vendas",
      label: "Registro de Vendas",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      ),
      show: true,
    },
    {
      to: "/funcionarios",
      label: "Equipe & Acessos",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      show: nivel === "admin" || nivel === "gerente",
    },
    {
      to: "/perfil",
      label: "Dados do Mercado",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
      show: nivel === "admin",
    },
  ];

  return (
    <aside className="sidebar">
      {/* Topo / Marca */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div className="sidebar-logo-text">
          Gest<span>Stock</span>
        </div>
      </div>

      {/* Itens de Navegação */}
      <nav className="sidebar-nav">
        <div className="sidebar-label">Módulos</div>
        {menuItems.filter(item => item.show).map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-link ${active ? "active" : ""}`}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  padding: "0.1rem 0.4rem",
                  borderRadius: "999px",
                  lineHeight: 1.2
                }}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé / Usuário & Dark Mode */}
      <div className="sidebar-footer">
        {/* Toggle Dark Mode */}
        <button
          type="button"
          onClick={() => setDarkMode(prev => !prev)}
          className="btn btn-secondary"
          style={{ width: "100%", justifyContent: "space-between", padding: "0.4375rem 0.625rem", fontSize: "0.8125rem", marginBottom: "0.25rem" }}
          title="Alternar tema claro/escuro"
        >
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {darkMode ? "🌙 Modo Escuro" : "☀️ Modo Claro"}
          </span>
          <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", background: "var(--bg-subtle)", padding: "0.1rem 0.35rem", borderRadius: "var(--radius-sm)" }}>
            {darkMode ? "ON" : "OFF"}
          </span>
        </button>

        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {nomeUsuario.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name" title={nomeUsuario}>{nomeUsuario}</div>
            <div className="sidebar-user-role">{nivelBadgeLabel[nivel] || "Operador"}</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{ width: "100%", justifyContent: "flex-start", padding: "0.4375rem 0.625rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}
