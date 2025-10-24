'use client';

import { useState, useEffect } from 'react';

interface EngagementMetrics {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  upvotes?: number;
  downvotes?: number;
  engagement_rate?: number;
}

interface ContentItem {
  id: string;
  platform: string;
  title: string;
  content_text?: string;
  url: string;
  author?: string;
  published_date?: string;
  scraped_date: string;
  engagement_metrics: EngagementMetrics;
  viral_score: number;
  content_type: string;
  tags: string[];
  thumbnail_url?: string;
}

interface Stats {
  total_content: number;
  total_analyses: number;
  total_briefs: number;
  platform_distribution: Record<string, number>;
  last_updated: string;
}

export default function Home() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [minViralScore, setMinViralScore] = useState<number>(0);
  const [savedContent, setSavedContent] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scrapeKeywords, setScrapeKeywords] = useState<string>('');
  const [scrapePlatforms, setScrapePlatforms] = useState<string[]>(['reddit']);
  const [scrapeLimit, setScrapeLimit] = useState<number>(20);
  const [redditSubject, setRedditSubject] = useState<string>('tech');
  const [redditSubreddit, setRedditSubreddit] = useState<string>('');

  const api_url = 'https://decodo-viral-content-analyzer-production.up.railway.app'

  // Subreddit suggestions by subject
  const subredditsBySubject = {
    tech: ['programming', 'webdev', 'MachineLearning', 'technology', 'learnprogramming', 'Python', 'javascript', 'reactjs'],
    business: ['entrepreneur', 'startups', 'business', 'marketing', 'investing', 'stocks', 'finance'],
    lifestyle: ['LifeProTips', 'getmotivated', 'productivity', 'selfimprovement', 'fitness', 'health'],
    entertainment: ['movies', 'television', 'gaming', 'music', 'books', 'netflix', 'entertainment'],
    science: ['science', 'askscience', 'space', 'Physics', 'chemistry', 'biology', 'futurology'],
    news: ['worldnews', 'news', 'politics', 'UpliftingNews', 'nottheonion'],
    creative: ['Art', 'Design', 'photography', 'writing', 'DIY', 'crafts', 'CreativeWriting'],
    travel: ['travel', 'solotravel', 'backpacking', 'digitalnomad', 'EarthPorn'],
    food: ['food', 'cooking', 'recipes', 'MealPrepSunday', 'FoodPorn', 'AskCulinary'],
    beauty: ['MakeupAddiction', 'SkincareAddiction', 'beauty', 'Hair', 'Nails']
  };
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [briefLoading, setBriefLoading] = useState<Set<string>>(new Set());
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState<Set<string>>(new Set());
  const [selectedBrief, setSelectedBrief] = useState<any>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  const fetchContent = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedPlatform !== 'all') {
        params.append('platform', selectedPlatform);
      }
      if (minViralScore > 0) {
        params.append('min_viral_score', minViralScore.toString());
      }

      const response = await fetch(`${api_url}/content?${params}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data);
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
      setContent([]);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats for now since we don't have a stats endpoint yet
      setStats({
        total_content: content.length,
        total_analyses: 0,
        total_briefs: 0,
        platform_distribution: {},
        last_updated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const searchContent = async () => {
    if (!searchQuery.trim()) {
      fetchContent();
      return;
    }

    try {
      const response = await fetch(`${api_url}/content/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data);

      }
    } catch (error) {
      console.error('Failed to search content:', error);
      setContent([]);
    }
  };

  const triggerScrape = async () => {
    setScrapeLoading(true);
    try {
      const keywords = scrapeKeywords.trim() ? scrapeKeywords.split(',').map(k => k.trim()) : ['viral', 'trending'];
      const scrapeRequest = {
        platforms: scrapePlatforms,
        keywords,
        limit: scrapeLimit,
        reddit_subreddit: redditSubreddit || (subredditsBySubject[redditSubject as keyof typeof subredditsBySubject]?.[0] || 'programming')
      };
      const response = await fetch(`${api_url}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scrapeRequest)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully scraped ${result.content_count} contents!`);
        // Refresh content after scraping
        setTimeout(() => {
          fetchContent();
          fetchStats();
        }, 1000);
      } else {
        const error = await response.json();
        alert(`Scraping failed: ${error.detail}`);
      }
    } catch (error) {
      console.error('Failed to trigger scrape:', error);
      alert('Failed to trigger scrape. Please try again.');
    } finally {
      setScrapeLoading(false);
    }
  };

  const generateAIAnalysis = async (contentId: string) => {
    setAiAnalysisLoading(prev => new Set(prev).add(contentId));
    try {
      const response = await fetch(`${api_url}/analyze/${contentId}`, {
        method: 'POST'
      });
      if (response.ok) {
        const analysis = await response.json();
        setSelectedAnalysis(analysis);
        setShowAnalysisModal(true);

        // Update stats
        setStats(prev => prev ? { ...prev, total_analyses: prev.total_analyses + 1 } : null);
      } else {
        alert('Failed to generate AI analysis. Please try again.');
      }
    } catch (error) {
      console.error('Failed to generate AI analysis:', error);
      alert('Failed to generate AI analysis. Please try again.');
    } finally {
      setAiAnalysisLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(contentId);
        return newSet;
      });
    }
  };

  const generateBrief = async (contentId: string) => {
    setBriefLoading(prev => new Set(prev).add(contentId));
    try {
      const response = await fetch(`${api_url}/generate-brief/${contentId}`, {
        method: 'POST'
      });
      if (response.ok) {
        const brief = await response.json();
        setSelectedBrief(brief);
        setShowBriefModal(true);

        // Update stats
        setStats(prev => prev ? { ...prev, total_briefs: prev.total_briefs + 1 } : null);
      } else {
        alert('Failed to generate content brief. Please try again.');
      }
    } catch (error) {
      console.error('Failed to generate brief:', error);
      alert('Failed to generate brief. Please try again.');
    } finally {
      setBriefLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(contentId);
        return newSet;
      });
    }
  };

  const toggleSaveContent = (contentId: string) => {
    const newSaved = new Set(savedContent);
    if (newSaved.has(contentId)) {
      newSaved.delete(contentId);
    } else {
      newSaved.add(contentId);
    }
    setSavedContent(newSaved);
    localStorage.setItem('viral-content-saved', JSON.stringify([...newSaved]));
  };

  const exportSavedContent = () => {
    const saved = content.filter(item => savedContent.has(item.id));
    const dataStr = JSON.stringify(saved, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `viral-content-export-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  useEffect(() => {
    // Load saved content from localStorage
    const saved = localStorage.getItem('viral-content-saved');
    if (saved) {
      setSavedContent(new Set(JSON.parse(saved)));
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchContent(), fetchStats()]);
      setLoading(false);
    };

    loadData();
  }, [selectedPlatform, minViralScore]);

  const formatEngagement = (metrics: EngagementMetrics, platform: string) => {
    if (platform === 'reddit') {
      return `↑ ${metrics.upvotes || 0} | 💬 ${metrics.comments || 0}`;
    } else if (platform === 'youtube') {
      return `👁 ${(metrics.views || 0).toLocaleString()} | 👍 ${(metrics.likes || 0).toLocaleString()} | 💬 ${metrics.comments || 0}`;
    } else if (platform === 'google' || platform === 'bing') {
      return `👁 ${(metrics.views || 0).toLocaleString()}`;
    }
    return 'N/A';
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'reddit': return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
      case 'youtube': return 'bg-gradient-to-r from-red-600 to-red-700 text-white';
      case 'google': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'bing': return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-purple-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Viral Content Analyzer
              </h1>
              <p className="text-gray-600 mt-1 font-medium">AI-powered content inspiration for affiliate marketers</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={triggerScrape}
                disabled={scrapeLoading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-300 disabled:to-blue-400 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {scrapeLoading ? 'Scraping...' : 'Refresh Content'}
              </button>
              {savedContent.size > 0 && (
                <button
                  onClick={exportSavedContent}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Export Saved ({savedContent.size})
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <h3 className="text-sm font-semibold text-blue-100 uppercase tracking-wide">Total Content</h3>
              <p className="text-4xl font-bold text-white mt-2">{stats.total_content}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <h3 className="text-sm font-semibold text-purple-100 uppercase tracking-wide">AI Analyses</h3>
              <p className="text-4xl font-bold text-white mt-2">{stats.total_analyses}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <h3 className="text-sm font-semibold text-green-100 uppercase tracking-wide">Content Briefs</h3>
              <p className="text-4xl font-bold text-white mt-2">{stats.total_briefs}</p>
            </div>
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <h3 className="text-sm font-semibold text-pink-100 uppercase tracking-wide">Last Updated</h3>
              <p className="text-sm text-white font-medium mt-2">
                {new Date(stats.last_updated).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-purple-100 mb-8">
          <div className="space-y-4">
            {/* Search Bar */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Search Content</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Search by title, content, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchContent()}
                  className="flex-1 border-2 border-purple-200 focus:border-purple-500 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 focus:ring-4 focus:ring-purple-100 outline-none"
                />
                <button
                  onClick={searchContent}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Search
                </button>
                <button
                  onClick={() => {setSearchQuery(''); fetchContent();}}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Platform</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="border-2 border-purple-200 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 focus:ring-4 focus:ring-purple-100 outline-none"
                >
                  <option value="all">All Platforms</option>
                  <option value="reddit">Reddit</option>
                  <option value="youtube">YouTube</option>
                  <option value="google">Google</option>
                  <option value="bing">Bing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Min Viral Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={minViralScore}
                  onChange={(e) => setMinViralScore(Number(e.target.value))}
                  className="border-2 border-purple-200 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm font-medium w-24 transition-all duration-300 focus:ring-4 focus:ring-purple-100 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Custom Scraping */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-purple-100 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">Custom Content Scraping</h3>
          <div className="space-y-4">

            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Select Platforms</label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'reddit', name: 'Reddit', desc: 'Popular programming/tech subreddits' },
                  { id: 'google', name: 'Google', desc: 'Search with keywords' },
                  { id: 'bing', name: 'Bing', desc: 'Search with keywords' },
                  { id: 'youtube', name: 'YouTube', desc: 'Transcript search with keywords' }
                ].map(platform => (
                  <label key={platform.id} className="flex items-start p-4 border-2 border-purple-200 rounded-xl cursor-pointer hover:bg-purple-50 hover:border-purple-400 transition-all duration-300">
                    <input
                      type="checkbox"
                      checked={scrapePlatforms.includes(platform.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setScrapePlatforms([...scrapePlatforms, platform.id]);
                        } else {
                          setScrapePlatforms(scrapePlatforms.filter(p => p !== platform.id));
                        }
                      }}
                      className="mr-3 mt-1 w-5 h-5 accent-purple-600"
                    />
                    <div>
                      <span className="text-sm font-bold capitalize">{platform.name}</span>
                      <p className="text-xs text-gray-600 font-medium">{platform.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Reddit Subreddit Selection - only show if Reddit is selected */}
            {scrapePlatforms.includes('reddit') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Reddit Subject</label>
                  <select
                    value={redditSubject}
                    onChange={(e) => {
                      setRedditSubject(e.target.value);
                      setRedditSubreddit(''); // Reset custom subreddit when subject changes
                    }}
                    className="w-full border-2 border-purple-200 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 focus:ring-4 focus:ring-purple-100 outline-none"
                  >
                    {Object.keys(subredditsBySubject).map(subject => (
                      <option key={subject} value={subject}>
                        {subject.charAt(0).toUpperCase() + subject.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Select Subreddit</label>
                  <select
                    value={redditSubreddit}
                    onChange={(e) => setRedditSubreddit(e.target.value)}
                    className="w-full border-2 border-purple-200 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 focus:ring-4 focus:ring-purple-100 outline-none"
                  >
                    <option value="">-- Popular {redditSubject} subreddits --</option>
                    {(subredditsBySubject[redditSubject as keyof typeof subredditsBySubject] || []).map(subreddit => (
                      <option key={subreddit} value={subreddit}>r/{subreddit}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-600 mt-2 font-medium">
                    Choose a specific subreddit or leave blank to use the first popular one for {redditSubject}.
                  </p>
                </div>
              </div>
            )}

            {/* Keywords - only show if non-Reddit platforms are selected */}
            {scrapePlatforms.some(p => p !== 'reddit') && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Keywords for {scrapePlatforms.filter(p => p !== 'reddit').join(', ')} (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="programming, ai, viral content, trending..."
                  value={scrapeKeywords}
                  onChange={(e) => setScrapeKeywords(e.target.value)}
                  className="w-full border-2 border-purple-200 focus:border-purple-500 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 focus:ring-4 focus:ring-purple-100 outline-none"
                />
                <p className="text-xs text-gray-600 mt-2 font-medium">
                  Keywords are used for Google, Bing, and YouTube.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Limit</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={scrapeLimit}
                  onChange={(e) => setScrapeLimit(Number(e.target.value))}
                  className="border-2 border-purple-200 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm font-medium w-24 transition-all duration-300 focus:ring-4 focus:ring-purple-100 outline-none"
                />
              </div>
            </div>
            <button
              onClick={triggerScrape}
              disabled={scrapeLoading || scrapePlatforms.length === 0}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-purple-300 disabled:to-purple-400 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {scrapeLoading ? 'Scraping...' : 'Scrape New Content'}
            </button>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
            <p className="mt-4 text-gray-700 font-bold text-lg">Loading viral content...</p>
          </div>
        ) : content.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.map((item) => (
              <div key={item.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-purple-100 hover:border-purple-300">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold shadow-md ${getPlatformColor(item.platform)}`}>
                      {item.platform.toUpperCase()}
                    </span>
                    <span className="text-sm font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                      Score: {item.viral_score}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 leading-tight">
                    {item.title}
                  </h3>

                  {item.content_text && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 font-medium">
                      {item.content_text.substring(0, 150)}...
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4 font-medium">
                    <span>{formatEngagement(item.engagement_metrics, item.platform)}</span>
                    {item.author && <span className="font-semibold">by {item.author}</span>}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-center py-2.5 px-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        View Original
                      </a>
                      <button
                        onClick={() => toggleSaveContent(item.id)}
                        className={`px-4 py-2.5 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 ${
                          savedContent.has(item.id)
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white'
                            : 'bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-700'
                        }`}
                      >
                        {savedContent.has(item.id) ? '★' : '☆'}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => generateAIAnalysis(item.id)}
                        disabled={aiAnalysisLoading.has(item.id)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-purple-300 disabled:to-purple-400 text-white py-2.5 px-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {aiAnalysisLoading.has(item.id) ? 'Analyzing...' : '🤖 AI Analysis'}
                      </button>
                      <button
                        onClick={() => generateBrief(item.id)}
                        disabled={briefLoading.has(item.id)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-green-300 disabled:to-green-400 text-white py-2.5 px-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {briefLoading.has(item.id) ? 'Generating...' : '📄 Get Brief'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-xl border-2 border-purple-100 max-w-md mx-auto">
              <p className="text-gray-700 font-bold text-lg">No content found. Try adjusting your filters or refresh the content.</p>
            </div>
          </div>
        )}

        {/* AI Analysis Modal */}
        {showAnalysisModal && selectedAnalysis && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-purple-200">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">🤖 AI Analysis Results</h2>
                  <button
                    onClick={() => setShowAnalysisModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-3xl font-bold transition-colors hover:rotate-90 transform duration-300"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Viral Pattern Analysis</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-blue-700">Hook Strength:</span>
                        <div className="bg-blue-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{width: `${selectedAnalysis.viral_patterns.hook_strength * 10}%`}}
                          ></div>
                        </div>
                        <span className="text-xs text-blue-600">{selectedAnalysis.viral_patterns.hook_strength}/10</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-blue-700">Timing Factor:</span>
                        <div className="bg-blue-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{width: `${selectedAnalysis.viral_patterns.timing_factor * 10}%`}}
                          ></div>
                        </div>
                        <span className="text-xs text-blue-600">{selectedAnalysis.viral_patterns.timing_factor}/10</span>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-700">Emotional Trigger:</span>
                        <p className="text-blue-600 capitalize">{selectedAnalysis.viral_patterns.emotional_trigger}</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Content Structure:</span>
                        <p className="text-blue-600">{selectedAnalysis.viral_patterns.content_structure}</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Audience Appeal:</span>
                        <p className="text-blue-600">{selectedAnalysis.viral_patterns.audience_appeal}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-3">💰 Affiliate Opportunities</h3>
                    <div className="space-y-3">
                      {selectedAnalysis.affiliate_opportunities.map((opp: any, index: number) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm font-medium text-green-700">Product Category:</span>
                              <p className="text-green-600">{opp.product_category}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-green-700">Commission Potential:</span>
                              <p className="text-green-600 capitalize">{opp.commission_potential}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-green-700">Target Audience:</span>
                              <p className="text-green-600">{opp.target_audience}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-green-700">Monetization Angle:</span>
                              <p className="text-green-600">{opp.monetization_angle}</p>
                            </div>
                          </div>
                          {opp.recommended_products && opp.recommended_products.length > 0 && (
                            <div className="mt-2">
                              <span className="text-sm font-medium text-green-700">Recommended Products:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {opp.recommended_products.map((product: string, i: number) => (
                                  <span key={i} className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                                    {product}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h3 className="font-semibold text-purple-900 mb-2">💡 Key Insights</h3>
                      <ul className="space-y-1">
                        {selectedAnalysis.key_insights.map((insight: string, index: number) => (
                          <li key={index} className="text-purple-700 text-sm">• {insight}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4">
                      <h3 className="font-semibold text-orange-900 mb-2">🚀 Success Factors</h3>
                      <ul className="space-y-1">
                        {selectedAnalysis.success_factors.map((factor: string, index: number) => (
                          <li key={index} className="text-orange-700 text-sm">• {factor}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-pink-50 rounded-lg p-4">
                      <h3 className="font-semibold text-pink-900 mb-2">🔄 Adaptations</h3>
                      <ul className="space-y-1">
                        {selectedAnalysis.recommended_adaptations.map((adaptation: string, index: number) => (
                          <li key={index} className="text-pink-700 text-sm">• {adaptation}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => setShowAnalysisModal(false)}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Brief Modal */}
        {showBriefModal && selectedBrief && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-green-200">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">📄 Content Brief</h2>
                  <button
                    onClick={() => setShowBriefModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-3xl font-bold transition-colors hover:rotate-90 transform duration-300"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">{selectedBrief.title}</h3>
                  <p className="text-sm text-gray-600">Generated: {new Date(selectedBrief.generated_date).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Estimated Engagement: {selectedBrief.estimated_engagement.toFixed(1)}%</p>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-3">🎯 Target Audience</h3>
                    <p className="text-blue-800">{selectedBrief.target_audience}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="font-semibold text-green-900 mb-3">🪝 Hook Suggestions</h3>
                      <ul className="space-y-2">
                        {selectedBrief.hook_suggestions.map((hook: string, index: number) => (
                          <li key={index} className="text-green-800 bg-white rounded p-2 text-sm">
                            "{hook}"
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <h3 className="font-semibold text-purple-900 mb-3">📐 Content Angles</h3>
                      <ul className="space-y-2">
                        {selectedBrief.content_angles.map((angle: string, index: number) => (
                          <li key={index} className="text-purple-800 bg-white rounded p-2 text-sm">
                            • {angle}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <h3 className="font-semibold text-orange-900 mb-3">📋 Content Outline</h3>
                    <ol className="space-y-2">
                      {selectedBrief.content_outline.map((point: string, index: number) => (
                        <li key={index} className="text-orange-800 bg-white rounded p-2 text-sm">
                          {index + 1}. {point}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-red-50 rounded-lg p-4">
                      <h3 className="font-semibold text-red-900 mb-3">📢 Call to Actions</h3>
                      <ul className="space-y-1">
                        {selectedBrief.call_to_actions.map((cta: string, index: number) => (
                          <li key={index} className="text-red-700 text-sm bg-white rounded p-1">
                            • {cta}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h3 className="font-semibold text-yellow-900 mb-3">💰 Affiliate Products</h3>
                      <ul className="space-y-1">
                        {selectedBrief.affiliate_products.map((product: string, index: number) => (
                          <li key={index} className="text-yellow-700 text-sm bg-white rounded p-1">
                            • {product}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-indigo-50 rounded-lg p-4">
                      <h3 className="font-semibold text-indigo-900 mb-3">🔥 Trending Topics</h3>
                      <div className="flex flex-wrap gap-1">
                        {selectedBrief.trending_topics.map((topic: string, index: number) => (
                          <span key={index} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs">
                            #{topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => setShowBriefModal(false)}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
