from src.config.data_base import db

class SaleItemModel(db.Model):
    __tablename__ = "sale_items"

    id           = db.Column(db.Integer, primary_key=True)
    sale_id      = db.Column(db.Integer, db.ForeignKey("sales.id", ondelete="CASCADE"), nullable=False)
    product_id   = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    product_name = db.Column(db.String(120), nullable=False)
    unit_price   = db.Column(db.Numeric(10, 2), nullable=False)
    quantity     = db.Column(db.Integer, nullable=False)
    subtotal     = db.Column(db.Numeric(10, 2), nullable=False)

    product = db.relationship("ProductModel", lazy=True)
    batch_consumptions = db.relationship(
        "SaleItemBatchModel",
        backref="sale_item",
        lazy=True,
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id":           self.id,
            "sale_id":      self.sale_id,
            "product_id":   self.product_id,
            "product_name": self.product_name,
            "unit_price":   float(self.unit_price) if self.unit_price is not None else 0.0,
            "quantity":     self.quantity,
            "subtotal":     float(self.subtotal) if self.subtotal is not None else 0.0,
            "batch_consumptions": [bc.to_dict() for bc in self.batch_consumptions] if self.batch_consumptions else [],
        }
