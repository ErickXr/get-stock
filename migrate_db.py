import sys
sys.path.insert(0, '.')
from run import app
from src.config.data_base import db

MIGRATIONS = [
    ('products', 'categoria',       'ALTER TABLE products ADD COLUMN categoria VARCHAR(60) NULL'),
    ('products', 'estoque_minimo',  'ALTER TABLE products ADD COLUMN estoque_minimo INT NOT NULL DEFAULT 5'),
    ('sales',    'forma_pagamento', "ALTER TABLE sales ADD COLUMN forma_pagamento VARCHAR(20) NOT NULL DEFAULT 'dinheiro'"),
    ('sales',    'desconto',        'ALTER TABLE sales ADD COLUMN desconto FLOAT NOT NULL DEFAULT 0.0'),
    ('sales',    'status',          "ALTER TABLE sales ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ativa'"),
    ('sales',    'motivo_cancelamento', 'ALTER TABLE sales ADD COLUMN motivo_cancelamento VARCHAR(255) NULL'),
]

with app.app_context():
    with db.engine.connect() as conn:
        for table, col, sql in MIGRATIONS:
            try:
                conn.execute(db.text(sql))
                conn.commit()
                print(f'OK: {table}.{col}')
            except Exception as e:
                print(f'SKIP {table}.{col}: {e}')
    print('Migracao concluida.')
