from django.urls import path
from .views import OrderCreateView, MyOrdersView, RestaurantOrdersView, OrderDetailView, OwnerStatsView

urlpatterns = [
    path('', OrderCreateView.as_view(), name='order-create'),
    path('my/', MyOrdersView.as_view(), name='my-orders'),
    path('restaurant/', RestaurantOrdersView.as_view(), name='restaurant-orders'),
    path('stats/', OwnerStatsView.as_view(), name='owner-stats'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
]
