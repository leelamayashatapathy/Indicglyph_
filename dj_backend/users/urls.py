from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    UserProfileView,
    ChangePasswordView,
    logout_view,
    get_balance,
    get_stats,
    UserRetrieveView,
    request_payout
)

app_name = 'users'

urlpatterns = [
    path('register', RegisterView.as_view(), name='register'),
    path('register/', RegisterView.as_view(), name='register-slash'),
    path('login', LoginView.as_view(), name='login'),
    path('login/', LoginView.as_view(), name='login-slash'),
    path('logout', logout_view, name='logout'),
    path('logout/', logout_view, name='logout-slash'),
    path('me', UserProfileView.as_view(), name='profile'),
    path('me/', UserProfileView.as_view(), name='profile-slash'),
    path('change-password', ChangePasswordView.as_view(), name='change-password'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password-slash'),
    path('token/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh-slash'),
]

