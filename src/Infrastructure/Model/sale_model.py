from src.config.data_base import db

class SaleModel(db.Model):
    __tablename__ = "sales"

    id                  = db.Column(db.Integer, primary_key=True)
    product_id          = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    seller_id           = db.Column(db.Integer, db.ForeignKey("sellers.id"), nullable=False)
    quantidade          = db.Column(db.Integer, nullable=False)
    preco_venda         = db.Column(db.Float, nullable=False)
    forma_pagamento     = db.Column(db.String(20), default="dinheiro", nullable=False)
    desconto            = db.Column(db.Float, default=0.0, nullable=False)
    status              = db.Column(db.String(20), default="ativa", nullable=False)
    motivo_cancelamento = db.Column(db.String(255), nullable=True)
    created_at          = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        subtotal = self.preco_venda * self.quantidade
        total    = round(subtotal - (self.desconto or 0.0), 2)
        return {
            "id":                  self.id,
            "product_id":          self.product_id,
            "produto_nome":        self.product.nome if self.product else f"Produto #{self.product_id}",
            "seller_id":           self.seller_id,
            "quantidade":          self.quantidade,
            "preco_venda":         self.preco_venda,
            "forma_pagamento":     self.forma_pagamento,
            "desconto":            round(self.desconto or 0.0, 2),
            "total":               total,
            "status":              self.status,
            "motivo_cancelamento": self.motivo_cancelamento,
            "created_at":          self.created_at.isoformat() if self.created_at else None,
        }
