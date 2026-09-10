from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from src.config.data_base import init_db
from src.routes import init_routes
import os
from dotenv import load_dotenv

load_dotenv()

def create_app():

    app = Flask(__name__)

    # Chave JWT com 64+ caracteres (segura conforme RFC 7518)
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "sua-chave-secreta-muito-segura-com-mais-de-32-caracteres-aleatorios")
    app.config["JWT_HEADER_NAME"] = "Authorization"
    app.config["JWT_HEADER_TYPE"] = "Bearer"

    # Configuração de Uploads
    UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'uploads')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

    CORS(app)

    jwt = JWTManager(app)

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {"erro": "A sessão expirou", "detalhes": "Por favor, faça login novamente."}, 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {"erro": "Token inválido", "detalhes": "O token de autenticação é inválido ou está malformado."}, 422

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {"erro": "Autenticação necessária", "detalhes": "O cabeçalho de autorização está ausente."}, 401

    init_db(app)

    init_routes(app)

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
