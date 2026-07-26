from rest_framework import serializers
from .models import Cart


class CartSerializer(serializers.ModelSerializer):
    food_name = serializers.SerializerMethodField()
    food_price = serializers.SerializerMethodField()
    food_image = serializers.SerializerMethodField()
    restaurant_name = serializers.SerializerMethodField()
    restaurant_id = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'food', 'quantity', 'food_name', 'food_price', 'food_image', 'restaurant_name', 'restaurant_id', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_food_name(self, obj):
        return obj.food.name

    def get_food_price(self, obj):
        return str(obj.food.price)

    def get_food_image(self, obj):
        if obj.food.image:
            return obj.food.image.url
        return None

    def get_restaurant_name(self, obj):
        return obj.food.restaurant.name

    def get_restaurant_id(self, obj):
        return obj.food.restaurant.id
