from src.Infrastructure.Model.seller_model import SellerModel
from src.config.data_base import db
from src.Domain.seller import SellerDomain
import bcrypt

class SellerService:

    @staticmethod
    def create_seller(nome, cnpj, email, senha, celular):
        # Validações de unicidade
        if SellerModel.query.filter_by(email=email).first():
            raise ValueError("Este e-mail já está cadastrado em outra conta.")
        if SellerModel.query.filter_by(cnpj=cnpj).first():
            raise ValueError("Este CNPJ já está cadastrado em outra conta.")
        if SellerModel.query.filter_by(celular=celular).first():
            raise ValueError("Este número de celular já está cadastrado.")

        hashed_password = bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt())
        seller = SellerModel(
            nome=nome,
            cnpj=cnpj,
            email=email,
            senha=hashed_password.decode('utf-8'),
            celular=celular
        )
        db.session.add(seller)
        db.session.commit()
        return seller

    @staticmethod
    def authenticate_seller(email, senha):
        seller = SellerModel.query.filter_by(email=email).first()
        if seller and bcrypt.checkpw(senha.encode('utf-8'), seller.senha.encode('utf-8')):
            return seller
        return None

    @staticmethod
    def get_by_cell(celular):
        """Busca um seller pelo número de celular"""
        seller = SellerModel.query.filter_by(celular=celular).first()
        return seller

    @staticmethod
    def get_by_id(seller_id):
        """Busca um seller pelo ID"""
        return SellerModel.query.get(int(seller_id))

    @staticmethod
    def update_seller(seller_id, data):
        try:
            seller_id = int(seller_id)
            seller = SellerModel.query.get(seller_id)

            if not seller:
                return None

            # Atualizar apenas campos permitidos
            if 'nome' in data:
                seller.nome = data['nome']
            if 'email' in data:
                # Verificar se email já existe para outro seller
                existing_seller = SellerModel.query.filter_by(email=data['email']).first()
                if existing_seller and existing_seller.id != seller_id:
                    raise ValueError("Email já está em uso por outro seller")
                seller.email = data['email']
            if 'celular' in data:
                # Verificar se celular já existe para outro seller
                existing_seller = SellerModel.query.filter_by(celular=data['celular']).first()
                if existing_seller and existing_seller.id != seller_id:
                    raise ValueError("Celular já está em uso por outro seller")
                seller.celular = data['celular']
            if 'cnpj' in data:
                # Verificar se CNPJ já existe para outro seller
                existing_seller = SellerModel.query.filter_by(cnpj=data['cnpj']).first()
                if existing_seller and existing_seller.id != seller_id:
                    raise ValueError("CNPJ já está em uso por outro seller")
                seller.cnpj = data['cnpj']
            if 'senha' in data and data['senha']:
                hashed_password = bcrypt.hashpw(data['senha'].encode('utf-8'), bcrypt.gensalt())
                seller.senha = hashed_password.decode('utf-8')

            db.session.commit()
            return seller

        except ValueError as e:
            db.session.rollback()
            raise e
        except Exception as e:
            db.session.rollback()
            print(f"Erro ao atualizar seller: {str(e)}")
            return None