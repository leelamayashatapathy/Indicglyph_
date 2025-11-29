"""Homepage content management routes."""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from backend.app.routes.routes_auth import get_current_user
from backend.app.models.homepage import (
    HomepageContent,
    HomepageUpdateRequest,
    HeroContent,
    Testimonial,
    Sponsor,
    FooterContent
)
from backend.app.services.homepage_service import HomepageService

router = APIRouter(prefix="/api/homepage", tags=["Homepage"])
logger = logging.getLogger(__name__)


def get_operator_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Verify current user is a platform operator."""
    roles = current_user.get("roles", [])
    if "platform_operator" not in roles and "super_operator" not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform operator access required"
        )
    return current_user


@router.get("/content", response_model=HomepageContent)
async def get_homepage_content():
    """
    Get current homepage content (public endpoint).
    Returns hero, testimonials, sponsors, and footer content.
    """
    try:
        return await HomepageService.get_homepage_content()
    except Exception as exc:
        logger.error("Failed to load homepage content: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load homepage content"
        )


@router.put("/content", response_model=HomepageContent)
async def update_homepage_content(
    update: HomepageUpdateRequest,
    current_user: dict = Depends(get_operator_user)
):
    """
    Update homepage content (platform operator only).
    Can update hero, testimonials, sponsors, or footer independently.
    """
    try:
        return await HomepageService.update_homepage_content(
            hero=update.hero,
            testimonials=update.testimonials,
            sponsors=update.sponsors,
            footer=update.footer
        )
    except Exception as exc:
        logger.error("Failed to update homepage content: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update homepage content"
        )


@router.put("/hero", response_model=HomepageContent)
async def update_hero(
    hero: HeroContent,
    current_user: dict = Depends(get_operator_user)
):
    """Update hero section only (platform operator only)."""
    try:
        return await HomepageService.update_hero(hero)
    except Exception as exc:
        logger.error("Failed to update homepage hero section: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update hero section"
        )


@router.put("/testimonials", response_model=HomepageContent)
async def update_testimonials(
    testimonials: List[Testimonial],
    current_user: dict = Depends(get_operator_user)
):
    """Update testimonials section only (platform operator only)."""
    try:
        return await HomepageService.update_testimonials(testimonials)
    except Exception as exc:
        logger.error("Failed to update testimonials: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update testimonials"
        )


@router.put("/sponsors", response_model=HomepageContent)
async def update_sponsors(
    sponsors: List[Sponsor],
    current_user: dict = Depends(get_operator_user)
):
    """Update sponsors section only (platform operator only)."""
    try:
        return await HomepageService.update_sponsors(sponsors)
    except Exception as exc:
        logger.error("Failed to update sponsors: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update sponsors"
        )


@router.put("/footer", response_model=HomepageContent)
async def update_footer(
    footer: FooterContent,
    current_user: dict = Depends(get_operator_user)
):
    """Update footer section only (platform operator only)."""
    try:
        return await HomepageService.update_footer(footer)
    except Exception as exc:
        logger.error("Failed to update footer: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update footer"
        )
