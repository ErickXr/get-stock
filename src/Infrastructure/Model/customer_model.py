from src.config.data_base import db
from decimal import Decimal

class CustomerModel(db.Model):
    __tablename__ = "customers"

    id           = db.Column(db.Integer, primary_key=True)
    seller_id    = db.Column(db.Integer, db.ForeignKey("sellers.id", ondelete="CASCADE"), nullable=False)
    name         = db.Column(db.String(120), nullable=False)
    phone        = db.Column(db.String(20), nullable=False)
    cpf          = db.Column(db.String(14), nullable=True)
    credit_limit = db.Column(db.Numeric(10, 2), default=Decimal('0.00'), nullable=False)
    active       = db.Column(db.Boolean, default=True, nullable=False)
    created_at   = db.Column(db.DateTime, server_default=db.func.now())

    # Relações
    payments = db.relationship("CustomerPaymentModel", backref="customer", lazy=True, cascade="all, delete-orphan")
    sales    = db.relationship("SaleModel", backref="customer", lazy=True)

    def to_dict(self):
        return {
            "id":           self.id,
            "seller_id":    self.seller_id,
            "name":         self.name,
            "phone":        self.phone,
            "cpf":          self.cpf,
            "credit_limit": float(self.credit_limit) if self.credit_limit is not None else 0.0,
            "active":       bool(self.active),
            "created_at":   self.created_at.isoformat() if self.created_at else None,
        }
