"""
Seed Command — Taste Tracker Tavern
Usage: python manage.py seed [--clear]

Fetches real food data from TheMealDB API (free key '1') to populate:
  - 14 Categories (from MealDB)
  - 5 Restaurants (sample data)
  - 50+ Food items (from MealDB meals)
  - 1 Admin, 2 Owners, 5 Customers
  - 60 Orders (spread over 6 months for analytics)
  - 10 Reservations
  - 15 Reviews
"""
import random
import requests
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand

from api.models import (
    User, Category, Restaurant, Food, Cart, Order, OrderItem,
    Reservation, Review
)

MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1'

RESTAURANT_DATA = [
    {
        'name': 'The Golden Spoon',
        'cuisine': 'American',
        'description': 'Classic American comfort food with a modern twist.',
        'address': '123 Main Street',
        'city': 'New York',
        'phone': '+1-212-555-0101',
        'email': 'info@goldenspoon.com',
        'opening_time': '08:00',
        'closing_time': '23:00',
        'tags': ['burgers', 'steaks', 'comfort food'],
        'image': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    },
    {
        'name': 'Pasta Paradise',
        'cuisine': 'Italian',
        'description': 'Authentic Italian pasta made fresh daily with imported ingredients.',
        'address': '45 Via Roma',
        'city': 'Chicago',
        'phone': '+1-312-555-0202',
        'email': 'ciao@pastaparadise.com',
        'opening_time': '11:00',
        'closing_time': '22:00',
        'tags': ['pasta', 'pizza', 'italian'],
        'image': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    },
    {
        'name': 'Spice Garden',
        'cuisine': 'Indian',
        'description': 'Aromatic curries and tandoor specialties from across India.',
        'address': '78 Curry Lane',
        'city': 'Houston',
        'phone': '+1-713-555-0303',
        'email': 'namaste@spicegarden.com',
        'opening_time': '11:30',
        'closing_time': '22:30',
        'tags': ['curry', 'tandoor', 'vegetarian', 'vegan'],
        'image': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
    },
    {
        'name': 'Ocean Fresh',
        'cuisine': 'Seafood',
        'description': 'Farm-to-table seafood sourced fresh daily from local waters.',
        'address': '99 Harbor View',
        'city': 'Seattle',
        'phone': '+1-206-555-0404',
        'email': 'catch@oceanfresh.com',
        'opening_time': '10:00',
        'closing_time': '21:00',
        'tags': ['seafood', 'healthy', 'fresh'],
        'image': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    },
    {
        'name': 'Sweet Endings',
        'cuisine': 'Dessert',
        'description': 'Award-winning desserts, pastries, and artisan coffee.',
        'address': '22 Sugar Street',
        'city': 'Los Angeles',
        'phone': '+1-310-555-0505',
        'email': 'sweet@sweetendings.com',
        'opening_time': '09:00',
        'closing_time': '20:00',
        'tags': ['desserts', 'pastries', 'coffee', 'bakery'],
        'image': 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800',
    },
]

CUSTOMER_DATA = [
    {'name': 'Alice Johnson', 'email': 'alice@example.com'},
    {'name': 'Bob Martinez', 'email': 'bob@example.com'},
    {'name': 'Carol Williams', 'email': 'carol@example.com'},
    {'name': 'David Chen', 'email': 'david@example.com'},
    {'name': 'Emma Davis', 'email': 'emma@example.com'},
]

REVIEW_COMMENTS = [
    "Absolutely delicious! Will definitely order again.",
    "Great food and fast delivery. Highly recommended!",
    "The flavors were amazing. Restaurant never disappoints.",
    "Good portion sizes and tasty food. A solid choice.",
    "Fantastic experience from ordering to delivery. 5 stars!",
    "Food was a bit cold on arrival but still tasted great.",
    "My go-to restaurant for a quick satisfying meal.",
    "Excellent quality ingredients. You can really taste the difference.",
    "Decent food, nothing extraordinary but reliable.",
    "Best meal I've had this month! Incredible taste.",
]


class Command(BaseCommand):
    help = 'Seed the database with sample data using TheMealDB API'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear all existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('🗑  Clearing existing data...')
            Review.objects.delete()
            Reservation.objects.delete()
            Order.objects.delete()
            Cart.objects.delete()
            Food.objects.delete()
            Category.objects.delete()
            Restaurant.objects.delete()
            User.objects.delete()
            self.stdout.write(self.style.SUCCESS('✓ Database cleared.'))

        self.stdout.write('🌱 Starting database seed...\n')

        # 1. Create users
        admin, owners, customers = self._create_users()

        # 2. Fetch categories from MealDB & create them
        categories = self._seed_categories()

        # 3. Create restaurants (assigned to owners)
        restaurants = self._create_restaurants(owners)

        # 4. Fetch meals from MealDB & create food items
        self._seed_foods(restaurants, categories)

        # 5. Create orders spread over 6 months
        self._create_orders(customers, restaurants)

        # 6. Create reservations
        self._create_reservations(customers, restaurants)

        # 7. Create reviews
        self._create_reviews(customers, restaurants)

        self.stdout.write(self.style.SUCCESS('\n✅ Database seeded successfully!'))
        self.stdout.write('\n📋 Login Credentials:')
        self.stdout.write('  Admin:   admin@cravio.com / admin123')
        self.stdout.write('  Owner 1: owner1@cravio.com / owner123')
        self.stdout.write('  Owner 2: owner2@cravio.com / owner123')
        self.stdout.write('  Customer: alice@example.com / pass123')

    def _create_users(self):
        self.stdout.write('👤 Creating users...')

        # Admin
        admin = User.objects(email='admin@cravio.com').first()
        if not admin:
            admin = User(name='Super Admin', email='admin@cravio.com', role='admin')
            admin.set_password('admin123')
            admin.save()

        # Owners
        owners = []
        for i in range(1, 3):
            email = f'owner{i}@cravio.com'
            owner = User.objects(email=email).first()
            if not owner:
                owner = User(
                    name=f'Restaurant Owner {i}',
                    email=email,
                    role='owner',
                    phone=f'+1-555-000{i}',
                )
                owner.set_password('owner123')
                owner.save()
            owners.append(owner)

        # Customers
        customers = []
        for cd in CUSTOMER_DATA:
            cust = User.objects(email=cd['email']).first()
            if not cust:
                cust = User(name=cd['name'], email=cd['email'], role='customer')
                cust.set_password('pass123')
                cust.save()
            customers.append(cust)

        self.stdout.write(self.style.SUCCESS(f'  ✓ {1 + len(owners) + len(customers)} users created'))
        return admin, owners, customers

    def _seed_categories(self):
        self.stdout.write('📂 Fetching categories from TheMealDB API...')
        try:
            resp = requests.get(f'{MEALDB_BASE}/categories.php', timeout=10)
            resp.raise_for_status()
            mealdb_cats = resp.json().get('categories', [])
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'  ⚠ MealDB unavailable: {e}. Using fallback categories.'))
            mealdb_cats = [
                {'idCategory': str(i), 'strCategory': n, 'strCategoryThumb': '', 'strCategoryDescription': ''}
                for i, n in enumerate(['Beef', 'Chicken', 'Dessert', 'Lamb', 'Pasta', 'Seafood', 'Vegan', 'Vegetarian', 'Breakfast'])
            ]

        categories = []
        for mc in mealdb_cats:
            cat = Category.objects(name=mc['strCategory']).first()
            if not cat:
                cat = Category(
                    name=mc['strCategory'],
                    description=mc.get('strCategoryDescription', '')[:200],
                    image=mc.get('strCategoryThumb', ''),
                    mealdb_id=mc.get('idCategory', ''),
                )
                cat.save()
            categories.append(cat)

        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(categories)} categories seeded from MealDB'))
        return categories

    def _create_restaurants(self, owners):
        self.stdout.write('🍽  Creating restaurants...')
        restaurants = []
        for i, rd in enumerate(RESTAURANT_DATA):
            existing = Restaurant.objects(name=rd['name']).first()
            if existing:
                restaurants.append(existing)
                continue
            owner = owners[i % len(owners)]
            restaurant = Restaurant(
                name=rd['name'],
                owner=owner,
                description=rd['description'],
                cuisine=rd['cuisine'],
                address=rd['address'],
                city=rd['city'],
                phone=rd['phone'],
                email=rd['email'],
                image=rd['image'],
                opening_time=rd['opening_time'],
                closing_time=rd['closing_time'],
                tags=rd['tags'],
                is_approved=True,
                is_active=True,
                rating=round(random.uniform(3.5, 5.0), 1),
                rating_count=random.randint(10, 100),
            )
            restaurant.save()
            restaurants.append(restaurant)
        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(restaurants)} restaurants created'))
        return restaurants

    def _seed_foods(self, restaurants, categories):
        self.stdout.write('🍕 Fetching meals from TheMealDB API...')
        cat_map = {c.name: c for c in categories}

        price_ranges = {
            'The Golden Spoon': (8.99, 24.99),
            'Pasta Paradise': (7.99, 19.99),
            'Spice Garden': (6.99, 18.99),
            'Ocean Fresh': (12.99, 34.99),
            'Sweet Endings': (4.99, 14.99),
        }

        total_foods = 0
        for restaurant in restaurants:
            price_range = price_ranges.get(restaurant.name, (8.99, 22.99))

            # Fetch meals for each category
            added_names = set()
            meals_for_rest = []

            categories_to_fetch = list(cat_map.keys())[:5]
            for cat_name in categories_to_fetch:
                try:
                    resp = requests.get(f'{MEALDB_BASE}/filter.php?c={cat_name}', timeout=8)
                    resp.raise_for_status()
                    meals = resp.json().get('meals', []) or []
                    meals_for_rest.extend([(m, cat_name) for m in meals[:3]])
                except Exception:
                    continue

            # Pick up to 12 unique meals per restaurant
            random.shuffle(meals_for_rest)
            for meal_summary, cat_name in meals_for_rest[:12]:
                meal_name = meal_summary.get('strMeal', '')
                if meal_name in added_names:
                    continue
                added_names.add(meal_name)

                if Food.objects(name=meal_name, restaurant=restaurant).first():
                    continue

                # Fetch full meal details for description
                description = f'A delicious {cat_name} dish.'
                meal_id = meal_summary.get('idMeal', '')
                try:
                    detail_resp = requests.get(f'{MEALDB_BASE}/lookup.php?i={meal_id}', timeout=6)
                    detail_resp.raise_for_status()
                    detail_meals = detail_resp.json().get('meals', [])
                    if detail_meals:
                        meal_detail = detail_meals[0]
                        instructions = meal_detail.get('strInstructions', '')
                        if instructions:
                            description = instructions[:150].strip() + '...'
                except Exception:
                    pass

                food = Food(
                    name=meal_name,
                    restaurant=restaurant,
                    category=cat_map.get(cat_name),
                    description=description,
                    price=round(random.uniform(*price_range), 2),
                    image=meal_summary.get('strMealThumb', ''),
                    is_available=True,
                    mealdb_id=meal_id,
                )
                food.save()
                total_foods += 1

        self.stdout.write(self.style.SUCCESS(f'  ✓ {total_foods} food items seeded from MealDB'))

    def _create_orders(self, customers, restaurants):
        self.stdout.write('📦 Creating sample orders (6 months history)...')
        total = 0
        statuses = ['delivered', 'delivered', 'delivered', 'cancelled', 'pending']

        for month_offset in range(6):
            base_date = datetime.utcnow() - timedelta(days=30 * month_offset)
            orders_this_month = random.randint(8, 15)

            for _ in range(orders_this_month):
                customer = random.choice(customers)
                restaurant = random.choice(restaurants)
                foods = list(Food.objects(restaurant=restaurant).limit(20))
                if not foods:
                    continue

                num_items = random.randint(1, 4)
                chosen = random.sample(foods, min(num_items, len(foods)))
                order_items = []
                total_amount = 0.0

                for food in chosen:
                    qty = random.randint(1, 3)
                    item = OrderItem(
                        food_id=str(food.id),
                        food_name=food.name,
                        food_image=food.image,
                        quantity=qty,
                        price=food.price,
                    )
                    order_items.append(item)
                    total_amount += food.price * qty

                # Randomize timestamp within that month
                days_offset = random.randint(0, 28)
                hours_offset = random.randint(10, 22)
                order_time = base_date - timedelta(days=days_offset) + timedelta(hours=hours_offset - base_date.hour)

                order = Order(
                    user=customer,
                    restaurant=restaurant,
                    items=order_items,
                    total=round(total_amount, 2),
                    delivery_address=f'{random.randint(100, 999)} Sample Street',
                    status=random.choice(statuses),
                    payment_mode=random.choice(['cash', 'card']),
                    created_at=order_time,
                    updated_at=order_time,
                )
                order.save()
                total += 1

        self.stdout.write(self.style.SUCCESS(f'  ✓ {total} orders created'))

    def _create_reservations(self, customers, restaurants):
        self.stdout.write('📅 Creating reservations...')
        total = 0
        statuses = ['confirmed', 'confirmed', 'pending', 'cancelled']
        times = ['12:00', '13:00', '18:00', '19:00', '20:00', '21:00']

        for _ in range(10):
            customer = random.choice(customers)
            restaurant = random.choice(restaurants)
            days_ahead = random.randint(-10, 30)
            date = (datetime.utcnow() + timedelta(days=days_ahead)).strftime('%Y-%m-%d')
            r = Reservation(
                user=customer,
                restaurant=restaurant,
                date=date,
                time=random.choice(times),
                guests=random.randint(1, 8),
                status=random.choice(statuses),
                notes=random.choice(['Window seat preferred', 'Birthday celebration', 'Anniversary dinner', '']),
            )
            r.save()
            total += 1

        self.stdout.write(self.style.SUCCESS(f'  ✓ {total} reservations created'))

    def _create_reviews(self, customers, restaurants):
        self.stdout.write('⭐ Creating reviews...')
        total = 0
        for restaurant in restaurants:
            num_reviews = random.randint(2, 5)
            reviewers = random.sample(customers, min(num_reviews, len(customers)))
            for customer in reviewers:
                if Review.objects(user=customer, restaurant=restaurant).first():
                    continue
                rating = random.randint(3, 5)
                review = Review(
                    user=customer,
                    restaurant=restaurant,
                    rating=rating,
                    comment=random.choice(REVIEW_COMMENTS),
                    created_at=datetime.utcnow() - timedelta(days=random.randint(0, 60)),
                )
                review.save()
                total += 1

            # Update restaurant rating
            all_reviews = Review.objects(restaurant=restaurant)
            if all_reviews.count() > 0:
                avg = sum(r.rating for r in all_reviews) / all_reviews.count()
                restaurant.rating = round(avg, 2)
                restaurant.rating_count = all_reviews.count()
                restaurant.save()

        self.stdout.write(self.style.SUCCESS(f'  ✓ {total} reviews created'))
