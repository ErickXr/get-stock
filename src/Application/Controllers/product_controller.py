# src/Application/Controllers/product_controller.py
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.Application.Service.product_service import ProductService
from flask_jwt_extended import create_access_token

class ProductController:

    @staticmethod
    @jwt_required()
    def create_product():
        """
        Cria um produto para o seller autenticado.
        Campos obrigatórios: nome, preco, quantidade.
        """
        seller_id = get_jwt_identity()
        try:
            # força a leitura do JSON mesmo que o header esteja errado
            data = request.get_json(force=True)
        except Exception as e:
            return jsonify({"erro": "JSON inválido", "detalhe": str(e)}), 422

        # validação dos campos obrigatórios
        if not data or not data.get("nome") or not data.get("preco") or not data.get("quantidade"):
            return jsonify({"erro": "Campos obrigatórios: nome, preco, quantidade"}), 400

        product = ProductService.create(data, seller_id)
        return jsonify({"mensagem": "Produto criado com sucesso", "id": product.id}), 201

    @staticmethod
    @jwt_required()
    def list_products():
        """
        Lista todos os produtos do seller autenticado.
        """
        seller_id = get_jwt_identity()
        products = ProductService.list(seller_id)
        return jsonify([p.to_dict() for p in products]), 200

    @staticmethod
    @jwt_required()
    def get_product(product_id):
        """
        Retorna detalhes de um produto específico pelo ID.
        """
        seller_id = get_jwt_identity()
        product = ProductService.get(product_id, seller_id)
        if not product:
            return jsonify({"erro": "Produto não encontrado"}), 404

        return jsonify(product.to_dict()), 200

    @staticmethod
    @jwt_required()
    def update_product(product_id):
        """
        Atualiza os dados de um produto existente.
        """
        seller_id = get_jwt_identity()
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
    @jwt_required()
    def inactivate_product(product_id):
        """
        Inativa um produto, impedindo novas vendas.
        """
        seller_id = get_jwt_identity()
        product = ProductService.get(product_id, seller_id)
        if not product:
            return jsonify({"erro": "Produto não encontrado"}), 404

        ProductService.inactivate(product)
        return jsonify({"mensagem": "Produto inativado com sucesso"}), 200

    @staticmethod
    @jwt_required()
    def activate_product(product_id):
        """
        Ativa um produto inativado.
        """
        seller_id = get_jwt_identity()
        product = ProductService.get(product_id, seller_id)
        if not product:
            return jsonify({"erro": "Produto não encontrado"}), 404

        ProductService.activate(product)
        return jsonify({"mensagem": "Produto ativado com sucesso"}), 200