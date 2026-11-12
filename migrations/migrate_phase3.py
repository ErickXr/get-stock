"""
Fase 3: Controle de Validade (Pereciveis / FEFO)
Migracao SQL idempotente - pode ser executada multiplas vezes sem erro.
"""

import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from run import app
from src.config.data_base import db
from sqlalchemy import text


def column_exists(table, column):
    """Verifica se uma coluna ja existe na tabela."""
    result = db.session.execute(text(
        f"SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
        f"WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{table}' AND COLUMN_NAME = '{column}'"
    )).scalar()
    return int(result) > 0


def table_exists(table):
    """Verifica se uma tabela ja existe."""
    result = db.session.execute(text(
        f"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES "
        f"WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{table}'"
    )).scalar()
    return int(result) > 0


def run_migration():
    with app.app_context():
        print("=" * 55)
        print("FASE 3 - Controle de Validade: Iniciando Migracao")
        print("=" * 55)

        # 1. Adicionar coluna controla_validade em products
        print("\n>> Verificando coluna controla_validade em products...")
        if not column_exists("products", "controla_validade"):
            db.session.execute(text(
                "ALTER TABLE products ADD COLUMN controla_validade BOOLEAN NOT NULL DEFAULT FALSE"
            ))
            db.session.commit()
            print("   OK: Coluna controla_validade adicionada.")
        else:
            print("   INFO: Coluna controla_validade ja existe, ignorando.")

        # 2. Criar tabela product_batches
        print("\n>> Verificando tabela product_batches...")
        if not table_exists("product_batches"):
            db.session.execute(text("""
                CREATE TABLE product_batches (
                    id          INT AUTO_INCREMENT PRIMARY KEY,
                    product_id  INT NOT NULL,
                    seller_id   INT NOT NULL,
                    batch_code  VARCHAR(50) NULL,
                    expiry_date DATE NOT NULL,
                    quantity    INT NOT NULL DEFAULT 0,
                    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_batch_product FOREIGN KEY (product_id)
                        REFERENCES products(id) ON DELETE CASCADE,
                    CONSTRAINT fk_batch_seller FOREIGN KEY (seller_id)
                        REFERENCES sellers(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """))
            db.session.commit()
            print("   OK: Tabela product_batches criada.")
        else:
            print("   INFO: Tabela product_batches ja existe, ignorando.")

        # 3. Criar tabela sale_item_batches
        print("\n>> Verificando tabela sale_item_batches...")
        if not table_exists("sale_item_batches"):
            db.session.execute(text("""
                CREATE TABLE sale_item_batches (
                    id           INT AUTO_INCREMENT PRIMARY KEY,
                    sale_item_id INT NOT NULL,
                    batch_id     INT NOT NULL,
                    quantity     INT NOT NULL,
                    CONSTRAINT fk_sib_sale_item FOREIGN KEY (sale_item_id)
                        REFERENCES sale_items(id) ON DELETE CASCADE,
                    CONSTRAINT fk_sib_batch FOREIGN KEY (batch_id)
                        REFERENCES product_batches(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """))
            db.session.commit()
            print("   OK: Tabela sale_item_batches criada.")
        else:
            print("   INFO: Tabela sale_item_batches ja existe, ignorando.")

        print("\n" + "=" * 55)
        print("FASE 3 - Migracao concluida com sucesso!")
        print("=" * 55)


if __name__ == "__main__":
    run_migration()
