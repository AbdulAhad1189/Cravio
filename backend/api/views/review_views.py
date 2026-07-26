"""
Review views: post review, list reviews for a restaurant
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ..models import Review, Restaurant, Order
from ..permissions import IsAuthenticatedUser, IsCustomer


class ReviewListCreateView(APIView):
    """
    GET  /api/reviews/?restaurant={id}  → get reviews for a restaurant
    POST /api/reviews/                  → customer: post review
    """

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsCustomer()]
        return []

    def get(self, request):
        restaurant_id = request.GET.get('restaurant')
        if not restaurant_id:
            return Response({'error': 'restaurant query param required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except Exception:
            return Response({'error': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)

        reviews = Review.objects(restaurant=restaurant).order_by('-created_at')
        return Response({'reviews': [r.to_dict() for r in reviews], 'count': reviews.count()})

    def post(self, request):
        data = request.data
        restaurant_id = data.get('restaurant_id')
        rating = data.get('rating')
        comment = data.get('comment', '')

        if not restaurant_id:
            return Response({'error': 'restaurant_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            rating = int(rating)
            if not (1 <= rating <= 5):
                raise ValueError()
        except (ValueError, TypeError):
            return Response({'error': 'Rating must be between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except Exception:
            return Response({'error': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check if customer already reviewed this restaurant
        existing = Review.objects(user=request.user, restaurant=restaurant).first()
        if existing:
            # Update existing review
            existing.rating = rating
            existing.comment = comment
            existing.save()
            review = existing
            created = False
        else:
            review = Review(
                user=request.user,
                restaurant=restaurant,
                rating=rating,
                comment=comment,
            )
            review.save()
            created = True

        # Update restaurant rating
        all_reviews = Review.objects(restaurant=restaurant)
        avg = sum(r.rating for r in all_reviews) / all_reviews.count()
        restaurant.rating = round(avg, 2)
        restaurant.rating_count = all_reviews.count()
        restaurant.save()

        return Response(
            {'message': 'Review submitted.' if created else 'Review updated.', 'review': review.to_dict()},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )
