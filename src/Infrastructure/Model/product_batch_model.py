from src.config.data_base import db
from decimal import Decimal


class ProductBatchModel(db.Model):
    __tablename__ = "product_batches"

    id          = db.Column(db.Integer, primary_key=True)
    product_id  = db.Column(db.Integer, db.ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    seller_id   = db.Column(db.Integer, db.ForeignKey("sellers.id", ondelete="CASCADE"), nullable=False)
    batch_code  = db.Column(db.String(50), nullable=True)
    expiry_date = db.Column(db.Date, nullable=False)
    quantity    = db.Column(db.Integer, nullable=False, default=0)
    created_at  = db.Column(db.DateTime, server_default=db.func.now())

    # Consumptions for cancellation rollback
    consumptions = db.relationship(
        "SaleItemBatchModel", backref="batch", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self):
        from datetime import date
        today = date.today()
        days_to_expire = (self.expiry_date - today).days if self.expiry_date else None
        is_expired = days_to_expire is not None and days_to_expire < 0

        if is_expired:
            urgency = "vencido"
        elif days_to_expire is not None and days_to_expire <= 7:
            urgency = "urgente"
        elif days_to_expire is not None and days_to_expire <= 15:
            urgency = "atencao"
        else:
            urgency = "ok"

        return {
            "id":             self.id,
            "product_id":     self.product_id,
            "seller_id":      self.seller_id,
            "batch_code":     self.batch_code,
            "expiry_date":    self.expiry_date.isoformat() if self.expiry_date else None,
            "quantity":       self.quantity,
            "created_at":     self.created_at.isoformat() if self.created_at else None,
            "days_to_expire": days_to_expire,
            "is_expired":     is_expired,
            "urgency":        urgency,
        }
