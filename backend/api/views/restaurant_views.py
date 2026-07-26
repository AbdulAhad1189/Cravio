"""
Restaurant views: list, create, detail, update, menu, search
"""
import os
from datetime import datetime
from django.conf import settings as dj_settings
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ..models import Restaurant, Food, Review
from ..permissions import IsAuthenticatedUser, IsOwner, IsAdmin, IsOwnerOrAdmin


def _save_image(file, subfolder):
    """Save an uploaded image file and return its media URL."""
    ext = os.path.splitext(file.name)[1].lower()
    filename = f'{subfolder}/{datetime.utcnow().timestamp()}{ext}'
    filepath = dj_settings.MEDIA_ROOT / filename
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, 'wb') as f:
        for chunk in file.chunks():
            f.write(chunk)
    return f'/media/{filename}'


class RestaurantListCreateView(APIView):
    """
    GET  /api/restaurants/         → list approved & active restaurants
    POST /api/restaurants/         → owner: create restaurant
    """

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsOwner()]
        return []

    def get(self, request):
        qs = Restaurant.objects.filter(is_approved=True, is_active=True)

        # Search
        q = request.GET.get('q', '').strip()
        if q:
            qs = qs.filter(
                Q(name__icontains=q) |
                Q(cuisine__icontains=q) |
                Q(city__icontains=q) |
                Q(description__icontains=q)
            )

        # Cuisine filter
        cuisine = request.GET.get('cuisine', '').strip()
        if cuisine:
            qs = qs.filter(cuisine__icontains=cuisine)

        # City filter
        city = request.GET.get('city', '').strip()
        if city:
            qs = qs.filter(city__icontains=city)

        restaurants = [r.to_dict() for r in qs]
        return Response({'restaurants': restaurants, 'count': len(restaurants)})

    def post(self, request):
        data = request.data
        name = data.get('name', '').strip()
        if not name:
            return Response({'error': 'Restaurant name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        restaurant = Restaurant(
            name=name,
            owner=request.user,
            description=data.get('description', ''),
            cuisine=data.get('cuisine', ''),
            address=data.get('address', ''),
            city=data.get('city', ''),
            phone=data.get('phone', ''),
            email=data.get('email', ''),
            opening_time=data.get('opening_time', '09:00'),
            closing_time=data.get('closing_time', '22:00'),
            tags=data.get('tags', '').split(',') if data.get('tags') else [],
        )

        if 'image' in request.FILES:
            restaurant.image = _save_image(request.FILES['image'], 'restaurants')

        restaurant.save()
        return Response(
            {'message': 'Restaurant created. Awaiting admin approval.', 'restaurant': restaurant.to_dict()},
            status=status.HTTP_201_CREATED
        )


class RestaurantDetailView(APIView):
    """
    GET /api/restaurants/{id}/     → restaurant details + stats
    PUT /api/restaurants/{id}/     → owner: update
    """

    def _get_restaurant(self, pk):
        try:
            return Restaurant.objects.get(id=pk)
        except (Restaurant.DoesNotExist, Exception):
            return None

    def get(self, request, pk):
        restaurant = self._get_restaurant(pk)
        if not restaurant:
            return Response({'error': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)

        data = restaurant.to_dict(include_owner=False)

        # Recent reviews
        reviews = Review.objects.filter(restaurant=restaurant).order_by('-created_at')[:5]
        data['recent_reviews'] = [r.to_dict() for r in reviews]

        # Food count
        data['food_count'] = Food.objects.filter(restaurant=restaurant, is_available=True).count()

        return Response({'restaurant': data})

    def put(self, request, pk):
        if not request.user or not hasattr(request.user, 'role'):
            return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

        restaurant = self._get_restaurant(pk)
        if not restaurant:
            return Response({'error': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Only owner of this restaurant or admin
        if request.user.role == 'owner' and str(restaurant.owner.id) != str(request.user.id):
            return Response({'error': 'You do not own this restaurant.'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role not in ('owner', 'admin'):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        for field in ['name', 'description', 'cuisine', 'address', 'city', 'phone', 'email', 'opening_time', 'closing_time']:
            if field in data and data[field]:
                setattr(restaurant, field, data[field])

        if 'tags' in data:
            restaurant.tags = data['tags'].split(',') if isinstance(data['tags'], str) else data['tags']

        if 'image' in request.FILES:
            restaurant.image = _save_image(request.FILES['image'], 'restaurants')

        restaurant.save()
        return Response({'message': 'Restaurant updated.', 'restaurant': restaurant.to_dict()})


class RestaurantMenuView(APIView):
    """GET /api/restaurants/{id}/menu/ → all food items grouped by category"""

    def get(self, request, pk):
        try:
            restaurant = Restaurant.objects.get(id=pk)
        except Exception:
            return Response({'error': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)

        foods = Food.objects.filter(restaurant=restaurant, is_available=True)
        # Group by category
        grouped = {}
        uncategorized = []
        for food in foods:
            if food.category:
                try:
                    cat_name = food.category.name
                    cat_id = str(food.category.id)
                    if cat_id not in grouped:
                        grouped[cat_id] = {'category': cat_name, 'items': []}
                    grouped[cat_id]['items'].append(food.to_dict())
                except Exception:
                    uncategorized.append(food.to_dict())
            else:
                uncategorized.append(food.to_dict())

        result = list(grouped.values())
        if uncategorized:
            result.append({'category': 'Other', 'items': uncategorized})

        return Response({'menu': result, 'restaurant_id': pk})


class OwnerRestaurantsView(APIView):
    """GET /api/restaurants/mine/ → list owner's own restaurants"""
    permission_classes = [IsOwner]

    def get(self, request):
        restaurants = Restaurant.objects.filter(owner=request.user)
        return Response({'restaurants': [r.to_dict() for r in restaurants]})
