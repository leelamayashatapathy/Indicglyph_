"""
URL configuration for indic_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/users/', include('users.user_urls')),
    path('api/datasets/', include('datasets.urls')),
    path('api/review/', include('reviews.urls')),
    path('api/dashboard/', include('reviews.dashboard_urls')),
    path('api/operator/', include('admin_console.urls')),
    path('api/analytics/', include('admin_console.analytics_urls')),
    path('api/homepage/', include('admin_console.homepage_urls')),
    path('api/health/', include('admin_console.health_urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
