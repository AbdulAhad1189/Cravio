"""
Notification views: list, mark read, mark all read.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from ..models import Notification
from ..permissions import IsAuthenticatedUser


class NotificationListView(APIView):
    """GET /api/notifications/ → user's unread+recent notifications"""
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        unread_only = request.GET.get('unread', '').lower() == 'true'
        qs = Notification.objects.filter(user=request.user).order_by('-created_at')[:50]
        if unread_only:
            qs = Notification.objects.filter(user=request.user, is_read=False).order_by('-created_at')[:50]
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({
            'notifications': [n.to_dict() for n in qs],
            'unread_count': unread_count,
        })


class NotificationMarkReadView(APIView):
    """PUT /api/notifications/<pk>/read/ → mark single notification read"""
    permission_classes = [IsAuthenticatedUser]

    def put(self, request, pk):
        try:
            n = Notification.objects.get(id=pk, user=request.user)
            n.is_read = True
            n.save()
            return Response({'message': 'Notification marked as read.'})
        except Exception:
            return Response({'error': 'Notification not found.'}, status=404)


class NotificationMarkAllReadView(APIView):
    """PUT /api/notifications/read-all/ → mark all notifications read"""
    permission_classes = [IsAuthenticatedUser]

    def put(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read.'})
