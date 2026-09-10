from flask import request, jsonify, make_response
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from src.Application.Service.seller_service import SellerService
from src.Infrastructure.Model.seller_model import SellerModel
from src.Infrastructure.http.whats_app import enviar_codigo_whatsapp
from src.config.data_base import db
import random


class SellerController:

    @staticmethod
    def register_seller():
        try:
            data = request.get_json()

            name = data.get('nome')
            cnpj = data.get('cnpj')
            email = data.get('email')
            password = data.get('senha')
            cell = data.get('celular')

            
            if not name or not cnpj or not email or not password or not cell:
                return make_response(jsonify({"erro": "Campos obrigatórios"}), 400)

            seller = SellerService.create_seller(name, cnpj, email, password, cell)


            codigo = str(random.randint(1000, 9999))
            seller.codigo_ativacao = codigo

     
            db.session.commit()


            enviar_codigo_whatsapp(cell, codigo)

            return make_response(jsonify({
                "mensagem": "Seller salvo com sucesso! Código enviado via WhatsApp.",
                "seller": seller.to_dict()
            }), 200)
        except ValueError as e:
            return make_response(jsonify({"erro": str(e)}), 400)
        except Exception as e:
            print(f"Erro no cadastro de seller: {str(e)}")
            return make_response(jsonify({"erro": "Erro interno", "detalhes": str(e)}), 500)

    @staticmethod
    def activate_seller():
        try:
            data = request.get_json()
            if not data:
                return make_response(jsonify({"erro": "Corpo da requisição não pode ser vazio"}), 400)
        except Exception:
            return make_response(jsonify({"erro": "JSON inválido"}), 400)

        celular = data.get("celular")
        codigo = data.get("codigo")

        if not celular or not codigo:
            return make_response(jsonify({"erro": "Campos 'celular' e 'codigo' são obrigatórios"}), 400)

        seller = SellerService.get_by_cell(celular)

        if not seller:
            return make_response(jsonify({"erro": "Seller não encontrado"}), 404)

        if seller.codigo_ativacao != codigo:
            return make_response(jsonify({"erro": "Código inválido"}), 400)

        seller.status = "ativo"

        db.session.commit()

        return make_response(jsonify({
            "mensagem": "Seller ativado com sucesso!"
        }), 200)

    @staticmethod
    def resend_code():
        try:
            data = request.get_json()
            if not data:
                return make_response(jsonify({"erro": "Corpo da requisição não pode ser vazio"}), 400)
            
            celular = data.get("celular")
            if not celular:
                return make_response(jsonify({"erro": "O campo 'celular' é obrigatório"}), 400)

            seller = SellerService.get_by_cell(celular)
            if not seller:
                return make_response(jsonify({"erro": "Seller não encontrado"}), 404)
            
            if seller.status == "ativo":
                return make_response(jsonify({"erro": "Seller já está ativo"}), 400)

            codigo = str(random.randint(1000, 9999))
            seller.codigo_ativacao = codigo
            db.session.commit()

            enviar_codigo_whatsapp(celular, codigo)

            return make_response(jsonify({"mensagem": "Novo código enviado com sucesso via WhatsApp!"}), 200)
        except Exception as e:
            print(f"Erro ao reenviar código: {str(e)}")
            return make_response(jsonify({"erro": "Erro interno", "detalhes": str(e)}), 500)

    @staticmethod
    def login_seller():
        data = request.get_json()

        email = data.get("email")
        senha = data.get("senha")

        if not email or not senha:
            return make_response(jsonify({"erro": "Email e senha são obrigatórios"}), 400)

        seller = SellerService.authenticate_seller(email, senha)

        if not seller:
            return make_response(jsonify({"erro": "Email ou senha inválidos"}), 401)

        if seller.status != "ativo":
            return make_response(jsonify({"erro": "Seller ainda não ativado"}), 403)

        token = create_access_token(identity=str(seller.id))

        return make_response(jsonify({
            "mensagem": "Login realizado com sucesso",
            "token": token,
            "seller": seller.to_dict()
        }), 200)
   
    @staticmethod
    @jwt_required()
    def update_seller():
        try:
            current_id = get_jwt_identity()
            data = request.get_json()

            if not data:
                return make_response(jsonify({"erro": "Corpo da requisição não pode ser vazio"}), 400)

            # Validar campos permitidos
            campos_permitidos = ['nome', 'email', 'celular', 'cnpj', 'senha']
            for campo in data.keys():
                if campo not in campos_permitidos:
                    return make_response(jsonify({"erro": f"Campo '{campo}' não é permitido"}), 400)

            update_seller = SellerService.update_seller(current_id, data)
            if not update_seller:
                return make_response(jsonify({"erro": "Seller não encontrado"}), 404)

            return make_response(jsonify({
                "mensagem": "perfil atualizado!",
                "seller": update_seller.to_dict()
            }), 200)

        except ValueError as e:
            return make_response(jsonify({"erro": str(e)}), 400)
        except Exception as e:
            print(f"Erro no update: {str(e)}")
            return make_response(jsonify({"erro": "Erro interno", "detalhes": str(e)}), 500)

    @staticmethod
    @jwt_required()
    def get_me():
        try:
            current_id = get_jwt_identity()
            seller = SellerService.get_by_id(current_id)
            if not seller:
                return make_response(jsonify({"erro": "Seller não encontrado"}), 404)
            return make_response(jsonify(seller.to_dict()), 200)
        except Exception as e:
            return make_response(jsonify({"erro": "Erro interno", "detalhes": str(e)}), 500)