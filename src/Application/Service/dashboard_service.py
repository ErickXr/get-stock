from src.Infrastructure.Model.product_model import ProductModel
from src.Infrastructure.Model.sale_model import SaleModel
from src.config.data_base import db
from sqlalchemy import func

class DashboardService:
    @staticmethod
    def get_seller_indicators(seller_id: int):
        # Total de produtos em estoque
        total_stock = db.session.query(func.sum(ProductModel.quantidade))\
            .filter_by(seller_id=seller_id).scalar() or 0
        
        # Valor total vendido
        total_revenue = db.session.query(func.sum(SaleModel.quantidade * SaleModel.preco_venda))\
            .filter_by(seller_id=seller_id).scalar() or 0
            
        return {
            "total_estoque": int(total_stock),
            "valor_total_vendido": float(total_revenue)
        }
