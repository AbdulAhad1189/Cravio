import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cravio.settings')
django.setup()
from foods.models import Food

checks = [
    ('Cheesecakes By CakeZone', 'Bakery, Desserts'),
    ('KFC', 'Burgers, Fast Food'),
    ('Starbucks Coffee', 'Beverages, Cafe'),
    ('Jalaram Khaman House', 'Gujarati, Snacks'),
]

for name, label in checks:
    qs = Food.objects.filter(restaurant__name=name)[:12]
    print(f"=== {name} ({label}) ===")
    for f in qs:
        cat = f.category.name if f.category else '-'
        print(f"  {f.name} | veg={f.is_veg} | {cat}")
    print()
