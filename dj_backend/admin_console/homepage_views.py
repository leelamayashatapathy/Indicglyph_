from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from reviews.models import HomepageContent
from .permissions import IsPlatformOperator


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPlatformOperator])
def get_homepage_content(request):
    """Get homepage content."""
    content = HomepageContent.get_content()
    return Response({
        'hero': content.hero or {},
        'testimonials': content.testimonials or [],
        'sponsors': content.sponsors or [],
        'footer': content.footer or {}
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsPlatformOperator])
def update_homepage_content(request):
    """Update full homepage content."""
    content = HomepageContent.get_content()
    
    if 'hero' in request.data:
        content.hero = request.data['hero']
    if 'testimonials' in request.data:
        content.testimonials = request.data['testimonials']
    if 'sponsors' in request.data:
        content.sponsors = request.data['sponsors']
    if 'footer' in request.data:
        content.footer = request.data['footer']
    
    content.save()
    
    return Response({
        'hero': content.hero,
        'testimonials': content.testimonials,
        'sponsors': content.sponsors,
        'footer': content.footer
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsPlatformOperator])
def update_hero(request):
    """Update hero section."""
    content = HomepageContent.get_content()
    content.hero = request.data
    content.save()
    return Response(content.hero)


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsPlatformOperator])
def update_testimonials(request):
    """Update testimonials section."""
    content = HomepageContent.get_content()
    content.testimonials = request.data if isinstance(request.data, list) else [request.data]
    content.save()
    return Response(content.testimonials)


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsPlatformOperator])
def update_sponsors(request):
    """Update sponsors section."""
    content = HomepageContent.get_content()
    content.sponsors = request.data if isinstance(request.data, list) else [request.data]
    content.save()
    return Response(content.sponsors)


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsPlatformOperator])
def update_footer(request):
    """Update footer section."""
    content = HomepageContent.get_content()
    content.footer = request.data
    content.save()
    return Response(content.footer)



