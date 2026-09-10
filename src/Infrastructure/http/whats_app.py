from twilio.rest import Client
import os
from dotenv import load_dotenv
import re

load_dotenv()

account_sid = os.getenv("TWILIO_ACCOUNT_SID")
auth_token = os.getenv("TWILIO_AUTH_TOKEN")
twilio_number = os.getenv("TWILIO_WHATSAPP_NUMBER")

client = Client(account_sid, auth_token) if account_sid and auth_token else None

def formatar_numero(celular):
    """
    Formata o número de celular para o formato internacional (+55 para Brasil)
    Aceita: 11999999999, (11)99999999, (11) 99999-9999, +5511999999999
    """
    # Remove tudo que não é número
    apenas_numeros = re.sub(r'\D', '', celular)
    
    # Se não tem 11 dígitos, assume que falta o país
    if len(apenas_numeros) == 10:
        # Celular 10 dígitos (antigo, sem nono dígito)
        apenas_numeros = '55' + apenas_numeros
    elif len(apenas_numeros) == 11:
        # Celular 11 dígitos (com nono dígito) - adiciona código de país
        apenas_numeros = '55' + apenas_numeros
    elif len(apenas_numeros) == 13 and apenas_numeros.startswith('55'):
        # Já tem código de país
        pass
    else:
        raise ValueError(f"Formato de celular inválido: {celular}. Use formato: XXXXXXXXXXX ou +55XXXXXXXXXXX")
    
    # Formata com +
    return f"+{apenas_numeros}"

def enviar_codigo_whatsapp(celular, codigo):
    """
    Envia código de ativação via WhatsApp usando Twilio.
    
    Args:
        celular (str): Número de celular (com ou sem código de país)
        codigo (str): Código de ativação de 4 dígitos
    
    Returns:
        str: SID da mensagem ou "simulado" se não há credenciais
    """
    try:
        if not client:
            print(f"❌ MODO SIMULADO - Twilio não configurado")
            print(f"   Celular: {celular}")
            print(f"   Código de ativação: {codigo}")
            return "simulado"
        
        # Formata o número de celular
        numero_formatado = formatar_numero(celular)
        
        print(f"✓ Enviando mensagem para {numero_formatado}")
        
        message = client.messages.create(
            body=f"Seu código de ativação é: {codigo}\n\nNão compartilhe este código com ninguém.",
            from_=twilio_number,
            to=f"whatsapp:{numero_formatado}"
        )
        print(f"✓ Mensagem enviada com sucesso! SID: {message.sid}")
        return message.sid
    except ValueError as e:
        print(f"❌ Erro de formatação: {str(e)}")
        raise
    except Exception as e:
        print(f"❌ Erro no envio Twilio: {str(e)}")
        raise