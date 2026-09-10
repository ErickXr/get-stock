from src.Infrastructure.Model.sale_model import SaleModel
from src.Infrastructure.Model.product_model import ProductModel

from src.Infrastructure.Model.seller_model import SellerModel
from src.config.data_base import db

class SaleService:

    @staticmethod
    def create(product_id: int, quantity: int, seller_id: str):
        try:
            seller_id_int = int(seller_id)

            seller = SellerModel.query.get(seller_id_int)
            if not seller or seller.status != "ativo":
                raise ValueError("Vendedor inativo ou não encontrado")

            # Combina a busca do produto com a verificação de propriedade em uma única consulta
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
                preco_venda=product.preco
            )

            product.quantidade -= quantity

            
            db.session.add(sale)
            db.session.commit()

            return sale
        except Exception:
            db.session.rollback()
            raise 

    @staticmethod
    def list_by_seller(seller_id: int):
        sales = SaleModel.query.filter_by(seller_id=seller_id).order_by(SaleModel.created_at.desc()).all()
        return [sale.to_dict() for sale in sales]