from src.config.data_base import db
from decimal import Decimal

class SaleModel(db.Model):
    __tablename__ = "sales"

    id                  = db.Column(db.Integer, primary_key=True)
    seller_id           = db.Column(db.Integer, db.ForeignKey("sellers.id"), nullable=False)
    
    # Cabeçalho da Venda (Monetário Decimal)
    total_bruto         = db.Column(db.Numeric(10, 2), nullable=True)
    desconto            = db.Column(db.Numeric(10, 2), default=Decimal('0.00'), nullable=False)
    total_liquido       = db.Column(db.Numeric(10, 2), nullable=True)
    forma_pagamento     = db.Column(db.String(20), default="dinheiro", nullable=False)
    status              = db.Column(db.String(20), default="ativa", nullable=False)
    motivo_cancelamento = db.Column(db.String(255), nullable=True)
    
    # Identificação do operador/vendedor
    user_id             = db.Column(db.Integer, nullable=True)
    usuario_nome        = db.Column(db.String(120), nullable=True)

    # Cliente (obrigatório se forma_pagamento == 'fiado')
    customer_id         = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=True)

    # Campos legados (agora nullable para suportar compras com múltiplos itens)
    product_id          = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=True)
    quantidade          = db.Column(db.Integer, nullable=True)
    preco_venda         = db.Column(db.Numeric(10, 2), nullable=True)

    created_at          = db.Column(db.DateTime, server_default=db.func.now())

    # Relacionamento com itens da venda
    items = db.relationship("SaleItemModel", backref="sale", lazy="joined", cascade="all, delete-orphan")
    product = db.relationship("ProductModel", lazy=True, foreign_keys=[product_id])

    def to_dict(self):
        items_data = [item.to_dict() for item in self.items] if self.items else []
        
        if items_data:
            total_qtd = sum(item["quantity"] for item in items_data)
            if len(items_data) == 1:
                nome_resumido = items_data[0]["product_name"]
            else:
                nome_resumido = f"{items_data[0]['product_name']} (+{len(items_data) - 1} itens)"
        else:
            total_qtd = self.quantidade or 0
            nome_resumido = self.product.nome if self.product else f"Produto #{self.product_id}"

        bruto = float(self.total_bruto) if self.total_bruto is not None else float(sum(i["subtotal"] for i in items_data) if items_data else (float(self.preco_venda or 0) * (self.quantidade or 0)))
        desc = float(self.desconto or 0.0)
        liquido = float(self.total_liquido) if self.total_liquido is not None else max(0.0, round(bruto - desc, 2))

        return {
            "id":                  self.id,
            "seller_id":           self.seller_id,
            "total_bruto":         round(bruto, 2),
            "desconto":            round(desc, 2),
            "total":               round(liquido, 2),
            "total_liquido":       round(liquido, 2),
            "forma_pagamento":     self.forma_pagamento,
            "status":              self.status,
            "motivo_cancelamento": self.motivo_cancelamento,
            "user_id":             self.user_id,
            "usuario_nome":        self.usuario_nome or "Dono (Admin)",
            "customer_id":         self.customer_id,
            "cliente_nome":        self.customer.name if self.customer else None,
            "quantidade":          total_qtd,
            "produto_nome":        nome_resumido,
            "items":               items_data,
            "created_at":          self.created_at.isoformat() if self.created_at else None,
        }
