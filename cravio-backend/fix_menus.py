"""
Fix menu items for all Swiggy-scraped restaurants.
Clears wrong/generic menu items and regenerates cuisine-appropriate ones.
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cravio.settings')
django.setup()

from restaurants.models import Restaurant
from foods.models import Food, Category
from restaurants.menu_generator import get_menu_for_restaurant

# Target: all restaurants with a swiggy_id that are NOT mock (swiggy_101-104)
swiggy_restaurants = Restaurant.objects.filter(
    swiggy_id__isnull=False,
    status='approved'
).exclude(
    swiggy_id__startswith='swiggy_'
)

print(f"Found {swiggy_restaurants.count()} Swiggy-scraped restaurants to fix.\n")

for r in swiggy_restaurants:
    old_count = Food.objects.filter(restaurant=r).count()
    # Delete existing wrong menu items
    Food.objects.filter(restaurant=r).delete()
    
    # Generate new cuisine-appropriate items
    menu_items = get_menu_for_restaurant(r)
    
    for item in menu_items:
        cat_name = item.get('category_name', 'General')
        category, _ = Category.objects.get_or_create(name=cat_name)
        
        Food.objects.create(
            restaurant=r,
            name=item['name'],
            description=item.get('description', f"Delicious {item['name']}"),
            price=item['price'],
            is_veg=item['is_veg'],
            is_available=item.get('is_available', True),
            category=category,
        )
    
    new_count = len(menu_items)
    veg_count = sum(1 for i in menu_items if i['is_veg'])
    print(f"  + {r.name} ({r.cuisine})")
    print(f"    Old: {old_count} items -> New: {new_count} items ({veg_count} veg, {new_count - veg_count} non-veg)")

print(f"\nDone! Menu items fixed for {swiggy_restaurants.count()} restaurants.")
