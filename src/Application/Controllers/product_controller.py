# src/Application/Controllers/product_controller.py
from flask import request, jsonify
from src.Application.Service.product_service import ProductService
from src.Application.Service.auth_guard import get_current_user, require_nivel


class ProductController:

    @staticmethod
    @require_nivel("admin", "gerente")
    def create_product():
        _, _, seller_id = get_current_user()
        try:
            data = request.get_json(force=True)
        except Exception as e:
            return jsonify({"erro": "JSON inválido", "detalhe": str(e)}), 422

        if not data or not data.get("nome") or not data.get("preco") or not data.get("quantidade"):
            return jsonify({"erro": "Campos obrigatórios: nome, preco, quantidade"}), 400

        product = ProductService.create(data, seller_id)
        return jsonify({"mensagem": "Produto criado com sucesso", "id": product.id}), 201

    @staticmethod
    @require_nivel("admin", "gerente", "operador")
    def list_products():
        _, _, seller_id = get_current_user()
        categoria = request.args.get("categoria")
        products = ProductService.list(seller_id, categoria=categoria)
        return jsonify([p.to_dict() for p in products]), 200

    @staticmethod
    @require_nivel("admin", "gerente", "operador")
    def list_categorias():
        _, _, seller_id = get_current_user()
        cats = ProductService.list_categorias(seller_id)
        return jsonify(cats), 200

    @staticmethod
    @require_nivel("admin", "gerente", "operador")
    def get_product(product_id):
        _, _, seller_id = get_current_user()
        product = ProductService.get(product_id, seller_id)
        if not product:
            return jsonify({"erro": "Produto não encontrado"}), 404
        return jsonify(product.to_dict()), 200

    @staticmethod
    @require_nivel("admin", "gerente")
    def update_product(product_id):
        _, _, seller_id = get_current_user()
        try:
            data = request.get_json(force=True)
        except Exception as e:
            return jsonify({"erro": "JSON inválido", "detalhe": str(e)}), 422

        product = ProductService.get(product_id, seller_id)
        if not product:
            return jsonify({"erro": "Produto não encontrado"}), 404

        ProductService.update(product, data)
        return jsonify({"mensagem": "Produto atualizado com sucesso", "produto": product.to_dict()}), 200

    @staticmethod
    @require_nivel("admin", "gerente")
    def inactivate_product(product_id):
        _, _, seller_id = get_current_user()
        product = ProductService.get(product_id, seller_id)
        if not product:
            return jsonify({"erro": "Produto não encontrado"}), 404
        ProductService.inactivate(product)
        return jsonify({"mensagem": "Produto inativado com sucesso"}), 200

    @staticmethod
    @require_nivel("admin", "gerente")
    def activate_product(product_id):
        _, _, seller_id = get_current_user()
        product = ProductService.get(product_id, seller_id)
        if not product:
            return jsonify({"erro": "Produto não encontrado"}), 404
        ProductService.activate(product)
        return jsonify({"mensagem": "Produto ativado com sucesso"}), 200
