from src.Infrastructure.Model.product_model import ProductModel
from src.Infrastructure.Model.seller_model import SellerModel
from src.config.data_base import db
from decimal import Decimal

class ProductService:

    @staticmethod
    def _sanitize_barcode(barcode):
        if not barcode:
            return None
        barcode_clean = str(barcode).strip()
        return barcode_clean if barcode_clean else None

    @staticmethod
    def create(data, seller_id):
        barcode = ProductService._sanitize_barcode(data.get("barcode"))
        if barcode:
            existing = ProductModel.query.filter_by(seller_id=seller_id, barcode=barcode).first()
            if existing:
                raise ValueError(f"Já existe um produto com o código de barras '{barcode}' cadastrado neste mercado.")

        preco_dec = Decimal(str(data["preco"]))
        controla_validade = bool(data.get("controla_validade", False))

        product = ProductModel(
            nome=data["nome"].strip(),
            preco=preco_dec,
            quantidade=int(data["quantidade"]),
            status="ativo",
            imagem=data.get("imagem"),
            categoria=data.get("categoria"),
            estoque_minimo=int(data.get("estoque_minimo", 5)),
            barcode=barcode,
            controla_validade=controla_validade,
            seller_id=seller_id
        )
        db.session.add(product)
        db.session.commit()
        return product

    @staticmethod
    def list(seller_id, categoria=None):
        q = ProductModel.query.filter_by(seller_id=seller_id)
        if categoria:
            q = q.filter_by(categoria=categoria)
        return q.order_by(ProductModel.nome.asc()).all()

    @staticmethod
    def list_categorias(seller_id):
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
    def get_by_barcode(barcode, seller_id):
        barcode_clean = ProductService._sanitize_barcode(barcode)
        if not barcode_clean:
            return None
        return ProductModel.query.filter_by(barcode=barcode_clean, seller_id=seller_id, status="ativo").first()

    @staticmethod
    def update(product, data):
        if "barcode" in data:
            barcode = ProductService._sanitize_barcode(data.get("barcode"))
            if barcode and barcode != product.barcode:
                existing = ProductModel.query.filter_by(seller_id=product.seller_id, barcode=barcode).first()
                if existing and existing.id != product.id:
                    raise ValueError(f"O código de barras '{barcode}' já pertence ao produto '{existing.nome}'.")
            product.barcode = barcode

        if "preco" in data and data["preco"] is not None:
            product.preco = Decimal(str(data["preco"]))

        product.nome           = data.get("nome", product.nome).strip()
        product.quantidade     = int(data.get("quantidade", product.quantidade))
        product.imagem         = data.get("imagem", product.imagem)
        product.categoria      = data.get("categoria", product.categoria)
        product.estoque_minimo = int(data.get("estoque_minimo", product.estoque_minimo))

        if "controla_validade" in data:
            product.controla_validade = bool(data["controla_validade"])

        db.session.commit()
        return product

    @staticmethod
    def restock(product_id: int, seller_id: int, quantity: int,
                expiry_date_str: str = None, batch_code: str = None):
        """
        Repõe estoque de um produto.
        - Se controla_validade=True: obrigatório informar expiry_date_str (data de validade),
          cria/incrementa lote via BatchService.
        - Se controla_validade=False: incrementa product.quantidade diretamente.
        """
        product = ProductModel.query.filter_by(
            id=product_id, seller_id=seller_id
        ).with_for_update().first()

        if not product:
            raise ValueError("Produto não encontrado.")

        if quantity <= 0:
            raise ValueError("A quantidade de reposição deve ser maior que zero.")

        try:
            if product.controla_validade:
                if not expiry_date_str:
                    raise ValueError(
                        "Este produto possui controle de validade. Informe a data de validade do lote."
                    )
                from src.Application.Service.batch_service import BatchService
                # BatchService já atualiza product.quantidade e faz commit
                return BatchService.add_or_update_batch(
                    product_id=product_id,
                    seller_id=seller_id,
                    expiry_date_str=expiry_date_str,
                    quantity=quantity,
                    batch_code=batch_code
                )
            else:
                product.quantidade += quantity
                db.session.commit()
                return product

        except Exception:
            db.session.rollback()
            raise

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
