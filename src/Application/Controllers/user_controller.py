from flask import request, jsonify, make_response
from flask_jwt_extended import create_access_token, jwt_required
from src.Application.Service.user_service import UserService
from src.Application.Service.auth_guard import get_current_user, require_nivel


class UserController:

    @staticmethod
    @require_nivel("admin")
    def create_user():
        """Cria um novo funcionário. Apenas admin (dono do mercado) pode fazer isso."""
        try:
            _, _, seller_id = get_current_user()
            data = request.get_json()

            nome = data.get("nome")
            email = data.get("email")
            senha = data.get("senha")
            nivel = data.get("nivel")

            if not nome or not email or not senha or not nivel:
                return make_response(jsonify({"erro": "Campos obrigatórios: nome, email, senha, nivel"}), 400)

            user = UserService.create_user(nome, email, senha, nivel, seller_id)
            return make_response(jsonify({"mensagem": "Funcionário criado com sucesso!", "user": user.to_dict()}), 201)
        except ValueError as e:
            return make_response(jsonify({"erro": str(e)}), 400)
        except Exception as e:
            print(f"Erro ao criar funcionário: {e}")
            return make_response(jsonify({"erro": "Erro interno", "detalhes": str(e)}), 500)

    @staticmethod
    @require_nivel("admin", "gerente")
    def list_users():
        """Lista todos os funcionários do mercado. Admin e gerente podem ver."""
        _, _, seller_id = get_current_user()
        users = UserService.list_users(seller_id)
        return make_response(jsonify([u.to_dict() for u in users]), 200)

    @staticmethod
    @require_nivel("admin")
    def update_user(user_id):
        """Atualiza dados de um funcionário. Apenas admin."""
        try:
            _, _, seller_id = get_current_user()
            data = request.get_json()
            user = UserService.update_user(user_id, seller_id, data)
            if not user:
                return make_response(jsonify({"erro": "Funcionário não encontrado"}), 404)
            return make_response(jsonify({"mensagem": "Funcionário atualizado!", "user": user.to_dict()}), 200)
        except ValueError as e:
            return make_response(jsonify({"erro": str(e)}), 400)
        except Exception as e:
            return make_response(jsonify({"erro": "Erro interno", "detalhes": str(e)}), 500)

    @staticmethod
    @require_nivel("admin")
    def toggle_user_status(user_id):
        """Ativa ou desativa um funcionário. Apenas admin."""
        _, _, seller_id = get_current_user()
        user = UserService.toggle_status(user_id, seller_id)
        if not user:
            return make_response(jsonify({"erro": "Funcionário não encontrado"}), 404)
        return make_response(jsonify({"mensagem": f"Funcionário agora está {user.status}.", "user": user.to_dict()}), 200)

    @staticmethod
    def login_user():
        """Login do funcionário. Retorna JWT com nivel e seller_id."""
        try:
            data = request.get_json()
            email = data.get("email")
            senha = data.get("senha")

            if not email or not senha:
                return make_response(jsonify({"erro": "Email e senha são obrigatórios"}), 400)

            user = UserService.authenticate(email, senha)
            if not user:
                return make_response(jsonify({"erro": "Email ou senha inválidos"}), 401)
            if user.status != "ativo":
                return make_response(jsonify({"erro": "Funcionário inativo. Contate o administrador."}), 403)

            # Identity no formato "user:<id>" para distinguir do seller
            token = create_access_token(identity=f"user:{user.id}")

            return make_response(jsonify({
                "mensagem": "Login realizado com sucesso",
                "token": token,
                "user": user.to_dict()
            }), 200)
        except Exception as e:
            print(f"Erro no login do funcionário: {e}")
            return make_response(jsonify({"erro": "Erro interno", "detalhes": str(e)}), 500)
