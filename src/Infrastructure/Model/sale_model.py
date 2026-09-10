from src.config.data_base import db

class SaleModel(db.Model):
    __tablename__ = "sales"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    seller_id = db.Column(db.Integer, db.ForeignKey("sellers.id"), nullable=False)
    quantidade = db.Column(db.Integer, nullable=False)
    preco_venda = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # O backref no SellerModel e ProductModel cria as propriedades virtuais automaticamente.

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "seller_id": self.seller_id,
            "quantidade": self.quantidade,
            "preco_venda": self.preco_venda,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }