from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Cart
from .serializers import CartSerializer


class CartListView(generics.ListCreateAPIView):
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user).select_related('food', 'food__restaurant')

    def create(self, request, *args, **kwargs):
        food_id = request.data.get('food')
        quantity = int(request.data.get('quantity', 1))
        cart_item, created = Cart.objects.get_or_create(
            user=request.user,
            food_id=food_id,
            defaults={'quantity': quantity}
        )
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        return Response(CartSerializer(cart_item).data, status=status.HTTP_201_CREATED)


class CartDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)
