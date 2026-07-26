import re
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from .models import Food, Category
from .serializers import FoodSerializer, CategorySerializer


class IsOwnerOfRestaurant(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.restaurant.owner == request.user


class FoodListView(generics.ListCreateAPIView):
    serializer_class = FoodSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        restaurant_id = self.request.query_params.get('restaurant')
        category_id = self.request.query_params.get('category')
        is_veg = self.request.query_params.get('is_veg')

        if restaurant_id:
            # Sync Swiggy menu on-demand if the restaurant is a Swiggy restaurant and not synced yet
            try:
                from restaurants.models import Restaurant
                restaurant = Restaurant.objects.get(id=restaurant_id)
                if restaurant.swiggy_id:
                    if not Food.objects.filter(restaurant=restaurant).exists():
                        from restaurants.swiggy_helper import sync_swiggy_menu
                        sync_swiggy_menu(restaurant)
            except Exception as e:
                print(f"Error syncing Swiggy menu: {e}")

        qs = Food.objects.select_related('restaurant', 'category')
        if restaurant_id:
            qs = qs.filter(restaurant_id=restaurant_id)
        if category_id:
            qs = qs.filter(category_id=category_id)
        if is_veg is not None:
            qs = qs.filter(is_veg=is_veg.lower() == 'true')
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'owner':
            raise PermissionDenied('Only restaurant owners can add food items.')
        restaurant = user.restaurants.first()
        if not restaurant:
            raise PermissionDenied('No restaurant found for this owner.')
        serializer.save(restaurant=restaurant)


class FoodDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Food.objects.all()
    serializer_class = FoodSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsOwnerOfRestaurant()]


class MyFoodsView(generics.ListAPIView):
    serializer_class = FoodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role != 'owner':
            return Food.objects.none()
        return Food.objects.filter(restaurant__owner=user)


class CategoryListView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

class MenuExtractionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    # Patterns for non-dish content that should be filtered out
    NON_DISH_PATTERNS = [
        re.compile(r'^\+?[\d\s\-\(\)]{7,}$'),                          # Phone numbers
        re.compile(r'[\w\.-]+@[\w\.-]+\.\w+'),                          # Emails
        re.compile(r'https?://|www\.', re.IGNORECASE),                  # URLs/websites
        re.compile(r'\b(open|closed|hours?|timing|we are open)\b', re.IGNORECASE),  # Hours/timing lines
        re.compile(r'\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b', re.IGNORECASE),  # Weekdays
        re.compile(r'\b(am|pm)\b.*\d', re.IGNORECASE),                 # Time expressions like "10am - 10pm"
        re.compile(r'^\d+\s*(am|pm)', re.IGNORECASE),                  # Lines starting with times
        re.compile(r'\b(welcome|thank you|thanks|enjoy|visit us|follow us|call us|contact|reservation|book|address|located|copyright|all rights reserved|est\.?|established)\b', re.IGNORECASE),
        re.compile(r'^(tel|ph|phone|fax|mob|mobile|call)\s*[:.]', re.IGNORECASE),  # Tel:/Ph: labels
        re.compile(r'\b(street|st\.|avenue|ave\.|road|rd\.|lane|ln\.|blvd|nagar|sector|block|colony|floor|plot|flat|no\.|#)\b', re.IGNORECASE),  # Address tokens
        re.compile(r'\b(gst|tax|service charge|inclusive|exclusive|subject to)\b', re.IGNORECASE),  # Tax/billing notes
        re.compile(r'^(note|please note|kindly note|disclaimer|terms|conditions)\b', re.IGNORECASE),  # Disclaimers
        re.compile(r'\b(wifi|wi-fi|password|ssid|free wifi)\b', re.IGNORECASE),    # WiFi info
        re.compile(r'^[\*\-=_#~]{2,}$'),                               # Decorative separator lines
        re.compile(r'^(our|we|the|a|an)\s+\w+\s*$', re.IGNORECASE),   # Generic tagline starters (short)
        re.compile(r'\b(restaurant|cafe|hotel|dhaba|kitchen|diner|bistro|eatery|lounge|bar)\b', re.IGNORECASE),  # Establishment names
        re.compile(r'^\d{4,}$'),                                        # Long standalone numbers (zip codes etc.)
        re.compile(r'\b(since|est)\s+\d{4}\b', re.IGNORECASE),         # "Since 1990" type lines
        re.compile(r'\b(special offer|discount|% off|combo|deal|buy one|get one|free|today only)\b', re.IGNORECASE),  # Promotions
        re.compile(r'^\s*[\(\[{].*[\)\]}]\s*$'),                       # Lines that are purely parenthetical
        re.compile(r'\b(serves?\s+\d|for\s+\d\s+person|portion)\b', re.IGNORECASE),  # Serving size standalone
        re.compile(r'^(page|pg\.?)\s*\d+\s*$', re.IGNORECASE),        # Page numbers
    ]

    # Extended set of menu section headers / category names to skip
    MENU_HEADERS = {
        'appetizers', 'appetizer', 'starters', 'starter',
        'soups', 'soup', 'salads', 'salad',
        'main course', 'mains', 'main', 'entrees', 'entree',
        'sides', 'sides & salads', 'side dishes',
        'desserts', 'dessert', 'sweets',
        'beverages', 'beverage', 'drinks', 'drink', 'juices', 'juice',
        'lunch specials', 'lunch', 'dinner', 'breakfast', 'brunch',
        'specialties', 'chef specials', 'chef\'s special', 'house special',
        'pizza', 'pizzas', 'pasta', 'pastas', 'burgers', 'burger',
        'sandwiches', 'sandwich', 'wraps', 'wrap',
        'platters', 'platter', 'combos', 'combo',
        'biryani', 'biryanis', 'breads', 'bread', 'naan', 'rotis',
        'rice', 'rice dishes', 'noodles', 'chinese', 'indian',
        'north indian', 'south indian', 'mughlai', 'tandoor', 'tandoori',
        'kebabs', 'kebab', 'kabab', 'kababs', 'grills', 'grill',
        'curries', 'curry', 'gravies', 'gravy',
        'veg', 'non veg', 'non-veg', 'vegetarian', 'vegan',
        'seafood', 'sea food', 'fish', 'prawns',
        'kids menu', 'kids', 'for kids',
        'menu', 'our menu', 'food menu',
        'add-ons', 'add ons', 'extras', 'toppings',
        'mocktails', 'cocktails', 'shakes', 'milkshakes', 'smoothies',
        'hot drinks', 'cold drinks', 'cold beverages', 'hot beverages',
        'tea', 'coffee',
    }

    def _is_non_dish_line(self, line: str) -> bool:
        """Return True if the line looks like non-dish content (header, address, etc.)."""
        line_lower = line.lower().strip()

        # Skip empty or too short
        if len(line_lower) < 3:
            return True

        # Skip known category/section headers
        if line_lower in self.MENU_HEADERS:
            return True

        # Skip lines that match known non-dish patterns
        for pattern in self.NON_DISH_PATTERNS:
            if pattern.search(line):
                return True

        # Skip lines that are ALL CAPS and short (typically headings like "MENU", "BEVERAGES")
        if line.isupper() and len(line.split()) <= 3 and not re.search(r'\d', line):
            return True

        # Skip lines that end with a colon (section headers like "Starters:")
        if re.match(r'^[A-Za-z\s&/\']+:$', line):
            return True

        return False

    def _looks_like_dish(self, name: str, has_price: bool) -> bool:
        """Return True if the name looks like an actual food dish."""
        if not name or len(name.strip()) < 3:
            return False

        name_lower = name.lower().strip()

        # Common food keywords — strong positive signal
        food_keywords = [
            'chicken', 'mutton', 'fish', 'prawn', 'shrimp', 'beef', 'pork', 'lamb', 'egg',
            'paneer', 'tofu', 'cheese', 'veg', 'biryani', 'curry', 'masala', 'tikka', 'kebab',
            'kabab', 'korma', 'dal', 'daal', 'rice', 'naan', 'roti', 'paratha', 'dosa', 'idli',
            'sambar', 'rasam', 'soup', 'salad', 'pasta', 'pizza', 'burger', 'sandwich', 'wrap',
            'roll', 'fries', 'waffle', 'pancake', 'shake', 'smoothie', 'juice', 'coffee', 'tea',
            'latte', 'cappuccino', 'espresso', 'mocha', 'chai', 'lassi', 'buttermilk',
            'cake', 'ice cream', 'sundae', 'brownie', 'pudding', 'pie', 'tart', 'cheesecake',
            'raita', 'chutney', 'papad', 'pickle', 'bread', 'toast', 'omelette', 'steak',
            'grilled', 'roasted', 'fried', 'baked', 'steamed', 'tandoori', 'spicy', 'crispy',
            'stuffed', 'loaded', 'special', 'classic', 'signature', 'house',
            'wings', 'nuggets', 'strips', 'platter', 'combo',
        ]
        if any(kw in name_lower for kw in food_keywords):
            return True

        # If it has a price attached, it's very likely a dish even without food keywords
        if has_price:
            # But reject if it's clearly not a dish name despite having a price
            # (e.g. single word that's a number, or address + price)
            word_count = len(name.split())
            if word_count >= 2:
                return True
            # Single word with price — accept only if it looks like a food name
            if word_count == 1 and len(name) >= 4 and not re.match(r'^\d+$', name):
                return True

        return False

    def parse_text_content(self, content):
        extracted_items = []
        lines = [line.strip() for line in content.split('\n') if line.strip()]

        i = 0
        while i < len(lines):
            line = lines[i]
            if not line or line.startswith('#'):
                i += 1
                continue

            line = re.sub(r'\s+', ' ', line).strip()

            # Filter obvious non-dish content early
            if self._is_non_dish_line(line):
                i += 1
                continue

            name = ""
            description = ""
            price = 150.0
            is_veg = True
            has_price = False

            # Try to extract price at end of line
            price_at_end_match = re.search(
                r'[\s\.\-_~:,\*]+(?:\$|Rs\.?|₹|INR)?\s*([0-9]+(?:\.[0-9]+)?)\s*$',
                line, re.IGNORECASE
            )

            if price_at_end_match:
                has_price = True
                price = float(price_at_end_match.group(1))
                name = line[:price_at_end_match.start()].strip()
            else:
                # Try splitting on common delimiters
                parts = None
                for delim in (' - ', ' : ', ' | '):
                    if delim in line:
                        parts = [p.strip() for p in line.split(delim)]
                        break

                if not parts:
                    for delim in ('-', ':', ','):
                        if delim in line:
                            parts = [p.strip() for p in line.split(delim, 2)]
                            break

                if parts:
                    for idx in range(len(parts) - 1, 0, -1):
                        val_str = parts[idx].replace('Rs', '').replace('INR', '').replace('₹', '').replace('$', '').strip()
                        try:
                            price = float(val_str)
                            has_price = True
                            parts.pop(idx)
                            break
                        except ValueError:
                            continue

                    name = parts[0]
                    if len(parts) >= 2:
                        description = " ".join(parts[1:])
                else:
                    # No delimiters — check next line for price
                    if i + 1 < len(lines):
                        next_line = re.sub(r'\s+', ' ', lines[i + 1]).strip()
                        next_line_lower = next_line.lower()
                        if next_line_lower not in self.MENU_HEADERS:
                            next_price_match = re.search(
                                r'[\s\.\-_~:,\*]+(?:\$|Rs\.?|₹|INR)?\s*([0-9]+(?:\.[0-9]+)?)\s*$',
                                next_line, re.IGNORECASE
                            )
                            if next_price_match:
                                name = line
                                price = float(next_price_match.group(1))
                                has_price = True
                                description = next_line[:next_price_match.start()].strip()
                                i += 1
                            else:
                                name = line
                        else:
                            name = line
                    else:
                        name = line

            name = name.strip()

            # Final validation: must look like a real dish
            if not self._looks_like_dish(name, has_price):
                i += 1
                continue

            name_lower = name.lower()
            desc_lower = description.lower()
            combined = f"{name_lower} {desc_lower}"

            # Veg/non-veg detection
            if any(x in combined for x in ('chicken', 'fish', 'meat', 'egg', 'kabab', 'kebab',
                                            'mutton', 'pork', 'beef', 'wings', 'prawn', 'shrimp',
                                            'lamb', 'bacon', 'pepperoni', 'tuna', 'salmon')):
                is_veg = False
            if any(x in combined for x in ('veg', 'tofu', 'paneer', 'cheese', 'mushroom',
                                            'soya', 'soy', 'corn', 'potato', 'spinach')):
                is_veg = True
            if any(x in name_lower for x in ('chicken', 'beef', 'mutton', 'pork', 'shrimp',
                                              'prawn', 'fish', 'lamb', 'bacon', 'pepperoni')):
                is_veg = False

            extracted_items.append({
                'name': name,
                'description': description or f"Delicious {name}",
                'price': price,
                'is_veg': is_veg,
                'is_available': True
            })
            i += 1

        return extracted_items

    def post(self, request, *args, **kwargs):
        if request.user.role != 'owner':
            return Response({'detail': 'Only restaurant owners can extract menus.'}, status=403)

        restaurant = request.user.restaurants.first()
        if not restaurant:
            return Response({'detail': 'No restaurant found. Register your restaurant first.'}, status=400)

        raw_text = request.data.get('raw_text')
        menu_file = request.FILES.get('menu_file')

        if not menu_file and not raw_text:
            return Response({'detail': 'No file uploaded or raw text provided.'}, status=400)

        extracted_items = []
        parsed_text = ""

        if raw_text:
            parsed_text = raw_text
            extracted_items = self.parse_text_content(parsed_text)
        elif menu_file:
            filename = menu_file.name.lower()
            if filename.endswith('.txt'):
                try:
                    content = menu_file.read().decode('utf-8')
                    parsed_text = content
                    extracted_items = self.parse_text_content(content)
                except Exception as e:
                    print(f"Error parsing text file: {e}")
                    return Response({'detail': 'Failed to read text file.'}, status=400)

            else:
                return Response({'detail': 'Only .txt files are supported. Please upload a plain text menu file.'}, status=400)

        # Allow empty items if we got some parsed text, otherwise error out
        if not parsed_text and not extracted_items:
            return Response({'detail': 'No food items could be parsed. Please check your file format (Name - Price per line).'}, status=400)

        return Response({
            'items': extracted_items,
            'raw_text': parsed_text,
            'count': len(extracted_items),
            'message': f'Successfully extracted {len(extracted_items)} items. Please review and modify them below.' if extracted_items else 'Could not parse items automatically. Please edit the text below and click re-parse.'
        })



class BulkFoodCreateView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FoodSerializer

    def post(self, request, *args, **kwargs):
        user = request.user
        if user.role != 'owner':
            return Response({'detail': 'Only restaurant owners can add food items.'}, status=403)
        restaurant = user.restaurants.first()
        if not restaurant:
            return Response({'detail': 'No restaurant found for this owner.'}, status=400)

        items = request.data.get('items', [])
        if not isinstance(items, list):
            return Response({'detail': 'Expected a list of items.'}, status=400)

        saved_items = []
        for item_data in items:
            name = item_data.get('name')
            if not name or not name.strip():
                continue
            
            category_name = item_data.get('category_name')
            category = None
            if category_name:
                category, _ = Category.objects.get_or_create(name=category_name)

            food = Food.objects.create(
                restaurant=restaurant,
                name=name,
                description=item_data.get('description', f"Delicious {name}"),
                price=float(item_data.get('price', 150.0)),
                is_veg=item_data.get('is_veg', True),
                is_available=item_data.get('is_available', True),
                category=category
            )
            saved_items.append(FoodSerializer(food).data)

        return Response({
            'items': saved_items,
            'count': len(saved_items),
            'message': f'Successfully added {len(saved_items)} items to your menu.'
        })

