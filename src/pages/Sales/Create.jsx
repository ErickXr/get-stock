import React from "react";
import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function CreateSale() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    produtoId: "",
    quantidade: 1
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await api.get("/api/products");
        // Filtra apenas produtos ativos e com estoque
        const activeProducts = response.data.filter(p => p.status === 'ativo' && p.quantidade > 0);
        setProducts(activeProducts);
      } catch (err) {
        console.error("Erro ao carregar produtos", err);
      }
    }
    loadProducts();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.produtoId) return alert("Selecione um produto.");
    
    setLoading(true);
    try {
      await api.post("/api/sales", {
        produtoId: parseInt(formData.produtoId),
        quantidade: parseInt(formData.quantidade)
      });
      alert("Venda registrada com sucesso!");
      navigate("/vendas");
    } catch (err) {
      alert(err.response?.data?.erro || "Erro ao registrar venda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1>Registrar Nova Venda</h1>
        <div className="glass-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Selecionar Produto</label>
              <select 
                required 
                onChange={(e) => setFormData({...formData, produtoId: e.target.value})}
              >
                <option value="">Escolha um produto...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome} (Disponível: {p.quantidade} - R$ {p.preco.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Quantidade</label>
              <input 
                type="number" 
                min="1" 
                value={formData.quantidade}
                required 
                onChange={(e) => setFormData({...formData, quantidade: e.target.value})}
              />
            </div>

            <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', marginBottom: '1.5rem' }}>
              {formData.produtoId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>Total da Venda:</span>
                  <span>
                    R$ {(products.find(p => p.id === parseInt(formData.produtoId))?.preco * formData.quantidade || 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading || products.length === 0}>
                {loading ? "Processando..." : "Confirmar Venda"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate("/vendas")}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
