from django.urls import path
from .views import (
    get_balance,
    get_stats,
    UserRetrieveView,
    request_payout
)

app_name = 'user_routes'

urlpatterns = [
    path('me/balance/', get_balance, name='balance'),
    path('me/stats/', get_stats, name='stats'),
    path('<str:username>/', UserRetrieveView.as_view(), name='user-detail'),
    path('request-payout/', request_payout, name='request-payout'),
]



