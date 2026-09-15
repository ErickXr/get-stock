import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { Link } from "react-router-dom";

const NIVEL_LABEL = {
  gerente: "Gerente",
  operador: "Operador",
};

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchUsers() {
    try {
      const response = await api.get("/api/users");
      setUsers(response.data);
    } catch (err) {
      setError(err.response?.data?.erro || "Erro ao carregar colaboradores.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(userId) {
    try {
      await api.patch(`/api/users/${userId}/toggle-status`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.erro || "Erro ao alterar status do colaborador.");
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const nivelLogado = JSON.parse(localStorage.getItem("user") || localStorage.getItem("seller") || "{}").nivel || "admin";

  return (
    <div className="page-content">
      {/* Topo / Título & Ação */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Equipe & Acessos</h1>
          <p className="subtitle">
            {users.length} {users.length === 1 ? "colaborador cadastrado" : "colaboradores cadastrados"} no mercado
          </p>
        </div>

        {nivelLogado === "admin" && (
          <Link to="/funcionarios/novo" className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Novo Funcionário
          </Link>
        )}
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: "1.5rem" }}>
          {error}
        </div>
      )}

      {/* Tabela de Colaboradores */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>E-mail de Login</th>
              <th>Nível de Acesso</th>
              <th>Situação</th>
              {nivelLogado === "admin" && <th style={{ textAlign: "right" }}>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={nivelLogado === "admin" ? 5 : 4} style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
                  Carregando colaboradores...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={nivelLogado === "admin" ? 5 : 4} style={{ textAlign: "center", padding: "3.5rem 1rem", color: "var(--text-secondary)" }}>
                  <p style={{ fontWeight: 500, marginBottom: "0.5rem" }}>Nenhum funcionário cadastrado ainda.</p>
                  {nivelLogado === "admin" && (
                    <Link to="/funcionarios/novo" className="btn btn-secondary" style={{ marginTop: "0.5rem" }}>
                      Cadastrar Primeiro Colaborador
                    </Link>
                  )}
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isAtivo = user.status === "ativo";
                return (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: "var(--bg-subtle)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-main)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 600,
                            fontSize: "0.8125rem",
                          }}
                        >
                          {user.nome.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{user.nome}</span>
                      </div>
                    </td>

                    <td style={{ color: "var(--text-secondary)" }}>{user.email}</td>

                    <td>
                      <span className="badge badge-neutral">
                        {NIVEL_LABEL[user.nivel] || user.nivel}
                      </span>
                    </td>

                    <td>
                      <span className={`badge ${isAtivo ? "badge-success" : "badge-neutral"}`}>
                        {isAtivo ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    {nivelLogado === "admin" && (
                      <td style={{ textAlign: "right" }}>
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={isAtivo ? "btn btn-danger" : "btn btn-secondary"}
                          style={{ padding: "0.3125rem 0.625rem", fontSize: "0.8125rem" }}
                        >
                          {isAtivo ? "Desativar" : "Ativar"}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
