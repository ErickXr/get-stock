import io, csv
from datetime import datetime
from flask import request, jsonify, make_response, Response
from src.Application.Service.sale_service import SaleService
from src.Application.Service.auth_guard import get_current_user, require_nivel

class SaleController:

    @staticmethod
    @require_nivel("admin", "gerente", "operador")
    def create():
        try:
            _, _, seller_id = get_current_user()
            data = request.get_json()
            product_id      = data.get("produtoId")
            quantity        = data.get("quantidade")
            forma_pagamento = data.get("forma_pagamento", "dinheiro")
            desconto        = float(data.get("desconto", 0.0))

            if not product_id or not quantity:
                return make_response(jsonify({"erro": "Campos 'produtoId' e 'quantidade' são obrigatórios"}), 400)
            if not isinstance(quantity, int) or quantity <= 0:
                return make_response(jsonify({"erro": "'quantidade' deve ser um número inteiro positivo"}), 400)

            sale = SaleService.create(product_id, quantity, seller_id, forma_pagamento, desconto)
            return make_response(jsonify({"mensagem": "Venda realizada com sucesso!", "venda": sale.to_dict()}), 201)
        except ValueError as e:
            return make_response(jsonify({"erro": str(e)}), 409)
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

            inicio = datetime.fromisoformat(inicio_str) if inicio_str else None
            fim    = datetime.fromisoformat(fim_str + "T23:59:59") if fim_str else None

            sales = SaleService.list_by_seller(seller_id, inicio=inicio, fim=fim, forma=forma)
            return make_response(jsonify(sales), 200)
        except Exception as e:
            return make_response(jsonify({"erro": str(e)}), 500)

    @staticmethod
    @require_nivel("admin", "gerente")
    def cancel_sale(sale_id):
        try:
            _, _, seller_id = get_current_user()
            data  = request.get_json() or {}
            motivo = data.get("motivo", "")
            sale  = SaleService.cancel(sale_id, seller_id, motivo)
            return make_response(jsonify({"mensagem": "Venda cancelada com sucesso", "venda": sale.to_dict()}), 200)
        except ValueError as e:
            return make_response(jsonify({"erro": str(e)}), 409)
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

            inicio = datetime.fromisoformat(inicio_str) if inicio_str else None
            fim    = datetime.fromisoformat(fim_str + "T23:59:59") if fim_str else None

            sales = SaleService.list_by_seller(seller_id, inicio=inicio, fim=fim, forma=forma)

            formas_map = {
                "dinheiro": "Dinheiro",
                "pix": "PIX",
                "debito": "Cartão de Débito",
                "credito": "Cartão de Crédito"
            }

            output = io.StringIO()
            # Delimitador ponto e vírgula (;) para abrir perfeitamente colunado no Excel (padrão Brasil/Europa)
            writer = csv.writer(output, delimiter=';', quoting=csv.QUOTE_MINIMAL)
            
            # Cabeçalho formatado
            writer.writerow([
                "Código",
                "Data / Hora",
                "Produto",
                "Qtd Vendida",
                "Preço Unitário (R$)",
                "Desconto (R$)",
                "Valor Total (R$)",
                "Forma de Pagamento",
                "Status da Venda",
                "Motivo Cancelamento"
            ])

            total_qtd = 0
            total_faturamento = 0.0

            for s in sales:
                # Formatação de data
                data_formatada = ""
                if s.get("created_at"):
                    try:
                        dt = datetime.fromisoformat(s["created_at"])
                        data_formatada = dt.strftime("%d/%m/%Y %H:%M")
                    except Exception:
                        data_formatada = s["created_at"][:16]

                status_label = "Concluída" if s.get("status") == "ativa" else "Cancelada"
                forma_label = formas_map.get(s.get("forma_pagamento", ""), s.get("forma_pagamento", "Outro"))
                
                preco_un = f"{s.get('preco_venda', 0):.2f}".replace('.', ',')
                desconto_val = f"{s.get('desconto', 0):.2f}".replace('.', ',')
                total_val = f"{s.get('total', 0):.2f}".replace('.', ',')

                if s.get("status") == "ativa":
                    total_qtd += s.get("quantidade", 0)
                    total_faturamento += float(s.get("total", 0))

                writer.writerow([
                    s.get("id", ""),
                    data_formatada,
                    s.get("produto_nome", f"Produto #{s.get('product_id')}"),
                    s.get("quantidade", 0),
                    preco_un,
                    desconto_val,
                    total_val,
                    forma_label,
                    status_label,
                    s.get("motivo_cancelamento") or ""
                ])

            # Linha em branco e Linha de Totais para análise no Excel
            writer.writerow([])
            writer.writerow([
                "TOTAIS (Vendas Ativas)",
                "",
                "",
                total_qtd,
                "",
                "",
                f"{total_faturamento:.2f}".replace('.', ','),
                "",
                "",
                ""
            ])

            output.seek(0)
            # UTF-8 com BOM (\ufeff) para o Excel reconhecer acentos e caracteres especiais em português
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
