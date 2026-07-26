"""
Authentication views: Register, Login, Profile
"""
import re
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ..models import User
from ..authentication import generate_token
from ..permissions import IsAuthenticatedUser


def _validate_email(email: str) -> bool:
    return bool(re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email))


class RegisterView(APIView):
    """POST /api/auth/register/"""
    permission_classes = []

    def post(self, request):
        data = request.data
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        role = data.get('role', 'customer')
        phone = data.get('phone', '')

        # Validation
        errors = {}
        if not name:
            errors['name'] = 'Name is required.'
        if not email or not _validate_email(email):
            errors['email'] = 'A valid email is required.'
        if not password or len(password) < 6:
            errors['password'] = 'Password must be at least 6 characters.'
        if role not in ('customer', 'owner'):
            errors['role'] = 'Role must be customer or owner.'
        if errors:
            return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

        # Check duplicate email
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'An account with this email already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create user
        user = User(name=name, email=email, username=email, role=role, phone=phone)
        user.set_password(password)
        user.save()

        token = generate_token(user)

        # Welcome email (non-blocking, ignore failures)
        try:
            send_mail(
                subject='Welcome to Cravio!',
                message=f'Hi {name},\n\nYour account has been created successfully.\n\nEnjoy exploring!',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=True,
            )
        except Exception:
            pass

        return Response(
            {'message': 'Account created successfully.', 'token': token, 'user': user.to_dict()},
            status=status.HTTP_201_CREATED
        )


class LoginView(APIView):
    """POST /api/auth/login/"""
    permission_classes = []

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(email=email).first()
        if not user or not user.check_password(password):
            return Response(
                {'error': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'error': 'Your account has been deactivated.'},
                status=status.HTTP_403_FORBIDDEN
            )

        token = generate_token(user)
        return Response(
            {'message': 'Login successful.', 'token': token, 'user': user.to_dict()},
            status=status.HTTP_200_OK
        )


class MeView(APIView):
    """GET/PUT /api/auth/me/"""
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        return Response({'user': request.user.to_dict()})

    def put(self, request):
        user = request.user
        data = request.data

        if 'name' in data and data['name'].strip():
            user.name = data['name'].strip()
        if 'phone' in data:
            user.phone = data['phone']
        if 'address' in data:
            user.address = data['address']

        # Handle avatar file upload
        if 'avatar' in request.FILES:
            import os
            from django.conf import settings as dj_settings
            avatar_file = request.FILES['avatar']
            ext = os.path.splitext(avatar_file.name)[1]
            filename = f'avatars/{str(user.id)}{ext}'
            filepath = dj_settings.MEDIA_ROOT / filename
            filepath.parent.mkdir(parents=True, exist_ok=True)
            with open(filepath, 'wb') as f:
                for chunk in avatar_file.chunks():
                    f.write(chunk)
            user.avatar = f'/media/{filename}'

        # Change password
        if 'new_password' in data and data.get('current_password'):
            if not user.check_password(data['current_password']):
                return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
            if len(data['new_password']) < 6:
                return Response({'error': 'New password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(data['new_password'])

        user.save()
        return Response({'message': 'Profile updated.', 'user': user.to_dict()})


class LogoutView(APIView):
    """POST /api/auth/logout/ (JWT is stateless — just signals client to discard token)"""
    permission_classes = [IsAuthenticatedUser]

    def post(self, request):
        return Response({'message': 'Logged out successfully.'})
