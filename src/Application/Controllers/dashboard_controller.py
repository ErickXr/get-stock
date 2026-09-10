from flask import jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.Application.Service.dashboard_service import DashboardService

class DashboardController:
    @staticmethod
    @jwt_required()
    def get_indicators():
        try:
            seller_id = int(get_jwt_identity())
            indicators = DashboardService.get_seller_indicators(seller_id)
            return make_response(jsonify(indicators), 200)
        except Exception as e:
            return make_response(jsonify({"erro": str(e)}), 500)
