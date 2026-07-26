from django.urls import path
from .views import RestaurantListView, RestaurantDetailView, MyRestaurantView, RestaurantApprovalView, TrendingRestaurantsView, TrendingByStateView

urlpatterns = [
    path('', RestaurantListView.as_view(), name='restaurant-list'),
    path('mine/', MyRestaurantView.as_view(), name='my-restaurant'),
    path('trending/', TrendingRestaurantsView.as_view(), name='restaurant-trending'),
    path('trending/by-state/', TrendingByStateView.as_view(), name='restaurant-trending-by-state'),
    path('<int:pk>/', RestaurantDetailView.as_view(), name='restaurant-detail'),
    path('<int:pk>/approval/', RestaurantApprovalView.as_view(), name='restaurant-approval'),
]
