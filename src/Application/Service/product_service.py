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
            seller_id=seller_id
        )
        db.session.add(product)
        db.session.commit()
        return product

    @staticmethod
    def list(seller_id):
        """
        Lista todos produtos do seller
        """
        return ProductModel.query.filter_by(seller_id=seller_id).all()

    @staticmethod
    def get(product_id, seller_id):
        """
        Busca um produto pelo ID, garantindo que pertença ao seller
        """
        return ProductModel.query.filter_by(id=product_id, seller_id=seller_id).first()

    @staticmethod
    def update(product, data):
        """
        Atualiza os campos do produto
        """
        product.nome = data.get("nome", product.nome)
        product.preco = data.get("preco", product.preco)
        product.quantidade = data.get("quantidade", product.quantidade)
        product.imagem = data.get("imagem", product.imagem)
        db.session.commit()
        return product

    @staticmethod
    def inactivate(product):
        """
        Marca o produto como inativo
        """
        product.status = "inativo"
        db.session.commit()
        return product

    @staticmethod
    def activate(product):
        """
        Marca o produto como ativo
        """
        product.status = "ativo"
        db.session.commit()
        return product