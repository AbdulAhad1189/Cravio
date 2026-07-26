"""
Reservation views:
- Customer: book, list, cancel own reservations
- Owner: full dashboard per restaurant, categorised by status, status management
- Shared: 2-hour reminder via Notification model (triggered by management command)
"""
from datetime import datetime, date as date_type
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ..models import Reservation, Restaurant, Notification, RESERVATION_STATUSES
from ..permissions import IsAuthenticatedUser


def _auto_update_statuses(reservations):
    """
    Automatically transition pending → upcoming when the reservation is today/future
    and completed when it is past, unless manually set to no_show or cancelled.
    Called lazily when fetching reservations for the owner.
    """
    today = date_type.today().isoformat()
    now_str = datetime.utcnow().strftime('%H:%M')
    for r in reservations:
        if r.status in ('cancelled', 'no_show', 'completed'):
            continue
        if r.date < today:
            r.status = 'completed'
            r.updated_at = datetime.utcnow()
            r.save()
        elif r.date == today and r.time <= now_str and r.status == 'upcoming':
            # past time today → completed (owner hasn't marked no-show yet)
            r.status = 'completed'
            r.updated_at = datetime.utcnow()
            r.save()
        elif r.status == 'pending':
            # confirmed pending → upcoming (business logic: pending stays pending until owner accepts)
            pass


def _notify(user, title, message, notif_type, reservation=None):
    """Create an in-app notification for a user."""
    try:
        n = Notification(user=user, title=title, message=message, type=notif_type)
        if reservation:
            n.reservation = reservation
        n.save()
    except Exception:
        pass   # never let notification errors break the main flow


class ReservationListCreateView(APIView):
    """
    GET  /api/reservations/             → list (role-based)
    GET  /api/reservations/?restaurant_id=<id>&status=<s>  → owner filtered
    POST /api/reservations/             → customer books a table
    """
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        user = request.user
        status_filter = request.GET.get('status', '').strip()
        restaurant_id = request.GET.get('restaurant_id', '').strip()

        if user.role == 'customer':
            qs = Reservation.objects(user=user).order_by('-created_at')
            if status_filter and status_filter in RESERVATION_STATUSES:
                qs = qs.filter(status=status_filter)
            return Response({'reservations': [r.to_dict() for r in qs]})

        elif user.role == 'owner':
            if restaurant_id:
                try:
                    restaurant = Restaurant.objects.get(id=restaurant_id)
                    if str(restaurant.owner.id) != str(user.id):
                        return Response({'error': 'Access denied.'}, status=403)
                    qs = Reservation.objects(restaurant=restaurant).order_by('-created_at')
                except Exception:
                    return Response({'error': 'Restaurant not found.'}, status=404)
            else:
                restaurants = list(Restaurant.objects(owner=user))
                qs = Reservation.objects(restaurant__in=restaurants).order_by('-created_at')

            qs = list(qs)
            _auto_update_statuses(qs)

            if status_filter and status_filter in RESERVATION_STATUSES:
                qs = [r for r in qs if r.status == status_filter]

            # Build categorised counts
            counts = {s: 0 for s in RESERVATION_STATUSES}
            for r in qs:
                counts[r.status] = counts.get(r.status, 0) + 1

            return Response({
                'reservations': [r.to_dict() for r in qs],
                'counts': counts,
            })

        elif user.role == 'admin':
            qs = Reservation.objects.all().order_by('-created_at').limit(200)
            return Response({'reservations': [r.to_dict() for r in qs]})

        return Response({'reservations': []})

    def post(self, request):
        if request.user.role != 'customer':
            return Response({'error': 'Only customers can make reservations.'}, status=403)

        data = request.data
        restaurant_id = data.get('restaurant_id') or data.get('restaurant')
        date = data.get('date', '').strip()
        time = data.get('time', '').strip()
        party_size = data.get('party_size') or data.get('guests', 2)
        notes = data.get('notes', '')
        special_requests = data.get('special_requests', '')

        errors = {}
        if not restaurant_id:
            errors['restaurant_id'] = 'Restaurant is required.'
        if not date:
            errors['date'] = 'Date is required.'
        if not time:
            errors['time'] = 'Time is required.'
        try:
            party_size = int(party_size)
            if party_size < 1 or party_size > 50:
                errors['party_size'] = 'Party size must be between 1 and 50.'
        except (ValueError, TypeError):
            errors['party_size'] = 'Party size must be a number.'
        if date < date_type.today().isoformat():
            errors['date'] = 'Reservation date must be today or in the future.'

        if errors:
            return Response({'errors': errors}, status=400)

        try:
            restaurant = Restaurant.objects.get(id=restaurant_id, is_approved=True)
        except Exception:
            return Response({'error': 'Restaurant not found or not approved.'}, status=404)

        reservation = Reservation(
            user=request.user,
            restaurant=restaurant,
            date=date,
            time=time,
            party_size=party_size,
            notes=notes,
            special_requests=special_requests,
        )
        reservation.save()

        # Notify the restaurant owner
        try:
            owner = restaurant.owner
            _notify(
                owner,
                title=f'New Reservation — {restaurant.name}',
                message=f'{request.user.name} booked a table for {party_size} on {date} at {time}.',
                notif_type='reservation_new',
                reservation=reservation,
            )
        except Exception:
            pass

        return Response(
            {'message': 'Reservation requested! The restaurant will confirm shortly.', 'reservation': reservation.to_dict()},
            status=201,
        )


class ReservationDetailView(APIView):
    """GET /api/reservations/<pk>/"""
    permission_classes = [IsAuthenticatedUser]

    def get(self, request, pk):
        try:
            r = Reservation.objects.get(id=pk)
        except Exception:
            return Response({'error': 'Reservation not found.'}, status=404)
        user = request.user
        if user.role == 'customer' and str(r.user.id) != str(user.id):
            return Response({'error': 'Access denied.'}, status=403)
        if user.role == 'owner':
            try:
                if str(r.restaurant.owner.id) != str(user.id):
                    return Response({'error': 'Access denied.'}, status=403)
            except Exception:
                return Response({'error': 'Access denied.'}, status=403)
        return Response({'reservation': r.to_dict()})


class ReservationStatusView(APIView):
    """
    PUT /api/reservations/<pk>/status/
    Owner can set: pending → upcoming, completed, cancelled, no_show
    Customer can only cancel their own (→ cancelled)
    Admin can set any status
    """
    permission_classes = [IsAuthenticatedUser]

    # What each role can transition to
    OWNER_ALLOWED = ['upcoming', 'completed', 'cancelled', 'no_show', 'pending']
    CUSTOMER_ALLOWED = ['cancelled']
    ADMIN_ALLOWED = RESERVATION_STATUSES

    def put(self, request, pk):
        try:
            reservation = Reservation.objects.get(id=pk)
        except Exception:
            return Response({'error': 'Reservation not found.'}, status=404)

        user = request.user
        new_status = request.data.get('status', '').strip()

        if new_status not in RESERVATION_STATUSES:
            return Response({'error': f'Invalid status. Must be one of: {", ".join(RESERVATION_STATUSES)}.'}, status=400)

        if user.role == 'owner':
            try:
                if str(reservation.restaurant.owner.id) != str(user.id):
                    return Response({'error': 'Access denied.'}, status=403)
            except Exception:
                return Response({'error': 'Access denied.'}, status=403)
            if new_status not in self.OWNER_ALLOWED:
                return Response({'error': 'Invalid status transition for owner.'}, status=400)
        elif user.role == 'customer':
            if str(reservation.user.id) != str(user.id):
                return Response({'error': 'Access denied.'}, status=403)
            if new_status not in self.CUSTOMER_ALLOWED:
                return Response({'error': 'Customers can only cancel reservations.'}, status=403)
        elif user.role == 'admin':
            if new_status not in self.ADMIN_ALLOWED:
                return Response({'error': 'Invalid status.'}, status=400)
        else:
            return Response({'error': 'Access denied.'}, status=403)

        old_status = reservation.status
        reservation.status = new_status
        reservation.updated_at = datetime.utcnow()
        reservation.save()

        # Notify customer of status change (if owner changed it)
        if user.role in ('owner', 'admin') and old_status != new_status:
            status_labels = {
                'upcoming': 'confirmed ✅',
                'completed': 'marked as completed',
                'cancelled': 'cancelled ❌',
                'no_show': 'marked as no-show',
                'pending': 'set back to pending',
            }
            try:
                cust = reservation.user
                _notify(
                    cust,
                    title='Reservation Update',
                    message=f'Your reservation at {reservation.restaurant.name} on {reservation.date} at {reservation.time} has been {status_labels.get(new_status, new_status)}.',
                    notif_type='reservation_status',
                    reservation=reservation,
                )
            except Exception:
                pass

        return Response({'message': f'Reservation updated to {new_status}.', 'reservation': reservation.to_dict()})


class ReservationStatsView(APIView):
    """GET /api/reservations/stats/ → owner gets counts per status for their restaurant"""
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        user = request.user
        restaurant_id = request.GET.get('restaurant_id', '')

        if user.role == 'owner':
            if restaurant_id:
                try:
                    restaurant = Restaurant.objects.get(id=restaurant_id, owner=user)
                except Exception:
                    return Response({'error': 'Restaurant not found.'}, status=404)
                qs = Reservation.objects(restaurant=restaurant)
            else:
                restaurants = list(Restaurant.objects(owner=user))
                qs = Reservation.objects(restaurant__in=restaurants)
        elif user.role == 'admin':
            qs = Reservation.objects.all()
        else:
            return Response({'error': 'Access denied.'}, status=403)

        counts = {s: qs.filter(status=s).count() for s in RESERVATION_STATUSES}
        counts['total'] = sum(counts.values())
        return Response({'counts': counts})
