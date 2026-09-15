from src.config.data_base import db

class ProductModel(db.Model):
    __tablename__ = "products"

    id             = db.Column(db.Integer, primary_key=True)
    nome           = db.Column(db.String(120), nullable=False)
    preco          = db.Column(db.Float, nullable=False)
    quantidade     = db.Column(db.Integer, nullable=False)
    status         = db.Column(db.String(20), default="ativo", nullable=False)
    imagem         = db.Column(db.String(255), nullable=True)
    categoria      = db.Column(db.String(60), nullable=True)
    estoque_minimo = db.Column(db.Integer, default=5, nullable=False)
    seller_id      = db.Column(db.Integer, db.ForeignKey("sellers.id"), nullable=False)

    # Relação com vendas
    sales = db.relationship("SaleModel", backref="product", lazy=True)

    def to_dict(self):
        return {
            "id":             self.id,
            "nome":           self.nome,
            "preco":          self.preco,
            "quantidade":     self.quantidade,
            "status":         self.status,
            "imagem":         self.imagem,
            "categoria":      self.categoria,
            "estoque_minimo": self.estoque_minimo,
            "seller_id":      self.seller_id,
        }
