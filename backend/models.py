from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class Platform(str, Enum):
    REDDIT = "reddit"
    YOUTUBE = "youtube"
    GOOGLE = "google"
    BING = "bing"

class ContentType(str, Enum):
    POST = "post"
    VIDEO = "video"
    ARTICLE = "article"
    TWEET = "tweet"

class EngagementMetrics(BaseModel):
    views: Optional[int] = 0
    likes: Optional[int] = 0
    comments: Optional[int] = 0
    shares: Optional[int] = 0
    upvotes: Optional[int] = 0
    downvotes: Optional[int] = 0
    engagement_rate: Optional[float] = 0.0

class ViralContent(BaseModel):
    id: str
    title: str
    platform: Platform
    content_type: ContentType
    url: str
    content_text: Optional[str] = ""
    author: Optional[str] = ""
    published_date: Optional[datetime] = None
    scraped_date: datetime
    engagement_metrics: EngagementMetrics
    viral_score: Optional[float] = 0.0
    tags: List[str] = []
    thumbnail_url: Optional[str] = ""

class ViralPattern(BaseModel):
    hook_strength: float
    emotional_trigger: str
    content_structure: str
    timing_factor: float
    audience_appeal: str

class AffiliateOpportunity(BaseModel):
    product_category: str
    monetization_angle: str
    target_audience: str
    commission_potential: str
    recommended_products: List[str] = []

class ContentAnalysis(BaseModel):
    content_id: str
    viral_patterns: ViralPattern
    affiliate_opportunities: List[AffiliateOpportunity]
    key_insights: List[str]
    success_factors: List[str]
    recommended_adaptations: List[str]

class ContentBrief(BaseModel):
    id: str
    original_content_id: str
    title: str
    hook_suggestions: List[str]
    content_angles: List[str]
    target_audience: str
    call_to_actions: List[str]
    affiliate_products: List[str]
    content_outline: List[str]
    trending_topics: List[str]
    estimated_engagement: float
    generated_date: datetime

class ScrapingRequest(BaseModel):
    platforms: List[Platform]
    keywords: Optional[List[str]] = []
    limit: int = 20
    time_range: Optional[str] = "24h"
    reddit_subreddit: Optional[str] = None

class ScrapingResponse(BaseModel):
    success: bool
    content_count: int
    contents: List[ViralContent]
    message: str