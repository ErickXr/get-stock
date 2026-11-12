import React, { useEffect, useState, useRef } from "react";
import { api } from "../../services/api";
import { useNavigate, Link } from "react-router-dom";

const FORMAS = [
  { value: "dinheiro", label: "Dinheiro", icon: "💵" },
  { value: "pix",      label: "PIX",      icon: "⚡" },
  { value: "debito",   label: "Débito",   icon: "💳" },
  { value: "credito",  label: "Crédito",  icon: "💳" },
  { value: "fiado",    label: "Fiado",    icon: "📒" },
];

export default function CreateSale() {
  const [products, setProducts]       = useState([]);
  const [cart, setCart]               = useState([]); // [{ product, quantity }]
  const [searchTerm, setSearchTerm]   = useState("");
  const [formaPagamento, setForma]    = useState("dinheiro");
  const [desconto, setDesconto]       = useState("");
  const [loading, setLoading]         = useState(false);
  const [feedback, setFeedback]       = useState({ message: "", type: "" }); // "error" | "success" | "info"
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Estado para Fiado / Caderneta
  const [customers, setCustomers]         = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch]     = useState("");
  const [showCustomerList, setShowCustomerList] = useState(false);

  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  // Carrega produtos ativos do mercado
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await api.get("/api/products");
        const active = (res.data || []).filter(p => p.status === "ativo");
        setProducts(active);
      } catch (err) {
        console.error("Erro ao carregar produtos:", err);
      }
    }
    loadProducts();

    // Carrega clientes ativos para o Fiado
    async function loadCustomers() {
      try {
        const res = await api.get("/api/customers", { params: { active_only: "true" } });
        setCustomers(res.data || []);
      } catch (err) {
        console.error("Erro ao carregar clientes:", err);
      }
    }
    loadCustomers();
  }, []);

  // Autofoco inicial no campo de busca/código de barras
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Atalhos de teclado globais: F2 (Focar busca) e F9 (Finalizar Venda)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === "F9") {
        e.preventDefault();
        handleSubmit();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, formaPagamento, desconto, loading]);

  // Filtra sugestões por nome ou código de barras
  const cleanTerm = searchTerm.trim().toLowerCase();
  const suggestions = cleanTerm.length > 0
    ? products.filter(p => 
        p.nome.toLowerCase().includes(cleanTerm) ||
        (p.barcode && p.barcode.toLowerCase().includes(cleanTerm))
      ).slice(0, 6)
    : [];

  function showMessage(msg, type = "error") {
    setFeedback({ message: msg, type });
    if (type === "error") {
      setTimeout(() => {
        setFeedback(prev => prev.message === msg ? { message: "", type: "" } : prev);
      }, 4500);
    }
  }

  // Adiciona produto ao carrinho
  function addToCart(product, quantityToAdd = 1) {
    if (!product || product.status !== "ativo") {
      showMessage("Produto não está disponível para venda.");
      return;
    }

    if (product.quantidade <= 0) {
      showMessage(`O produto "${product.nome}" está sem estoque.`);
      return;
    }

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.product.id === product.id);
      if (existingIndex >= 0) {
        const currentQty = prevCart[existingIndex].quantity;
        const newQty = currentQty + quantityToAdd;
        if (newQty > product.quantidade) {
          showMessage(`Estoque insuficiente para "${product.nome}". Disponível: ${product.quantidade} un.`);
          return prevCart;
        }
        const updated = [...prevCart];
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        return updated;
      } else {
        if (quantityToAdd > product.quantidade) {
          showMessage(`Estoque insuficiente para "${product.nome}". Disponível: ${product.quantidade} un.`);
          return prevCart;
        }
        return [{ product, quantity: quantityToAdd }, ...prevCart];
      }
    });

    setSearchTerm("");
    setShowSuggestions(false);
    setSelectedIndex(0);
    searchInputRef.current?.focus();
  }

  // Processa entrada de scanner de código de barras ou Enter na busca
  async function handleSearchSubmit(e) {
    if (e) e.preventDefault();
    const query = searchTerm.trim();
    if (!query) return;

    // 1. Tenta encontrar por código de barras exato na lista carregada
    const matchBarcode = products.find(p => p.barcode && p.barcode.trim() === query);
    if (matchBarcode) {
      addToCart(matchBarcode, 1);
      return;
    }

    // 2. Se for código numérico, tenta buscar direto no endpoint de código de barras
    if (/^\d{4,20}$/.test(query)) {
      try {
        const res = await api.get(`/api/products/by-barcode/${query}`);
        if (res.data) {
          addToCart(res.data, 1);
          return;
        }
      } catch (err) {
        // Segue para a busca por nome
      }
    }

    // 3. Se houver sugestão selecionada na lista, adiciona ela
    if (suggestions.length > 0) {
      const selected = suggestions[selectedIndex] || suggestions[0];
      addToCart(selected, 1);
      return;
    }

    showMessage(`Nenhum produto encontrado para "${query}".`);
  }

  // Alteração de quantidade no carrinho
  function updateQuantity(productId, newQty) {
    if (isNaN(newQty)) return;
    const qty = parseInt(newQty, 10);
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId) {
          if (qty > item.product.quantidade) {
            showMessage(`Estoque máximo atingido para "${item.product.nome}" (${item.product.quantidade} un disponíveis).`);
            return { ...item, quantity: item.product.quantidade };
          }
          return { ...item, quantity: qty };
        }
        return item;
      });
    });
  }

  function removeFromCart(productId) {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }

  function clearCart() {
    if (cart.length === 0) return;
    if (window.confirm("Deseja realmente limpar todos os itens do carrinho?")) {
      setCart([]);
      setDesconto("");
      searchInputRef.current?.focus();
    }
  }

  // Cálculos financeiros
  const subtotal = cart.reduce((acc, item) => acc + (item.product.preco * item.quantity), 0);
  const descontoNum = Math.max(0, parseFloat(desconto) || 0);
  const descontoAplicado = Math.min(descontoNum, subtotal);
  const total = Math.max(0, subtotal - descontoAplicado);
  const totalItensCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const fmtBRL = (val) => Number(val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Finalização da Venda
  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (loading) return;

    if (cart.length === 0) {
      showMessage("Adicione ao menos um produto no carrinho antes de finalizar a venda.");
      searchInputRef.current?.focus();
      return;
    }

    // Validação de Fiado: obrigatório selecionar cliente
    if (formaPagamento === "fiado" && !selectedCustomer) {
      showMessage("Para venda no fiado, selecione um cliente da caderneta.");
      return;
    }

    // Validação de Fiado: verificar limite de crédito no frontend (backend também valida)
    if (formaPagamento === "fiado" && selectedCustomer) {
      if (total > selectedCustomer.limite_disponivel) {
        showMessage(
          `Limite de crédito insuficiente. Total da venda: ${fmtBRL(total)} | Disponível: ${fmtBRL(selectedCustomer.limite_disponivel)} para ${selectedCustomer.name}.`
        );
        return;
      }
    }

    setLoading(true);
    setFeedback({ message: "", type: "" });

    try {
      const payload = {
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        })),
        forma_pagamento: formaPagamento,
        desconto: descontoAplicado,
        customer_id: formaPagamento === "fiado" && selectedCustomer ? selectedCustomer.id : null,
      };

      await api.post("/api/sales", payload);
      navigate("/vendas");
    } catch (err) {
      const errorMsg = err.response?.data?.erro || "Erro ao registrar a venda. Verifique o estoque.";
      showMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-content" style={{ maxWidth: "1280px" }}>
      {/* Topo / Título & Atalhos */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Frente de Caixa (PDV)</h1>
          <p className="subtitle">
            Terminal de vendas ágil com leitor de código de barras e carrinho de compras
          </p>
        </div>

        {/* Guias de Atalhos de Teclado */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem", background: "var(--bg-subtle)", padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
            <kbd style={{ fontWeight: 700, color: "var(--text-main)", background: "var(--bg-surface)", padding: "0.1rem 0.35rem", borderRadius: "3px", border: "1px solid var(--border-medium)" }}>F2</kbd> Focar Busca
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem", background: "var(--bg-subtle)", padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
            <kbd style={{ fontWeight: 700, color: "var(--text-main)", background: "var(--bg-surface)", padding: "0.1rem 0.35rem", borderRadius: "3px", border: "1px solid var(--border-medium)" }}>Enter</kbd> Adicionar Item
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem", background: "var(--bg-subtle)", padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
            <kbd style={{ fontWeight: 700, color: "var(--accent)", background: "var(--bg-surface)", padding: "0.1rem 0.35rem", borderRadius: "3px", border: "1px solid var(--accent-border)" }}>F9</kbd> Finalizar Venda
          </span>
        </div>
      </div>

      {/* Banner de Feedback/Alerta */}
      {feedback.message && (
        <div 
          className={feedback.type === "success" ? "info-box" : "error-box"} 
          style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", animation: "fadeSlideIn 0.2s ease" }}
        >
          <span>{feedback.message}</span>
          <button 
            type="button" 
            onClick={() => setFeedback({ message: "", type: "" })} 
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700, fontSize: "1.1rem" }}
          >
            ×
          </button>
        </div>
      )}

      {/* Grid Principal: Esquerda (Busca + Carrinho) | Direita (Pagamento + Totais) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: "1.5rem", alignItems: "start" }}>
        
        {/* COLUNA ESQUERDA: Busca e Carrinho */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* Barra de Entrada / Leitor de Código de Barras */}
          <div className="card" style={{ padding: "1.25rem", position: "relative" }}>
            <form onSubmit={handleSearchSubmit}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <span style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--accent)", display: "flex", alignItems: "center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 5v14M8 5v14M12 5v14M17 5v14M21 5v14"/>
                    </svg>
                  </span>
                  
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    placeholder="Bipe o código de barras ou digite o nome do produto..."
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowSuggestions(true);
                      setSelectedIndex(0);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown" && suggestions.length > 0) {
                        e.preventDefault();
                        setSelectedIndex(prev => (prev + 1) % suggestions.length);
                      } else if (e.key === "ArrowUp" && suggestions.length > 0) {
                        e.preventDefault();
                        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
                      } else if (e.key === "Escape") {
                        setShowSuggestions(false);
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem 0.75rem 2.75rem",
                      fontSize: "0.9375rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-medium)",
                      background: "var(--bg-surface)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ padding: "0.75rem 1.25rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
                >
                  <span>Adicionar</span>
                  <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>↵</span>
                </button>
              </div>
            </form>

            {/* Menu Pop-up de Sugestões de Busca */}
            {showSuggestions && suggestions.length > 0 && (
              <div 
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: "1.25rem",
                  right: "1.25rem",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-md)",
                  zIndex: 100,
                  maxHeight: "260px",
                  overflowY: "auto",
                }}
              >
                {suggestions.map((p, idx) => (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p, 1)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      padding: "0.625rem 1rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      borderBottom: idx < suggestions.length - 1 ? "1px solid var(--border-subtle)" : "none",
                      backgroundColor: idx === selectedIndex ? "var(--accent-subtle)" : "transparent",
                      color: idx === selectedIndex ? "var(--accent-text)" : "var(--text-main)",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{p.nome}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "0.75rem", marginTop: "0.1rem" }}>
                        {p.barcode && <span>❚❙❘ {p.barcode}</span>}
                        <span>Estoque: {p.quantidade} un</span>
                        {p.categoria && <span>{p.categoria}</span>}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                      {fmtBRL(p.preco)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lista de Itens no Carrinho */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-main)" }}>
                Itens no Carrinho ({cart.length})
              </div>
              {cart.length > 0 && (
                <button 
                  onClick={clearCart} 
                  type="button" 
                  style={{ background: "none", border: "none", color: "#dc2626", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                >
                  Limpar Carrinho
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3.5rem 1.5rem", color: "var(--text-muted)" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🛒</div>
                <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                  O carrinho está vazio
                </div>
                <div style={{ fontSize: "0.8125rem" }}>
                  Passe o leitor de código de barras ou use a busca acima para incluir produtos.
                </div>
              </div>
            ) : (
              <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th style={{ textAlign: "right" }}>Preço Unit.</th>
                      <th style={{ textAlign: "center", width: "130px" }}>Quantidade</th>
                      <th style={{ textAlign: "right" }}>Subtotal</th>
                      <th style={{ textAlign: "center", width: "40px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => {
                      const itemSubtotal = item.product.preco * item.quantity;
                      return (
                        <tr key={item.product.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                              {item.product.nome}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "0.5rem" }}>
                              {item.product.barcode && <span>❚❙❘ {item.product.barcode}</span>}
                              <span>Máx: {item.product.quantidade} un</span>
                            </div>
                          </td>

                          <td style={{ textAlign: "right", color: "var(--text-secondary)" }}>
                            {fmtBRL(item.product.preco)}
                          </td>

                          {/* Seletor com Botões + e - */}
                          <td style={{ textAlign: "center" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid var(--border-medium)", borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--bg-surface)" }}>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                style={{ width: "28px", height: "28px", border: "none", background: "var(--bg-subtle)", color: "var(--text-main)", cursor: "pointer", fontWeight: 700 }}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={item.product.quantidade}
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                                style={{ width: "42px", height: "28px", border: "none", textAlign: "center", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-main)", background: "transparent", outline: "none" }}
                              />
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                disabled={item.quantity >= item.product.quantidade}
                                style={{ width: "28px", height: "28px", border: "none", background: "var(--bg-subtle)", color: "var(--text-main)", cursor: item.quantity >= item.product.quantidade ? "not-allowed" : "pointer", fontWeight: 700, opacity: item.quantity >= item.product.quantidade ? 0.4 : 1 }}
                              >
                                +
                              </button>
                            </div>
                          </td>

                          <td style={{ textAlign: "right", fontWeight: 700, color: "var(--text-main)" }}>
                            {fmtBRL(itemSubtotal)}
                          </td>

                          <td style={{ textAlign: "center" }}>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.product.id)}
                              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1 }}
                              title="Remover item do carrinho"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: Pagamento & Finalização */}
        <div className="card" style={{ position: "sticky", top: "1rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1.25rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.75rem" }}>
            Finalização da Venda
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Formas de Pagamento */}
            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontWeight: 600, fontSize: "0.8125rem", marginBottom: "0.5rem" }}>Forma de Pagamento</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {FORMAS.map(f => {
                  const isSelected = formaPagamento === f.value;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setForma(f.value)}
                      style={{
                        padding: "0.625rem 0.75rem",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        justifyContent: "center",
                        border: `1px solid ${isSelected ? "var(--accent)" : "var(--border-subtle)"}`,
                        background: isSelected ? "var(--accent-subtle)" : "var(--bg-surface)",
                        color: isSelected ? "var(--accent-text)" : "var(--text-secondary)",
                        transition: "var(--transition)",
                      }}
                    >
                      <span>{f.icon}</span>
                      <span>{f.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seletor de Cliente para Fiado */}
            {formaPagamento === "fiado" && (
              <div style={{ marginBottom: "1.25rem", padding: "1rem", background: "rgba(239, 68, 68, 0.06)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                <label style={{ fontWeight: 600, fontSize: "0.8125rem", marginBottom: "0.5rem", display: "block", color: "#dc2626" }}>
                  📒 Cliente da Caderneta *
                </label>

                {selectedCustomer ? (
                  <div>
                    {/* Cliente selecionado */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "var(--bg-surface)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--text-main)" }}>
                          {selectedCustomer.name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          📞 {selectedCustomer.phone}
                        </div>
                        <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.75rem", fontSize: "0.75rem" }}>
                          <span style={{ color: total > selectedCustomer.limite_disponivel ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
                            Disponível: {(Number(selectedCustomer.limite_disponivel) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                          {selectedCustomer.saldo_devedor > 0 && (
                            <span style={{ color: "#b45309" }}>
                              Dívida atual: {(Number(selectedCustomer.saldo_devedor) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </span>
                          )}
                        </div>

                        {/* Alerta de limite insuficiente */}
                        {total > selectedCustomer.limite_disponivel && (
                          <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", fontWeight: 600, color: "#dc2626", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            ⛔ Limite insuficiente para esta venda! ({fmtBRL(total)} &gt; {fmtBRL(selectedCustomer.limite_disponivel)})
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem", padding: "0.25rem" }}
                        title="Trocar cliente"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="Buscar cliente por nome ou telefone..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerList(e.target.value.trim().length > 0);
                      }}
                      onFocus={() => setShowCustomerList(customerSearch.trim().length > 0)}
                      style={{ width: "100%", fontSize: "0.875rem" }}
                    />
                    {showCustomerList && (
                      <div style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        right: 0,
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        boxShadow: "var(--shadow-md)",
                        zIndex: 100,
                        maxHeight: "200px",
                        overflowY: "auto"
                      }}>
                        {customers
                          .filter(c => {
                            const q = customerSearch.toLowerCase();
                            return c.name.toLowerCase().includes(q) || c.phone.includes(q);
                          })
                          .slice(0, 8)
                          .map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedCustomer(c);
                                setCustomerSearch("");
                                setShowCustomerList(false);
                              }}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                width: "100%",
                                padding: "0.65rem 0.85rem",
                                background: "none",
                                border: "none",
                                borderBottom: "1px solid var(--border-subtle)",
                                cursor: "pointer",
                                textAlign: "left",
                                gap: "0.5rem"
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-main)" }}>
                                  {c.name}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                  {c.phone}
                                </div>
                              </div>
                              <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <div style={{ fontSize: "0.7rem", color: c.saldo_devedor > 0 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
                                  Disp: {(Number(c.limite_disponivel) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </div>
                              </div>
                            </button>
                          ))
                        }
                        {customers.filter(c => {
                          const q = customerSearch.toLowerCase();
                          return c.name.toLowerCase().includes(q) || c.phone.includes(q);
                        }).length === 0 && (
                          <div style={{ padding: "0.85rem", fontSize: "0.8125rem", color: "var(--text-muted)", textAlign: "center" }}>
                            Nenhum cliente ativo encontrado.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Desconto em R$ */}
            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontWeight: 600, fontSize: "0.8125rem" }}>Desconto Total (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
                style={{ fontSize: "0.9375rem" }}
              />
            </div>

            {/* Resumo Financeiro */}
            <div style={{ padding: "1.125rem", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                <span>Subtotal ({totalItensCount} itens)</span>
                <span>{fmtBRL(subtotal)}</span>
              </div>
              
              {descontoAplicado > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", color: "#b45309", marginBottom: "0.35rem" }}>
                  <span>Desconto</span>
                  <span>- {fmtBRL(descontoAplicado)}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.625rem", marginTop: "0.5rem" }}>
                <span style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.9375rem" }}>Total a Cobrar</span>
                <span style={{ fontSize: "1.625rem", fontWeight: 800, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
                  {fmtBRL(total)}
                </span>
              </div>
            </div>

            {/* Botões de Ação */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={
                  loading || cart.length === 0 ||
                  (formaPagamento === "fiado" && !selectedCustomer) ||
                  (formaPagamento === "fiado" && selectedCustomer && total > selectedCustomer.limite_disponivel)
                }
                style={{ padding: "0.875rem", fontSize: "1rem", fontWeight: 700, width: "100%", justifyContent: "center" }}
              >
                {loading
                  ? "Processando Venda..."
                  : formaPagamento === "fiado" && !selectedCustomer
                    ? "Selecione o Cliente (Fiado)"
                    : "Finalizar Venda (F9)"
                }
              </button>

              <Link 
                to="/vendas" 
                className="btn btn-secondary" 
                style={{ width: "100%", textAlign: "center", justifyContent: "center" }}
              >
                Histórico de Vendas
              </Link>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
