import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Link } from "react-router-dom";

export default function Profile() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    celular: "",
    cnpj: "",
    senha: "",
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
          senha: "",
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
      setMessage({ text: "Dados atualizados com sucesso.", type: "success" });
      setFormData((prev) => ({ ...prev, senha: "" }));
    } catch (err) {
      console.error("Erro ao salvar", err);
      const errorMsg = err.response?.data?.erro || "Erro ao atualizar dados do mercado.";
      setMessage({ text: errorMsg, type: "danger" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page-content" style={{ color: "var(--text-muted)" }}>
        Carregando dados da loja...
      </div>
    );
  }

  return (
    <div className="page-content" style={{ maxWidth: "780px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1>Dados do Mercado</h1>
        <p className="subtitle">Mantenha as informações cadastrais e de acesso da empresa em dia</p>
      </div>

      {message.text && (
        <div
          className={message.type === "success" ? "info-box" : "error-box"}
          style={{
            marginBottom: "1.5rem",
            backgroundColor: message.type === "success" ? "var(--status-success-bg)" : "var(--status-danger-bg)",
            borderColor: message.type === "success" ? "var(--status-success-border)" : "var(--status-danger-border)",
            color: message.type === "success" ? "var(--status-success-text)" : "var(--status-danger-text)",
          }}
        >
          {message.text}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Nome do Estabelecimento</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                placeholder="Nome da sua loja"
              />
            </div>

            <div className="form-group">
              <label>CNPJ</label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                required
                placeholder="00.000.000/0001-00"
              />
            </div>

            <div className="form-group">
              <label>E-mail de Contato</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="contato@mercado.com"
              />
            </div>

            <div className="form-group">
              <label>Telefone / Celular</label>
              <input
                type="text"
                value={formData.celular}
                onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                required
                placeholder="+55 11 99999-9999"
              />
            </div>
          </div>

          <div style={{ marginTop: "1rem", marginBottom: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-subtle)" }}>
            <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.25rem" }}>Segurança da Conta</div>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Preencha apenas se desejar redefinir sua senha de acesso
            </p>

            <div className="form-group" style={{ maxWidth: "340px" }}>
              <label>Nova Senha</label>
              <input
                type="password"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                autoComplete="new-password"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
            <Link to="/dashboard" className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
