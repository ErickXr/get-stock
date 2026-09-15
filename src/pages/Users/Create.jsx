import React, { useState } from "react";
import { api } from "../../services/api";
import { useNavigate, Link } from "react-router-dom";

export default function CreateUser() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nivel, setNivel] = useState("operador");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/api/users", { nome, email, senha, nivel });
      navigate("/funcionarios");
    } catch (err) {
      setError(err.response?.data?.erro || "Erro ao cadastrar colaborador.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-content" style={{ maxWidth: "580px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1>Novo Funcionário</h1>
        <p className="subtitle">Cadastre um colaborador e defina suas permissões no sistema</p>
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: "1.5rem" }}>
          {error}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome Completo</label>
            <input
              type="text"
              placeholder="Ex: Carlos Eduardo Silva"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>E-mail Corporativo</label>
            <input
              type="email"
              placeholder="carlos@mercado.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Senha de Acesso</label>
            <input
              type="password"
              placeholder="Defina uma senha segura"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Nível de Permissão</label>
            <select
              value={nivel}
              onChange={(e) => setNivel(e.target.value)}
            >
              <option value="gerente">Gerente — Acesso a produtos e vendas</option>
              <option value="operador">Operador — Apenas registro de vendas em balcão</option>
            </select>
          </div>

          <div className="info-box" style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontWeight: 600, color: "var(--text-main)", marginBottom: "0.25rem" }}>
              Descrição das permissões:
            </div>
            <ul style={{ paddingLeft: "1.25rem", margin: 0, lineHeight: 1.6 }}>
              <li><strong>Gerente:</strong> Pode cadastrar e editar produtos do estoque e registrar vendas.</li>
              <li><strong>Operador:</strong> Focado em frente de caixa; pode apenas consultar e registrar vendas.</li>
            </ul>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Cadastrando..." : "Cadastrar Funcionário"}
            </button>
            <Link to="/funcionarios" className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
