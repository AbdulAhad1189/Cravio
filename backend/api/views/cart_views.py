"""
Cart views: get, add item, update quantity, remove item, clear
"""
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ..models import Cart, CartItem, Food, Restaurant
from ..permissions import IsCustomer, IsAuthenticatedUser


class CartView(APIView):
    """
    GET    /api/cart/        → get current cart
    POST   /api/cart/        → add item to cart
    DELETE /api/cart/        → clear cart
    """
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        cart = Cart.objects(user=request.user).first()
        if not cart:
            return Response({'cart': {'items': [], 'total': 0, 'item_count': 0, 'restaurant': None}})
        return Response({'cart': cart.to_dict()})

    def post(self, request):
        """Add a food item to cart. Clears cart if from different restaurant."""
        data = request.data
        food_id = data.get('food_id')
        quantity = int(data.get('quantity', 1))

        if not food_id:
            return Response({'error': 'food_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if quantity < 1:
            return Response({'error': 'Quantity must be at least 1.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            food = Food.objects.get(id=food_id)
        except Exception:
            return Response({'error': 'Food item not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not food.is_available:
            return Response({'error': 'This item is currently unavailable.'}, status=status.HTTP_400_BAD_REQUEST)

        cart = Cart.objects(user=request.user).first()

        # If cart exists and belongs to a different restaurant, clear it
        if cart and cart.restaurant:
            try:
                cart_rest_id = str(cart.restaurant.id)
                food_rest_id = str(food.restaurant.id)
                if cart_rest_id != food_rest_id:
                    cart.items = []
                    cart.restaurant = food.restaurant
            except Exception:
                cart.items = []
                cart.restaurant = food.restaurant
        elif not cart:
            cart = Cart(user=request.user, restaurant=food.restaurant)
        else:
            cart.restaurant = food.restaurant

        # Check if item already in cart
        existing = None
        for item in cart.items:
            try:
                if str(item.food.id) == food_id:
                    existing = item
                    break
            except Exception:
                continue

        if existing:
            existing.quantity += quantity
        else:
            cart.items.append(CartItem(food=food, quantity=quantity, price=food.price))

        cart.updated_at = datetime.utcnow()
        cart.save()
        return Response({'message': 'Item added to cart.', 'cart': cart.to_dict()})

    def delete(self, request):
        cart = Cart.objects(user=request.user).first()
        if cart:
            cart.items = []
            cart.restaurant = None
            cart.save()
        return Response({'message': 'Cart cleared.'})


class CartItemView(APIView):
    """
    PUT    /api/cart/item/{food_id}/  → update quantity
    DELETE /api/cart/item/{food_id}/  → remove item
    """
    permission_classes = [IsAuthenticatedUser]

    def put(self, request, food_id):
        quantity = int(request.data.get('quantity', 1))
        if quantity < 1:
            return Response({'error': 'Quantity must be at least 1.'}, status=status.HTTP_400_BAD_REQUEST)

        cart = Cart.objects(user=request.user).first()
        if not cart:
            return Response({'error': 'Cart is empty.'}, status=status.HTTP_404_NOT_FOUND)

        for item in cart.items:
            try:
                if str(item.food.id) == food_id:
                    item.quantity = quantity
                    cart.updated_at = datetime.utcnow()
                    cart.save()
                    return Response({'message': 'Quantity updated.', 'cart': cart.to_dict()})
            except Exception:
                continue

        return Response({'error': 'Item not found in cart.'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, food_id):
        cart = Cart.objects(user=request.user).first()
        if not cart:
            return Response({'error': 'Cart is empty.'}, status=status.HTTP_404_NOT_FOUND)

        original_count = len(cart.items)
        cart.items = [item for item in cart.items if str(item.food.id) != food_id]

        if len(cart.items) == original_count:
            return Response({'error': 'Item not found in cart.'}, status=status.HTTP_404_NOT_FOUND)

        if not cart.items:
            cart.restaurant = None

        cart.updated_at = datetime.utcnow()
        cart.save()
        return Response({'message': 'Item removed.', 'cart': cart.to_dict()})
