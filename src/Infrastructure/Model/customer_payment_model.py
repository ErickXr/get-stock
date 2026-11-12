from src.config.data_base import db
from decimal import Decimal

class CustomerPaymentModel(db.Model):
    __tablename__ = "customer_payments"

    id             = db.Column(db.Integer, primary_key=True)
    customer_id    = db.Column(db.Integer, db.ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    seller_id      = db.Column(db.Integer, db.ForeignKey("sellers.id", ondelete="CASCADE"), nullable=False)
    amount         = db.Column(db.Numeric(10, 2), nullable=False)
    payment_method = db.Column(db.String(20), default="dinheiro", nullable=False)
    received_by    = db.Column(db.String(120), nullable=False)
    note           = db.Column(db.String(255), nullable=True)
    created_at     = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        return {
            "id":             self.id,
            "customer_id":    self.customer_id,
            "seller_id":      self.seller_id,
            "amount":         float(self.amount) if self.amount is not None else 0.0,
            "payment_method": self.payment_method,
            "received_by":    self.received_by,
            "note":           self.note,
            "created_at":     self.created_at.isoformat() if self.created_at else None,
        }
