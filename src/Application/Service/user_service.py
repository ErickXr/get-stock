import bcrypt
from src.Infrastructure.Model.user_model import UserModel
from src.config.data_base import db

NIVEIS_VALIDOS = ["admin", "gerente", "operador"]


class UserService:

    @staticmethod
    def create_user(nome, email, senha, nivel, seller_id):
        """Cria um novo funcionário vinculado ao mercado do seller."""
        if nivel not in ["gerente", "operador"]:
            raise ValueError("Nível inválido. Use 'gerente' ou 'operador'.")

        if UserModel.query.filter_by(email=email).first():
            raise ValueError("Este e-mail já está em uso.")

        hashed = bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt())
        user = UserModel(
            nome=nome,
            email=email,
            senha=hashed.decode("utf-8"),
            nivel=nivel,
            seller_id=seller_id,
            status="ativo"
        )
        db.session.add(user)
        db.session.commit()
        return user

    @staticmethod
    def list_users(seller_id):
        """Lista todos os funcionários de um mercado."""
        return UserModel.query.filter_by(seller_id=seller_id).all()

    @staticmethod
    def get_by_id(user_id, seller_id):
        """Busca um funcionário pelo ID, garantindo que pertence ao mercado."""
        return UserModel.query.filter_by(id=user_id, seller_id=seller_id).first()

    @staticmethod
    def update_user(user_id, seller_id, data):
        """Atualiza dados de um funcionário."""
        user = UserModel.query.filter_by(id=user_id, seller_id=seller_id).first()
        if not user:
            return None

        if "nome" in data:
            user.nome = data["nome"]
        if "nivel" in data:
            if data["nivel"] not in ["gerente", "operador"]:
                raise ValueError("Nível inválido. Use 'gerente' ou 'operador'.")
            user.nivel = data["nivel"]
        if "senha" in data and data["senha"]:
            hashed = bcrypt.hashpw(data["senha"].encode("utf-8"), bcrypt.gensalt())
            user.senha = hashed.decode("utf-8")

        db.session.commit()
        return user

    @staticmethod
    def toggle_status(user_id, seller_id):
        """Ativa ou desativa um funcionário."""
        user = UserModel.query.filter_by(id=user_id, seller_id=seller_id).first()
        if not user:
            return None
        user.status = "inativo" if user.status == "ativo" else "ativo"
        db.session.commit()
        return user

    @staticmethod
    def authenticate(email, senha):
        """Autentica um funcionário pelo e-mail e senha."""
        user = UserModel.query.filter_by(email=email).first()
        if user and bcrypt.checkpw(senha.encode("utf-8"), user.senha.encode("utf-8")):
            return user
        return None
