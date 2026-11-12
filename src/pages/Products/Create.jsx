import React, { useState, useRef } from "react";
import { api } from "../../services/api";
import { useNavigate, Link } from "react-router-dom";

const CATEGORIAS = ["Bebidas","Laticinios","Padaria","Carnes","Limpeza","Higiene","Cereais","Frios","Congelados","Outros"];

export default function CreateProduct() {
  const [formData, setFormData] = useState({
    nome: "",
    barcode: "",
    preco: "",
    quantidade: "",
    estoque_minimo: "5",
    categoria: "",
    imagem: "",
    controla_validade: false,
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError("");
    const data = new FormData();
    data.append("image", file);

    try {
      const response = await api.post("/api/upload", data);
      setFormData({ ...formData, imagem: response.data.url });
    } catch (err) {
      const errorMsg = err.response?.data?.erro || err.response?.data?.mensagem || "Erro ao fazer upload da imagem.";
      setError(errorMsg);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/api/products", {
        ...formData,
        preco: parseFloat(formData.preco),
        quantidade: parseInt(formData.quantidade),
        estoque_minimo: parseInt(formData.estoque_minimo || "5"),
      });
      navigate("/produtos");
    } catch (err) {
      const errorMsg = err.response?.data?.detalhes || err.response?.data?.erro || "Erro ao cadastrar produto.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-content" style={{ maxWidth: "680px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1>Cadastrar Novo Produto</h1>
        <p className="subtitle">Preencha os dados da mercadoria para inseri-la no catálogo</p>
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: "1.5rem" }}>
          {error}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Nome da Mercadoria</label>
              <input
                type="text"
                required
                placeholder="Ex: Arroz Tipo 1 5kg"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Código de Barras / EAN (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: 7891234567890"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Preco Unitario de Venda (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0,00"
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Quantidade em Estoque</label>
              <input
                type="number"
                min="0"
                required
                placeholder="0"
                value={formData.quantidade}
                onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Categoria</label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                style={{ width:"100%", padding:"0.5rem 0.75rem", border:"1px solid var(--border-subtle)", borderRadius:"var(--radius-sm)", background:"var(--bg-surface)", color:"var(--text-main)", fontFamily:"inherit", fontSize:"0.875rem" }}
              >
                <option value="">Sem categoria</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Estoque Minimo para Alerta</label>
              <input
                type="number"
                min="0"
                placeholder="5"
                value={formData.estoque_minimo}
                onChange={(e) => setFormData({ ...formData, estoque_minimo: e.target.value })}
              />
            </div>
          </div>

          {/* Toggle: Controla Validade */}
          <div style={{ padding: "1rem", background: "var(--bg-subtle)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setFormData(prev => ({ ...prev, controla_validade: !prev.controla_validade }))}>
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "0.9375rem" }}>
                  🗓️ Produto Perecível (Controle de Validade)
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                  Ativa o controle de lotes com data de validade. Vendas usarão FEFO automaticamente.
                </div>
              </div>
              <div style={{
                width: "44px", height: "24px", borderRadius: "999px", flexShrink: 0,
                background: formData.controla_validade ? "var(--accent)" : "var(--border-medium)",
                display: "flex", alignItems: "center", padding: "2px",
                transition: "background var(--transition)", position: "relative"
              }}>
                <div style={{
                  width: "20px", height: "20px", borderRadius: "50%", background: "white",
                  transform: formData.controla_validade ? "translateX(20px)" : "translateX(0)",
                  transition: "transform var(--transition)", boxShadow: "var(--shadow-xs)"
                }} />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Foto do Produto (Opcional)</label>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.25rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Enviando imagem..." : "Selecionar Imagem"}
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                disabled={uploading}
                style={{ display: "none" }}
              />
              <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                {formData.imagem ? "Imagem selecionada" : "Formatos JPG, PNG ou WebP"}
              </span>
            </div>

            {formData.imagem && (
              <div style={{ marginTop: "1rem" }}>
                <img
                  src={formData.imagem}
                  alt="Pré-visualização"
                  style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}
                />
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-subtle)" }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Produto"}
            </button>
            <Link to="/produtos" className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
