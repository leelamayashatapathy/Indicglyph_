"""Homepage content management service."""
import logging
from typing import Optional
from backend.app.db_adapter import db_adapter
from backend.app.models.homepage import (
    HomepageContent,
    HeroContent,
    Testimonial,
    Sponsor,
    FooterContent
)

logger = logging.getLogger(__name__)


class HomepageService:
    """Service for managing homepage content."""
    
    COLLECTION = "homepage_content"
    CONFIG_ID = "homepage_config"

    # TODO: consider caching/static rendering for homepage content if it stays mostly unchanged.
    
    @staticmethod
    async def get_homepage_content() -> HomepageContent:
        """Get current homepage content or create default."""
        try:
            content = await db_adapter.get(HomepageService.COLLECTION, HomepageService.CONFIG_ID)
        except Exception as exc:
            logger.error("Failed to fetch homepage content: %s", exc)
            raise
        
        if not content:
            # Create default homepage content
            default_content = HomepageContent()
            
            # Add default testimonials
            default_content.testimonials = [
                Testimonial(
                    name="Priya Sharma",
                    quote="Contributing to IndicGlyph has been incredibly rewarding. I'm helping build AI that understands my language!",
                    role="Data Reviewer, Hindi",
                    avatar_url=None
                ),
                Testimonial(
                    name="Arjun Patel",
                    quote="The platform is intuitive and the payouts are fair. I love being part of this AI revolution.",
                    role="OCR Specialist, Gujarati",
                    avatar_url=None
                ),
                Testimonial(
                    name="Lakshmi Reddy",
                    quote="IndicGlyph makes it easy to contribute to meaningful work while earning. Highly recommend!",
                    role="Voice Data Reviewer, Telugu",
                    avatar_url=None
                )
            ]
            
            try:
                await db_adapter.upsert(
                    HomepageService.COLLECTION,
                    HomepageService.CONFIG_ID,
                    default_content.dict()
                )
            except Exception as exc:
                logger.error("Failed to seed default homepage content: %s", exc)
                raise
            return default_content
        
        return HomepageContent(**content)
    
    @staticmethod
    async def update_homepage_content(
        hero: Optional[HeroContent] = None,
        testimonials: Optional[list] = None,
        sponsors: Optional[list] = None,
        footer: Optional[FooterContent] = None
    ) -> HomepageContent:
        """Update homepage content."""
        current = await HomepageService.get_homepage_content()
        
        if hero:
            current.hero = hero
        
        if testimonials is not None:
            current.testimonials = [Testimonial(**t) if isinstance(t, dict) else t for t in testimonials]
        
        if sponsors is not None:
            current.sponsors = [Sponsor(**s) if isinstance(s, dict) else s for s in sponsors]
        
        if footer:
            current.footer = footer
        
        try:
            await db_adapter.upsert(
                HomepageService.COLLECTION,
                HomepageService.CONFIG_ID,
                current.dict()
            )
        except Exception as exc:
            logger.error("Failed to update homepage content: %s", exc)
            raise
        
        return current
    
    @staticmethod
    async def update_hero(hero: HeroContent) -> HomepageContent:
        """Update hero section only."""
        return await HomepageService.update_homepage_content(hero=hero)
    
    @staticmethod
    async def update_testimonials(testimonials: list) -> HomepageContent:
        """Update testimonials only."""
        return await HomepageService.update_homepage_content(testimonials=testimonials)
    
    @staticmethod
    async def update_sponsors(sponsors: list) -> HomepageContent:
        """Update sponsors only."""
        return await HomepageService.update_homepage_content(sponsors=sponsors)
    
    @staticmethod
    async def update_footer(footer: FooterContent) -> HomepageContent:
        """Update footer only."""
        return await HomepageService.update_homepage_content(footer=footer)
