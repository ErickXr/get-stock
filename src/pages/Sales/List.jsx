import React from "react";
import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { Link } from "react-router-dom";

export default function SalesList() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSales() {
      try {
        const response = await api.get("/api/sales");
        setSales(response.data);
      } catch (err) {
        console.error("Erro ao carregar vendas", err);
      } finally {
        setLoading(false);
      }
    }
    loadSales();
  }, []);

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Histórico de Vendas</h1>
        <Link to="/vendas/nova" className="btn btn-primary">
          + Nova Venda
        </Link>
      </div>

      <div className="glass-card" style={{ padding: '0' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Produto ID</th>
                <th>Qtd</th>
                <th>Preço Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                    Nenhuma venda registrada ainda.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{new Date(sale.created_at).toLocaleDateString('pt-BR')} {new Date(sale.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>PROD-{sale.product_id}</td>
                    <td>{sale.quantidade}</td>
                    <td>R$ {sale.preco_venda.toFixed(2)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                      R$ {(sale.quantidade * sale.preco_venda).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
