import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useNavigate, useParams, Link } from "react-router-dom";

export default function EditCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [creditLimit, setCreditLimit] = useState("0.00");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCustomer() {
      try {
        const res = await api.get(`/api/customers/${id}`);
        const c = res.data;
        setName(c.name || "");
        setPhone(c.phone || "");
        setCpf(c.cpf || "");
        setCreditLimit(Number(c.credit_limit || 0).toFixed(2));
        setActive(Boolean(c.active));
      } catch (err) {
        setError(err.response?.data?.erro || "Erro ao carregar dados do cliente.");
      } finally {
        setLoading(false);
      }
    }
    loadCustomer();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Nome e telefone são obrigatórios.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await api.put(`/api/customers/${id}`, {
        name: name.trim(),
        phone: phone.trim(),
        cpf: cpf.trim() || null,
        credit_limit: parseFloat(creditLimit.replace(",", ".")) || 0.0,
        active: Boolean(active)
      });
      navigate(`/clientes/${id}`);
    } catch (err) {
      setError(err.response?.data?.erro || "Erro ao atualizar cliente.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page-content">
        <p style={{ color: "var(--text-muted)" }}>Carregando dados do cliente...</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div style={{ marginBottom: "2rem" }}>
        <Link to={`/clientes/${id}`} style={{ fontSize: "0.8125rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.75rem" }}>
          ← Voltar para Detalhes do Cliente
        </Link>
        <h1>Editar Cliente</h1>
        <p className="subtitle">
          Atualize os dados cadastrais, limite de crédito e situação do cliente
        </p>
      </div>

      <div className="card" style={{ maxWidth: "640px", padding: "2rem" }}>
        {error && <div className="error-box" style={{ marginBottom: "1.5rem" }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: "1.25rem" }}>
            <label>Nome Completo*</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
            <div className="form-group">
              <label>Telefone / WhatsApp*</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>CPF (Opcional)</label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label>Limite de Crédito para Fiado (R$)*</label>
            <input
              type="number"
              step="0.01"
              min="0.00"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              required
            />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem", display: "block" }}>
              Valor máximo que o cliente pode deixar pendente na caderneta.
            </span>
          </div>

          <div className="form-group" style={{ marginBottom: "1.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <input
              type="checkbox"
              id="clienteAtivo"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              style={{ width: "1.1rem", height: "1.1rem", accentColor: "var(--accent)", cursor: "pointer" }}
            />
            <label htmlFor="clienteAtivo" style={{ marginBottom: 0, cursor: "pointer", fontWeight: 500 }}>
              Cliente Ativo (Pode realizar compras no Fiado)
            </label>
          </div>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <Link to={`/clientes/${id}`} className="btn btn-secondary">
              Cancelar
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
