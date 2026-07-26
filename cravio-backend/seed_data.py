"""
Run with: python manage.py shell < seed_data.py
Or:       venv\Scripts\python manage.py shell -c "exec(open('seed_data.py').read())"
"""
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cravio.settings')

import django
django.setup()

from users.models import User
from restaurants.models import Restaurant
from foods.models import Category, Food
from datetime import time

print("Seeding data...")

# Create owner user
owner, _ = User.objects.get_or_create(
    email='owner@cravio.app',
    defaults=dict(username='owner@cravio.app', first_name='Ravi', last_name='Sharma', role='owner', phone='9876543210')
)
owner.set_password('owner123')
owner.save()

# Create customer user
customer, _ = User.objects.get_or_create(
    email='customer@cravio.app',
    defaults=dict(username='customer@cravio.app', first_name='Priya', last_name='Patel', role='customer', phone='9876500000')
)
customer.set_password('customer123')
customer.save()

# Create categories
cats = {}
for name, icon in [('North Indian', ''), ('Italian', ''), ('Chinese', ''), ('Cafe', ''), ('Biryani', ''), ('Pizza', ''), ('Desserts', ''), ('South Indian', '')]:
    cat, _ = Category.objects.get_or_create(name=name, defaults={'icon': icon})
    cats[name] = cat

# Create restaurants
restaurants_data = [
    dict(name='Olive Bistro', cuisine='Italian, Continental', address='12 MG Road', city='Bengaluru', phone='9900000001', email='olive@cravio.app', status='approved', opening_time=time(11,0), closing_time=time(23,0)),
    dict(name='The Spice Room', cuisine='North Indian, Mughlai', address='45 Koramangala', city='Bengaluru', phone='9900000002', email='spice@cravio.app', status='approved', opening_time=time(12,0), closing_time=time(22,30)),
    dict(name='Café Willow', cuisine='Cafe, Continental', address='7 Indiranagar', city='Bengaluru', phone='9900000003', email='willow@cravio.app', status='approved', opening_time=time(8,0), closing_time=time(22,0)),
    dict(name='Biryani House', cuisine='Biryani, North Indian', address='88 Jayanagar', city='Bengaluru', phone='9900000004', email='biryani@cravio.app', status='approved', opening_time=time(11,30), closing_time=time(23,30)),
]

created_restaurants = []
for rd in restaurants_data:
    r, created = Restaurant.objects.get_or_create(name=rd['name'], defaults={**rd, 'owner': owner, 'average_rating': 4.3})
    created_restaurants.append(r)
    if created:
        print(f"  Created restaurant: {r.name}")

# Create food items for first restaurant
if created_restaurants:
    r = created_restaurants[0]
    foods = [
        ('Margherita Pizza', cats.get('Pizza'), 299, False, True),
        ('Pasta Arrabiata', cats.get('Italian'), 249, False, True),
        ('Caesar Salad', cats.get('Cafe'), 199, True, True),
        ('Grilled Chicken', cats.get('Italian'), 399, False, True),
        ('Tiramisu', cats.get('Desserts'), 189, True, True),
    ]
    for fname, cat, price, is_veg, avail in foods:
        Food.objects.get_or_create(
            name=fname, restaurant=r,
            defaults=dict(category=cat, price=price, is_veg=is_veg, is_available=avail, description=f'Freshly prepared {fname.lower()}')
        )

    r2 = created_restaurants[1]
    foods2 = [
        ('Butter Chicken', cats.get('North Indian'), 350, False, True),
        ('Dal Makhani', cats.get('North Indian'), 250, True, True),
        ('Biryani Hyderabadi', cats.get('Biryani'), 320, False, True),
        ('Paneer Tikka', cats.get('North Indian'), 280, True, True),
        ('Gulab Jamun', cats.get('Desserts'), 99, True, True),
    ]
    for fname, cat, price, is_veg, avail in foods2:
        Food.objects.get_or_create(
            name=fname, restaurant=r2,
            defaults=dict(category=cat, price=price, is_veg=is_veg, is_available=avail, description=f'Freshly prepared {fname.lower()}')
        )

print("\n✅ Seed complete!")
print("\nTest accounts:")
print("  Admin    → admin@cravio.app    / admin123")
print("  Owner    → owner@cravio.app    / owner123")
print("  Customer → customer@cravio.app / customer123")
