from src.config.data_base import db


class SaleItemBatchModel(db.Model):
    """Rastreia quais lotes foram consumidos em cada item de venda (para estorno FEFO no cancelamento)."""
    __tablename__ = "sale_item_batches"

    id           = db.Column(db.Integer, primary_key=True)
    sale_item_id = db.Column(db.Integer, db.ForeignKey("sale_items.id", ondelete="CASCADE"), nullable=False)
    batch_id     = db.Column(db.Integer, db.ForeignKey("product_batches.id", ondelete="CASCADE"), nullable=False)
    quantity     = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {
            "id":           self.id,
            "sale_item_id": self.sale_item_id,
            "batch_id":     self.batch_id,
            "quantity":     self.quantity,
        }
