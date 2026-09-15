import React, { useEffect, useState, useRef } from "react";
import { api } from "../../services/api";
import { useNavigate, useParams, Link } from "react-router-dom";

const CATEGORIAS = ["Bebidas","Laticinios","Padaria","Carnes","Limpeza","Higiene","Cereais","Frios","Congelados","Outros"];

export default function EditProduct() {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    nome: "",
    preco: "",
    quantidade: "",
    estoque_minimo: "5",
    categoria: "",
    imagem: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await api.get(`/api/products/${id}`);
        setFormData({
          nome:           response.data.nome,
          preco:          response.data.preco.toString(),
          quantidade:     response.data.quantidade.toString(),
          estoque_minimo: (response.data.estoque_minimo ?? 5).toString(),
          categoria:      response.data.categoria || "",
          imagem:         response.data.imagem || "",
        });
      } catch (err) {
        alert("Erro ao carregar dados do produto.");
        navigate("/produtos");
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.put(`/api/products/${id}`, {
        ...formData,
        preco:          parseFloat(formData.preco),
        quantidade:     parseInt(formData.quantidade),
        estoque_minimo: parseInt(formData.estoque_minimo || "5"),
      });
      navigate("/produtos");
    } catch (err) {
      const errorMsg = err.response?.data?.erro || "Erro ao atualizar produto.";
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page-content" style={{ color: "var(--text-muted)" }}>
        Carregando informações do produto...
      </div>
    );
  }

  return (
    <div className="page-content" style={{ maxWidth: "680px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1>Editar Produto</h1>
        <p className="subtitle">Atualize o cadastro e estoque do item #{id}</p>
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: "1.5rem" }}>
          {error}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome da Mercadoria</label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Preco Unitario de Venda (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
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

          <div className="form-group">
            <label>Foto do Produto</label>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.25rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Enviando..." : "Substituir Imagem"}
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                disabled={uploading}
                style={{ display: "none" }}
              />
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
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Salvando..." : "Salvar Alterações"}
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
