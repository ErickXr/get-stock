-- =========================================================================
-- MIGRAÇÃO FASE 2: FIADO / CADERNETA DE CLIENTES
-- Idempotente para MySQL (MERCADOESTOQUE / getstock)
-- =========================================================================

-- 1. Tabela de Clientes (customers)
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    cpf VARCHAR(14) NULL,
    credit_limit DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
);

-- Índices de busca
SET @idx_cust = (
    SELECT COUNT(*) FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
      AND table_name = 'customers' 
      AND index_name = 'idx_customer_seller_name'
);
SET @sql = IF(@idx_cust = 0, 'CREATE INDEX idx_customer_seller_name ON customers (seller_id, name)', 'SELECT "idx_customer_seller_name ja existe"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Tabela de Pagamentos de Clientes (customer_payments)
CREATE TABLE IF NOT EXISTS customer_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    seller_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    received_by VARCHAR(120) NOT NULL,
    note VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
);

-- 3. Adicionar customer_id em sales para compras no fiado
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id INT NULL;

SET @fk_sales_cust = (
    SELECT COUNT(*) FROM information_schema.table_constraints 
    WHERE table_schema = DATABASE() 
      AND table_name = 'sales' 
      AND constraint_name = 'fk_sales_customer'
);
SET @sql_fk = IF(@fk_sales_cust = 0, 'ALTER TABLE sales ADD CONSTRAINT fk_sales_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL', 'SELECT "fk_sales_customer ja existe"');
PREPARE stmt_fk FROM @sql_fk;
EXECUTE stmt_fk;
DEALLOCATE PREPARE stmt_fk;
