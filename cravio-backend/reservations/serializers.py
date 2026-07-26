from rest_framework import serializers
from .models import Reservation


class ReservationSerializer(serializers.ModelSerializer):
    customer_name  = serializers.SerializerMethodField()
    restaurant_name = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = '__all__'
        read_only_fields = ['id', 'user', 'status', 'created_at',
                            'otp', 'otp_verified', 'otp_sent_at', 'reminder_sent']

    def get_customer_name(self, obj):
        return f'{obj.user.first_name} {obj.user.last_name}'.strip() or obj.user.email

    def get_restaurant_name(self, obj):
        return obj.restaurant.name

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
