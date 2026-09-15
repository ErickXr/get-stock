from src.config.data_base import db

class UserModel(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True)
    senha = db.Column(db.String(255), nullable=False)
    nivel = db.Column(db.String(20), nullable=False, default="operador")  # admin, gerente, operador
    status = db.Column(db.String(20), nullable=False, default="ativo")
    seller_id = db.Column(db.Integer, db.ForeignKey("sellers.id"), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "email": self.email,
            "nivel": self.nivel,
            "status": self.status,
            "seller_id": self.seller_id
        }
