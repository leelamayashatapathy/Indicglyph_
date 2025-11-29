"""Homepage content management models."""
from typing import List, Optional
from pydantic import BaseModel, HttpUrl


class HeroContent(BaseModel):
    """Hero section content."""
    heading: str = "Crowdsourcing AI & OCR Data Review for Indian Languages & Beyond"
    subheading: str = "Build the future of multilingual AI — one word, glyph, and voice at a time."
    cta_primary_label: str = "Join as a Reviewer"
    cta_primary_link: str = "/register"
    cta_secondary_label: str = "Login to Dashboard"
    cta_secondary_link: str = "/login"
    hero_image_url: Optional[str] = None
    background_texture_url: Optional[str] = None


class Testimonial(BaseModel):
    """Single testimonial."""
    name: str
    quote: str
    role: str
    avatar_url: Optional[str] = None


class Sponsor(BaseModel):
    """Single sponsor."""
    name: str
    logo_url: str
    website_url: HttpUrl


class FooterContent(BaseModel):
    """Footer section content."""
    blurb: str = "IndicGlyph Data Studio empowers reviewers worldwide to shape the future of AI for multilingual content."
    company_name: str = "Taapset Technologies Pvt Ltd"
    company_url: HttpUrl = "https://www.taapset.com"
    show_social_links: bool = False
    social_twitter: Optional[str] = None
    social_linkedin: Optional[str] = None
    social_github: Optional[str] = None


class HomepageContent(BaseModel):
    """Complete homepage content configuration."""
    _id: str = "homepage_config"
    hero: HeroContent = HeroContent()
    testimonials: List[Testimonial] = []
    sponsors: List[Sponsor] = []
    footer: FooterContent = FooterContent()


class HomepageUpdateRequest(BaseModel):
    """Request model for updating homepage content."""
    hero: Optional[HeroContent] = None
    testimonials: Optional[List[Testimonial]] = None
    sponsors: Optional[List[Sponsor]] = None
    footer: Optional[FooterContent] = None
