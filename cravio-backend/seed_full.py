"""
Full seed script — covers restaurants across 15+ Indian states with orders, reviews, reservations.
Run with:
  python manage.py shell -c "exec(open('seed_full.py').read())"
"""
import os, random
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cravio.settings')

import django
django.setup()

from datetime import time, timedelta, date
from django.utils import timezone
from django.db import transaction

from users.models import User
from restaurants.models import Restaurant
from foods.models import Category, Food
from orders.models import Order, OrderItem
from reservations.models import Reservation
from reviews.models import Review

print("Starting full seed...")

# ─────────────────────────────────────────────
# 1. USERS
# ─────────────────────────────────────────────
def make_user(email, first, last, role, phone):
    u, created = User.objects.get_or_create(
        email=email,
        defaults=dict(username=email, first_name=first, last_name=last, role=role, phone=phone)
    )
    u.set_password(f'{role}123')
    u.save()
    return u

admin_user  = make_user('admin@cravio.app',    'Admin',   'Cravio',  'admin',    '9000000000')
owner1      = make_user('owner1@cravio.app',   'Ravi',    'Sharma',  'owner',    '9876543210')
owner2      = make_user('owner2@cravio.app',   'Priya',   'Menon',   'owner',    '9876543211')
owner3      = make_user('owner3@cravio.app',   'Arjun',   'Reddy',   'owner',    '9876543212')
owner4      = make_user('owner4@cravio.app',   'Fatima',  'Khan',    'owner',    '9876543213')
owner5      = make_user('owner5@cravio.app',   'Suresh',  'Iyer',    'owner',    '9876543214')

customers = []
CUSTOMER_DATA = [
    ('divya@gmail.com',   'Divya',   'Pillai',  '9800000001'),
    ('rahul@gmail.com',   'Rahul',   'Gupta',   '9800000002'),
    ('sneha@gmail.com',   'Sneha',   'Joshi',   '9800000003'),
    ('karan@gmail.com',   'Karan',   'Singh',   '9800000004'),
    ('meera@gmail.com',   'Meera',   'Nair',    '9800000005'),
    ('aditya@gmail.com',  'Aditya',  'Kumar',   '9800000006'),
    ('pooja@gmail.com',   'Pooja',   'Verma',   '9800000007'),
    ('vikram@gmail.com',  'Vikram',  'Malhotra','9800000008'),
    ('ananya@gmail.com',  'Ananya',  'Das',     '9800000009'),
    ('rohit@gmail.com',   'Rohit',   'Shah',    '9800000010'),
]
for email, first, last, phone in CUSTOMER_DATA:
    customers.append(make_user(email, first, last, 'customer', phone))

print(f"  ✓ {len(customers)+6} users ready")

# ─────────────────────────────────────────────
# 2. FOOD CATEGORIES
# ─────────────────────────────────────────────
CAT_DATA = [
    ('North Indian', ''), ('South Indian', ''), ('Biryani', ''),
    ('Chinese', ''),      ('Italian', ''),       ('Pizza', ''),
    ('Cafe', ''),         ('Desserts', ''),       ('Mughlai', ''),
    ('Street Food', ''),  ('Seafood', ''),        ('Continental', ''),
]
cats = {}
for name, icon in CAT_DATA:
    c, _ = Category.objects.get_or_create(name=name, defaults={'icon': icon})
    cats[name] = c

print(f"  ✓ {len(cats)} categories ready")

# ─────────────────────────────────────────────
# 3. RESTAURANTS — 20 across 15 states
# ─────────────────────────────────────────────
RESTAURANT_DATA = [
    # Karnataka
    dict(name='The Spice Room',      cuisine='North Indian, Mughlai', city='Bengaluru',   state='Karnataka',       pincode='560001', address='45 Koramangala, Bengaluru',     owner=owner1, average_rating=4.7, total_reviews=312),
    dict(name='Café Willow',         cuisine='Cafe, Continental',     city='Bengaluru',   state='Karnataka',       pincode='560038', address='7 Indiranagar, Bengaluru',      owner=owner2, average_rating=4.5, total_reviews=198),
    # Maharashtra
    dict(name='Mumbai Darbar',       cuisine='North Indian, Mughlai', city='Mumbai',      state='Maharashtra',     pincode='400001', address='12 Marine Drive, Mumbai',       owner=owner3, average_rating=4.8, total_reviews=540),
    dict(name='Pav Bhaji Palace',    cuisine='Street Food',           city='Pune',        state='Maharashtra',     pincode='411001', address='22 FC Road, Pune',              owner=owner1, average_rating=4.4, total_reviews=220),
    # Delhi
    dict(name='Dilli Haat Kitchen',  cuisine='North Indian, Mughlai', city='Delhi',       state='Delhi',           pincode='110001', address='Connaught Place, New Delhi',     owner=owner4, average_rating=4.9, total_reviews=720),
    dict(name='Old Delhi Biryani',   cuisine='Biryani, Mughlai',      city='Delhi',       state='Delhi',           pincode='110006', address='Chandni Chowk, Old Delhi',      owner=owner5, average_rating=4.7, total_reviews=485),
    # Tamil Nadu
    dict(name='Murugan Idli Shop',   cuisine='South Indian',          city='Chennai',     state='Tamil Nadu',      pincode='600001', address='14 Anna Salai, Chennai',        owner=owner2, average_rating=4.6, total_reviews=390),
    dict(name='The Marina Seafood',  cuisine='Seafood, Continental',  city='Chennai',     state='Tamil Nadu',      pincode='600004', address='Marina Beach Road, Chennai',    owner=owner3, average_rating=4.5, total_reviews=275),
    # Telangana
    dict(name='Paradise Biryani',    cuisine='Biryani, Mughlai',      city='Hyderabad',   state='Telangana',       pincode='500001', address='MG Road, Hyderabad',            owner=owner4, average_rating=4.9, total_reviews=890),
    dict(name='Chutneys Hyderabad',  cuisine='South Indian',          city='Hyderabad',   state='Telangana',       pincode='500082', address='Banjara Hills, Hyderabad',      owner=owner1, average_rating=4.6, total_reviews=340),
    # West Bengal
    dict(name='Arsalan Kolkata',     cuisine='Biryani, Mughlai',      city='Kolkata',     state='West Bengal',     pincode='700017', address='Park Street, Kolkata',          owner=owner5, average_rating=4.8, total_reviews=610),
    dict(name='Oh! Calcutta',        cuisine='Continental, Seafood',  city='Kolkata',     state='West Bengal',     pincode='700071', address='Forum Mall, Kolkata',           owner=owner2, average_rating=4.5, total_reviews=295),
    # Rajasthan
    dict(name='Lal Mahal Dawat',     cuisine='Rajasthani, North Indian', city='Jaipur',   state='Rajasthan',       pincode='302001', address='Civil Lines, Jaipur',           owner=owner3, average_rating=4.7, total_reviews=430),
    # Gujarat
    dict(name='Agashiye',            cuisine='Gujarati, Street Food', city='Ahmedabad',   state='Gujarat',         pincode='380001', address='House of MG, Ahmedabad',        owner=owner4, average_rating=4.8, total_reviews=510),
    # Punjab
    dict(name='Dhaba on the Street', cuisine='North Indian, Mughlai', city='Chandigarh',  state='Punjab',          pincode='160001', address='Sector 17, Chandigarh',         owner=owner5, average_rating=4.6, total_reviews=380),
    # Kerala
    dict(name='Paragon Restaurant',  cuisine='Seafood, South Indian', city='Kozhikode',   state='Kerala',          pincode='673001', address='SM Street, Kozhikode',          owner=owner1, average_rating=4.7, total_reviews=460),
    # Goa
    dict(name='Fisherman\'s Wharf',  cuisine='Seafood, Continental',  city='Panaji',      state='Goa',             pincode='403001', address='Calapor, Panaji, Goa',          owner=owner2, average_rating=4.8, total_reviews=550),
    # Uttar Pradesh
    dict(name='Tunday Kababi',        cuisine='Mughlai, Street Food', city='Lucknow',     state='Uttar Pradesh',   pincode='226001', address='Aminabad, Lucknow',             owner=owner3, average_rating=4.9, total_reviews=780),
    # Madhya Pradesh
    dict(name='Indian Cafe Bhopal',  cuisine='North Indian, Cafe',   city='Bhopal',      state='Madhya Pradesh',  pincode='462001', address='New Market, Bhopal',            owner=owner4, average_rating=4.3, total_reviews=180),
    # Assam
    dict(name='Khorika',             cuisine='North Indian, Seafood', city='Guwahati',    state='Assam',           pincode='781001', address='GS Road, Guwahati',             owner=owner5, average_rating=4.4, total_reviews=150),
]

restaurants = []
for rd in RESTAURANT_DATA:
    r, created = Restaurant.objects.get_or_create(
        name=rd['name'],
        defaults={
            **rd,
            'status': 'approved',
            'is_active': True,
            'opening_time': time(10, 0),
            'closing_time': time(23, 0),
            'description': f"A popular {rd['cuisine']} restaurant in {rd['city']}, known for authentic flavors and warm hospitality.",
        }
    )
    if created:
        print(f"  + Restaurant: {r.name} ({r.city}, {r.state})")
    restaurants.append(r)

print(f"  ✓ {len(restaurants)} restaurants ready")

# ─────────────────────────────────────────────
# 4. FOOD ITEMS — 5 per restaurant
# ─────────────────────────────────────────────
FOOD_TEMPLATES = {
    'North Indian, Mughlai': [
        ('Butter Chicken',    'Mughlai',    350, False),
        ('Dal Makhani',       'North Indian', 220, True),
        ('Paneer Tikka',      'North Indian', 280, True),
        ('Seekh Kebab',       'Mughlai',    310, False),
        ('Garlic Naan',       'North Indian', 60,  True),
    ],
    'South Indian': [
        ('Masala Dosa',       'South Indian', 120, True),
        ('Idli Sambhar',      'South Indian', 80,  True),
        ('Vada',              'South Indian', 60,  True),
        ('Uttapam',           'South Indian', 110, True),
        ('Filter Coffee',     'Cafe',         50,  True),
    ],
    'Biryani, Mughlai': [
        ('Chicken Dum Biryani','Biryani',    320, False),
        ('Mutton Biryani',    'Biryani',    390, False),
        ('Veg Biryani',       'Biryani',    220, True),
        ('Raita',             'North Indian', 60,  True),
        ('Shorba',            'Mughlai',    90,  False),
    ],
    'Biryani, Mughlai': [
        ('Chicken Dum Biryani','Biryani',    320, False),
        ('Mutton Biryani',    'Biryani',    390, False),
        ('Veg Biryani',       'Biryani',    220, True),
        ('Raita',             'North Indian', 60,  True),
        ('Shorba',            'Mughlai',    90,  False),
    ],
    'Cafe, Continental': [
        ('Cappuccino',        'Cafe',        120, True),
        ('Avocado Toast',     'Continental', 220, True),
        ('Eggs Benedict',     'Continental', 280, False),
        ('Blueberry Muffin',  'Desserts',    90,  True),
        ('Chicken Sandwich',  'Continental', 250, False),
    ],
    'Street Food': [
        ('Pav Bhaji',         'Street Food', 120, True),
        ('Vada Pav',          'Street Food', 40,  True),
        ('Pani Puri',         'Street Food', 60,  True),
        ('Bhel Puri',         'Street Food', 70,  True),
        ('Misal Pav',         'Street Food', 100, True),
    ],
    'Seafood, Continental': [
        ('Grilled Pomfret',   'Seafood',    480, False),
        ('Prawn Masala',      'Seafood',    520, False),
        ('Fish Curry Rice',   'Seafood',    320, False),
        ('Calamari Rings',    'Seafood',    380, False),
        ('Crab Butter Garlic','Seafood',    650, False),
    ],
    'Italian': [
        ('Margherita Pizza',  'Pizza',       320, True),
        ('Pasta Arrabiata',   'Italian',    290, True),
        ('Tiramisu',          'Desserts',    180, True),
        ('Bruschetta',        'Italian',    160, True),
        ('Risotto Fungi',     'Italian',    350, True),
    ],
    'Rajasthani, North Indian': [
        ('Dal Baati Churma',  'North Indian', 280, True),
        ('Laal Maas',         'North Indian', 420, False),
        ('Gatte ki Sabzi',    'North Indian', 200, True),
        ('Kachori',           'Street Food', 60,  True),
        ('Mawa Kachori',      'Desserts',    80,  True),
    ],
    'Gujarati, Street Food': [
        ('Dhokla',            'Street Food', 80,  True),
        ('Thepla',            'Street Food', 60,  True),
        ('Undhiyu',           'North Indian', 200, True),
        ('Fafda Jalebi',      'Street Food', 90,  True),
        ('Handvo',            'Street Food', 100, True),
    ],
    'Seafood, South Indian': [
        ('Karimeen Pollichathu','Seafood',  480, False),
        ('Kerala Prawn Curry', 'Seafood',   420, False),
        ('Fish Molee',        'Seafood',    380, False),
        ('Appam Stew',        'South Indian',160, False),
        ('Kozhikodan Halwa',  'Desserts',   100, True),
    ],
    'North Indian, Cafe': [
        ('Shahi Paneer',      'North Indian', 280, True),
        ('Chicken Korma',     'North Indian', 340, False),
        ('Cold Coffee',       'Cafe',         110, True),
        ('Chocolate Cake',    'Desserts',    150, True),
        ('Veg Biryani',       'Biryani',    200, True),
    ],
    'North Indian, Seafood': [
        ('Masor Tenga',       'Seafood',    280, False),
        ('Chicken Curry',     'North Indian', 300, False),
        ('Aloo Pitika',       'North Indian', 80,  True),
        ('Pitha',             'Desserts',    70,  True),
        ('Duck Curry',        'North Indian', 380, False),
    ],
}

DEFAULT_FOODS = [
    ('Special Thali',     'North Indian', 250, True),
    ('Chicken Curry',     'North Indian', 280, False),
    ('Veg Pulao',         'Biryani',     180, True),
    ('Rasgulla',          'Desserts',    60,  True),
    ('Lassi',             'Cafe',        80,  True),
]

food_items_all = []
for r in restaurants:
    template = FOOD_TEMPLATES.get(r.cuisine, DEFAULT_FOODS)
    for fname, cat_name, price, is_veg in template:
        food, _ = Food.objects.get_or_create(
            name=fname, restaurant=r,
            defaults=dict(
                category=cats.get(cat_name),
                price=price, is_veg=is_veg, is_available=True,
                description=f'Freshly prepared {fname.lower()}',
            )
        )
        food_items_all.append(food)

print(f"  ✓ {len(food_items_all)} food items ready")

# ─────────────────────────────────────────────
# 5. REVIEWS — 3-8 per restaurant
# ─────────────────────────────────────────────
REVIEW_TEXTS = [
    "Absolutely loved the food! The flavours were authentic and the service was great.",
    "One of the best meals I've had in this city. Will definitely come back.",
    "Great ambiance, good food. Slightly pricey but worth it.",
    "The biryani here is unmatched. Highly recommended!",
    "Service was a bit slow but the food made up for it.",
    "Excellent variety on the menu. The desserts were a highlight.",
    "Cosy place with delicious food. Perfect for a date night.",
    "Generous portions and great taste. Value for money.",
    "The seafood was super fresh. Best catch in town!",
    "Authentic regional flavours. Felt like home-cooked food.",
]

review_count = 0
for r in restaurants:
    used_customers = random.sample(customers, min(random.randint(3, 8), len(customers)))
    for rating_offset, customer in enumerate(used_customers):
        rating = min(5, max(3, r.average_rating + random.uniform(-1, 0.5)))
        Review.objects.get_or_create(
            user=customer, restaurant=r,
            defaults=dict(
                rating=int(round(rating)),
                comment=random.choice(REVIEW_TEXTS),
            )
        )
        review_count += 1

print(f"  ✓ {review_count} reviews added")

# ─────────────────────────────────────────────
# 6. ORDERS — realistic volume per restaurant
# ─────────────────────────────────────────────
STATUSES = ['delivered', 'delivered', 'delivered', 'preparing', 'pending', 'cancelled']
ADDRESSES = [
    '12 MG Road, Bengaluru', '45 Sector 17, Delhi', '7 Park Street, Kolkata',
    '88 Anna Salai, Chennai', 'FC Road, Pune', 'Banjara Hills, Hyderabad',
    'Civil Lines, Jaipur', 'GS Road, Guwahati', 'SM Street, Kozhikode',
]

order_count = 0
with transaction.atomic():
    for r in restaurants:
        r_foods = list(Food.objects.filter(restaurant=r))
        if not r_foods:
            continue
        # More orders for higher-rated restaurants — simulates trending
        num_orders = int(r.average_rating * 20) + random.randint(10, 40)
        for i in range(num_orders):
            customer = random.choice(customers)
            selected_foods = random.sample(r_foods, min(random.randint(1, 3), len(r_foods)))
            items_data = [(f, random.randint(1, 3)) for f in selected_foods]
            total = sum(f.price * qty for f, qty in items_data)
            days_ago = random.randint(0, 90)
            order_date = timezone.now() - timedelta(days=days_ago)

            order = Order(
                user=customer,
                restaurant=r,
                status=random.choice(STATUSES),
                total_amount=total,
                delivery_address=random.choice(ADDRESSES),
                created_at=order_date,
            )
            order.save()

            for food, qty in items_data:
                OrderItem.objects.create(order=order, food=food, quantity=qty, price=food.price)
            order_count += 1

print(f"  ✓ {order_count} orders added")

# ─────────────────────────────────────────────
# 7. RESERVATIONS — 2-5 per restaurant
# ─────────────────────────────────────────────
res_count = 0
for r in restaurants:
    for _ in range(random.randint(2, 5)):
        customer = random.choice(customers)
        days_from_now = random.randint(-30, 30)
        res_date = date.today() + timedelta(days=days_from_now)
        Reservation.objects.get_or_create(
            user=customer, restaurant=r, date=res_date,
            defaults=dict(
                time=time(random.choice([13, 14, 19, 20, 21]), 0),
                guests=random.randint(2, 6),
                status=random.choice(['confirmed', 'pending', 'confirmed']),
            )
        )
        res_count += 1

print(f"  ✓ {res_count} reservations added")

print("\n✅ Seed complete!")
print("\nTest accounts:")
print("  Admin    → admin@cravio.app   / admin123")
print("  Owner    → owner1@cravio.app  / owner123")
print("  Customer → divya@gmail.com    / customer123")
print(f"\n  {len(restaurants)} restaurants across 15 states seeded")
