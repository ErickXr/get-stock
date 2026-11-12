import sys
sys.path.insert(0, '.')
from run import app
from src.config.data_base import db
from sqlalchemy import text

def run_migration():
    with app.app_context():
        with db.engine.connect() as conn:
            print("--- Executando Migrações ---")

            # 1. products.barcode
            try:
                conn.execute(text("ALTER TABLE products ADD COLUMN barcode VARCHAR(20) NULL"))
                conn.commit()
                print("OK: products.barcode adicionado")
            except Exception as e:
                print(f"INFO products.barcode: {e}")

            # Índice único composto (seller_id, barcode)
            try:
                conn.execute(text("CREATE UNIQUE INDEX uq_seller_barcode ON products (seller_id, barcode)"))
                conn.commit()
                print("OK: indice uq_seller_barcode criado")
            except Exception as e:
                print(f"INFO uq_seller_barcode: {e}")

            # 2. Tabela sale_items
            try:
                conn.execute(text("""
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
                )
                """))
                conn.commit()
                print("OK: tabela sale_items verificada/criada")
            except Exception as e:
                print(f"ERRO sale_items: {e}")

            # 3. Colunas em sales para cabeçalho
            colunas_sales = [
                ("total_bruto", "ALTER TABLE sales ADD COLUMN total_bruto DECIMAL(10,2) NULL"),
                ("total_liquido", "ALTER TABLE sales ADD COLUMN total_liquido DECIMAL(10,2) NULL"),
                ("user_id", "ALTER TABLE sales ADD COLUMN user_id INT NULL"),
                ("usuario_nome", "ALTER TABLE sales ADD COLUMN usuario_nome VARCHAR(120) NULL"),
            ]
            for col, sql in colunas_sales:
                try:
                    conn.execute(text(sql))
                    conn.commit()
                    print(f"OK: sales.{col} adicionado")
                except Exception as e:
                    print(f"INFO sales.{col}: {e}")

            # Tornar colunas legadas nullable em sales
            try:
                conn.execute(text("ALTER TABLE sales MODIFY COLUMN product_id INT NULL"))
                conn.commit()
                print("OK: sales.product_id agora é NULLABLE")
            except Exception as e:
                print(f"INFO sales.product_id modify: {e}")

            try:
                conn.execute(text("ALTER TABLE sales MODIFY COLUMN quantidade INT NULL"))
                conn.commit()
                print("OK: sales.quantidade agora é NULLABLE")
            except Exception as e:
                print(f"INFO sales.quantidade modify: {e}")

            try:
                conn.execute(text("ALTER TABLE sales MODIFY COLUMN preco_venda DECIMAL(10,2) NULL"))
                conn.commit()
                print("OK: sales.preco_venda agora é NULLABLE")
            except Exception as e:
                print(f"INFO sales.preco_venda modify: {e}")

            try:
                conn.execute(text("ALTER TABLE sales MODIFY COLUMN desconto DECIMAL(10,2) NOT NULL DEFAULT 0.00"))
                conn.commit()
                print("OK: sales.desconto ajustado para DECIMAL(10,2)")
            except Exception as e:
                print(f"INFO sales.desconto modify: {e}")

            # 4. Migração de dados legados
            print("\n--- Migrando dados históricos de vendas ---")
            # Atualizar total_bruto e total_liquido onde for nulo
            conn.execute(text("""
                UPDATE sales 
                SET total_bruto = ROUND(COALESCE(quantidade * preco_venda, 0.00), 2)
                WHERE total_bruto IS NULL AND quantidade IS NOT NULL AND preco_venda IS NOT NULL
            """))
            conn.execute(text("""
                UPDATE sales 
                SET total_liquido = ROUND(GREATEST(0.00, total_bruto - COALESCE(desconto, 0.00)), 2)
                WHERE total_liquido IS NULL AND total_bruto IS NOT NULL
            """))
            conn.commit()
            print("OK: totais históricos calculados em sales")

            # Inserir itens históricos em sale_items
            res = conn.execute(text("""
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
                  AND NOT EXISTS (SELECT 1 FROM sale_items si WHERE si.sale_id = s.id)
            """))
            conn.commit()
            print(f"OK: {res.rowcount} vendas legadas migradas para sale_items!")

            print("\nMigração da Fase 1 finalizada com sucesso.")

if __name__ == "__main__":
    run_migration()
