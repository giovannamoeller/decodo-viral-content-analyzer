## Project Overview

An AI-powered content inspiration platform that scrapes viral/trending content across platforms, analyzes what makes it successful, and generates actionable content briefs for affiliate marketers. 

### MVP Scope

**Core Feature: Viral Content Analysis & Brief Generation**

- Scrape top-performing content from Reddit, YouTube, Google trending
- AI analysis of viral content patterns (hooks, structure, topics)
- Generate ready-to-use content briefs with affiliate angles
- Simple feed-style dashboard for browsing ideas

**Content Scraping Pipeline** 

**Decodo Services**: Web Scraping API 

**Tasks**:

- Set up Decodo Scraper
- Build scrapers for Reddit, YouTube, Google, Bing
- Create data models for storing viral content

**AI Content Analysis**: OpenAI/LangChain
- Implement AI analysis of viral content patterns
- Build content brief generation system
- Create engagement prediction scoring
- Develop affiliate opportunity detection

* Use the ChatGPT/Perplexity functions defined in `scraper`. If that does not work, use LangChain.

**Dashboard Front-end** 

**Tech Stack**: Next.js + Tailwind

**Tasks**:

- Build responsive content feed interface
- Implement filtering and search functionality
- Add content brief display and interaction
- Create idea saving and organization features

All the scrapers are defined in the file scraper.py inside the backend. Do not change this file.

This is a POC. It should not be that complex, you don't need to implement databases yet, for example. But do not use mocked data. 