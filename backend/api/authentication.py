"""
JWT Authentication for Taste Tracker Tavern
Uses PyJWT with a custom DRF BaseAuthentication class
"""
import jwt
from datetime import datetime, timedelta
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import User


def generate_token(user: User) -> str:
    """Generate a JWT access token for the given user."""
    payload = {
        'user_id': str(user.id),
        'email': user.email,
        'role': user.role,
        'exp': datetime.utcnow() + timedelta(seconds=settings.JWT_ACCESS_EXPIRE),
        'iat': datetime.utcnow(),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm='HS256')


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token. Raises AuthenticationFailed on error."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed('Token has expired. Please log in again.')
    except jwt.DecodeError:
        raise AuthenticationFailed('Invalid token. Authentication failed.')
    except jwt.InvalidTokenError as e:
        raise AuthenticationFailed(f'Token error: {str(e)}')


class JWTAuthentication(BaseAuthentication):
    """
    Custom DRF authentication that reads Bearer token from Authorization header,
    decodes it, and returns the corresponding MongoEngine User document.
    """

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None  # No token — AnonymousUser

        token = auth_header.split(' ', 1)[1].strip()
        if not token:
            return None

        payload = decode_token(token)

        try:
            user = User.objects.get(id=payload['user_id'])
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found.')

        if not user.is_active:
            raise AuthenticationFailed('User account is disabled.')

        return (user, token)

    def authenticate_header(self, request):
        return 'Bearer realm="api"'
