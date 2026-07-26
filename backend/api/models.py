"""
Django ORM Models for Cravio
Models: User, Restaurant, Category, Food, Cart, CartItem, Order, OrderItem, Reservation, Review, Notification
"""
from datetime import datetime
from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models


# ─── Query Compatibility Manager ───────────────────────────────────────────────

class MongoEngineLikeUserManager(UserManager):
    def __call__(self, *args, **kwargs):
        return self.filter(*args, **kwargs)
    def delete(self):
        return self.all().delete()


class MongoEngineLikeManager(models.Manager):
    def __call__(self, *args, **kwargs):
        return self.filter(*args, **kwargs)
    def delete(self):
        return self.all().delete()


# ─── User ────────────────────────────────────────────────────────────────────────

class User(AbstractUser):
    ROLE_CHOICES = [
        ('customer', 'Customer'),
        ('owner', 'Restaurant Owner'),
        ('admin', 'Administrator'),
    ]
    
    name = models.CharField(max_length=150, blank=True, default='')
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='customer',
        db_index=True
    )
    phone = models.CharField(max_length=20, blank=True, default='')
    avatar = models.URLField(blank=True, default='')
    address = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Custom query helper manager
    objects = MongoEngineLikeUserManager()
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
        ]
    
    def save(self, *args, **kwargs):
        # Set username as email for compatibility
        if not self.username:
            self.username = self.email
        if not self.email:
            self.email = self.username
        super().save(*args, **kwargs)

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name or self.username,
            'email': self.email,
            'role': self.role,
            'phone': self.phone,
            'avatar': self.avatar,
            'address': self.address,
        }

    def __str__(self):
        return f"{self.email} ({self.role})"


# ─── Category ────────────────────────────────────────────────────────────────────

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, db_index=True)
    description = models.TextField(blank=True, default='')
    image = models.URLField(blank=True, default='')
    mealdb_id = models.CharField(max_length=50, blank=True, default='')
    
    objects = MongoEngineLikeManager()

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'categories'
        ordering = ['name']
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'image': self.image,
            'mealdb_id': self.mealdb_id,
        }

    def __str__(self):
        return self.name


# ─── Restaurant ──────────────────────────────────────────────────────────────────

class Restaurant(models.Model):
    name = models.CharField(max_length=200, db_index=True)
    owner = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='restaurants'
    )
    description = models.TextField(blank=True, default='')
    cuisine = models.CharField(max_length=100, blank=True, default='')
    address = models.TextField(blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='', db_index=True)
    phone = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    image = models.URLField(blank=True, default='')
    rating = models.FloatField(default=0.0)
    rating_count = models.IntegerField(default=0)
    is_approved = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    opening_time = models.TimeField(default='09:00')
    closing_time = models.TimeField(default='22:00')
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    objects = MongoEngineLikeManager()

    class Meta:
        db_table = 'restaurants'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner']),
            models.Index(fields=['is_approved', 'is_active']),
            models.Index(fields=['city']),
        ]
    
    def to_dict(self, include_owner=False):
        d = {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'cuisine': self.cuisine,
            'address': self.address,
            'city': self.city,
            'phone': self.phone,
            'email': self.email,
            'image': self.image,
            'rating': self.rating,
            'rating_count': self.rating_count,
            'is_approved': self.is_approved,
            'is_active': self.is_active,
            'opening_time': self.opening_time.strftime('%H:%M') if self.opening_time else '09:00',
            'closing_time': self.closing_time.strftime('%H:%M') if self.closing_time else '22:00',
            'tags': self.tags,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_owner and self.owner:
            d['owner'] = {
                'id': str(self.owner.id),
                'name': self.owner.name or self.owner.username,
                'email': self.owner.email,
            }
        return d

    def __str__(self):
        return self.name


# ─── Food ────────────────────────────────────────────────────────────────────────

class Food(models.Model):
    name = models.CharField(max_length=200, db_index=True)
    restaurant = models.ForeignKey(
        'Restaurant',
        on_delete=models.CASCADE,
        related_name='foods'
    )
    category = models.ForeignKey(
        'Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='foods'
    )
    description = models.TextField(blank=True, default='')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.URLField(blank=True, default='')
    is_available = models.BooleanField(default=True, db_index=True)
    mealdb_id = models.CharField(max_length=50, blank=True, default='')
    mealdb_area = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    
    objects = MongoEngineLikeManager()

    class Meta:
        db_table = 'foods'
        ordering = ['name']
        indexes = [
            models.Index(fields=['restaurant', 'is_available']),
            models.Index(fields=['category']),
        ]
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'restaurant_id': str(self.restaurant.id) if self.restaurant else None,
            'category': {
                'id': str(self.category.id),
                'name': self.category.name
            } if self.category else None,
            'description': self.description,
            'price': float(self.price),
            'image': self.image,
            'is_available': self.is_available,
            'mealdb_id': self.mealdb_id,
            'mealdb_area': self.mealdb_area,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __str__(self):
        return f"{self.name} - {self.restaurant.name}"


# ─── Cart ────────────────────────────────────────────────────────────────────────

class Cart(models.Model):
    user = models.OneToOneField('User', on_delete=models.CASCADE, related_name='cart')
    restaurant = models.ForeignKey('Restaurant', on_delete=models.SET_NULL, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = MongoEngineLikeManager()

    class Meta:
        db_table = 'carts'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._items_list = None

    @property
    def items(self):
        if self._items_list is None:
            if self.pk:
                self._items_list = list(CartItem.objects.filter(cart=self))
            else:
                self._items_list = []
        return self._items_list

    @items.setter
    def items(self, val):
        self._items_list = list(val)

    @property
    def total(self):
        return sum(float(item.price) * item.quantity for item in self.items)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self._items_list is not None:
            current_ids = []
            for item in self._items_list:
                item.cart = self
                item.save()
                current_ids.append(item.id)
            CartItem.objects.filter(cart=self).exclude(id__in=current_ids).delete()

    def to_dict(self):
        rest = None
        if self.restaurant:
            rest = {'id': str(self.restaurant.id), 'name': self.restaurant.name}
        return {
            'restaurant': rest,
            'items': [item.to_dict() for item in self.items],
            'total': round(self.total, 2),
            'item_count': len(self.items),
        }


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='cart_items')
    food = models.ForeignKey(Food, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    objects = MongoEngineLikeManager()

    class Meta:
        db_table = 'cart_items'

    def to_dict(self):
        food_data = None
        if self.food:
            food_data = {
                'id': str(self.food.id),
                'name': self.food.name,
                'image': self.food.image,
                'price': float(self.food.price),
            }
        return {
            'food': food_data,
            'quantity': self.quantity,
            'price': float(self.price),
        }


# ─── Order ───────────────────────────────────────────────────────────────────────

ORDER_STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'delivered', 'rejected', 'cancelled']


class Order(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='orders')
    restaurant = models.ForeignKey('Restaurant', on_delete=models.CASCADE, related_name='orders')
    total = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_address = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=[(s, s) for s in ORDER_STATUSES], default='pending')
    payment_mode = models.CharField(max_length=20, default='cash')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = MongoEngineLikeManager()

    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._items_list = None

    @property
    def items(self):
        if self._items_list is None:
            if self.pk:
                self._items_list = list(OrderItem.objects.filter(order=self))
            else:
                self._items_list = []
        return self._items_list

    @items.setter
    def items(self, val):
        self._items_list = list(val)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self._items_list is not None:
            current_ids = []
            for item in self._items_list:
                item.order = self
                item.save()
                current_ids.append(item.id)
            OrderItem.objects.filter(order=self).exclude(id__in=current_ids).delete()

    def to_dict(self, include_user=False, include_restaurant=False):
        d = {
            'id': str(self.id),
            'items': [item.to_dict() for item in self.items],
            'total': float(round(self.total, 2)),
            'delivery_address': self.delivery_address,
            'status': self.status,
            'payment_mode': self.payment_mode,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_user and self.user:
            d['user'] = {'id': str(self.user.id), 'name': self.user.name or self.user.username, 'email': self.user.email}
        else:
            d['user_id'] = str(self.user.id)
            
        if include_restaurant and self.restaurant:
            d['restaurant'] = {'id': str(self.restaurant.id), 'name': self.restaurant.name, 'image': self.restaurant.image}
        else:
            d['restaurant'] = {'id': str(self.restaurant.id), 'name': self.restaurant.name, 'image': self.restaurant.image}
        return d


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='order_items')
    food_id = models.CharField(max_length=100)
    food_name = models.CharField(max_length=200)
    food_image = models.URLField(blank=True, default='')
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    objects = MongoEngineLikeManager()

    class Meta:
        db_table = 'order_items'

    def to_dict(self):
        return {
            'food_id': self.food_id,
            'food_name': self.food_name,
            'food_image': self.food_image,
            'quantity': self.quantity,
            'price': float(self.price),
            'subtotal': float(round(self.price * self.quantity, 2)),
        }


# ─── Reservation ─────────────────────────────────────────────────────────────────

RESERVATION_STATUSES = ['pending', 'upcoming', 'completed', 'cancelled', 'no_show']


class Reservation(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='reservations')
    restaurant = models.ForeignKey('Restaurant', on_delete=models.CASCADE, related_name='reservations')
    date = models.CharField(max_length=20)          # YYYY-MM-DD
    time = models.CharField(max_length=20)          # HH:MM
    party_size = models.IntegerField(default=2)
    status = models.CharField(max_length=20, default='pending')
    notes = models.TextField(blank=True, default='')
    special_requests = models.TextField(blank=True, default='')
    reminder_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = MongoEngineLikeManager()

    class Meta:
        db_table = 'reservations'
        ordering = ['-created_at']

    def to_dict(self, include_user=True, include_restaurant=True):
        d = {
            'id': str(self.id),
            'date': self.date,
            'time': self.time,
            'party_size': self.party_size,
            'guests': self.party_size,
            'status': self.status,
            'notes': self.notes,
            'special_requests': self.special_requests,
            'reminder_sent': self.reminder_sent,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_user and self.user:
            d['user'] = {
                'id': str(self.user.id),
                'name': self.user.name or self.user.username,
                'email': self.user.email,
                'phone': self.user.phone,
            }
        if include_restaurant and self.restaurant:
            d['restaurant'] = {
                'id': str(self.restaurant.id),
                'name': self.restaurant.name,
                'image': self.restaurant.image,
                'phone': self.restaurant.phone,
                'email': self.restaurant.email,
            }
        return d


# ─── Notification ─────────────────────────────────────────────────────────────────

class Notification(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    type = models.CharField(max_length=30, default='general')
    reservation = models.ForeignKey(Reservation, on_delete=models.SET_NULL, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = MongoEngineLikeManager()

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def to_dict(self):
        return {
            'id': str(self.id),
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'reservation_id': str(self.reservation.id) if self.reservation else None,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ─── Review ──────────────────────────────────────────────────────────────────────

class Review(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='reviews')
    restaurant = models.ForeignKey('Restaurant', on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField()
    comment = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    objects = MongoEngineLikeManager()

    class Meta:
        db_table = 'reviews'
        ordering = ['-created_at']

    def to_dict(self):
        return {
            'id': str(self.id),
            'user': {'id': str(self.user.id), 'name': self.user.name or self.user.username, 'avatar': self.user.avatar} if self.user else None,
            'restaurant_id': str(self.restaurant.id) if self.restaurant else None,
            'rating': self.rating,
            'comment': self.comment,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
