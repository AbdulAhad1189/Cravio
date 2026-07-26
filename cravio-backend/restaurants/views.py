from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from datetime import timedelta
from .models import Restaurant
from .serializers import RestaurantSerializer


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user or request.user.role == 'admin'


class RestaurantListView(generics.ListCreateAPIView):
    serializer_class = RestaurantSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        city    = self.request.query_params.get('city')

        # Trigger Swiggy restaurants sync if querying a specific city
        if city:
            if not Restaurant.objects.filter(city__iexact=city, swiggy_id__isnull=False).exists():
                try:
                    from .swiggy_helper import sync_swiggy_restaurants
                    sync_swiggy_restaurants(city_name=city)
                except Exception as e:
                    print(f"Error syncing Swiggy restaurants for city {city}: {e}")

        # If the database has no synced Swiggy restaurants at all, sync default city (bengaluru)
        if not Restaurant.objects.filter(swiggy_id__isnull=False).exists():
            try:
                from .swiggy_helper import sync_swiggy_restaurants
                sync_swiggy_restaurants(city_name='bengaluru')
            except Exception as e:
                print(f"Error syncing default Swiggy restaurants: {e}")

        qs = Restaurant.objects.all()
        status_param = self.request.query_params.get('status')
        search  = self.request.query_params.get('search')
        cuisine = self.request.query_params.get('cuisine')

        user = self.request.user
        if not user.is_authenticated or user.role not in ('admin', 'owner'):
            qs = qs.filter(status='approved')
        elif status_param:
            qs = qs.filter(status=status_param)

        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(cuisine__icontains=search) |
                Q(city__icontains=search)
            )
        if cuisine and cuisine != 'all':
            qs = qs.filter(cuisine__icontains=cuisine)
        if city:
            qs = qs.filter(
                Q(city__icontains=city) |
                Q(address__icontains=city)
            )
        return qs

    def perform_create(self, serializer):
        if self.request.user.role != 'owner':
            raise PermissionDenied('Only restaurant owners can register restaurants.')
        # New restaurants start as pending — admin must approve
        serializer.save(owner=self.request.user, status='pending')


class RestaurantDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]


class MyRestaurantView(generics.ListCreateAPIView):
    """Returns all restaurants owned by the logged-in owner."""
    serializer_class = RestaurantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Restaurant.objects.filter(owner=self.request.user)

    def get(self, request, *args, **kwargs):
        qs = self.get_queryset()
        if not qs.exists():
            raise NotFound('No restaurant found for this owner.')
        # Return first restaurant for dashboard compat
        serializer = self.get_serializer(qs.first())
        return Response(serializer.data)


class RestaurantApprovalView(generics.GenericAPIView):
    """
    Admin-only endpoint to approve or reject a restaurant registration.
    PATCH /api/restaurants/<id>/approval/
    Body: { "status": "approved" | "rejected", "rejection_reason": "..." }
    """
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'detail': 'Only admins can approve or reject restaurants.'}, status=403)

        try:
            restaurant = Restaurant.objects.get(pk=pk)
        except Restaurant.DoesNotExist:
            return Response({'detail': 'Restaurant not found.'}, status=404)

        new_status = request.data.get('status')
        if new_status not in ('approved', 'rejected', 'pending'):
            return Response({'detail': 'Invalid status. Must be approved, rejected, or pending.'}, status=400)

        restaurant.status = new_status
        restaurant.save(update_fields=['status'])

        serializer = self.get_serializer(restaurant)
        action_label = {
            'approved': 'approved and is now live',
            'rejected': 'rejected',
            'pending':  'set back to pending review',
        }[new_status]

        return Response({
            'restaurant': serializer.data,
            'message': f'"{restaurant.name}" has been {action_label}.',
        })


class TrendingRestaurantsView(APIView):
    """
    GET /api/restaurants/trending/
    Query params:
      - city   (optional) — filter to city
      - state  (optional) — filter to state
      - limit  (optional, default 10)

    Returns top trending restaurants scored by orders (50%), rating (30%), reviews (20%).
    Falls back to national trending if location has no matches.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from .trending import get_trending_queryset
        city  = request.query_params.get('city', '').strip()
        state = request.query_params.get('state', '').strip()
        limit = int(request.query_params.get('limit', 10))

        restaurants, location_filtered = get_trending_queryset(
            city=city or None,
            state=state or None,
            limit=limit,
        )

        data = []
        for r in restaurants:
            serializer = RestaurantSerializer(r, context={'request': request})
            row = serializer.data
            row['trending_score'] = r.trending_score
            row['recent_orders']  = r.recent_orders
            data.append(row)

        return Response({
            'results': data,
            'location_filtered': location_filtered,
            'city':  city  or None,
            'state': state or None,
        })


class TrendingByStateView(APIView):
    """
    GET /api/restaurants/trending/by-state/
    Admin-only. Returns top restaurants per state.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'detail': 'Admin only.'}, status=403)

        from .trending import trending_by_state
        limit = int(request.query_params.get('limit', 3))
        state_data = trending_by_state(limit_per_state=limit)

        result = {}
        for state, rests in state_data.items():
            result[state] = []
            for r in rests:
                serializer = RestaurantSerializer(r, context={'request': request})
                row = serializer.data
                row['trending_score'] = r.trending_score
                row['recent_orders']  = r.recent_orders
                result[state].append(row)

        return Response(result)
