from django.urls import path
from .health_views import health_check

app_name = 'health'

urlpatterns = [
    path('', health_check, name='health'),
]



