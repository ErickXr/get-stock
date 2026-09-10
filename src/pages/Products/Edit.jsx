import React from "react";
import { useEffect, useState, useRef } from "react";
import { api } from "../../services/api";
import { useNavigate, useParams } from "react-router-dom";

export default function EditProduct() {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    nome: "",
    preco: "",
    quantidade: "",
    imagem: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append("image", file);

    try {
      const response = await api.post("/api/upload", data);
      setFormData({ ...formData, imagem: response.data.url });
    } catch (err) {
      const errorMsg = err.response?.data?.erro || err.response?.data?.mensagem || "Erro ao fazer upload da imagem.";
      alert("Erro: " + errorMsg);
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await api.get(`/api/products/${id}`);
        setFormData({
          nome: response.data.nome,
          preco: response.data.preco.toString(),
          quantidade: response.data.quantidade.toString(),
          imagem: response.data.imagem || ""
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
    try {
      await api.put(`/api/products/${id}`, {
        ...formData,
        preco: parseFloat(formData.preco),
        quantidade: parseInt(formData.quantidade)
      });
      navigate("/produtos");
    } catch (err) {
      alert("Erro ao atualizar produto.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="container">Carregando dados...</div>;

  return (
    <div className="container">
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1>Editar Produto</h1>
        <div className="glass-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome do Produto</label>
              <input 
                type="text" 
                value={formData.nome}
                required 
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Preço (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={formData.preco}
                  required 
                  onChange={(e) => setFormData({...formData, preco: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Quantidade em Estoque</label>
                <input 
                  type="number" 
                  value={formData.quantidade}
                  required 
                  onChange={(e) => setFormData({...formData, quantidade: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Imagem do Produto</label>
              <div>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Enviando..." : "Escolher arquivo"}
                </button>
                <input 
                  type="file" 
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
              </div>
              {/* {uploading && <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>Fazendo upload...</p>} removido pois o botão já diz 'Enviando...' */}
              {formData.imagem && (
                <div style={{ marginTop: '10px' }}>
                  <p style={{ fontSize: '0.9rem', marginBottom: '5px', color: '#888' }}>Pré-visualização da imagem atual:</p>
                  <img src={formData.imagem} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Salvando..." : "Salvar Alterações"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate("/produtos")}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
