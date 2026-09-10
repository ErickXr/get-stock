from flask import request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.Application.Service.sale_service import SaleService

class SaleController:

    @staticmethod
    @jwt_required()
    def create():
        try:
            seller_id = get_jwt_identity()
            data = request.get_json()

            product_id = data.get("produtoId")
            quantity = data.get("quantidade")

            if not product_id or not quantity:
                return make_response(jsonify({"erro": "Campos 'produtoId' e 'quantidade' são obrigatórios"}), 400)
            
            if not isinstance(quantity, int) or quantity <= 0:
                return make_response(jsonify({"erro": "'quantidade' deve ser um número inteiro positivo"}), 400)
    
            sale = SaleService.create(product_id, quantity, seller_id)
            return make_response(jsonify({
                "mensagem": "Venda realizada com sucesso!",
                "venda": sale.to_dict()
            }), 201)
        except ValueError as e:
            # Erros de negócio (estoque, produto inativo, etc.) retornam 409 Conflict
            return make_response(jsonify({"erro": str(e)}), 409)
        except Exception as e:
            # Outros erros inesperados retornam 500
            return make_response(jsonify({"erro": "Erro interno ao processar a venda", "detalhes": str(e)}), 500)

    @staticmethod
    @jwt_required()
    def list_sales():
        try:
            seller_id = int(get_jwt_identity())
            sales = SaleService.list_by_seller(seller_id)
            return make_response(jsonify(sales), 200)
        except Exception as e:
            return make_response(jsonify({"erro": str(e)}), 500)