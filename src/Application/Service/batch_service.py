from src.Infrastructure.Model.product_batch_model import ProductBatchModel
from src.Infrastructure.Model.sale_item_batch_model import SaleItemBatchModel
from src.Infrastructure.Model.product_model import ProductModel
from src.config.data_base import db
from sqlalchemy import func
from datetime import date, timedelta


class BatchService:

    # ------------------------------------------------------------------ #
    # REPOSIÇÃO: adiciona lote (ou incrementa lote existente na mesma data)
    # ------------------------------------------------------------------ #
    @staticmethod
    def add_or_update_batch(product_id: int, seller_id: int, expiry_date_str: str,
                             quantity: int, batch_code: str = None):
        """
        Repõe estoque de produto com controle de validade.
        Se já existe lote com mesma data de validade (e mesmo batch_code, se fornecido),
        incrementa a quantidade. Caso contrário, cria novo lote.
        Sempre atualiza product.quantidade para manter a invariante.
        """
        from datetime import date as _date
        try:
            expiry_date = _date.fromisoformat(expiry_date_str)
        except (ValueError, TypeError):
            raise ValueError(f"Data de validade inválida: '{expiry_date_str}'. Use o formato AAAA-MM-DD.")

        if quantity <= 0:
            raise ValueError("A quantidade de reposição deve ser maior que zero.")

        try:
            # Tenta encontrar lote existente com mesma data de validade
            query = ProductBatchModel.query.filter_by(
                product_id=product_id,
                seller_id=seller_id,
                expiry_date=expiry_date
            )
            if batch_code:
                batch_code_clean = batch_code.strip() or None
                query = query.filter_by(batch_code=batch_code_clean)
            else:
                batch_code_clean = None

            existing = query.with_for_update().first()

            if existing:
                existing.quantity += quantity
                batch = existing
            else:
                batch = ProductBatchModel(
                    product_id=product_id,
                    seller_id=seller_id,
                    batch_code=batch_code_clean,
                    expiry_date=expiry_date,
                    quantity=quantity,
                )
                db.session.add(batch)

            # Mantém invariante: product.quantidade = sum(batches.quantity)
            product = ProductModel.query.filter_by(
                id=product_id, seller_id=seller_id
            ).with_for_update().first()
            if product:
                product.quantidade += quantity

            db.session.commit()
            return batch

        except Exception:
            db.session.rollback()
            raise

    # ------------------------------------------------------------------ #
    # FEFO: consuma lotes em ordem de validade (mais perto de vencer = primeiro)
    # ------------------------------------------------------------------ #
    @staticmethod
    def consume_fefo(product, quantity_needed: int, seller_id: int):
        """
        Consome estoque seguindo FEFO (First Expired, First Out).
        NUNCA consome de lotes vencidos (expiry_date < hoje).
        
        Retorna lista de dicts: [{'batch_id': int, 'quantity_consumed': int}]
        NÃO faz commit — o chamador é responsável pelo commit/rollback.
        Lança ValueError se estoque válido (não vencido) for insuficiente.
        """
        today = date.today()

        # Bloqueia apenas lotes não vencidos com estoque
        batches = ProductBatchModel.query.filter(
            ProductBatchModel.product_id == product.id,
            ProductBatchModel.seller_id == seller_id,
            ProductBatchModel.expiry_date >= today,
            ProductBatchModel.quantity > 0
        ).order_by(ProductBatchModel.expiry_date.asc()).with_for_update().all()

        total_available = sum(b.quantity for b in batches)
        if total_available < quantity_needed:
            raise ValueError(
                f"Estoque válido insuficiente para '{product.nome}'. "
                f"Disponível (não vencido): {total_available}, solicitado: {quantity_needed}."
            )

        consumed = []
        remaining = quantity_needed

        for batch in batches:
            if remaining <= 0:
                break
            take = min(batch.quantity, remaining)
            batch.quantity -= take
            remaining -= take
            consumed.append({"batch_id": batch.id, "quantity_consumed": take})

        # Atualiza o total do produto (mantém invariante)
        product.quantidade -= quantity_needed
        return consumed

    # ------------------------------------------------------------------ #
    # ESTORNO FEFO (cancelamento de venda)
    # ------------------------------------------------------------------ #
    @staticmethod
    def restore_batches(sale_item_id: int, seller_id: int):
        """
        Estorna as quantidades de lotes consumidas em um sale_item.
        Lê SaleItemBatchModel para saber exatamente quais lotes e quantidades.
        Também reverte product.quantidade.
        NÃO faz commit — o chamador é responsável.
        """
        consumptions = SaleItemBatchModel.query.filter_by(
            sale_item_id=sale_item_id
        ).all()

        total_restored = 0
        for cons in consumptions:
            batch = ProductBatchModel.query.filter_by(
                id=cons.batch_id, seller_id=seller_id
            ).with_for_update().first()
            if batch:
                batch.quantity += cons.quantity
                total_restored += cons.quantity

        # Atualiza o produto também
        if consumptions and total_restored > 0:
            # Pega o product_id via sale_item
            from src.Infrastructure.Model.sale_item_model import SaleItemModel
            si = SaleItemModel.query.get(sale_item_id)
            if si:
                prod = ProductModel.query.filter_by(
                    id=si.product_id, seller_id=seller_id
                ).with_for_update().first()
                if prod:
                    prod.quantidade += total_restored

    # ------------------------------------------------------------------ #
    # ALERTAS DE VENCIMENTO
    # ------------------------------------------------------------------ #
    @staticmethod
    def get_expiring_alerts(seller_id: int, days_ahead: int = 7):
        """
        Retorna lotes vencidos e lotes que vencem em até `days_ahead` dias,
        agrupados por produto.
        """
        today = date.today()
        cutoff = today + timedelta(days=days_ahead)

        # Busca lotes com quantidade > 0 que estejam vencidos ou vencendo em breve
        batches = (
            ProductBatchModel.query
            .filter(
                ProductBatchModel.seller_id == seller_id,
                ProductBatchModel.quantity > 0,
                ProductBatchModel.expiry_date <= cutoff
            )
            .order_by(ProductBatchModel.expiry_date.asc())
            .all()
        )

        # Agrupa por produto
        products_map = {}
        for b in batches:
            pid = b.product_id
            if pid not in products_map:
                prod = ProductModel.query.filter_by(id=pid, seller_id=seller_id).first()
                if not prod:
                    continue
                products_map[pid] = {
                    "product_id":   pid,
                    "product_nome": prod.nome,
                    "product_status": prod.status,
                    "batches": [],
                    "has_expired":  False,
                    "has_urgent":   False,
                }
            bd = b.to_dict()
            if bd["is_expired"]:
                products_map[pid]["has_expired"] = True
            elif bd["days_to_expire"] is not None and bd["days_to_expire"] <= 7:
                products_map[pid]["has_urgent"] = True
            products_map[pid]["batches"].append(bd)

        return list(products_map.values())

    @staticmethod
    def get_expiring_count(seller_id: int, days_ahead: int = 7) -> int:
        """
        Retorna o número de PRODUTOS (não lotes) com algum lote vencido ou
        vencendo em até `days_ahead` dias — para o badge da sidebar.
        """
        today = date.today()
        cutoff = today + timedelta(days=days_ahead)

        result = (
            db.session.query(func.count(func.distinct(ProductBatchModel.product_id)))
            .filter(
                ProductBatchModel.seller_id == seller_id,
                ProductBatchModel.quantity > 0,
                ProductBatchModel.expiry_date <= cutoff
            )
            .scalar()
        )
        return int(result or 0)

    # ------------------------------------------------------------------ #
    # BAIXA POR PERDA / VENCIMENTO
    # ------------------------------------------------------------------ #
    @staticmethod
    def write_off_batch(batch_id: int, seller_id: int, quantity: int, reason: str):
        """
        Registra baixa por perda ou vencimento.
        Reduz a quantidade do lote e do produto.
        Motivos aceitos: 'Vencido', 'Avaria', 'Outro'.
        """
        VALID_REASONS = {"Vencido", "Avaria", "Outro"}
        if reason not in VALID_REASONS:
            raise ValueError(f"Motivo de baixa inválido. Use: {', '.join(VALID_REASONS)}.")

        if quantity <= 0:
            raise ValueError("A quantidade para baixa deve ser maior que zero.")

        try:
            batch = ProductBatchModel.query.filter_by(
                id=batch_id, seller_id=seller_id
            ).with_for_update().first()

            if not batch:
                raise ValueError("Lote não encontrado.")

            if quantity > batch.quantity:
                raise ValueError(
                    f"Quantidade de baixa ({quantity}) excede o estoque do lote ({batch.quantity})."
                )

            batch.quantity -= quantity

            # Mantém invariante: atualiza product.quantidade
            prod = ProductModel.query.filter_by(
                id=batch.product_id, seller_id=seller_id
            ).with_for_update().first()
            if prod:
                prod.quantidade -= quantity

            db.session.commit()
            return batch

        except Exception:
            db.session.rollback()
            raise

    # ------------------------------------------------------------------ #
    # LOTES DE UM PRODUTO
    # ------------------------------------------------------------------ #
    @staticmethod
    def get_product_batches(product_id: int, seller_id: int):
        """Retorna todos os lotes de um produto, incluindo vencidos, em ordem de validade."""
        return (
            ProductBatchModel.query
            .filter_by(product_id=product_id, seller_id=seller_id)
            .order_by(ProductBatchModel.expiry_date.asc())
            .all()
        )
