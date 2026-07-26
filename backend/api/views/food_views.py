"""
Food & Category views
"""
import os
from datetime import datetime
from django.conf import settings as dj_settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ..models import Food, Category, Restaurant
from ..permissions import IsOwner, IsAuthenticatedUser
from .restaurant_views import _save_image


class CategoryListView(APIView):
    """GET /api/categories/ → all food categories"""
    permission_classes = []

    def get(self, request):
        categories = Category.objects.all()
        return Response({'categories': [c.to_dict() for c in categories]})


class FoodListCreateView(APIView):
    """
    GET  /api/foods/  → all available foods (with filters)
    POST /api/foods/  → owner: add food item
    """

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsOwner()]
        return []

    def get(self, request):
        qs = Food.objects(is_available=True)

        restaurant_id = request.GET.get('restaurant')
        if restaurant_id:
            try:
                restaurant = Restaurant.objects.get(id=restaurant_id)
                qs = qs.filter(restaurant=restaurant)
            except Exception:
                return Response({'error': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)

        category_id = request.GET.get('category')
        if category_id:
            try:
                category = Category.objects.get(id=category_id)
                qs = qs.filter(category=category)
            except Exception:
                pass

        q = request.GET.get('q', '').strip()
        if q:
            import re
            pattern = re.compile(q, re.IGNORECASE)
            qs = qs.filter(__raw__={
                '$or': [
                    {'name': pattern},
                    {'description': pattern},
                ]
            })

        foods = [f.to_dict() for f in qs]
        return Response({'foods': foods, 'count': len(foods)})

    def post(self, request):
        data = request.data
        name = data.get('name', '').strip()
        price = data.get('price')
        restaurant_id = data.get('restaurant_id')

        if not name:
            return Response({'error': 'Food name is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if price is None:
            return Response({'error': 'Price is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            price = float(price)
            if price < 0:
                raise ValueError()
        except (ValueError, TypeError):
            return Response({'error': 'Price must be a positive number.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate restaurant ownership
        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except Exception:
            return Response({'error': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)

        if str(restaurant.owner.id) != str(request.user.id):
            return Response({'error': 'You do not own this restaurant.'}, status=status.HTTP_403_FORBIDDEN)

        food = Food(
            name=name,
            restaurant=restaurant,
            description=data.get('description', ''),
            price=price,
            is_available=data.get('is_available', True),
        )

        # Category
        category_id = data.get('category_id')
        if category_id:
            try:
                food.category = Category.objects.get(id=category_id)
            except Exception:
                pass

        if 'image' in request.FILES:
            food.image = _save_image(request.FILES['image'], 'foods')

        food.save()
        return Response({'message': 'Food item added.', 'food': food.to_dict()}, status=status.HTTP_201_CREATED)


class FoodDetailView(APIView):
    """
    GET    /api/foods/{id}/  → food detail
    PUT    /api/foods/{id}/  → owner: update
    DELETE /api/foods/{id}/  → owner: delete
    """

    def _get_food(self, pk):
        try:
            return Food.objects.get(id=pk)
        except Exception:
            return None

    def get(self, request, pk):
        food = self._get_food(pk)
        if not food:
            return Response({'error': 'Food not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'food': food.to_dict()})

    def put(self, request, pk):
        if not request.user or not hasattr(request.user, 'role'):
            return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

        food = self._get_food(pk)
        if not food:
            return Response({'error': 'Food not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Verify ownership
        if request.user.role == 'owner':
            try:
                if str(food.restaurant.owner.id) != str(request.user.id):
                    return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
            except Exception:
                return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        if 'name' in data and data['name'].strip():
            food.name = data['name'].strip()
        if 'description' in data:
            food.description = data['description']
        if 'price' in data:
            try:
                food.price = float(data['price'])
            except (ValueError, TypeError):
                pass
        if 'is_available' in data:
            food.is_available = str(data['is_available']).lower() in ('true', '1', 'yes')
        if 'category_id' in data and data['category_id']:
            try:
                food.category = Category.objects.get(id=data['category_id'])
            except Exception:
                pass

        if 'image' in request.FILES:
            food.image = _save_image(request.FILES['image'], 'foods')

        food.save()
        return Response({'message': 'Food item updated.', 'food': food.to_dict()})

    def delete(self, request, pk):
        if not request.user or not hasattr(request.user, 'role'):
            return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

        food = self._get_food(pk)
        if not food:
            return Response({'error': 'Food not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == 'owner':
            try:
                if str(food.restaurant.owner.id) != str(request.user.id):
                    return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
            except Exception:
                return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        elif request.user.role != 'admin':
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        food.delete()
        return Response({'message': 'Food item deleted.'})
