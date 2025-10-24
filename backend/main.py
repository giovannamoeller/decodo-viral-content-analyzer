from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import os
from dotenv import load_dotenv
from typing import List, Optional

from models import ViralContent, Platform, ContentType, EngagementMetrics, ScrapingRequest, ScrapingResponse, ContentAnalysis, ContentBrief
from content_service import ContentService
from ai_service import AIAnalysisService
from scheduler import scheduler_instance

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler_instance.start_scheduler()
    yield
    scheduler_instance.stop_scheduler()

app = FastAPI(
    title="Viral Content Analyzer API",
    description="AI-powered content inspiration platform for viral content analysis",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", 'https://decodo-viral-content-analyzer.vercel.app'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

content_service = ContentService()
ai_service = AIAnalysisService()

@app.get("/")
async def root():
    return {"message": "Viral Content Analyzer API", "status": "active"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is running"}

@app.post("/scrape", response_model=ScrapingResponse)
async def scrape_content(request: ScrapingRequest):
    try:
        # Validate platforms
        for platform in request.platforms:
            if platform not in [Platform.REDDIT, Platform.YOUTUBE, Platform.GOOGLE, Platform.BING]:
                raise HTTPException(status_code=400, detail=f"Invalid platform: {platform}")

        contents = content_service.scrape_trending_content(request)
        return ScrapingResponse(
            success=True,
            content_count=len(contents),
            contents=contents,
            message=f"Successfully scraped {len(contents)} contents"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")

@app.get("/content", response_model=List[ViralContent])
async def get_all_content(platform: Optional[str] = None, min_viral_score: Optional[float] = None):
    contents = content_service.get_all_content()

    # Filter by platform if specified
    if platform and platform != "all":
        try:
            platform_enum = Platform(platform.lower())
            contents = [c for c in contents if c.platform == platform_enum]
        except ValueError:
            # Invalid platform, ignore filter
            pass

    # Filter by minimum viral score if specified
    if min_viral_score is not None and min_viral_score > 0:
        contents = [c for c in contents if c.viral_score >= min_viral_score]

    return contents

@app.get("/content/platform/{platform}", response_model=List[ViralContent])
async def get_content_by_platform(platform: Platform):
    return content_service.get_content_by_platform(platform)

@app.get("/content/search", response_model=List[ViralContent])
async def search_content(q: str):
    if not q.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty")
    return content_service.search_content(q)

@app.get("/content/top", response_model=List[ViralContent])
async def get_top_viral_content(limit: int = 10):
    if limit <= 0 or limit > 100:
        raise HTTPException(status_code=400, detail="Limit must be between 1 and 100")
    return content_service.get_top_viral_content(limit)


@app.post("/analyze/{content_id}", response_model=ContentAnalysis)
async def analyze_content(content_id: str):
    contents = content_service.get_all_content()
    content = next((c for c in contents if c.id == content_id), None)

    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    try:
        analysis = ai_service.analyze_viral_content(content)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/generate-brief/{content_id}", response_model=ContentBrief)
async def generate_content_brief(content_id: str):
    contents = content_service.get_all_content()
    content = next((c for c in contents if c.id == content_id), None)

    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    try:
        analysis = ai_service.analyze_viral_content(content)
        brief = ai_service.generate_content_brief(content, analysis)
        return brief
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Brief generation failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)