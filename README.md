# 🚀 Viral Content Analyzer

An AI-powered content inspiration platform designed for affiliate marketers to discover, analyze, and adapt viral content across multiple platforms. This full-stack application combines intelligent web scraping, AI analysis, and content brief generation to help creators stay ahead of trending topics.

> **Powered by Decodo:** Decodo is a provider of advanced web scraping and proxy solutions that helps businesses extract data from websites at scale. They specialize in overcoming modern anti-bot measures, CAPTCHAs, and dynamic content challenges using AI-powered techniques and sophisticated proxy infrastructure. Their platform offers comprehensive scraping tools and APIs designed to handle complex data extraction from major platforms like Google, YouTube, and Bing while ensuring reliable, compliant data collection.

[![WhatsApp Image 2025-09-29 at 9 45 17 AM](https://github.com/user-attachments/assets/53f0a71c-bf82-4e5d-97bc-a841854182fc)](https://visit.decodo.com/K0NmEz)

**👉 [Visit Decodo here](https://visit.decodo.com/K0NmEz)**

## ✨ Features

### 🎯 Content Discovery
- **Multi-Platform Scraping**: Automatically collect viral content from Reddit, YouTube, Google, and Bing
- **Smart Filtering**: Filter content by platform, viral score, and custom search queries
- **Real-time Updates**: Automated content refresh with scheduled scraping
- **Subreddit Targeting**: Browse content by specific subjects (tech, business, lifestyle, etc.)

### 🤖 AI-Powered Analysis
- **Viral Pattern Recognition**: Analyze hook strength, emotional triggers, and content structure
- **Affiliate Opportunities**: Identify monetization potential and recommended products
- **Success Factor Analysis**: Extract key insights and adaptation recommendations
- **Engagement Prediction**: Calculate viral scores based on engagement metrics

### 📄 Content Brief Generation
- **Hook Suggestions**: AI-generated attention-grabbing headlines
- **Content Angles**: Multiple perspectives for adapting viral content
- **Target Audience Analysis**: Detailed audience profiling
- **Call-to-Action Templates**: Optimized CTAs for affiliate marketing
- **Trending Topics**: Current hashtags and topics for maximum reach

### 💾 Content Management
- **Save & Export**: Bookmark favorite content and export to JSON
- **Search & Filter**: Advanced search across titles, content, and tags
- **Performance Tracking**: Monitor analysis and brief generation statistics

## 🏗️ Architecture

### Frontend (Next.js 15 + React 19)
- **Modern React**: Built with latest React 19 features and TypeScript
- **Responsive Design**: TailwindCSS for mobile-first responsive UI
- **Real-time Updates**: Live content refresh and progress tracking
- **Interactive Modals**: Detailed analysis and brief viewing

### Backend (FastAPI + Python)
- **High-Performance API**: FastAPI with automatic OpenAPI documentation
- **DECODO Integration**: Advanced web scraping with the DECODO scraper
- **OpenAI Integration**: GPT-powered content analysis and brief generation
- **Scheduled Tasks**: Automated content refresh with APScheduler
- **Data Persistence**: JSON-based storage with automatic backups

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- OpenAI API key (optional, fallback analysis available)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment configuration**
   ```bash
   cp .env.example .env
   # Add your OpenAI API key to .env (optional)
   OPENAI_API_KEY=your_openai_api_key_here
   ```

5. **Start the API server**
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

## 📚 API Documentation

### Core Endpoints

- **GET /content** - Retrieve all content with optional filtering
- **POST /scrape** - Trigger content scraping from specified platforms
- **GET /content/search** - Search content by query
- **POST /analyze/{content_id}** - Generate AI analysis for specific content
- **POST /generate-brief/{content_id}** - Create content brief

### Example API Usage

```bash
# Scrape content from Reddit and YouTube
curl -X POST "http://localhost:8000/scrape" \
  -H "Content-Type: application/json" \
  -d '{
    "platforms": ["reddit", "youtube"],
    "keywords": ["AI", "programming"],
    "limit": 10,
    "reddit_subreddit": "programming"
  }'

# Get top viral content
curl "http://localhost:8000/content?min_viral_score=50&platform=reddit"

# Generate AI analysis
curl -X POST "http://localhost:8000/analyze/content-id-here"
```

## 🔧 Configuration

### Supported Platforms
- **Reddit**: Subreddit-based content scraping
- **YouTube**: Transcript analysis for trending videos
- **Google**: Search result analysis with AI overview
- **Bing**: Alternative search engine content discovery

### Viral Score Calculation
The viral score (0-100) is calculated based on:
- Views (10% weight)
- Likes (20% weight)
- Comments (30% weight)
- Shares (50% weight)
- Platform-specific engagement metrics

## 📊 Project Structure

```
viral-content-analyzer/
├── backend/
│   ├── main.py              # FastAPI application entry point
│   ├── content_service.py   # Content management and scraping logic
│   ├── ai_service.py        # OpenAI integration and analysis
│   ├── models.py           # Pydantic data models
│   ├── scraper.py          # DECODO scraper wrapper
│   ├── scheduler.py        # Automated task scheduling
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── page.tsx    # Main application interface
│   │       └── layout.tsx  # App layout and styling
│   ├── package.json       # Node.js dependencies
│   └── tailwind.config.js # TailwindCSS configuration
└── README.md
```

## 🛠️ Development

### Building for Production

**Backend:**
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

### Testing
```bash
# Backend testing
cd backend
pytest

# Frontend testing
cd frontend
npm test
```

## 🔐 Security

- **API Security**: CORS protection and request validation
- **Data Privacy**: No sensitive data storage, optional OpenAI integration
- **Rate Limiting**: Built-in scraping rate limits to respect platform policies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **DECODO Scraper**: Advanced web scraping capabilities
- **OpenAI**: AI-powered content analysis
- **FastAPI**: High-performance Python web framework
- **Next.js**: React framework for production-ready applications

## 📞 Support

For support, questions, or feature requests, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for content creators and affiliate marketers**
