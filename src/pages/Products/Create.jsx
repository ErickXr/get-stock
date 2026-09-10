import React from "react";
import { useState, useRef } from "react";
import { api } from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function CreateProduct() {
  const [formData, setFormData] = useState({
    nome: "",
    preco: "",
    quantidade: "",
    imagem: ""
  });
  const [loading, setLoading] = useState(false);
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

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/products", {
        ...formData,
        preco: parseFloat(formData.preco),
        quantidade: parseInt(formData.quantidade)
      });
      navigate("/produtos");
    } catch (err) {
      const errorMsg = err.response?.data?.detalhes || err.response?.data?.erro || "Erro ao cadastrar produto.";
      alert("Erro: " + errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1>Novo Produto</h1>
        <div className="glass-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome do Produto</label>
              <input 
                type="text" 
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
                  required 
                  onChange={(e) => setFormData({...formData, preco: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Quantidade em Estoque</label>
                <input 
                  type="number" 
                  required 
                  onChange={(e) => setFormData({...formData, quantidade: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Imagem do Produto (Opcional)</label>
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
                  <p style={{ fontSize: '0.9rem', marginBottom: '5px', color: '#888' }}>Pré-visualização:</p>
                  <img src={formData.imagem} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Salvando..." : "Cadastrar Produto"}
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
