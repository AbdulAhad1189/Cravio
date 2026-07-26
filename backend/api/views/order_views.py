"""
Order views: place order, list, update status
"""
from datetime import datetime
from django.core.mail import send_mail
from django.conf import settings as dj_settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ..models import Order, OrderItem, Cart, Restaurant, Food
from ..permissions import IsAuthenticatedUser, IsCustomer, IsOwner


class OrderListCreateView(APIView):
    """
    GET  /api/orders/  → customer: order history / owner: restaurant orders
    POST /api/orders/  → customer: place order (checkout)
    """
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        user = request.user
        if user.role == 'customer':
            orders = Order.objects(user=user).order_by('-created_at')
            return Response({'orders': [o.to_dict(include_restaurant=True) for o in orders]})

        elif user.role == 'owner':
            restaurant_id = request.GET.get('restaurant_id')
            if restaurant_id:
                try:
                    restaurant = Restaurant.objects.get(id=restaurant_id)
                    if str(restaurant.owner.id) != str(user.id):
                        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
                    orders = Order.objects(restaurant=restaurant).order_by('-created_at')
                except Exception:
                    return Response({'error': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)
            else:
                # All restaurants owned by this user
                restaurants = Restaurant.objects(owner=user)
                orders = Order.objects(restaurant__in=restaurants).order_by('-created_at')
            return Response({'orders': [o.to_dict(include_user=True, include_restaurant=True) for o in orders]})

        elif user.role == 'admin':
            orders = Order.objects.all().order_by('-created_at').limit(100)
            return Response({'orders': [o.to_dict(include_user=True, include_restaurant=True) for o in orders]})

        return Response({'orders': []})

    def post(self, request):
        """Place an order from cart or from provided items."""
        if request.user.role != 'customer':
            return Response({'error': 'Only customers can place orders.'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        delivery_address = data.get('delivery_address', request.user.address or '')
        payment_mode = data.get('payment_mode', 'cash')
        notes = data.get('notes', '')

        # Get items from cart or request body
        cart = Cart.objects(user=request.user).first()
        if not cart or not cart.items:
            return Response({'error': 'Your cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        restaurant = None
        try:
            restaurant = cart.restaurant
        except Exception:
            return Response({'error': 'No restaurant associated with cart.'}, status=status.HTTP_400_BAD_REQUEST)

        order_items = []
        total = 0.0
        for cart_item in cart.items:
            try:
                food = cart_item.food
                item = OrderItem(
                    food_id=str(food.id),
                    food_name=food.name,
                    food_image=food.image,
                    quantity=cart_item.quantity,
                    price=cart_item.price,
                )
                order_items.append(item)
                total += cart_item.price * cart_item.quantity
            except Exception:
                continue

        if not order_items:
            return Response({'error': 'No valid items in cart.'}, status=status.HTTP_400_BAD_REQUEST)

        order = Order(
            user=request.user,
            restaurant=restaurant,
            items=order_items,
            total=round(total, 2),
            delivery_address=delivery_address,
            payment_mode=payment_mode,
            notes=notes,
        )
        order.save()

        # Clear cart after successful order
        cart.items = []
        cart.restaurant = None
        cart.save()

        # Send confirmation email
        try:
            send_mail(
                subject=f'Order #{str(order.id)[:8].upper()} Confirmed!',
                message=f'Hi {request.user.name},\n\nYour order from {restaurant.name} has been placed.\nTotal: ${order.total:.2f}\n\nWe\'ll update you when the restaurant accepts it.',
                from_email=dj_settings.DEFAULT_FROM_EMAIL,
                recipient_list=[request.user.email],
                fail_silently=True,
            )
        except Exception:
            pass

        return Response(
            {'message': 'Order placed successfully!', 'order': order.to_dict(include_restaurant=True)},
            status=status.HTTP_201_CREATED
        )


class OrderDetailView(APIView):
    """GET /api/orders/{id}/ → single order detail"""
    permission_classes = [IsAuthenticatedUser]

    def get(self, request, pk):
        try:
            order = Order.objects.get(id=pk)
        except Exception:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Permission check
        user = request.user
        if user.role == 'customer' and str(order.user.id) != str(user.id):
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        if user.role == 'owner':
            try:
                if str(order.restaurant.owner.id) != str(user.id):
                    return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            except Exception:
                return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        return Response({'order': order.to_dict(include_user=True, include_restaurant=True)})


class OrderStatusView(APIView):
    """PUT /api/orders/{id}/status/ → owner: update order status"""
    permission_classes = [IsAuthenticatedUser]

    VALID_TRANSITIONS = {
        'owner': {
            'pending': ['accepted', 'rejected'],
            'accepted': ['preparing'],
            'preparing': ['ready'],
            'ready': ['delivered'],
        },
        'customer': {
            'pending': ['cancelled'],
        },
        'admin': {
            'pending': ['accepted', 'rejected', 'cancelled'],
            'accepted': ['preparing', 'cancelled'],
            'preparing': ['ready', 'cancelled'],
            'ready': ['delivered', 'cancelled'],
        }
    }

    def put(self, request, pk):
        try:
            order = Order.objects.get(id=pk)
        except Exception:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status', '').strip()
        user = request.user

        # Permission check
        if user.role == 'owner':
            try:
                if str(order.restaurant.owner.id) != str(user.id):
                    return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            except Exception:
                return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        elif user.role == 'customer':
            if str(order.user.id) != str(user.id):
                return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        elif user.role != 'admin':
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        # Validate transition
        allowed = self.VALID_TRANSITIONS.get(user.role, {}).get(order.status, [])
        if new_status not in allowed:
            return Response(
                {'error': f'Cannot transition from "{order.status}" to "{new_status}".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = new_status
        order.updated_at = datetime.utcnow()
        order.save()

        # Notify customer by email
        try:
            send_mail(
                subject=f'Order Update — {new_status.capitalize()}',
                message=f'Hi {order.user.name},\n\nYour order #{str(order.id)[:8].upper()} status has been updated to: {new_status.upper()}.',
                from_email=dj_settings.DEFAULT_FROM_EMAIL,
                recipient_list=[order.user.email],
                fail_silently=True,
            )
        except Exception:
            pass

        return Response({'message': f'Order status updated to {new_status}.', 'order': order.to_dict()})
