import os
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    """
    Inicializa a base de dados com o app Flask e o SQLAlchemy.
    
    Opções de banco de dados:
    1. SQLite (padrão) - Não precisa de Docker, ideal para desenvolvimento
    2. MySQL - Precisa subir o Docker com docker-compose up
    """
    
    # Configuração de Banco de Dados via .env
    basedir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(basedir, '..', '..', 'market_management.db')
    
    # Tenta pegar a conexão do arquivo .env (MySQL), se não achar cai no SQLite (Padrão)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI', f'sqlite:///{db_path}')
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    
    # Cria as tabelas automaticamente
    with app.app_context():
        db.create_all()

