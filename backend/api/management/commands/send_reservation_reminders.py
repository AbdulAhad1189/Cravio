"""
Management command: send_reservation_reminders

Finds reservations happening within the next 2 hours (± 5 min window),
sends in-app notifications to both the customer and the restaurant owner,
and marks reminder_sent=True so they are not sent again.

Run via:  python manage.py send_reservation_reminders

Schedule this command to run every 10 minutes using Windows Task Scheduler
or the start_scheduler management command.
"""
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings

from api.models import Reservation, Notification


class Command(BaseCommand):
    help = 'Send 2-hour pre-reservation reminders to customers and restaurant owners.'

    def handle(self, *args, **options):
        now = datetime.utcnow()
        # Reminders fire when reservation is between 1h 55m and 2h 05m from now
        window_start = now + timedelta(hours=1, minutes=55)
        window_end   = now + timedelta(hours=2, minutes=5)

        target_date = window_start.strftime('%Y-%m-%d')
        target_time_min = window_start.strftime('%H:%M')
        target_time_max = window_end.strftime('%H:%M')

        self.stdout.write(f'[{now.strftime("%H:%M")}] Checking reminders for {target_date} between {target_time_min}–{target_time_max}')

        # Fetch qualifying reservations
        reservations = Reservation.objects(
            date=target_date,
            reminder_sent=False,
            status__in=['pending', 'upcoming'],
        )

        sent = 0
        for res in reservations:
            if not (target_time_min <= res.time <= target_time_max):
                continue

            try:
                customer = res.user
                restaurant = res.restaurant
                owner = restaurant.owner
            except Exception as e:
                self.stderr.write(f'  Skipping reservation {res.id}: {e}')
                continue

            date_str = res.date
            time_str = res.time
            party = res.party_size

            # ── In-app notification for customer ────────────────────────────
            Notification(
                user=customer,
                title=f'Reminder: Your reservation at {restaurant.name}',
                message=f'You have a table for {party} at {restaurant.name} today at {time_str}. See you soon!',
                type='reservation_reminder',
                reservation=res,
            ).save()

            # ── In-app notification for restaurant owner ─────────────────────
            Notification(
                user=owner,
                title=f'Upcoming reservation at {restaurant.name}',
                message=f'{customer.name} has a table for {party} today at {time_str}.',
                type='reservation_reminder',
                reservation=res,
            ).save()

            # ── Email to customer ─────────────────────────────────────────────
            try:
                send_mail(
                    subject=f'Reminder: Your table at {restaurant.name}',
                    message=(
                        f'Hi {customer.name},\n\n'
                        f'This is a reminder that you have a reservation at {restaurant.name}.\n\n'
                        f'  Date:       {date_str}\n'
                        f'  Time:       {time_str}\n'
                        f'  Party size: {party}\n'
                        f'  Address:    {restaurant.address}, {restaurant.city}\n\n'
                        f'We look forward to seeing you!\n\n'
                        f'— Cravio'
                    ),
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@cravio.com'),
                    recipient_list=[customer.email],
                    fail_silently=True,
                )
            except Exception:
                pass   # email may not be configured — in-app is the fallback

            # ── Email to restaurant owner ─────────────────────────────────────
            try:
                send_mail(
                    subject=f'Upcoming reservation: {customer.name}',
                    message=(
                        f'Hi {owner.name},\n\n'
                        f'You have an upcoming reservation at {restaurant.name}.\n\n'
                        f'  Guest:      {customer.name}\n'
                        f'  Phone:      {customer.phone or "not provided"}\n'
                        f'  Date:       {date_str}\n'
                        f'  Time:       {time_str}\n'
                        f'  Party size: {party}\n'
                        f'  Notes:      {res.notes or "none"}\n\n'
                        f'— Cravio'
                    ),
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@cravio.com'),
                    recipient_list=[owner.email],
                    fail_silently=True,
                )
            except Exception:
                pass

            # Mark reminder sent
            res.reminder_sent = True
            res.save()
            sent += 1
            self.stdout.write(self.style.SUCCESS(
                f'  ✓ Reminder sent: {customer.name} @ {restaurant.name} ({time_str})'
            ))

        self.stdout.write(f'Done. {sent} reminder(s) sent.')
