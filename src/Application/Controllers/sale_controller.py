import io, csv
from datetime import datetime
from flask import request, jsonify, make_response, Response
from src.Application.Service.sale_service import SaleService
from src.Application.Service.auth_guard import get_current_user, require_nivel
from src.Infrastructure.Model.user_model import UserModel

class SaleController:

    @staticmethod
    @require_nivel("admin", "gerente", "operador")
    def create():
        try:
            entidade, nivel, seller_id = get_current_user()
            data = request.get_json(force=True)

            # Extração de itens (suporta novo formato com carrinho e formato legado)
            items = data.get("items")
            if not items:
                prod_id = data.get("produtoId") or data.get("product_id")
                qty = data.get("quantidade") or data.get("quantity")
                if prod_id and qty:
                    items = [{"product_id": int(prod_id), "quantity": int(qty)}]
                else:
                    return make_response(jsonify({"erro": "Informe ao menos um produto no carrinho."}), 400)

            forma_pagamento = data.get("payment_method") or data.get("forma_pagamento") or "dinheiro"
            desconto = float(data.get("discount") or data.get("desconto") or 0.0)
            customer_id = data.get("customer_id") or data.get("cliente_id")

            # Identificação do operador
            user_id = None
            usuario_nome = "Dono (Admin)"
            if isinstance(entidade, UserModel):
                user_id = entidade.id
                usuario_nome = f"{entidade.nome} ({nivel.capitalize()})"
            elif hasattr(entidade, "nome"):
                usuario_nome = f"{entidade.nome} (Admin)"

            sale = SaleService.create_cart_sale(
                items_data=items,
                seller_id=seller_id,
                forma_pagamento=forma_pagamento,
                desconto=desconto,
                user_id=user_id,
                usuario_nome=usuario_nome,
                customer_id=customer_id
            )

            return make_response(jsonify({
                "mensagem": "Venda realizada com sucesso!",
                "venda": sale.to_dict()
            }), 201)

        except ValueError as e:
            return make_response(jsonify({"erro": str(e)}), 400)
        except Exception as e:
            return make_response(jsonify({"erro": "Erro interno ao processar a venda", "detalhes": str(e)}), 500)

    @staticmethod
    @require_nivel("admin", "gerente", "operador")
    def list_sales():
        try:
            _, _, seller_id = get_current_user()
            inicio_str = request.args.get("inicio")
            fim_str    = request.args.get("fim")
            forma      = request.args.get("forma")
            customer_id = request.args.get("customer_id")

            inicio = datetime.fromisoformat(inicio_str) if inicio_str else None
            fim    = datetime.fromisoformat(fim_str + "T23:59:59") if fim_str else None

            sales = SaleService.list_by_seller(seller_id, inicio=inicio, fim=fim, forma=forma, customer_id=customer_id)
            return make_response(jsonify(sales), 200)
        except Exception as e:
            return make_response(jsonify({"erro": str(e)}), 500)

    @staticmethod
    @require_nivel("admin", "gerente")
    def cancel_sale(sale_id):
        try:
            _, _, seller_id = get_current_user()
            data = request.get_json() or {}
            motivo = data.get("motivo", "")
            if not motivo or not str(motivo).strip():
                return make_response(jsonify({"erro": "O motivo do cancelamento é obrigatório."}), 400)

            sale = SaleService.cancel(sale_id, seller_id, motivo)
            return make_response(jsonify({
                "mensagem": "Venda cancelada com sucesso e estoque estornado!",
                "venda": sale.to_dict()
            }), 200)
        except ValueError as e:
            return make_response(jsonify({"erro": str(e)}), 400)
        except Exception as e:
            return make_response(jsonify({"erro": str(e)}), 500)

    @staticmethod
    @require_nivel("admin", "gerente")
    def export_csv():
        try:
            _, _, seller_id = get_current_user()
            inicio_str = request.args.get("inicio")
            fim_str    = request.args.get("fim")
            forma      = request.args.get("forma")
            customer_id = request.args.get("customer_id")

            inicio = datetime.fromisoformat(inicio_str) if inicio_str else None
            fim    = datetime.fromisoformat(fim_str + "T23:59:59") if fim_str else None

            sales = SaleService.list_by_seller(seller_id, inicio=inicio, fim=fim, forma=forma, customer_id=customer_id)

            formas_map = {
                "dinheiro": "Dinheiro",
                "pix": "PIX",
                "debito": "Cartão de Débito",
                "credito": "Cartão de Crédito",
                "fiado": "Fiado / Caderneta"
            }

            output = io.StringIO()
            writer = csv.writer(output, delimiter=';', quoting=csv.QUOTE_MINIMAL)

            writer.writerow([
                "Cód. Venda",
                "Data / Hora",
                "Operador",
                "Cliente (Fiado)",
                "Produto",
                "Qtd",
                "Preço Unit. (R$)",
                "Subtotal Item (R$)",
                "Desconto Venda (R$)",
                "Total Venda (R$)",
                "Forma de Pagamento",
                "Status da Venda",
                "Motivo Cancelamento"
            ])

            total_itens_vendidos = 0
            total_faturamento_liquido = 0.0
            vendas_ativas_contabilizadas = set()

            for s in sales:
                data_formatada = ""
                if s.get("created_at"):
                    try:
                        dt = datetime.fromisoformat(s["created_at"])
                        data_formatada = dt.strftime("%d/%m/%Y %H:%M")
                    except Exception:
                        data_formatada = s["created_at"][:16]

                status_label = "Concluída" if s.get("status") == "ativa" else "Cancelada"
                forma_label = formas_map.get(s.get("forma_pagamento", ""), s.get("forma_pagamento", "Outro"))
                operador = s.get("usuario_nome") or "Dono (Admin)"
                cliente = s.get("cliente_nome") or "Balcão"
                desconto_venda = f"{s.get('desconto', 0):.2f}".replace('.', ',')
                total_venda = f"{s.get('total', 0):.2f}".replace('.', ',')

                is_ativa = s.get("status") == "ativa"
                if is_ativa and s["id"] not in vendas_ativas_contabilizadas:
                    total_faturamento_liquido += float(s.get("total", 0.0))
                    vendas_ativas_contabilizadas.add(s["id"])

                items = s.get("items") or []
                if items:
                    for idx, item in enumerate(items):
                        if is_ativa:
                            total_itens_vendidos += int(item.get("quantity", 0))

                        desc_col = desconto_venda if idx == 0 else ""
                        total_col = total_venda if idx == 0 else ""

                        writer.writerow([
                            s.get("id", ""),
                            data_formatada,
                            operador,
                            cliente,
                            item.get("product_name", ""),
                            item.get("quantity", 0),
                            f"{item.get('unit_price', 0):.2f}".replace('.', ','),
                            f"{item.get('subtotal', 0):.2f}".replace('.', ','),
                            desc_col,
                            total_col,
                            forma_label,
                            status_label,
                            s.get("motivo_cancelamento") or ""
                        ])
                else:
                    if is_ativa:
                        total_itens_vendidos += int(s.get("quantidade", 0))

                    writer.writerow([
                        s.get("id", ""),
                        data_formatada,
                        operador,
                        cliente,
                        s.get("produto_nome", f"Produto #{s.get('product_id')}"),
                        s.get("quantidade", 0),
                        f"{s.get('preco_venda', 0):.2f}".replace('.', ','),
                        f"{s.get('total_bruto', s.get('total', 0)):.2f}".replace('.', ','),
                        desconto_venda,
                        total_venda,
                        forma_label,
                        status_label,
                        s.get("motivo_cancelamento") or ""
                    ])

            # Linha de Totais sem duplicar descontos
            writer.writerow([])
            writer.writerow([
                "TOTAIS (Vendas Ativas)",
                "",
                "",
                f"{len(vendas_ativas_contabilizadas)} vendas",
                "",
                total_itens_vendidos,
                "",
                "",
                "",
                f"{total_faturamento_liquido:.2f}".replace('.', ','),
                "",
                "",
                ""
            ])

            output.seek(0)
            return Response(
                "\ufeff" + output.getvalue(),
                mimetype="text/csv; charset=utf-8-sig",
                headers={
                    "Content-Disposition": f"attachment; filename=relatorio_vendas_{datetime.now().strftime('%Y%m%d_%H%M')}.csv",
                    "Content-Type": "text/csv; charset=utf-8"
                }
            )
        except Exception as e:
            return make_response(jsonify({"erro": str(e)}), 500)
