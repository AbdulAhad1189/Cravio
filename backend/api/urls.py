from django.urls import path
from .views.auth_views import RegisterView, LoginView, MeView, LogoutView
from .views.restaurant_views import (
    RestaurantListCreateView, RestaurantDetailView,
    RestaurantMenuView, OwnerRestaurantsView
)
from .views.food_views import FoodListCreateView, FoodDetailView, CategoryListView
from .views.cart_views import CartView, CartItemView
from .views.order_views import OrderListCreateView, OrderDetailView, OrderStatusView
from .views.reservation_views import (
    ReservationListCreateView, ReservationDetailView,
    ReservationStatusView, ReservationStatsView,
)
from .views.notification_views import (
    NotificationListView, NotificationMarkReadView, NotificationMarkAllReadView,
)
from .views.review_views import ReviewListCreateView
from .views.admin_views import (
    AdminRestaurantListView, AdminRestaurantApproveView,
    AdminUserListView, AdminUserDetailView, AdminStatsView
)
from .views.analytics_views import (
    RestaurantAnalyticsView, PlatformAnalyticsView, RevenuePredictionView
)

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/me/', MeView.as_view(), name='auth-me'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),

    # ── Restaurants ───────────────────────────────────────────────────
    path('restaurants/', RestaurantListCreateView.as_view(), name='restaurant-list'),
    path('restaurants/mine/', OwnerRestaurantsView.as_view(), name='owner-restaurants'),
    path('restaurants/<str:pk>/', RestaurantDetailView.as_view(), name='restaurant-detail'),
    path('restaurants/<str:pk>/menu/', RestaurantMenuView.as_view(), name='restaurant-menu'),

    # ── Foods & Categories ────────────────────────────────────────────
    path('foods/', FoodListCreateView.as_view(), name='food-list'),
    path('foods/<str:pk>/', FoodDetailView.as_view(), name='food-detail'),
    path('categories/', CategoryListView.as_view(), name='category-list'),

    # ── Cart ──────────────────────────────────────────────────────────
    path('cart/', CartView.as_view(), name='cart'),
    path('cart/item/<str:food_id>/', CartItemView.as_view(), name='cart-item'),

    # ── Orders ────────────────────────────────────────────────────────
    path('orders/', OrderListCreateView.as_view(), name='order-list'),
    path('orders/<str:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/<str:pk>/status/', OrderStatusView.as_view(), name='order-status'),

    # ── Reservations ───────────────────────────────────────────────
    path('reservations/', ReservationListCreateView.as_view(), name='reservation-list'),
    path('reservations/stats/', ReservationStatsView.as_view(), name='reservation-stats'),
    path('reservations/<str:pk>/', ReservationDetailView.as_view(), name='reservation-detail'),
    path('reservations/<str:pk>/status/', ReservationStatusView.as_view(), name='reservation-status'),

    # ── Notifications ───────────────────────────────────────────────
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/read-all/', NotificationMarkAllReadView.as_view(), name='notification-read-all'),
    path('notifications/<str:pk>/read/', NotificationMarkReadView.as_view(), name='notification-read'),

    # ── Reviews ───────────────────────────────────────────────────────
    path('reviews/', ReviewListCreateView.as_view(), name='review-list'),

    # ── Admin ─────────────────────────────────────────────────────────
    path('admin/restaurants/', AdminRestaurantListView.as_view(), name='admin-restaurants'),
    path('admin/restaurants/<str:pk>/approve/', AdminRestaurantApproveView.as_view(), name='admin-approve'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<str:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),

    # ── Analytics ─────────────────────────────────────────────────────
    path('analytics/restaurant/<str:pk>/', RestaurantAnalyticsView.as_view(), name='analytics-restaurant'),
    path('analytics/platform/', PlatformAnalyticsView.as_view(), name='analytics-platform'),
    path('analytics/predict/<str:pk>/', RevenuePredictionView.as_view(), name='analytics-predict'),
]
