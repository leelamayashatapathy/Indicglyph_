from django.urls import path
from .homepage_views import (
    get_homepage_content,
    update_homepage_content,
    update_hero,
    update_testimonials,
    update_sponsors,
    update_footer,
)

app_name = 'homepage'

urlpatterns = [
    path('content/', get_homepage_content, name='content-get'),
    path('content/update/', update_homepage_content, name='content-update'),
    path('hero/', update_hero, name='hero-update'),
    path('testimonials/', update_testimonials, name='testimonials-update'),
    path('sponsors/', update_sponsors, name='sponsors-update'),
    path('footer/', update_footer, name='footer-update'),
]



