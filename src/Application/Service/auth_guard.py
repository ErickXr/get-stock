from functools import wraps
from flask import jsonify, make_response
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from src.Infrastructure.Model.user_model import UserModel
from src.Infrastructure.Model.seller_model import SellerModel


def get_current_user():
    """
    Retorna o usuário logado (seller ou funcionário) e seu nível.
    Retorna: (entidade, nivel, seller_id)
    """
    identity = get_jwt_identity()
    # Identidade no formato "seller:<id>" ou "user:<id>"
    tipo, uid = identity.split(":")
    uid = int(uid)

    if tipo == "seller":
        seller = SellerModel.query.get(uid)
        return seller, "admin", seller.id if seller else (None, None, None)
    elif tipo == "user":
        user = UserModel.query.get(uid)
        return user, user.nivel if user else None, user.seller_id if user else None
    return None, None, None


def require_nivel(*niveis_permitidos):
    """
    Decorator que protege um endpoint exigindo um nível mínimo de acesso.
    Uso: @require_nivel("admin") ou @require_nivel("admin", "gerente")
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            _, nivel, _ = get_current_user()
            if nivel not in niveis_permitidos:
                return make_response(
                    jsonify({"erro": f"Acesso negado. Nível necessário: {', '.join(niveis_permitidos)}"}),
                    403
                )
            return fn(*args, **kwargs)
        return wrapper
    return decorator
