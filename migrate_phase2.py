import sys
sys.path.insert(0, '.')
from run import app
from src.config.data_base import db
from sqlalchemy import text

def run_phase2_migration():
    with app.app_context():
        with db.engine.connect() as conn:
            print("--- Executando Migração Fase 2: Clientes e Fiado ---")

            # 1. Tabela customers
            try:
                conn.execute(text("""
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
                )
                """))
                conn.commit()
                print("OK: tabela customers criada/verificada")
            except Exception as e:
                print(f"INFO customers: {e}")

            # Índice customers
            try:
                conn.execute(text("CREATE INDEX idx_customer_seller_name ON customers (seller_id, name)"))
                conn.commit()
                print("OK: indice idx_customer_seller_name criado")
            except Exception as e:
                print(f"INFO idx_customer_seller_name: {e}")

            # 2. Tabela customer_payments
            try:
                conn.execute(text("""
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
                )
                """))
                conn.commit()
                print("OK: tabela customer_payments criada/verificada")
            except Exception as e:
                print(f"INFO customer_payments: {e}")

            # 3. Coluna customer_id em sales
            try:
                conn.execute(text("ALTER TABLE sales ADD COLUMN customer_id INT NULL"))
                conn.commit()
                print("OK: sales.customer_id adicionado")
            except Exception as e:
                print(f"INFO sales.customer_id: {e}")

            try:
                conn.execute(text("ALTER TABLE sales ADD CONSTRAINT fk_sales_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL"))
                conn.commit()
                print("OK: foreign key fk_sales_customer adicionada")
            except Exception as e:
                print(f"INFO fk_sales_customer: {e}")

            print("Migração Fase 2 concluída com sucesso.")

if __name__ == "__main__":
    run_phase2_migration()
