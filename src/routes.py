# src/routes.py
from flask import jsonify, make_response
from flask_jwt_extended import jwt_required
from src.Application.Controllers.user_controller import UserController
from src.Application.Controllers.seller_controller import SellerController
from src.Application.Controllers.product_controller import ProductController
from src.Application.Controllers.sale_controller import SaleController
from src.Application.Controllers.dashboard_controller import DashboardController
from src.Application.Controllers.upload_controller import UploadController
from flask import send_from_directory, current_app

def init_routes(app):
    @app.route('/api', methods=['GET'])
    def health():
        return make_response(jsonify({"mensagem": "API - OK; Docker - Up"}), 200)

    @app.route('/user', methods=['POST'])
    def register_user():
        return UserController.register_user()

    @app.route('/api/sellers', methods=['POST'])
    def register_seller():
        return SellerController.register_seller()

    @app.route('/api/sellers/activate', methods=['POST'])
    def activate_seller():
        return SellerController.activate_seller()

    @app.route('/api/sellers/resend-code', methods=['POST'])
    def resend_code():
        return SellerController.resend_code()

    @app.route('/api/sellers/login', methods=['POST'])
    def login_seller():
        return SellerController.login_seller()
    
    @app.route('/api/auth/login', methods=['POST'])
    def auth_login():
        """Alias para /api/sellers/login"""
        return SellerController.login_seller()
    
    @app.route('/api/sellers/me', methods=['GET'])
    @jwt_required()
    def get_seller():
        return SellerController.get_me()

    @app.route('/api/sellers/me', methods=['PUT'])
    @jwt_required()
    def update_seller():
        return SellerController.update_seller()

    @app.route('/api/products', methods=['POST'])
    @jwt_required()
    def create_product():
        return ProductController.create_product()

    @app.route('/api/products', methods=['GET'])
    @jwt_required()
    def list_products():
        return ProductController.list_products()

    @app.route('/api/products/<int:product_id>', methods=['GET'])
    @jwt_required()
    def get_product(product_id):
        return ProductController.get_product(product_id)

    @app.route('/api/products/<int:product_id>', methods=['PUT'])
    @jwt_required()
    def update_product(product_id):
        return ProductController.update_product(product_id)

    @app.route('/api/products/<int:product_id>/inactivate', methods=['PATCH'])
    @jwt_required()
    def inactivate_product(product_id):
        return ProductController.inactivate_product(product_id)

    @app.route('/api/products/<int:product_id>/activate', methods=['PATCH'])
    @jwt_required()
    def activate_product(product_id):
        return ProductController.activate_product(product_id)

    @app.route("/api/sales", methods=["POST"])
    @jwt_required()
    def create_sale():
        return SaleController.create()

    @app.route("/api/sales", methods=["GET"])
    @jwt_required()
    def list_sales():
        return SaleController.list_sales()

    @app.route("/api/dashboard", methods=["GET"])
    @jwt_required()
    def get_dashboard():
        return DashboardController.get_indicators()

    @app.route("/api/upload", methods=["POST"])
    def upload_file():
        return UploadController.upload_image()

    @app.route('/uploads/<path:filename>')
    def serve_uploaded_file(filename):
        return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)