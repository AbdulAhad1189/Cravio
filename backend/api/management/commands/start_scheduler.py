"""
Management command: start_scheduler

Runs a simple in-process scheduler that fires send_reservation_reminders
every 10 minutes. Start this alongside the Django dev server:

    python manage.py start_scheduler

For production, use Windows Task Scheduler or a cron job instead.
"""
import time
from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Start the background scheduler for reservation reminders (runs every 10 min).'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Scheduler started. Reminders fire every 10 minutes.'))
        self.stdout.write('Press Ctrl+C to stop.\n')
        try:
            while True:
                call_command('send_reservation_reminders')
                time.sleep(600)   # 10 minutes
        except KeyboardInterrupt:
            self.stdout.write('\nScheduler stopped.')
