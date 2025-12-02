from django.urls import path
from .views import (
    SubmitReviewView,
    get_review_stats,
    get_my_reviews,
    flag_item
)

app_name = 'reviews'

urlpatterns = [
    path('submit/', SubmitReviewView.as_view(), name='submit'),
    path('stats/', get_review_stats, name='stats'),
    path('my-reviews/', get_my_reviews, name='my-reviews'),
    path('flag/', flag_item, name='flag'),
]



