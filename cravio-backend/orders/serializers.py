from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    food_name = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'food', 'food_name', 'quantity', 'price']

    def get_food_name(self, obj):
        return obj.food.name if obj.food else 'Deleted item'


class OrderItemCreateSerializer(serializers.Serializer):
    food = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    price = serializers.DecimalField(max_digits=8, decimal_places=2)


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.SerializerMethodField()
    restaurant_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'user', 'restaurant', 'restaurant_name', 'customer_name',
                  'status', 'total_amount', 'delivery_address', 'notes', 'items',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_customer_name(self, obj):
        return f'{obj.user.first_name} {obj.user.last_name}'.strip() or obj.user.email

    def get_restaurant_name(self, obj):
        return obj.restaurant.name


class OrderCreateSerializer(serializers.Serializer):
    restaurant = serializers.IntegerField()
    delivery_address = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    items = OrderItemCreateSerializer(many=True)
