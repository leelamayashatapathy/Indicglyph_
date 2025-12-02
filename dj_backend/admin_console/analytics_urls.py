from django.urls import path
from .analytics_views import (
    get_reviewer_analytics,
    get_dataset_analytics,
    get_flagged_items,
)

app_name = 'analytics'

urlpatterns = [
    path('reviewers/', get_reviewer_analytics, name='reviewers'),
    path('datasets/', get_dataset_analytics, name='datasets'),
    path('flagged-items/', get_flagged_items, name='flagged-items'),
]



