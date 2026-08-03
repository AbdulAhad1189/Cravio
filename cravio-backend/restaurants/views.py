from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from datetime import timedelta
from .models import Restaurant
from .serializers import RestaurantSerializer


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user or request.user.role == 'admin'


class RestaurantListView(generics.ListCreateAPIView):
    serializer_class = RestaurantSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        city    = self.request.query_params.get('city', '').strip()

        # Trigger Swiggy restaurants sync if querying a recognized city
        if city:
            from .swiggy_helper import CITY_COORDINATES, sync_swiggy_restaurants
            city_key = city.lower()
            if city_key in CITY_COORDINATES and not Restaurant.objects.filter(city__iexact=city, swiggy_id__isnull=False).exists():
                try:
                    sync_swiggy_restaurants(city_name=city)
                except Exception as e:
                    print(f"Error syncing Swiggy restaurants for city {city}: {e}")

        # If the database has no synced Swiggy restaurants at all, sync default city (bengaluru)
        if not Restaurant.objects.filter(swiggy_id__isnull=False).exists():
            try:
                from .swiggy_helper import sync_swiggy_restaurants
                sync_swiggy_restaurants(city_name='bengaluru')
            except Exception as e:
                print(f"Error syncing default Swiggy restaurants: {e}")

        qs = Restaurant.objects.all()
        status_param = self.request.query_params.get('status')
        search  = self.request.query_params.get('search', '').strip()
        cuisine = self.request.query_params.get('cuisine', '').strip()

        user = self.request.user
        if not user.is_authenticated or user.role not in ('admin', 'owner'):
            qs = qs.filter(status='approved')
        elif status_param:
            qs = qs.filter(status=status_param)

        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(cuisine__icontains=search) |
                Q(city__icontains=search) |
                Q(address__icontains=search)
            )
        if cuisine and cuisine != 'all':
            qs = qs.filter(cuisine__icontains=cuisine)
        if city:
            qs = qs.filter(
                Q(city__iexact=city) |
                Q(state__iexact=city) |
                Q(address__icontains=city)
            )
        return qs

    def perform_create(self, serializer):
        if self.request.user.role != 'owner':
            raise PermissionDenied('Only restaurant owners can register restaurants.')
        # New restaurants start as pending — admin must approve
        serializer.save(owner=self.request.user, status='pending')


class RestaurantDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]


class MyRestaurantView(generics.ListCreateAPIView):
    """Returns all restaurants owned by the logged-in owner."""
    serializer_class = RestaurantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Restaurant.objects.filter(owner=self.request.user)

    def get(self, request, *args, **kwargs):
        qs = self.get_queryset()
        if not qs.exists():
            raise NotFound('No restaurant found for this owner.')
        # Return first restaurant for dashboard compat
        serializer = self.get_serializer(qs.first())
        return Response(serializer.data)


class RestaurantApprovalView(generics.GenericAPIView):
    """
    Admin-only endpoint to approve or reject a restaurant registration.
    PATCH /api/restaurants/<id>/approval/
    Body: { "status": "approved" | "rejected", "rejection_reason": "..." }
    """
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'detail': 'Only admins can approve or reject restaurants.'}, status=403)

        try:
            restaurant = Restaurant.objects.get(pk=pk)
        except Restaurant.DoesNotExist:
            return Response({'detail': 'Restaurant not found.'}, status=404)

        new_status = request.data.get('status')
        if new_status not in ('approved', 'rejected', 'pending'):
            return Response({'detail': 'Invalid status. Must be approved, rejected, or pending.'}, status=400)

        restaurant.status = new_status
        restaurant.save(update_fields=['status'])

        serializer = self.get_serializer(restaurant)
        action_label = {
            'approved': 'approved and is now live',
            'rejected': 'rejected',
            'pending':  'set back to pending review',
        }[new_status]

        return Response({
            'restaurant': serializer.data,
            'message': f'"{restaurant.name}" has been {action_label}.',
        })


class TrendingRestaurantsView(APIView):
    """
    GET /api/restaurants/trending/
    Query params:
      - city   (optional) — filter to city
      - state  (optional) — filter to state
      - limit  (optional, default 10)

    Returns top trending restaurants scored by orders (50%), rating (30%), reviews (20%).
    Falls back to national trending if location has no matches.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from .trending import get_trending_queryset
        city  = request.query_params.get('city', '').strip()
        state = request.query_params.get('state', '').strip()
        limit = int(request.query_params.get('limit', 10))

        restaurants, location_filtered = get_trending_queryset(
            city=city or None,
            state=state or None,
            limit=limit,
        )

        data = []
        for r in restaurants:
            serializer = RestaurantSerializer(r, context={'request': request})
            row = serializer.data
            row['trending_score'] = r.trending_score
            row['recent_orders']  = r.recent_orders
            data.append(row)

        return Response({
            'results': data,
            'location_filtered': location_filtered,
            'city':  city  or None,
            'state': state or None,
        })


class TrendingByStateView(APIView):
    """
    GET /api/restaurants/trending/by-state/
    Admin-only. Returns top restaurants per state.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'detail': 'Admin only.'}, status=403)

        from .trending import trending_by_state
        limit = int(request.query_params.get('limit', 3))
        state_data = trending_by_state(limit_per_state=limit)

        result = {}
        for state, rests in state_data.items():
            result[state] = []
            for r in rests:
                serializer = RestaurantSerializer(r, context={'request': request})
                row = serializer.data
                row['trending_score'] = r.trending_score
                row['recent_orders']  = r.recent_orders
                result[state].append(row)

        return Response(result)


SIMILAR_CUISINES = {
    'pizza': ['pizza', 'italian', 'fast food', 'continental', 'american', 'burger'],
    'desserts': ['dessert', 'bakery', 'ice cream', 'sweet', 'cake'],
    'cafe': ['cafe', 'coffee', 'bakery', 'continental', 'beverages'],
    'italian': ['italian', 'pizza', 'pasta', 'continental'],
    'north indian': ['north indian', 'mughlai', 'punjabi', 'tandoori', 'dhaba'],
    'south indian': ['south indian', 'dosa', 'idli', 'kerala', 'chettinad'],
    'biryani': ['biryani', 'mughlai', 'hyderabadi'],
    'chinese': ['chinese', 'asian', 'thai'],
}


class RandomRestaurantView(APIView):
    """
    GET /api/restaurants/random/
    Returns one random approved restaurant in the user's city matching the selected cuisine or similar cuisines.
    Query params: cuisine, city, state, exclude
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        import random as rnd
        cuisine = request.query_params.get('cuisine', '').strip()
        city    = request.query_params.get('city', '').strip()
        state   = request.query_params.get('state', '').strip()
        exclude_str = request.query_params.get('exclude', '').strip()

        exclude_ids = []
        if exclude_str:
            try:
                exclude_ids = [int(x) for x in exclude_str.split(',') if x.strip()]
            except ValueError:
                pass

        # Trigger Swiggy sync if querying a specific city
        if city:
            from .swiggy_helper import CITY_COORDINATES, sync_swiggy_restaurants
            city_key = city.lower()
            if city_key in CITY_COORDINATES and not Restaurant.objects.filter(city__iexact=city, swiggy_id__isnull=False).exists():
                try:
                    sync_swiggy_restaurants(city_name=city)
                except Exception as e:
                    print(f"Error syncing Swiggy restaurants for city {city}: {e}")

        base_qs = Restaurant.objects.filter(status='approved', is_active=True)

        if city:
            city_qs = base_qs.filter(Q(city__iexact=city) | Q(address__icontains=city))
            
            # Filter cuisine using similar keywords if available
            if cuisine:
                cuisines_list = SIMILAR_CUISINES.get(cuisine.lower(), [cuisine.lower()])
                q_filter = Q()
                for c_kw in cuisines_list:
                    q_filter |= Q(cuisine__icontains=c_kw)
                target_qs = city_qs.filter(q_filter)
            else:
                target_qs = city_qs

            # Exclude seen IDs if possible
            avail_qs = target_qs.exclude(id__in=exclude_ids) if exclude_ids else target_qs
            ids = list(avail_qs.values_list('id', flat=True))

            # If all were excluded, fall back to target_qs (excluding only the latest seen)
            if not ids and exclude_ids:
                avail_qs = target_qs.exclude(id=exclude_ids[-1])
                ids = list(avail_qs.values_list('id', flat=True))

            # If still empty, use target_qs or city_qs
            if not ids:
                ids = list(target_qs.values_list('id', flat=True))
            if not ids:
                ids = list(city_qs.values_list('id', flat=True))

            if ids:
                picked = Restaurant.objects.get(pk=rnd.choice(ids))
                return Response(RestaurantSerializer(picked, context={'request': request}).data)

            return Response({'detail': f'No restaurants found in {city}.'}, status=404)

        if state:
            state_qs = base_qs.filter(Q(state__iexact=state))
            if cuisine:
                cuisines_list = SIMILAR_CUISINES.get(cuisine.lower(), [cuisine.lower()])
                q_filter = Q()
                for c_kw in cuisines_list:
                    q_filter |= Q(cuisine__icontains=c_kw)
                target_qs = state_qs.filter(q_filter)
            else:
                target_qs = state_qs

            avail_qs = target_qs.exclude(id__in=exclude_ids) if exclude_ids else target_qs
            ids = list(avail_qs.values_list('id', flat=True))

            if not ids and exclude_ids:
                ids = list(target_qs.values_list('id', flat=True))

            if ids:
                picked = Restaurant.objects.get(pk=rnd.choice(ids))
                return Response(RestaurantSerializer(picked, context={'request': request}).data)

            return Response({'detail': f'No restaurants found in {state}.'}, status=404)

        if cuisine:
            cuisines_list = SIMILAR_CUISINES.get(cuisine.lower(), [cuisine.lower()])
            q_filter = Q()
            for c_kw in cuisines_list:
                q_filter |= Q(cuisine__icontains=c_kw)
            target_qs = base_qs.filter(q_filter)
        else:
            target_qs = base_qs

        avail_qs = target_qs.exclude(id__in=exclude_ids) if exclude_ids else target_qs
        ids = list(avail_qs.values_list('id', flat=True))
        if not ids:
            ids = list(base_qs.values_list('id', flat=True))

        if not ids:
            return Response({'detail': 'No restaurants found.'}, status=404)

        picked = Restaurant.objects.get(pk=rnd.choice(ids))
        return Response(RestaurantSerializer(picked, context={'request': request}).data)


class LiveStatusView(APIView):
    """
    GET /api/restaurants/<pk>/live-status/
    Returns real-time crowd level and estimated wait based on recent orders.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            restaurant = Restaurant.objects.get(pk=pk, status='approved')
        except Restaurant.DoesNotExist:
            return Response({'detail': 'Restaurant not found.'}, status=404)

        from orders.models import Order
        recent_orders = Order.objects.filter(
            restaurant=restaurant,
            created_at__gte=timezone.now() - timedelta(hours=1),
        ).exclude(status='cancelled').count()

        # Compute crowd level and wait time
        if recent_orders == 0:
            crowd_level, wait_min, color = 'Low', 5, '#22c55e'
        elif recent_orders <= 5:
            crowd_level, wait_min, color = 'Moderate', 15, '#eab308'
        elif recent_orders <= 12:
            crowd_level, wait_min, color = 'Busy', 30, '#f97316'
        else:
            crowd_level, wait_min, color = 'Very Busy', 50, '#ef4444'

        return Response({
            'restaurant_id':   pk,
            'crowd_level':     crowd_level,
            'estimated_wait':  wait_min,
            'color':           color,
            'recent_orders':   recent_orders,
            'updated_at':      timezone.now().isoformat(),
        })


class CraveMatchView(APIView):
    """
    POST /api/restaurants/cravematch/
    Calculates gourmet personality based on quiz answers and returns matched restaurants.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        answers = request.data.get('answers', [])
        city = request.data.get('city', '').strip()

        if not answers or len(answers) < 5:
            return Response({'detail': 'Please provide answers to all quiz questions.'}, status=400)

        # Trigger Swiggy sync if querying a specific city
        if city:
            if not Restaurant.objects.filter(city__iexact=city, swiggy_id__isnull=False).exists():
                try:
                    from .swiggy_helper import sync_swiggy_restaurants
                    sync_swiggy_restaurants(city_name=city)
                except Exception as e:
                    print(f"Error syncing Swiggy restaurants for city {city}: {e}")


        # Mapping score/choices to personality types
        # Let's say choice sums:
        # Question 1: Spice (0: Mild, 1: Medium, 2: Spicy, 3: Fiery)
        # Question 2: Texture (0: Crispy, 1: Creamy, 2: Saucy, 3: Chewy)
        # Question 3: Vibe (0: Elegant, 1: Casual, 2: Fast-paced, 3: Cozy)
        # Question 4: Sweet vs Savory (0: Sweet, 1: Savory, 2: Bitter, 3: Sour)
        # Question 5: Beverage (0: Coffee, 1: Tea, 2: Wine/Cocktail, 3: Soda/Juice)
        
        # Calculate scores to classify into 4 unique foodie personalities
        spicy_count = answers[0]
        creamy_count = answers[1]
        cozy_count = answers[2]
        sweet_count = answers[3]

        if sweet_count == 0 or sweet_count == 3:
            personality = {
                'title': 'The Sweettooth Sophisticate',
                'description': 'You live for the sweeter things in life. Dessert is never an after-thought for you; it is the main event! You appreciate delicate pastries, decadent chocolates, artisan bakes, and curated coffees in cozy settings.',
                'cuisines': ['Desserts', 'Cafe', 'Bakery'],
                'color': '#C27047'
            }
        elif spicy_count >= 2:
            personality = {
                'title': 'The Bold Adventurer',
                'description': 'You crave intense heat, rich aromatics, and robust textures. Fiery spices, layered slow-cooked dishes like biryani, and zesty street food define your ultimate dining style.',
                'cuisines': ['Biryani', 'North Indian', 'Street Food', 'Chinese'],
                'color': '#D5865C'
            }
        elif cozy_count >= 2 or creamy_count >= 2:
            personality = {
                'title': 'The Cozy Comfort Seeker',
                'description': 'For you, food is a warm hug. You lean towards rich gravies, melted cheese, satisfying carbs, and comforting spaces where you can share pizzas, pastas, or buttery curries with friends.',
                'cuisines': ['Pizza', 'Italian', 'North Indian', 'Cafe'],
                'color': '#E6C687'
            }
        else:
            personality = {
                'title': 'The Herbaceous Connoisseur',
                'description': 'You appreciate fresh, clean, and artisanal food. Fresh herbs, light dressings, sourdough flatbreads, and aromatic teas. You prefer high-quality, authentic flavors that are both nourishing and sophisticated.',
                'cuisines': ['Italian', 'South Indian', 'Cafe'],
                'color': '#A6B98F'
            }

        # Query matching restaurants
        qs = Restaurant.objects.filter(status='approved', is_active=True)
        if city:
            qs = qs.filter(Q(city__icontains=city) | Q(address__icontains=city))

        # Filter by cuisines
        q_filter = Q()
        for cuisine in personality['cuisines']:
            q_filter |= Q(cuisine__icontains=cuisine)
        
        matched_rests = qs.filter(q_filter)[:3]

        # If no restaurants matched, fall back to general approved restaurants
        if not matched_rests.exists():
            matched_rests = qs[:3]

        serializer = RestaurantSerializer(matched_rests, many=True, context={'request': request})

        return Response({
            'personality': personality,
            'restaurants': serializer.data
        })


class RestaurantDuelView(APIView):
    """
    GET /api/restaurants/duel/
    Returns 1 or 2 random approved restaurants in the user's city.
    Optional query params:
      - city: filter to user's city
      - count: number of restaurants to return (1 or 2)
      - exclude: comma-separated list of restaurant IDs to exclude
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        import random as rnd
        city = request.query_params.get('city', '').strip()
        count = int(request.query_params.get('count', 1))
        exclude_str = request.query_params.get('exclude', '').strip()

        exclude_ids = []
        if exclude_str:
            try:
                exclude_ids = [int(x) for x in exclude_str.split(',') if x.strip()]
            except ValueError:
                pass

        # Trigger Swiggy sync if querying a specific city
        if city:
            from .swiggy_helper import CITY_COORDINATES, sync_swiggy_restaurants
            city_key = city.lower()
            if city_key in CITY_COORDINATES and not Restaurant.objects.filter(city__iexact=city, swiggy_id__isnull=False).exists():
                try:
                    sync_swiggy_restaurants(city_name=city)
                except Exception as e:
                    print(f"Error syncing Swiggy restaurants for city {city}: {e}")

        base_qs = Restaurant.objects.filter(status='approved', is_active=True)
        
        # Primary filter by city
        if city:
            city_qs = base_qs.filter(Q(city__iexact=city) | Q(address__icontains=city))
            
            # Exclude IDs
            avail_qs = city_qs.exclude(id__in=exclude_ids) if exclude_ids else city_qs
            ids = list(avail_qs.values_list('id', flat=True))
            
            # If not enough un-excluded restaurants in the city, recycle older excluded ones in this city (except current contender)
            if len(ids) < count:
                if exclude_ids:
                    avail_qs = city_qs.exclude(id=exclude_ids[-1])
                    ids = list(avail_qs.values_list('id', flat=True))
                if len(ids) < count:
                    ids = list(city_qs.values_list('id', flat=True))

            if len(ids) < count:
                return Response({'detail': f'Not enough restaurants found in {city} for a duel.'}, status=404)
        else:
            city_qs = base_qs
            avail_qs = city_qs.exclude(id__in=exclude_ids) if exclude_ids else city_qs
            ids = list(avail_qs.values_list('id', flat=True))
            if len(ids) < count:
                ids = list(city_qs.values_list('id', flat=True))

            if len(ids) < count:
                return Response({'detail': 'Not enough restaurants for a duel.'}, status=404)

        picked_ids = rnd.sample(ids, min(len(ids), count))
        restaurants = Restaurant.objects.filter(id__in=picked_ids)
        restaurants = sorted(restaurants, key=lambda r: picked_ids.index(r.id))
        
        serializer = RestaurantSerializer(restaurants, many=True, context={'request': request})
        return Response(serializer.data)



