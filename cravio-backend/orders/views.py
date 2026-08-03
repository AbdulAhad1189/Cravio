from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderCreateSerializer


class OrderCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        from restaurants.models import Restaurant
        try:
            restaurant = Restaurant.objects.get(id=data['restaurant'])
        except Restaurant.DoesNotExist:
            return Response({'detail': 'Restaurant not found.'}, status=404)

        order = Order.objects.create(
            user=request.user,
            restaurant=restaurant,
            delivery_address=data['delivery_address'],
            notes=data.get('notes', ''),
            total_amount=data['total_amount'],
        )

        from foods.models import Food
        for item_data in data['items']:
            try:
                food = Food.objects.get(id=item_data['food'])
                OrderItem.objects.create(
                    order=order,
                    food=food,
                    quantity=item_data['quantity'],
                    price=item_data['price'],
                )
            except Food.DoesNotExist:
                pass

        # Clear cart after order
        from cart.models import Cart
        Cart.objects.filter(user=request.user).delete()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class MyOrdersView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items', 'items__food')


class RestaurantOrdersView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Order.objects.all().prefetch_related('items', 'items__food')
        if user.role == 'owner':
            qs = Order.objects.filter(restaurant__owner=user)
            restaurant_id = self.request.query_params.get('restaurant')
            if restaurant_id:
                qs = qs.filter(restaurant_id=restaurant_id)
            return qs.prefetch_related('items', 'items__food')
        return Order.objects.none()


class OrderDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Order.objects.all()
        if user.role == 'owner':
            return Order.objects.filter(restaurant__owner=user)
        return Order.objects.filter(user=user)

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)


class OwnerStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'owner':
            return Response({'detail': 'Forbidden'}, status=403)

        orders = Order.objects.filter(restaurant__owner=request.user)
        from foods.models import Food
        total_foods = Food.objects.filter(restaurant__owner=request.user).count()
        revenue = orders.filter(status='delivered').aggregate(total=Sum('total_amount'))['total'] or 0

        return Response({
            'total_orders': orders.count(),
            'pending_orders': orders.filter(status='pending').count(),
            'total_revenue': revenue,
            'total_foods': total_foods,
        })


class OrderTrackView(APIView):
    """
    GET /api/orders/<pk>/track/
    Server-Sent Events endpoint for real-time order status tracking.
    Streams status updates every 3 seconds.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        import json
        import time
        from django.http import StreamingHttpResponse

        def event_stream():
            STATUS_STEPS = ['pending', 'accepted', 'preparing', 'ready', 'delivered']
            last_status = None
            max_iterations = 200  # ~10 minutes at 3s intervals

            for _ in range(max_iterations):
                try:
                    order = Order.objects.get(pk=pk, user=request.user)
                except Order.DoesNotExist:
                    yield f"data: {json.dumps({'error': 'Order not found'})}\n\n"
                    break

                current_status = order.status
                step_index = STATUS_STEPS.index(current_status) if current_status in STATUS_STEPS else 0

                if current_status != last_status:
                    payload = {
                        'order_id': order.id,
                        'status': current_status,
                        'step_index': step_index,
                        'total_steps': len(STATUS_STEPS),
                        'restaurant': order.restaurant.name,
                        'updated_at': order.updated_at.isoformat(),
                    }
                    yield f"data: {json.dumps(payload)}\n\n"
                    last_status = current_status

                if current_status in ('delivered', 'cancelled'):
                    yield f"data: {json.dumps({'done': True, 'status': current_status})}\n\n"
                    break

                time.sleep(3)

        response = StreamingHttpResponse(
            event_stream(),
            content_type='text/event-stream',
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response
