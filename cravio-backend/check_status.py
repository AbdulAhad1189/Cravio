import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cravio.settings')
django.setup()

from restaurants.models import Restaurant
from django.db.models import Count

r = Restaurant.objects.filter(owner__email='mariyabharty@gmail.com').first()
if r:
    print(f'Name: {r.name}')
    print(f'Status: {r.status}')
    print(f'City: {r.city}')
    print(f'Cuisine: {r.cuisine}')
else:
    print('No restaurant found for mariyabharty')

print('\nStatus breakdown:')
for item in Restaurant.objects.values('status').annotate(c=Count('id')):
    print(f"  {item['status']}: {item['c']}")
print(f"  TOTAL: {Restaurant.objects.count()}")
