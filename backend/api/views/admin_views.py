"""
Admin views: manage restaurants, users, platform statistics
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ..models import Restaurant, User, Order, Review, Reservation, Food, Category
from ..permissions import IsAdmin


class AdminRestaurantListView(APIView):
    """GET /api/admin/restaurants/ → all restaurants with approval status"""
    permission_classes = [IsAdmin]

    def get(self, request):
        approval = request.GET.get('approved')
        if approval == 'true':
            qs = Restaurant.objects(is_approved=True)
        elif approval == 'false':
            qs = Restaurant.objects(is_approved=False)
        else:
            qs = Restaurant.objects.all()

        restaurants = [r.to_dict(include_owner=True) for r in qs.order_by('-created_at')]
        return Response({'restaurants': restaurants, 'count': len(restaurants)})


class AdminRestaurantApproveView(APIView):
    """PUT /api/admin/restaurants/{id}/approve/ → approve or reject"""
    permission_classes = [IsAdmin]

    def put(self, request, pk):
        try:
            restaurant = Restaurant.objects.get(id=pk)
        except Exception:
            return Response({'error': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)

        approve = request.data.get('approve', True)
        restaurant.is_approved = bool(approve)
        restaurant.save()

        action = 'approved' if restaurant.is_approved else 'rejected'
        return Response({'message': f'Restaurant {action}.', 'restaurant': restaurant.to_dict()})


class AdminUserListView(APIView):
    """GET /api/admin/users/ → all users"""
    permission_classes = [IsAdmin]

    def get(self, request):
        role = request.GET.get('role')
        if role in ('customer', 'owner', 'admin'):
            users = User.objects(role=role).order_by('-created_at')
        else:
            users = User.objects.all().order_by('-created_at')
        return Response({'users': [u.to_dict() for u in users], 'count': users.count()})


class AdminUserDetailView(APIView):
    """
    GET    /api/admin/users/{id}/  → user detail
    PUT    /api/admin/users/{id}/  → toggle active status
    DELETE /api/admin/users/{id}/  → deactivate/remove user
    """
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        try:
            user = User.objects.get(id=pk)
        except Exception:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        data = user.to_dict()
        data['order_count'] = Order.objects(user=user).count()
        data['review_count'] = Review.objects(user=user).count()
        return Response({'user': data})

    def put(self, request, pk):
        try:
            user = User.objects.get(id=pk)
        except Exception:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        user.is_active = not user.is_active
        user.save()
        state = 'activated' if user.is_active else 'deactivated'
        return Response({'message': f'User {state}.', 'user': user.to_dict()})

    def delete(self, request, pk):
        try:
            user = User.objects.get(id=pk)
        except Exception:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        if user.role == 'admin':
            return Response({'error': 'Cannot delete admin users.'}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = False
        user.save()
        return Response({'message': 'User deactivated.'})


class AdminStatsView(APIView):
    """GET /api/admin/stats/ → platform-level overview statistics"""
    permission_classes = [IsAdmin]

    def get(self, request):
        total_users = User.objects.count()
        total_customers = User.objects(role='customer').count()
        total_owners = User.objects(role='owner').count()
        total_restaurants = Restaurant.objects.count()
        approved_restaurants = Restaurant.objects(is_approved=True).count()
        pending_restaurants = Restaurant.objects(is_approved=False).count()
        total_orders = Order.objects.count()
        total_revenue = sum(o.total for o in Order.objects(status='delivered'))
        total_reviews = Review.objects.count()
        total_foods = Food.objects.count()
        total_categories = Category.objects.count()
        total_reservations = Reservation.objects.count()

        # Recent orders
        recent_orders = Order.objects.order_by('-created_at').limit(5)

        return Response({
            'stats': {
                'users': {
                    'total': total_users,
                    'customers': total_customers,
                    'owners': total_owners,
                },
                'restaurants': {
                    'total': total_restaurants,
                    'approved': approved_restaurants,
                    'pending': pending_restaurants,
                },
                'orders': {
                    'total': total_orders,
                    'total_revenue': round(total_revenue, 2),
                },
                'reviews': total_reviews,
                'foods': total_foods,
                'categories': total_categories,
                'reservations': total_reservations,
            },
            'recent_orders': [o.to_dict(include_user=True, include_restaurant=True) for o in recent_orders],
        })
