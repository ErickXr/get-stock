from flask import request, jsonify
from src.Application.Service.product_service import ProductService
from src.Application.Service.batch_service import BatchService
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

        if not data or not data.get("nome") or data.get("preco") is None or data.get("quantidade") is None:
            return jsonify({"erro": "Campos obrigatórios: nome, preco, quantidade"}), 400

        try:
            product = ProductService.create(data, seller_id)
            return jsonify({"mensagem": "Produto criado com sucesso", "id": product.id, "produto": product.to_dict()}), 201
        except ValueError as e:
            return jsonify({"erro": str(e)}), 400
        except Exception as e:
            return jsonify({"erro": "Erro ao criar produto", "detalhe": str(e)}), 500

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
    @require_nivel("admin", "gerente", "operador")
    def get_by_barcode(ean):
        _, _, seller_id = get_current_user()
        if not ean:
            return jsonify({"erro": "Código de barras não fornecido"}), 400
        product = ProductService.get_by_barcode(ean, seller_id)
        if not product:
            return jsonify({"erro": f"Nenhum produto ativo encontrado com o código '{ean}'."}), 404
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

        try:
            ProductService.update(product, data)
            return jsonify({"mensagem": "Produto atualizado com sucesso", "produto": product.to_dict()}), 200
        except ValueError as e:
            return jsonify({"erro": str(e)}), 400
        except Exception as e:
            return jsonify({"erro": "Erro ao atualizar produto", "detalhe": str(e)}), 500

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

    # ------------------------------------------------------------------ #
    # REPOSIÇÃO DE ESTOQUE
    # ------------------------------------------------------------------ #
    @staticmethod
    @require_nivel("admin", "gerente")
    def restock_product(product_id):
        _, _, seller_id = get_current_user()
        try:
            data = request.get_json(force=True)
        except Exception as e:
            return jsonify({"erro": "JSON inválido", "detalhe": str(e)}), 422

        quantity = data.get("quantity") or data.get("quantidade")
        if not quantity:
            return jsonify({"erro": "Informe a quantidade a repor."}), 400

        try:
            quantity = int(quantity)
        except (ValueError, TypeError):
            return jsonify({"erro": "A quantidade deve ser um número inteiro."}), 400

        expiry_date = data.get("expiry_date")
        batch_code  = data.get("batch_code")

        try:
            result = ProductService.restock(product_id, seller_id, quantity, expiry_date, batch_code)
            if hasattr(result, "quantity"):
                # resultado é um lote
                return jsonify({"mensagem": "Lote adicionado/atualizado com sucesso.", "lote": result.to_dict()}), 200
            else:
                # resultado é o produto
                return jsonify({"mensagem": "Estoque reposto com sucesso.", "produto": result.to_dict()}), 200
        except ValueError as e:
            return jsonify({"erro": str(e)}), 400
        except Exception as e:
            return jsonify({"erro": "Erro ao repor estoque.", "detalhe": str(e)}), 500

    # ------------------------------------------------------------------ #
    # ALERTAS DE VENCIMENTO
    # ------------------------------------------------------------------ #
    @staticmethod
    @require_nivel("admin", "gerente", "operador")
    def get_expiring_alerts():
        _, _, seller_id = get_current_user()
        try:
            days = int(request.args.get("days", 7))
        except (ValueError, TypeError):
            days = 7
        
        try:
            alerts = BatchService.get_expiring_alerts(seller_id, days_ahead=days)
            count  = BatchService.get_expiring_count(seller_id, days_ahead=days)
            return jsonify({"alertas": alerts, "total_produtos": count}), 200
        except Exception as e:
            return jsonify({"erro": "Erro ao buscar alertas de validade.", "detalhe": str(e)}), 500

    # ------------------------------------------------------------------ #
    # LOTES DE UM PRODUTO
    # ------------------------------------------------------------------ #
    @staticmethod
    @require_nivel("admin", "gerente", "operador")
    def get_product_batches(product_id):
        _, _, seller_id = get_current_user()
        product = ProductService.get(product_id, seller_id)
        if not product:
            return jsonify({"erro": "Produto não encontrado"}), 404
        if not product.controla_validade:
            return jsonify({"lotes": [], "produto": product.to_dict()}), 200
        
        batches = BatchService.get_product_batches(product_id, seller_id)
        return jsonify({
            "lotes": [b.to_dict() for b in batches],
            "produto": product.to_dict()
        }), 200

    # ------------------------------------------------------------------ #
    # BAIXA POR PERDA / VENCIMENTO
    # ------------------------------------------------------------------ #
    @staticmethod
    @require_nivel("admin", "gerente")
    def write_off_batch(batch_id):
        _, _, seller_id = get_current_user()
        try:
            data = request.get_json(force=True)
        except Exception as e:
            return jsonify({"erro": "JSON inválido", "detalhe": str(e)}), 422

        quantity = data.get("quantity") or data.get("quantidade")
        reason   = data.get("reason") or data.get("motivo")

        if not quantity or not reason:
            return jsonify({"erro": "Informe a quantidade e o motivo da baixa."}), 400

        try:
            quantity = int(quantity)
        except (ValueError, TypeError):
            return jsonify({"erro": "A quantidade deve ser um número inteiro."}), 400

        try:
            batch = BatchService.write_off_batch(batch_id, seller_id, quantity, reason)
            return jsonify({"mensagem": "Baixa registrada com sucesso.", "lote": batch.to_dict()}), 200
        except ValueError as e:
            return jsonify({"erro": str(e)}), 400
        except Exception as e:
            return jsonify({"erro": "Erro ao registrar baixa.", "detalhe": str(e)}), 500
