from src.config.data_base import db
from decimal import Decimal

class ProductModel(db.Model):
    __tablename__ = "products"
    __table_args__ = (
        db.UniqueConstraint("seller_id", "barcode", name="uq_seller_barcode"),
    )

    id               = db.Column(db.Integer, primary_key=True)
    nome             = db.Column(db.String(120), nullable=False)
    preco            = db.Column(db.Numeric(10, 2), nullable=False)
    quantidade       = db.Column(db.Integer, nullable=False)
    status           = db.Column(db.String(20), default="ativo", nullable=False)
    imagem           = db.Column(db.String(255), nullable=True)
    categoria        = db.Column(db.String(60), nullable=True)
    estoque_minimo   = db.Column(db.Integer, default=5, nullable=False)
    barcode          = db.Column(db.String(20), nullable=True)
    controla_validade = db.Column(db.Boolean, default=False, nullable=False)
    seller_id        = db.Column(db.Integer, db.ForeignKey("sellers.id"), nullable=False)

    batches = db.relationship(
        "ProductBatchModel",
        backref="product",
        lazy=True,
        cascade="all, delete-orphan",
        foreign_keys="ProductBatchModel.product_id"
    )

    def to_dict(self):
        return {
            "id":               self.id,
            "nome":             self.nome,
            "preco":            float(self.preco) if self.preco is not None else 0.0,
            "quantidade":       self.quantidade,
            "status":           self.status,
            "imagem":           self.imagem,
            "categoria":        self.categoria,
            "estoque_minimo":   self.estoque_minimo,
            "barcode":          self.barcode,
            "controla_validade": bool(self.controla_validade),
            "seller_id":        self.seller_id,
        }
