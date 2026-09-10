import React from "react";
import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { Link } from "react-router-dom";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const response = await api.get("/api/products");
      setProducts(response.data);
    } catch (err) {
      console.error("Falha ao carregar produtos", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleInactivate(id) {
    if (!confirm("Deseja realmente inativar este produto?")) return;
    try {
      await api.patch(`/api/products/${id}/inactivate`);
      loadProducts();
    } catch (err) {
      alert("Erro ao inativar produto.");
    }
  }

  async function handleActivate(id) {
    if (!confirm("Deseja reativar este produto?")) return;
    try {
      await api.patch(`/api/products/${id}/activate`);
      loadProducts();
    } catch (err) {
      alert("Erro ao ativar produto.");
    }
  }

  if (loading) return <div className="container animate-in">Carregando lista de produtos...</div>;

  return (
    <div className="container animate-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <p style={{ color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            Estoque
          </p>
          <h1>Meus Produtos</h1>
        </div>
        <Link to="/produtos/novo" className="btn btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Novo Produto
        </Link>
      </header>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Preço Unitário</th>
                <th>Em Estoque</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '5rem 0' }}>
                    <div style={{ opacity: 0.5, marginBottom: '1rem' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>
                    </div>
                    Você ainda não cadastrou nenhum produto.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="table-row">
                    <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {product.imagem ? (
                          <img 
                            src={product.imagem} 
                            alt={product.nome} 
                            style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-light)' }} 
                          />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                          </div>
                        )}
                        <span>{product.nome}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>R$ {product.preco.toFixed(2)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700 }}>{product.quantidade}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>unidades</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${product.status === 'ativo' ? 'badge-success' : 'badge-danger'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.75rem' }}>
                        <Link to={`/produtos/${product.id}`} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', borderRadius: '8px' }}>
                          Editar
                        </Link>
                        {product.status === 'ativo' ? (
                          <button onClick={() => handleInactivate(product.id)} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', borderRadius: '8px', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                            Inativar
                          </button>
                        ) : (
                          <button onClick={() => handleActivate(product.id)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', borderRadius: '8px' }}>
                            Reativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <style>{`
        .table-row { transition: background-color 0.2s; }
        .table-row:hover { background-color: rgba(37, 99, 235, 0.02); }
      `}</style>
    </div>
  );
}