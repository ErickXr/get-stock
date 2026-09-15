from src.Infrastructure.Model.sale_model import SaleModel
from src.Infrastructure.Model.product_model import ProductModel
from src.Infrastructure.Model.seller_model import SellerModel
from src.config.data_base import db
from datetime import datetime

class SaleService:

    @staticmethod
    def create(product_id: int, quantity: int, seller_id: str, forma_pagamento: str = "dinheiro", desconto: float = 0.0):
        try:
            seller_id_int = int(seller_id)
            seller = SellerModel.query.get(seller_id_int)
            if not seller or seller.status != "ativo":
                raise ValueError("Vendedor inativo ou não encontrado")

            product = ProductModel.query.filter_by(id=product_id, seller_id=seller_id_int).first()
            if not product:
                raise ValueError("Produto não encontrado ou não pertence a este vendedor.")
            if product.status != "ativo":
                raise ValueError("Produto inativo não pode ser vendido")
            if quantity > product.quantidade:
                raise ValueError(f"Estoque insuficiente. Disponível: {product.quantidade}")

            sale = SaleModel(
                product_id=product.id,
                seller_id=seller_id_int,
                quantidade=quantity,
                preco_venda=product.preco,
                forma_pagamento=forma_pagamento,
                desconto=desconto,
                status="ativa",
            )
            product.quantidade -= quantity
            db.session.add(sale)
            db.session.commit()
            return sale
        except Exception:
            db.session.rollback()
            raise

    @staticmethod
    def cancel(sale_id: int, seller_id: int, motivo: str = ""):
        sale = SaleModel.query.filter_by(id=sale_id, seller_id=int(seller_id)).first()
        if not sale:
            raise ValueError("Venda não encontrada")
        if sale.status == "cancelada":
            raise ValueError("Venda já está cancelada")

        # Reverte estoque
        product = ProductModel.query.get(sale.product_id)
        if product:
            product.quantidade += sale.quantidade

        sale.status = "cancelada"
        sale.motivo_cancelamento = motivo
        db.session.commit()
        return sale

    @staticmethod
    def list_by_seller(seller_id: int, inicio=None, fim=None, forma=None):
        q = SaleModel.query.filter_by(seller_id=int(seller_id))
        if inicio:
            q = q.filter(SaleModel.created_at >= inicio)
        if fim:
            q = q.filter(SaleModel.created_at <= fim)
        if forma:
            q = q.filter_by(forma_pagamento=forma)
        sales = q.order_by(SaleModel.created_at.desc()).all()
        return [s.to_dict() for s in sales]
