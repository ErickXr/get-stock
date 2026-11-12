from flask import request, jsonify, make_response
from src.Application.Service.customer_service import CustomerService
from src.Application.Service.auth_guard import get_current_user, require_nivel
from src.Infrastructure.Model.user_model import UserModel

class CustomerController:

    @staticmethod
    @require_nivel("admin", "gerente")
    def create_customer():
        try:
            _, _, seller_id = get_current_user()
            data = request.get_json(force=True)
            customer = CustomerService.create_customer(data, seller_id)
            return make_response(jsonify({
                "mensagem": "Cliente cadastrado com sucesso!",
                "customer": CustomerService.get_customer_summary(customer)
            }), 201)
        except ValueError as e:
            return make_response(jsonify({"erro": str(e)}), 400)
        except Exception as e:
            return make_response(jsonify({"erro": "Erro ao cadastrar cliente", "detalhes": str(e)}), 500)

    @staticmethod
    @require_nivel("admin", "gerente", "operador")
    def list_customers():
        try:
            _, _, seller_id = get_current_user()
            search = request.args.get("search")
            active_only = request.args.get("active_only", "false").lower() == "true"
            customers = CustomerService.list_customers(seller_id, search=search, active_only=active_only)
            return make_response(jsonify(customers), 200)
        except Exception as e:
            return make_response(jsonify({"erro": str(e)}), 500)

    @staticmethod
    @require_nivel("admin", "gerente", "operador")
    def get_customer(customer_id):
        try:
            _, _, seller_id = get_current_user()
            customer = CustomerService.get_customer(customer_id, seller_id)
            if not customer:
                return make_response(jsonify({"erro": "Cliente não encontrado"}), 404)
            return make_response(jsonify(CustomerService.get_customer_summary(customer)), 200)
        except Exception as e:
            return make_response(jsonify({"erro": str(e)}), 500)

    @staticmethod
    @require_nivel("admin", "gerente")
    def update_customer(customer_id):
        try:
            _, _, seller_id = get_current_user()
            data = request.get_json(force=True)
            updated = CustomerService.update_customer(customer_id, seller_id, data)
            return make_response(jsonify({
                "mensagem": "Cliente atualizado com sucesso!",
                "customer": updated
            }), 200)
        except ValueError as e:
            return make_response(jsonify({"erro": str(e)}), 400)
        except Exception as e:
            return make_response(jsonify({"erro": str(e)}), 500)

    @staticmethod
    @require_nivel("admin", "gerente")
    def toggle_status(customer_id):
        try:
            _, _, seller_id = get_current_user()
            toggled = CustomerService.toggle_status(customer_id, seller_id)
            return make_response(jsonify({
                "mensagem": f"Cliente {'ativado' if toggled['active'] else 'inativado'} com sucesso!",
                "customer": toggled
            }), 200)
        except ValueError as e:
            return make_response(jsonify({"erro": str(e)}), 400)
        except Exception as e:
            return make_response(jsonify({"erro": str(e)}), 500)

    @staticmethod
    @require_nivel("admin", "gerente", "operador")
    def get_statement(customer_id):
        try:
            _, _, seller_id = get_current_user()
            statement = CustomerService.get_statement(customer_id, seller_id)
            return make_response(jsonify(statement), 200)
        except ValueError as e:
            return make_response(jsonify({"erro": str(e)}), 404)
        except Exception as e:
            return make_response(jsonify({"erro": str(e)}), 500)

    @staticmethod
    @require_nivel("admin", "gerente", "operador")
    def receive_payment(customer_id):
        try:
            entidade, nivel, seller_id = get_current_user()
            data = request.get_json(force=True)

            amount = float(data.get("amount") or data.get("valor") or 0.0)
            payment_method = data.get("payment_method") or data.get("forma_pagamento") or "dinheiro"
            note = data.get("note") or data.get("observacao")

            received_by = "Dono (Admin)"
            if isinstance(entidade, UserModel):
                received_by = f"{entidade.nome} ({nivel.capitalize()})"
            elif hasattr(entidade, "nome"):
                received_by = f"{entidade.nome} (Admin)"

            result = CustomerService.receive_payment(
                customer_id=customer_id,
                seller_id=seller_id,
                amount_val=amount,
                payment_method=payment_method,
                received_by=received_by,
                note=note
            )
            return make_response(jsonify({
                "mensagem": "Pagamento registrado com sucesso e saldo devedor abatido!",
                "result": result
            }), 201)
        except ValueError as e:
            return make_response(jsonify({"erro": str(e)}), 400)
        except Exception as e:
            return make_response(jsonify({"erro": str(e)}), 500)

    @staticmethod
    @require_nivel("admin", "gerente", "operador")
    def get_fiado_overview():
        try:
            _, _, seller_id = get_current_user()
            overview = CustomerService.get_fiado_overview(seller_id)
            return make_response(jsonify(overview), 200)
        except Exception as e:
            return make_response(jsonify({"erro": str(e)}), 500)
