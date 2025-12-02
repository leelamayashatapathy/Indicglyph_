from django.urls import path
from .views import get_assigned_datasets

app_name = 'dashboard'

urlpatterns = [
    path('assigned-datasets/', get_assigned_datasets, name='assigned-datasets'),
]



