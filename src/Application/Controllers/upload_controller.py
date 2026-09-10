import os
from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename
import uuid

class UploadController:

    @staticmethod
    @jwt_required()
    def upload_image():
        """
        Recebe um arquivo de imagem e salva no diretório de uploads.
        Retorna a URL do arquivo salvo.
        """
        if 'image' not in request.files:
            return jsonify({"erro": "Nenhum arquivo enviado"}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({"erro": "Nenhum arquivo selecionado"}), 400
        
        if file:
            # Pega a extensão do arquivo
            _, ext = os.path.splitext(file.filename)
            # Gera um nome único para o arquivo para evitar conflitos
            filename = f"{uuid.uuid4().hex}{ext}"
            filename = secure_filename(filename)
            
            # Pega o caminho configurado no Flask para uploads
            upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
            
            # Garante que a pasta existe (mesmo que já devesse existir)
            os.makedirs(upload_folder, exist_ok=True)
            
            file_path = os.path.join(upload_folder, filename)
            
            # Salva o arquivo
            file.save(file_path)
            
            # Constrói a URL do arquivo (assumindo a rota /uploads/<filename>)
            # Usa o request.host_url para obter o domínio atual e a porta
            host_url = request.host_url.rstrip('/')
            file_url = f"{host_url}/uploads/{filename}"
            
            return jsonify({
                "mensagem": "Upload realizado com sucesso",
                "url": file_url
            }), 201

