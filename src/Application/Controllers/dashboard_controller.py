from flask import jsonify, make_response, request
from src.Application.Service.dashboard_service import DashboardService
from src.Application.Service.auth_guard import get_current_user, require_nivel

class DashboardController:
    @staticmethod
    @require_nivel("admin", "gerente", "operador")
    def get_indicators():
        try:
            _, _, seller_id = get_current_user()
            indicators = DashboardService.get_seller_indicators(seller_id)
            return make_response(jsonify(indicators), 200)
        except Exception as e:
            return make_response(jsonify({"erro": str(e)}), 500)

    @staticmethod
    @require_nivel("admin", "gerente", "operador")
    def get_revenue_trend():
        try:
            _, _, seller_id = get_current_user()
            days = request.args.get("days", default=7, type=int)
            data = DashboardService.get_revenue_trend(seller_id, days=days)
            return make_response(jsonify(data), 200)
        except Exception as e:
            return make_response(jsonify({"erro": str(e)}), 500)

    @staticmethod
    @require_nivel("admin", "gerente", "operador")
    def get_top_products():
        try:
            _, _, seller_id = get_current_user()
            limit = request.args.get("limit", default=5, type=int)
            data  = DashboardService.get_top_products(seller_id, limit=limit)
            return make_response(jsonify(data), 200)
        except Exception as e:
            return make_response(jsonify({"erro": str(e)}), 500)
