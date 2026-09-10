from src.Domain.user import UserDomain
from src.Infrastructure.Model.user import User
from src.config.data_base import db
import bcrypt

class UserService:
    @staticmethod
    def create_user(name, email, password):
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        user = User(name=name, email=email, password=hashed_password.decode('utf-8'))
        db.session.add(user)
        db.session.commit()
        return UserDomain(user.id, user.name, user.email, user.password)
