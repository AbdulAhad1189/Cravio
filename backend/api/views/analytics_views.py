"""
Analytics views: restaurant analytics, platform analytics, revenue prediction
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ..models import Restaurant, Order
from ..permissions import IsAuthenticatedUser, IsOwner, IsAdmin, IsOwnerOrAdmin
from ..analytics.analytics import (
    get_restaurant_analytics,
    get_platform_analytics,
    predict_revenue,
)


class RestaurantAnalyticsView(APIView):
    """GET /api/analytics/restaurant/{id}/ → owner analytics for a specific restaurant"""
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request, pk):
        try:
            restaurant = Restaurant.objects.get(id=pk)
        except Exception:
            return Response({'error': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Only the owner of this restaurant or admin can view analytics
        if request.user.role == 'owner' and str(restaurant.owner.id) != str(request.user.id):
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        data = get_restaurant_analytics(restaurant)
        return Response({'analytics': data, 'restaurant': {'id': str(restaurant.id), 'name': restaurant.name}})


class PlatformAnalyticsView(APIView):
    """GET /api/analytics/platform/ → admin platform-wide analytics"""
    permission_classes = [IsAdmin]

    def get(self, request):
        data = get_platform_analytics()
        return Response({'analytics': data})


class RevenuePredictionView(APIView):
    """GET /api/analytics/predict/{id}/ → predict next month revenue for a restaurant"""
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request, pk):
        try:
            restaurant = Restaurant.objects.get(id=pk)
        except Exception:
            return Response({'error': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == 'owner' and str(restaurant.owner.id) != str(request.user.id):
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        prediction = predict_revenue(restaurant)
        return Response({'prediction': prediction, 'restaurant': {'id': str(restaurant.id), 'name': restaurant.name}})
