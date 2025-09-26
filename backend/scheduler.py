from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from content_service import ContentService
from models import ScrapingRequest, Platform
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ContentScrapingScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.content_service = ContentService()

    async def scrape_viral_content_job(self):
        logger.info("Starting scheduled viral content scraping...")

        try:
            scraping_request = ScrapingRequest(
                platforms=[Platform.REDDIT, Platform.GOOGLE, Platform.BING],
                keywords=['viral', 'trending', 'popular', 'hot'],
                limit=50,
                time_range="24h"
            )

            contents = self.content_service.scrape_trending_content(scraping_request)
            logger.info(f"Successfully scraped {len(contents)} viral contents")

        except Exception as e:
            logger.error(f"Error during scheduled scraping: {e}")

    def start_scheduler(self):
        self.scheduler.add_job(
            self.scrape_viral_content_job,
            trigger=IntervalTrigger(hours=2),
            id='viral_content_scraping',
            name='Scrape viral content every 2 hours',
            replace_existing=True
        )

        # Skip initial scraping for now to avoid blocking on startup

        self.scheduler.start()
        logger.info("Content scraping scheduler started")

    def stop_scheduler(self):
        self.scheduler.shutdown()
        logger.info("Content scraping scheduler stopped")

scheduler_instance = ContentScrapingScheduler()