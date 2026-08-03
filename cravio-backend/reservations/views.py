from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Reservation
from .serializers import ReservationSerializer
from .email_service import send_otp_email


class ReservationListView(generics.ListCreateAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Reservation.objects.all()
        restaurant_id = self.request.query_params.get('restaurant')
        if restaurant_id:
            qs = qs.filter(restaurant_id=restaurant_id)
        return qs

    def perform_create(self, serializer):
        reservation = serializer.save(user=self.request.user)
        notification_email = self.request.data.get('notification_email', '').strip() or None
        reservation.generate_and_set_otp()
        send_otp_email(reservation, override_email=notification_email)


class MyReservationsView(generics.ListAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Reservation.objects.filter(user=self.request.user)


class RestaurantReservationsView(generics.ListAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'owner':
            qs = Reservation.objects.filter(restaurant__owner=user)
            restaurant_id = self.request.query_params.get('restaurant')
            if restaurant_id:
                qs = qs.filter(restaurant_id=restaurant_id)
            return qs
        if user.role == 'admin':
            return Reservation.objects.all()
        return Reservation.objects.none()


class ReservationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ('admin', 'owner'):
            return Reservation.objects.all()
        return Reservation.objects.filter(user=user)

    def perform_update(self, serializer):
        instance = serializer.save()
        if 'status' in serializer.validated_data:
            from .email_service import send_status_update_email
            send_status_update_email(instance)

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)



@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def resend_otp(request, pk):
    """Resend OTP for a reservation."""
    try:
        reservation = Reservation.objects.get(pk=pk, user=request.user)
    except Reservation.DoesNotExist:
        return Response({'detail': 'Reservation not found.'}, status=404)

    if reservation.otp_verified:
        return Response({'detail': 'Reservation already confirmed.'}, status=400)

    reservation.generate_and_set_otp()
    sent = send_otp_email(reservation)
    if sent:
        return Response({'detail': 'OTP resent to your email.'})
    return Response({'detail': 'Failed to send OTP. Please try again.'}, status=500)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_otp(request, pk):
    """
    Verify OTP and confirm the reservation request.
    Body: { "otp": "123456" }
    """
    try:
        reservation = Reservation.objects.get(pk=pk, user=request.user)
    except Reservation.DoesNotExist:
        return Response({'detail': 'Reservation not found.'}, status=404)

    if reservation.otp_verified:
        return Response({'detail': 'Email already verified.', 'reservation': ReservationSerializer(reservation).data})

    entered_otp = request.data.get('otp', '').strip()
    if not entered_otp:
        return Response({'detail': 'OTP is required.'}, status=400)

    if reservation.is_otp_valid(entered_otp):
        reservation.otp_verified = True
        reservation.status = 'pending'  # remains pending until owner confirms
        reservation.save(update_fields=['otp_verified', 'status'])
        return Response({
            'detail': 'Email verified! Your reservation request has been submitted to the restaurant for approval.',
            'reservation': ReservationSerializer(reservation).data,
        })

    return Response({'detail': 'Invalid or expired OTP. Please try again.'}, status=400)

