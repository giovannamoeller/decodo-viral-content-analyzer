import json
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from scraper import Scraper
from models import ViralContent, Platform, ContentType, EngagementMetrics, ScrapingRequest
import re
import os

class ContentService:
    def __init__(self):
        self.scraper = Scraper()
        self.storage_file = "viral_content_data.json"
        self.content_data = self._load_data()

    def _load_data(self) -> Dict[str, Any]:
        if os.path.exists(self.storage_file):
            with open(self.storage_file, 'r') as f:
                return json.load(f)
        return {"contents": [], "last_updated": None}

    def _save_data(self):
        with open(self.storage_file, 'w') as f:
            json.dump(self.content_data, f, indent=2, default=str)

    def _calculate_viral_score(self, metrics: EngagementMetrics) -> float:
        total_engagement = (
            (metrics.views or 0) * 0.1 +
            (metrics.likes or 0) * 2 +
            (metrics.comments or 0) * 3 +
            (metrics.shares or 0) * 5 +
            (metrics.upvotes or 0) * 2
        )

        if metrics.views and metrics.views > 0:
            engagement_rate = total_engagement / metrics.views * 100
        else:
            engagement_rate = total_engagement / 1000

        return min(engagement_rate, 100.0)

    def _extract_decodo_content(self, response: str, platform: Platform) -> List[ViralContent]:
        """Extract content from DECODO scraper response for any platform"""
        contents = []
        try:
            data = json.loads(response)
            print(f"DECODO response for {platform}: {str(data)[:200]}...")

            if isinstance(data, dict) and 'results' in data:
                for result in data['results']:
                    if platform == Platform.REDDIT and 'content' in result:
                        # Parse Reddit DECODO response structure
                        reddit_data = result['content']
                        if 'data' in reddit_data and 'children' in reddit_data['data']:
                            for post in reddit_data['data']['children']:
                                if post.get('kind') == 't3' and 'data' in post:
                                    post_data = post['data']

                                    metrics = EngagementMetrics(
                                        upvotes=post_data.get('ups', 0),
                                        downvotes=post_data.get('downs', 0),
                                        comments=post_data.get('num_comments', 0),
                                        views=post_data.get('ups', 0) * 10  # Estimate views
                                    )

                                    content = ViralContent(
                                        id=str(uuid.uuid4()),
                                        title=post_data.get('title', 'No title'),
                                        platform=Platform.REDDIT,
                                        content_type=ContentType.POST,
                                        url=f"https://reddit.com{post_data.get('permalink', '')}",
                                        content_text=post_data.get('selftext', ''),
                                        author=post_data.get('author', 'Unknown'),
                                        published_date=datetime.fromtimestamp(post_data.get('created_utc', 0)) if post_data.get('created_utc') else datetime.now(),
                                        scraped_date=datetime.now(),
                                        engagement_metrics=metrics,
                                        viral_score=self._calculate_viral_score(metrics),
                                        tags=[post_data.get('subreddit', 'reddit')],
                                        thumbnail_url=post_data.get('thumbnail', '')
                                    )
                                    contents.append(content)

                    elif platform == Platform.GOOGLE:
                        # Parse Google search results from DECODO
                        # TODO: Implement based on actual DECODO Google response structure
                        pass

                    elif platform == Platform.YOUTUBE:
                        # Parse YouTube transcript data from DECODO
                        # TODO: Implement based on actual DECODO YouTube response structure
                        pass

                    elif platform == Platform.BING:
                        # Parse Bing search results from DECODO
                        # TODO: Implement based on actual DECODO Bing response structure
                        pass

                print(f"Successfully extracted {len(contents)} contents from {platform}")
            else:
                print(f"No valid results in DECODO response for {platform}")

        except Exception as e:
            print(f"Error parsing DECODO response for {platform}: {e}")
            import traceback
            traceback.print_exc()

        return contents


    def scrape_trending_content(self, request: ScrapingRequest) -> List[ViralContent]:
        all_contents = []
        successful_scrapes = 0

        for platform in request.platforms:
            try:
                platform_contents = []

                if platform == Platform.REDDIT:
                    # Use the specific subreddit from request, default to programming
                    subreddit = request.reddit_subreddit or 'programming'
                    subreddit_url = f"https://www.reddit.com/r/{subreddit}/"
                    print(f"Scraping Reddit subreddit: r/{subreddit}")
                    response = self.scraper.reddit_subreddit_scraper(subreddit_url)
                    platform_contents.extend(self._extract_decodo_content(response, platform))

                elif platform == Platform.GOOGLE:
                    for keyword in (request.keywords or ['trending', 'viral']):
                        response = self.scraper.google_with_ai_overview_scraper(keyword, request.limit)
                        platform_contents.extend(self._extract_decodo_content(response, platform))

                elif platform == Platform.BING:
                    for keyword in (request.keywords or ['trending', 'viral']):
                        response = self.scraper.bing_search_scraper(keyword, request.limit)
                        platform_contents.extend(self._extract_decodo_content(response, platform))

                elif platform == Platform.YOUTUBE:
                    for keyword in (request.keywords or ['trending', 'viral']):
                        response = self.scraper.youtube_transcript_scraper(keyword)
                        platform_contents.extend(self._extract_decodo_content(response, platform))

                # Only use real scraped content
                if platform_contents:
                    successful_scrapes += 1
                else:
                    print(f"No real content from {platform}, skipping...")

                all_contents.extend(platform_contents[:request.limit])

            except Exception as e:
                print(f"Error scraping {platform}: {e}")
                # Skip platform if scraping fails - no mock content

        # If no successful scrapes, return empty results - no mock content
        if successful_scrapes == 0 and not all_contents:
            print("No successful scrapes, returning empty results...")

        all_contents.sort(key=lambda x: x.viral_score, reverse=True)

        # Save the new content (merge with existing)
        existing_contents = [ViralContent(**content) for content in self.content_data["contents"]]

        # Remove duplicates by URL and add new content
        existing_urls = {content.url for content in existing_contents}
        new_contents = [content for content in all_contents if content.url not in existing_urls]

        all_stored_contents = existing_contents + new_contents
        all_stored_contents.sort(key=lambda x: x.viral_score, reverse=True)

        self.content_data["contents"] = [content.dict() for content in all_stored_contents]
        self.content_data["last_updated"] = datetime.now().isoformat()
        self._save_data()

        return all_contents[:request.limit]

    def get_all_content(self) -> List[ViralContent]:
        return [ViralContent(**content) for content in self.content_data["contents"]]

    def get_content_by_platform(self, platform: Platform) -> List[ViralContent]:
        return [
            ViralContent(**content)
            for content in self.content_data["contents"]
            if content["platform"] == platform
        ]

    def search_content(self, query: str) -> List[ViralContent]:
        query_lower = query.lower()
        matching_contents = []

        for content_dict in self.content_data["contents"]:
            content = ViralContent(**content_dict)
            if (query_lower in content.title.lower() or
                query_lower in (content.content_text or '').lower() or
                any(query_lower in tag.lower() for tag in content.tags)):
                matching_contents.append(content)

        return matching_contents

    def get_top_viral_content(self, limit: int = 10) -> List[ViralContent]:
        all_content = self.get_all_content()
        sorted_content = sorted(all_content, key=lambda x: x.viral_score, reverse=True)
        return sorted_content[:limit]