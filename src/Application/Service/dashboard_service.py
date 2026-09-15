from src.Infrastructure.Model.product_model import ProductModel
from src.Infrastructure.Model.sale_model import SaleModel
from src.config.data_base import db
from sqlalchemy import func
from datetime import datetime, timedelta

class DashboardService:
    @staticmethod
    def get_seller_indicators(seller_id: int):
        total_stock = db.session.query(func.sum(ProductModel.quantidade))\
            .filter(ProductModel.seller_id == seller_id, ProductModel.status == "ativo").scalar() or 0

        total_revenue = db.session.query(func.sum(SaleModel.quantidade * SaleModel.preco_venda - SaleModel.desconto))\
            .filter(SaleModel.seller_id == seller_id, SaleModel.status == "ativa").scalar() or 0

        total_sales_count = db.session.query(func.count(SaleModel.id))\
            .filter(SaleModel.seller_id == seller_id, SaleModel.status == "ativa").scalar() or 0

        # Produtos com estoque abaixo do mínimo
        estoque_baixo = db.session.query(func.count(ProductModel.id))\
            .filter(
                ProductModel.seller_id == seller_id,
                ProductModel.status == "ativo",
                ProductModel.quantidade <= ProductModel.estoque_minimo
            ).scalar() or 0

        return {
            "total_estoque":         int(total_stock),
            "valor_total_vendido":   float(total_revenue),
            "total_vendas":          int(total_sales_count),
            "produtos_estoque_baixo": int(estoque_baixo),
        }

    @staticmethod
    def get_revenue_trend(seller_id: int, days: int = 7):
        now   = datetime.now()
        today = now.date()
        start_date      = today - timedelta(days=days - 1)
        prev_start_date = start_date - timedelta(days=days)

        rows = (
            db.session.query(
                func.date(SaleModel.created_at).label("data"),
                func.sum(SaleModel.quantidade * SaleModel.preco_venda - SaleModel.desconto).label("total")
            )
            .filter(
                SaleModel.seller_id == seller_id,
                SaleModel.status == "ativa",
                SaleModel.created_at >= datetime.combine(start_date, datetime.min.time())
            )
            .group_by(func.date(SaleModel.created_at))
            .all()
        )

        by_date = {str(r.data): float(r.total) for r in rows}
        trend   = []
        current_period_sum = 0.0
        for i in range(days):
            d     = start_date + timedelta(days=i)
            val   = by_date.get(str(d), 0.0)
            current_period_sum += val
            trend.append({"date": str(d), "label": d.strftime("%d/%m"), "total": round(val, 2)})

        prev_sum = (
            db.session.query(func.sum(SaleModel.quantidade * SaleModel.preco_venda - SaleModel.desconto))
            .filter(
                SaleModel.seller_id == seller_id,
                SaleModel.status == "ativa",
                SaleModel.created_at >= datetime.combine(prev_start_date, datetime.min.time()),
                SaleModel.created_at <  datetime.combine(start_date, datetime.min.time())
            )
            .scalar() or 0.0
        )
        prev_sum = float(prev_sum)

        if prev_sum > 0:
            percentage_change = round(((current_period_sum - prev_sum) / prev_sum) * 100, 1)
        elif current_period_sum > 0:
            percentage_change = 100.0
        else:
            percentage_change = 0.0

        return {
            "trend": trend,
            "period_total": round(current_period_sum, 2),
            "percentage_change": percentage_change,
            "days": days,
        }

    @staticmethod
    def get_top_products(seller_id: int, limit: int = 5):
        rows = (
            db.session.query(
                SaleModel.product_id,
                ProductModel.nome,
                func.sum(SaleModel.quantidade).label("total_vendido")
            )
            .join(ProductModel, ProductModel.id == SaleModel.product_id)
            .filter(SaleModel.seller_id == seller_id, SaleModel.status == "ativa")
            .group_by(SaleModel.product_id, ProductModel.nome)
            .order_by(func.sum(SaleModel.quantidade).desc())
            .limit(limit)
            .all()
        )
        if not rows:
            return []
        max_val = rows[0].total_vendido if rows else 1
        return [
            {
                "product_id":    r.product_id,
                "nome":          r.nome,
                "total_vendido": int(r.total_vendido),
                "pct":           round((r.total_vendido / max_val) * 100, 1),
            }
            for r in rows
        ]
