from src.Infrastructure.Model.sale_model import SaleModel
from src.Infrastructure.Model.sale_item_model import SaleItemModel
from src.Infrastructure.Model.sale_item_batch_model import SaleItemBatchModel
from src.Infrastructure.Model.product_model import ProductModel
from src.Infrastructure.Model.seller_model import SellerModel
from src.Infrastructure.Model.customer_model import CustomerModel
from src.config.data_base import db
from datetime import datetime
from decimal import Decimal

class SaleService:

    @staticmethod
    def create_cart_sale(items_data: list, seller_id: int, forma_pagamento: str = "dinheiro", desconto: float = 0.0, user_id: int = None, usuario_nome: str = None, customer_id: int = None):
        """
        Registra uma venda com múltiplos itens (carrinho).
        Operação atômica protegida com with_for_update() nos produtos e no cliente (se fiado).
        Recalcula todos os preços no servidor.
        Para produtos com controla_validade=True, usa FEFO (BatchService.consume_fefo).
        """
        if not items_data or len(items_data) == 0:
            raise ValueError("O carrinho de compras não pode estar vazio.")

        forma_pagamento_clean = str(forma_pagamento or "dinheiro").strip().lower()

        try:
            seller_id_int = int(seller_id)
            seller = SellerModel.query.get(seller_id_int)
            if not seller or seller.status != "ativo":
                raise ValueError("Vendedor inativo ou não encontrado.")

            # Validação e bloqueio do Cliente se for Fiado
            customer = None
            if forma_pagamento_clean == "fiado":
                if not customer_id:
                    raise ValueError("Para vendas no Fiado, é obrigatório selecionar um cliente.")
                
                # Bloqueio pessimista na linha do cliente
                customer = CustomerModel.query.filter_by(
                    id=int(customer_id),
                    seller_id=seller_id_int
                ).with_for_update().first()

                if not customer:
                    raise ValueError("Cliente selecionado não foi encontrado.")
                if not customer.active:
                    raise ValueError(f"O cliente '{customer.name}' está inativo e não pode comprar no fiado.")

            # Normalização e consolidação de itens duplicados no payload
            consolidated = {}
            for item in items_data:
                pid = item.get("product_id") or item.get("produtoId")
                qty = item.get("quantity") or item.get("quantidade")
                if not pid:
                    raise ValueError("Item inválido no carrinho: 'product_id' ausente.")
                if not qty or not isinstance(qty, int) or qty <= 0:
                    raise ValueError("A quantidade de cada item deve ser um número inteiro positivo.")
                consolidated[pid] = consolidated.get(pid, 0) + qty

            sale_items = []
            total_bruto = Decimal("0.00")

            # Ordenar por product_id para evitar deadlocks na concorrência
            sorted_product_ids = sorted(consolidated.keys())

            # Importação lazy para evitar dependência circular
            from src.Application.Service.batch_service import BatchService

            for pid in sorted_product_ids:
                qty = consolidated[pid]
                
                # Bloqueio pessimista para garantir consistência de estoque
                product = ProductModel.query.filter_by(
                    id=pid,
                    seller_id=seller_id_int
                ).with_for_update().first()

                if not product:
                    raise ValueError(f"Produto #{pid} não encontrado ou não pertence a este estabelecimento.")
                
                if product.status != "ativo":
                    raise ValueError(f"O produto '{product.nome}' está inativo e não pode ser vendido.")

                if product.quantidade < qty:
                    raise ValueError(
                        f"Estoque insuficiente para '{product.nome}'. Disponível: {product.quantidade}, solicitado: {qty}."
                    )

                unit_price = Decimal(str(product.preco))
                subtotal = unit_price * Decimal(qty)
                total_bruto += subtotal

                sale_item = SaleItemModel(
                    product_id=product.id,
                    product_name=product.nome,
                    unit_price=unit_price,
                    quantity=qty,
                    subtotal=subtotal
                )

                if product.controla_validade:
                    # FEFO: consome dos lotes — BatchService.consume_fefo atualiza product.quantidade
                    consumed = BatchService.consume_fefo(product, qty, seller_id_int)
                    # Registra quais lotes foram consumidos (para estorno no cancelamento)
                    for c in consumed:
                        sale_item.batch_consumptions.append(SaleItemBatchModel(
                            batch_id=c["batch_id"],
                            quantity=c["quantity_consumed"]
                        ))
                else:
                    # Produto sem controle de validade: baixa direta do estoque
                    product.quantidade -= qty

                sale_items.append(sale_item)

            # Cálculo de desconto e total líquido
            desconto_val = Decimal(str(max(0.0, float(desconto or 0.0))))
            if desconto_val > total_bruto:
                desconto_val = total_bruto
            total_liquido = total_bruto - desconto_val

            # Validação do limite de crédito do Fiado
            if forma_pagamento_clean == "fiado" and customer:
                from src.Application.Service.customer_service import CustomerService
                saldo_atual = CustomerService.calculate_debt(customer.id, seller_id_int)
                limite = Decimal(str(customer.credit_limit or Decimal('0.00')))
                
                if saldo_atual + total_liquido > limite:
                    disponivel = max(Decimal('0.00'), limite - saldo_atual)
                    raise ValueError(
                        f"Limite de crédito excedido para '{customer.name}'. Limite Total: R$ {limite:.2f}, Saldo Devedor Atual: R$ {saldo_atual:.2f}, Disponível: R$ {disponivel:.2f}, Total da Venda: R$ {total_liquido:.2f}."
                    )

            sale = SaleModel(
                seller_id=seller_id_int,
                total_bruto=total_bruto,
                desconto=desconto_val,
                total_liquido=total_liquido,
                forma_pagamento=forma_pagamento_clean,
                status="ativa",
                user_id=user_id,
                usuario_nome=usuario_nome or "Dono (Admin)",
                customer_id=customer.id if customer else None,
                items=sale_items
            )

            db.session.add(sale)
            db.session.commit()
            return sale

        except Exception:
            db.session.rollback()
            raise

    @staticmethod
    def cancel(sale_id: int, seller_id: int, motivo: str = ""):
        """
        Cancela uma venda estornando todos os itens de volta ao estoque.
        Para produtos com controla_validade, estorna usando rastreio de lotes (SaleItemBatch).
        Se foi venda no fiado, o cancelamento reduz automaticamente o saldo devedor do cliente.
        """
        if not motivo or not str(motivo).strip():
            raise ValueError("O motivo do cancelamento é obrigatório.")

        try:
            sale = SaleModel.query.filter_by(
                id=sale_id,
                seller_id=int(seller_id)
            ).with_for_update().first()

            if not sale:
                raise ValueError("Venda não encontrada.")
            if sale.status == "cancelada":
                raise ValueError("Esta venda já se encontra cancelada.")

            from src.Application.Service.batch_service import BatchService

            # Restaura estoque de cada item
            if sale.items:
                sorted_items = sorted(sale.items, key=lambda x: x.product_id)
                for item in sorted_items:
                    prod = ProductModel.query.filter_by(
                        id=item.product_id,
                        seller_id=sale.seller_id
                    ).with_for_update().first()

                    if prod and prod.controla_validade and item.batch_consumptions:
                        # Estorno FEFO por rastreio de lotes
                        BatchService.restore_batches(item.id, sale.seller_id)
                    elif prod:
                        # Estorno direto de quantidade (sem controle de validade)
                        prod.quantidade += item.quantity

            elif sale.product_id and sale.quantidade:
                # Venda legada (antes da Fase 1)
                prod = ProductModel.query.filter_by(
                    id=sale.product_id,
                    seller_id=sale.seller_id
                ).with_for_update().first()
                if prod:
                    prod.quantidade += sale.quantidade

            sale.status = "cancelada"
            sale.motivo_cancelamento = str(motivo).strip()
            db.session.commit()
            return sale

        except Exception:
            db.session.rollback()
            raise

    @staticmethod
    def list_by_seller(seller_id: int, inicio=None, fim=None, forma=None, customer_id: int = None):
        q = SaleModel.query.filter_by(seller_id=int(seller_id))
        if inicio:
            q = q.filter(SaleModel.created_at >= inicio)
        if fim:
            q = q.filter(SaleModel.created_at <= fim)
        if forma:
            q = q.filter_by(forma_pagamento=forma)
        if customer_id:
            q = q.filter_by(customer_id=int(customer_id))
        sales = q.order_by(SaleModel.created_at.desc()).all()
        return [s.to_dict() for s in sales]
