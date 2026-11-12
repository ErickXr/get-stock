import React, { useState } from "react";
import { api } from "../../services/api";
import { useNavigate, Link } from "react-router-dom";

export default function CreateCustomer() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [creditLimit, setCreditLimit] = useState("100.00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Por favor, preencha o nome e o telefone do cliente.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        cpf: cpf.trim() || null,
        credit_limit: parseFloat(creditLimit.replace(",", ".")) || 0.0,
      };

      await api.post("/api/customers", payload);
      navigate("/clientes");
    } catch (err) {
      setError(err.response?.data?.erro || "Erro ao cadastrar cliente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-content">
      <div style={{ marginBottom: "2rem" }}>
        <Link to="/clientes" style={{ fontSize: "0.8125rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.75rem" }}>
          ← Voltar para Clientes
        </Link>
        <h1>Cadastrar Novo Cliente</h1>
        <p className="subtitle">
          Cadastre clientes para permitir compras na caderneta (fiado) com controle de limite de crédito
        </p>
      </div>

      <div className="card" style={{ maxWidth: "640px", padding: "2rem" }}>
        {error && <div className="error-box" style={{ marginBottom: "1.5rem" }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: "1.25rem" }}>
            <label>Nome Completo*</label>
            <input
              type="text"
              placeholder="Ex: Maria dos Santos"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
            <div className="form-group">
              <label>Telefone / WhatsApp*</label>
              <input
                type="text"
                placeholder="(11) 98765-4321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>CPF (Opcional)</label>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "1.75rem" }}>
            <label>Limite de Crédito para Fiado (R$)*</label>
            <input
              type="number"
              step="0.01"
              min="0.00"
              placeholder="0,00"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              required
            />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem", display: "block" }}>
              Valor máximo acumulado que o cliente pode comprar fiado sem quitar.
            </span>
          </div>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <Link to="/clientes" className="btn btn-secondary">
              Cancelar
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Salvando..." : "Cadastrar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
