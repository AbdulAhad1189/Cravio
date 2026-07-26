from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import User
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer, get_tokens_for_user


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = get_tokens_for_user(user)
            return Response({
                **tokens,
                'user': UserSerializer(user).data,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            tokens = get_tokens_for_user(user)
            return Response({
                **tokens,
                'user': UserSerializer(user).data,
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)


class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'admin':
            return User.objects.none()
        return User.objects.all()


class AdminStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'detail': 'Forbidden'}, status=403)
        from orders.models import Order
        from restaurants.models import Restaurant
        from django.db.models import Sum, Count, Q
        from django.utils import timezone
        from datetime import timedelta

        since_30d = timezone.now() - timedelta(days=30)
        since_7d  = timezone.now() - timedelta(days=7)

        total_revenue = Order.objects.filter(status='delivered').aggregate(
            total=Sum('total_amount')
        )['total'] or 0

        revenue_30d = Order.objects.filter(
            status='delivered', created_at__gte=since_30d
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        orders_7d = Order.objects.filter(created_at__gte=since_7d).count()

        # Top 5 states by order volume
        from restaurants.trending import trending_by_state
        state_data = trending_by_state(limit_per_state=1)
        top_states = [
            {
                'state': state,
                'top_restaurant': rests[0].name if rests else '',
                'recent_orders':  rests[0].recent_orders if rests else 0,
            }
            for state, rests in sorted(
                state_data.items(),
                key=lambda x: x[1][0].recent_orders if x[1] else 0,
                reverse=True,
            )[:5]
        ]

        return Response({
            'total_restaurants': Restaurant.objects.count(),
            'pending_restaurants': Restaurant.objects.filter(status='pending').count(),
            'approved_restaurants': Restaurant.objects.filter(status='approved').count(),
            'total_users': User.objects.count(),
            'total_orders': Order.objects.count(),
            'orders_last_7_days': orders_7d,
            'total_revenue': total_revenue,
            'revenue_last_30_days': revenue_30d,
            'top_states': top_states,
        })
