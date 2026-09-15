from src.Infrastructure.Model.product_model import ProductModel
from src.Infrastructure.Model.seller_model import SellerModel
from src.config.data_base import db

class ProductService:

    @staticmethod
    def create(data, seller_id):
        product = ProductModel(
            nome=data["nome"],
            preco=data["preco"],
            quantidade=data["quantidade"],
            status="ativo",
            imagem=data.get("imagem"),
            categoria=data.get("categoria"),
            estoque_minimo=int(data.get("estoque_minimo", 5)),
            seller_id=seller_id
        )
        db.session.add(product)
        db.session.commit()
        return product

    @staticmethod
    def list(seller_id, categoria=None):
        """Lista todos produtos do seller, com filtro opcional de categoria."""
        q = ProductModel.query.filter_by(seller_id=seller_id)
        if categoria:
            q = q.filter_by(categoria=categoria)
        return q.all()

    @staticmethod
    def list_categorias(seller_id):
        """Retorna as categorias únicas usadas pelo seller."""
        rows = (
            db.session.query(ProductModel.categoria)
            .filter(ProductModel.seller_id == seller_id, ProductModel.categoria != None)
            .distinct()
            .all()
        )
        return sorted([r[0] for r in rows if r[0]])

    @staticmethod
    def get(product_id, seller_id):
        return ProductModel.query.filter_by(id=product_id, seller_id=seller_id).first()

    @staticmethod
    def update(product, data):
        product.nome           = data.get("nome", product.nome)
        product.preco          = data.get("preco", product.preco)
        product.quantidade     = data.get("quantidade", product.quantidade)
        product.imagem         = data.get("imagem", product.imagem)
        product.categoria      = data.get("categoria", product.categoria)
        product.estoque_minimo = int(data.get("estoque_minimo", product.estoque_minimo))
        db.session.commit()
        return product

    @staticmethod
    def inactivate(product):
        product.status = "inativo"
        db.session.commit()
        return product

    @staticmethod
    def activate(product):
        product.status = "ativo"
        db.session.commit()
        return product
