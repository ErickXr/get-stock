from src.Infrastructure.Model.customer_model import CustomerModel
from src.Infrastructure.Model.customer_payment_model import CustomerPaymentModel
from src.Infrastructure.Model.sale_model import SaleModel
from src.config.data_base import db
from sqlalchemy import func
from decimal import Decimal

class CustomerService:

    @staticmethod
    def create_customer(data, seller_id):
        name = data.get("name") or data.get("nome")
        phone = data.get("phone") or data.get("telefone") or data.get("celular")
        if not name or not str(name).strip():
            raise ValueError("O nome do cliente é obrigatório.")
        if not phone or not str(phone).strip():
            raise ValueError("O telefone do cliente é obrigatório.")

        credit_limit_raw = data.get("credit_limit") or data.get("limite_credito") or 0.0
        credit_limit = Decimal(str(max(0.0, float(credit_limit_raw))))

        cpf = data.get("cpf")
        if cpf:
            cpf = str(cpf).strip()

        customer = CustomerModel(
            seller_id=int(seller_id),
            name=str(name).strip(),
            phone=str(phone).strip(),
            cpf=cpf if cpf else None,
            credit_limit=credit_limit,
            active=True
        )
        db.session.add(customer)
        db.session.commit()
        return customer

    @staticmethod
    def get_customer(customer_id: int, seller_id: int):
        return CustomerModel.query.filter_by(id=customer_id, seller_id=int(seller_id)).first()

    @staticmethod
    def calculate_debt(customer_id: int, seller_id: int):
        """
        Calcula o saldo devedor por consulta:
        (soma das vendas fiado ativas) - (soma de todos os pagamentos realizados).
        Garante consistência absoluta sem colunas editáveis.
        """
        total_fiado = db.session.query(func.coalesce(func.sum(SaleModel.total_liquido), Decimal('0.00')))\
            .filter(
                SaleModel.customer_id == customer_id,
                SaleModel.seller_id == seller_id,
                SaleModel.forma_pagamento == 'fiado',
                SaleModel.status == 'ativa'
            ).scalar() or Decimal('0.00')

        total_pago = db.session.query(func.coalesce(func.sum(CustomerPaymentModel.amount), Decimal('0.00')))\
            .filter(
                CustomerPaymentModel.customer_id == customer_id,
                CustomerPaymentModel.seller_id == seller_id
            ).scalar() or Decimal('0.00')

        saldo_devedor = max(Decimal('0.00'), total_fiado - total_pago)
        return Decimal(str(saldo_devedor))

    @staticmethod
    def get_customer_summary(customer: CustomerModel):
        saldo_devedor = CustomerService.calculate_debt(customer.id, customer.seller_id)
        limite = Decimal(str(customer.credit_limit or Decimal('0.00')))
        disponivel = max(Decimal('0.00'), limite - saldo_devedor)
        
        pct_uso = 0.0
        if limite > 0:
            pct_uso = round(float((saldo_devedor / limite) * 100), 1)

        data = customer.to_dict()
        data.update({
            "saldo_devedor": round(float(saldo_devedor), 2),
            "limite_disponivel": round(float(disponivel), 2),
            "percentual_uso": pct_uso,
            "possui_divida": saldo_devedor > 0
        })
        return data

    @staticmethod
    def list_customers(seller_id: int, search: str = None, active_only: bool = False):
        q = CustomerModel.query.filter_by(seller_id=int(seller_id))
        if active_only:
            q = q.filter_by(active=True)
        if search:
            s = f"%{search.strip()}%"
            q = q.filter((CustomerModel.name.ilike(s)) | (CustomerModel.phone.ilike(s)) | (CustomerModel.cpf.ilike(s)))
        
        customers = q.order_by(CustomerModel.name.asc()).all()
        return [CustomerService.get_customer_summary(c) for c in customers]

    @staticmethod
    def update_customer(customer_id: int, seller_id: int, data: dict):
        customer = CustomerService.get_customer(customer_id, seller_id)
        if not customer:
            raise ValueError("Cliente não encontrado.")

        if "name" in data or "nome" in data:
            name = data.get("name") or data.get("nome")
            if not str(name).strip():
                raise ValueError("O nome do cliente não pode ser vazio.")
            customer.name = str(name).strip()

        if "phone" in data or "telefone" in data or "celular" in data:
            phone = data.get("phone") or data.get("telefone") or data.get("celular")
            if not str(phone).strip():
                raise ValueError("O telefone do cliente não pode ser vazio.")
            customer.phone = str(phone).strip()

        if "cpf" in data:
            customer.cpf = str(data["cpf"]).strip() if data["cpf"] else None

        if "credit_limit" in data or "limite_credito" in data:
            raw_limite = data.get("credit_limit") if "credit_limit" in data else data.get("limite_credito")
            customer.credit_limit = Decimal(str(max(0.0, float(raw_limite or 0.0))))

        if "active" in data:
            customer.active = bool(data["active"])

        db.session.commit()
        return CustomerService.get_customer_summary(customer)

    @staticmethod
    def toggle_status(customer_id: int, seller_id: int):
        customer = CustomerService.get_customer(customer_id, seller_id)
        if not customer:
            raise ValueError("Cliente não encontrado.")
        customer.active = not customer.active
        db.session.commit()
        return CustomerService.get_customer_summary(customer)

    @staticmethod
    def get_statement(customer_id: int, seller_id: int):
        customer = CustomerService.get_customer(customer_id, seller_id)
        if not customer:
            raise ValueError("Cliente não encontrado.")

        summary = CustomerService.get_customer_summary(customer)

        sales = SaleModel.query.filter_by(
            customer_id=customer_id,
            seller_id=int(seller_id),
            forma_pagamento='fiado'
        ).all()

        payments = CustomerPaymentModel.query.filter_by(
            customer_id=customer_id,
            seller_id=int(seller_id)
        ).all()

        timeline = []
        for s in sales:
            timeline.append({
                "type": "compra_fiado",
                "id": s.id,
                "date": s.created_at.isoformat() if s.created_at else None,
                "amount": float(s.total_liquido or 0.0),
                "items_summary": s.to_dict()["produto_nome"],
                "status": s.status,
                "operator": s.usuario_nome or "Dono (Admin)",
                "note": f"Venda #{s.id}" + (f" (Cancelada: {s.motivo_cancelamento})" if s.status == "cancelada" else "")
            })

        for p in payments:
            timeline.append({
                "type": "pagamento_recebido",
                "id": p.id,
                "date": p.created_at.isoformat() if p.created_at else None,
                "amount": float(p.amount),
                "items_summary": f"Abatimento de dívida ({p.payment_method.capitalize()})",
                "status": "pago",
                "operator": p.received_by,
                "note": p.note or "Pagamento de conta fiado"
            })

        # Ordenar cronologicamente inverso (mais recente primeiro)
        timeline.sort(key=lambda x: x["date"] or "", reverse=True)

        return {
            "customer": summary,
            "timeline": timeline
        }

    @staticmethod
    def receive_payment(customer_id: int, seller_id: int, amount_val: float, payment_method: str, received_by: str, note: str = None):
        """
        Registra pagamento de conta fiado.
        Bloqueia a linha do cliente com with_for_update para garantir atomicidade.
        Impede receber valor maior que o saldo devedor.
        """
        amount = Decimal(str(amount_val or 0.0))
        if amount <= 0:
            raise ValueError("O valor do pagamento deve ser maior que zero.")

        try:
            customer = CustomerModel.query.filter_by(
                id=customer_id,
                seller_id=int(seller_id)
            ).with_for_update().first()

            if not customer:
                raise ValueError("Cliente não encontrado.")

            saldo_devedor = CustomerService.calculate_debt(customer.id, customer.seller_id)
            if saldo_devedor <= 0:
                raise ValueError(f"O cliente '{customer.name}' não possui nenhuma dívida em aberto.")

            if amount > saldo_devedor:
                raise ValueError(
                    f"O valor de R$ {amount:.2f} excede o saldo devedor de R$ {saldo_devedor:.2f} do cliente."
                )

            payment = CustomerPaymentModel(
                customer_id=customer.id,
                seller_id=int(seller_id),
                amount=amount,
                payment_method=payment_method or "dinheiro",
                received_by=received_by or "Dono (Admin)",
                note=str(note).strip() if note else None
            )

            db.session.add(payment)
            db.session.commit()

            novo_saldo = CustomerService.calculate_debt(customer.id, customer.seller_id)
            return {
                "payment": payment.to_dict(),
                "novo_saldo_devedor": round(float(novo_saldo), 2)
            }
        except Exception:
            db.session.rollback()
            raise

    @staticmethod
    def get_fiado_overview(seller_id: int):
        """Retorna o total a receber de fiado e o número de clientes devedores."""
        customers = CustomerModel.query.filter_by(seller_id=int(seller_id), active=True).all()
        total_a_receber = Decimal('0.00')
        clientes_devedores = 0

        for c in customers:
            debt = CustomerService.calculate_debt(c.id, c.seller_id)
            if debt > 0:
                total_a_receber += debt
                clientes_devedores += 1

        return {
            "total_a_receber": round(float(total_a_receber), 2),
            "clientes_devedores_count": clientes_devedores
        }
