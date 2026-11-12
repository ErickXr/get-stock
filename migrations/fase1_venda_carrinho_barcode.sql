-- =========================================================================
-- MIGRAÇÃO FASE 1: VENDA COM CARRINHO (MÚLTIPLOS ITENS) + CÓDIGO DE BARRAS
-- Idempotente para MySQL (MERCADOESTOQUE / getstock)
-- =========================================================================

-- 1. Código de barras no produto
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(20) NULL;

-- Criar índice composto único se não existir
SET @index_exists = (
    SELECT COUNT(*) FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
      AND table_name = 'products' 
      AND index_name = 'uq_seller_barcode'
);
SET @sql = IF(@index_exists = 0, 'CREATE UNIQUE INDEX uq_seller_barcode ON products (seller_id, barcode)', 'SELECT "Indice uq_seller_barcode ja existe"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Tabela de itens da venda (sale_items)
CREATE TABLE IF NOT EXISTS sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(120) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 3. Cabeçalho de venda (sales)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS total_bruto DECIMAL(10,2) NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS total_liquido DECIMAL(10,2) NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS user_id INT NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS usuario_nome VARCHAR(120) NULL;

-- Modificar colunas legadas para NULLABLE
ALTER TABLE sales MODIFY COLUMN product_id INT NULL;
ALTER TABLE sales MODIFY COLUMN quantidade INT NULL;
ALTER TABLE sales MODIFY COLUMN preco_venda DECIMAL(10,2) NULL;
ALTER TABLE sales MODIFY COLUMN desconto DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- 4. Migração de dados legados existentes
UPDATE sales 
SET total_bruto = ROUND(COALESCE(quantidade * preco_venda, 0.00), 2)
WHERE total_bruto IS NULL AND quantidade IS NOT NULL AND preco_venda IS NOT NULL;

UPDATE sales 
SET total_liquido = ROUND(GREATEST(0.00, total_bruto - COALESCE(desconto, 0.00)), 2)
WHERE total_liquido IS NULL AND total_bruto IS NOT NULL;

INSERT INTO sale_items (sale_id, product_id, product_name, unit_price, quantity, subtotal)
SELECT 
    s.id, 
    s.product_id, 
    COALESCE(p.nome, CONCAT('Produto #', s.product_id)), 
    ROUND(s.preco_venda, 2), 
    s.quantidade, 
    ROUND(s.quantidade * s.preco_venda, 2)
FROM sales s
LEFT JOIN products p ON s.product_id = p.id
WHERE s.product_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM sale_items si WHERE si.sale_id = s.id);
