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

      const response = await fetch(`http://localhost:8000/content?${params}`);
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
      const response = await fetch(`http://localhost:8000/content/search?q=${encodeURIComponent(searchQuery)}`);
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
      const response = await fetch('http://localhost:8000/scrape', {
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
      const response = await fetch(`http://localhost:8000/analyze/${contentId}`, {
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
      const response = await fetch(`http://localhost:8000/generate-brief/${contentId}`, {
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
      case 'reddit': return 'bg-orange-100 text-orange-800';
      case 'youtube': return 'bg-red-100 text-red-800';
      case 'google': return 'bg-blue-100 text-blue-800';
      case 'bing': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Viral Content Analyzer</h1>
              <p className="text-gray-600">AI-powered content inspiration for affiliate marketers</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={triggerScrape}
                disabled={scrapeLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md transition-colors"
              >
                {scrapeLoading ? 'Scraping...' : 'Refresh Content'}
              </button>
              {savedContent.size > 0 && (
                <button
                  onClick={exportSavedContent}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Content</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.total_content}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <h3 className="text-sm font-medium text-gray-500">AI Analyses</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.total_analyses}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <h3 className="text-sm font-medium text-gray-500">Content Briefs</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.total_briefs}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
              <p className="text-sm text-gray-600">
                {new Date(stats.last_updated).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg p-4 shadow mb-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Content</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search by title, content, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchContent()}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
                <button
                  onClick={searchContent}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                >
                  Search
                </button>
                <button
                  onClick={() => {setSearchQuery(''); fetchContent();}}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md text-sm transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Platforms</option>
                  <option value="reddit">Reddit</option>
                  <option value="youtube">YouTube</option>
                  <option value="google">Google</option>
                  <option value="bing">Bing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Viral Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={minViralScore}
                  onChange={(e) => setMinViralScore(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm w-20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Custom Scraping */}
        <div className="bg-white rounded-lg p-4 shadow mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Custom Content Scraping</h3>
          <div className="space-y-4">

            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Platforms</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'reddit', name: 'Reddit', desc: 'Popular programming/tech subreddits' },
                  { id: 'google', name: 'Google', desc: 'Search with keywords' },
                  { id: 'bing', name: 'Bing', desc: 'Search with keywords' },
                  { id: 'youtube', name: 'YouTube', desc: 'Transcript search with keywords' }
                ].map(platform => (
                  <label key={platform.id} className="flex items-start p-2 border rounded cursor-pointer hover:bg-gray-50">
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
                      className="mr-2 mt-1"
                    />
                    <div>
                      <span className="text-sm font-medium capitalize">{platform.name}</span>
                      <p className="text-xs text-gray-500">{platform.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Reddit Subreddit Selection - only show if Reddit is selected */}
            {scrapePlatforms.includes('reddit') && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reddit Subject</label>
                  <select
                    value={redditSubject}
                    onChange={(e) => {
                      setRedditSubject(e.target.value);
                      setRedditSubreddit(''); // Reset custom subreddit when subject changes
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    {Object.keys(subredditsBySubject).map(subject => (
                      <option key={subject} value={subject}>
                        {subject.charAt(0).toUpperCase() + subject.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Subreddit</label>
                  <select
                    value={redditSubreddit}
                    onChange={(e) => setRedditSubreddit(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">-- Popular {redditSubject} subreddits --</option>
                    {(subredditsBySubject[redditSubject as keyof typeof subredditsBySubject] || []).map(subreddit => (
                      <option key={subreddit} value={subreddit}>r/{subreddit}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose a specific subreddit or leave blank to use the first popular one for {redditSubject}.
                  </p>
                </div>
              </div>
            )}

            {/* Keywords - only show if non-Reddit platforms are selected */}
            {scrapePlatforms.some(p => p !== 'reddit') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keywords for {scrapePlatforms.filter(p => p !== 'reddit').join(', ')} (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="programming, ai, viral content, trending..."
                  value={scrapeKeywords}
                  onChange={(e) => setScrapeKeywords(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Keywords are used for Google, Bing, and YouTube.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={scrapeLimit}
                  onChange={(e) => setScrapeLimit(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm w-20"
                />
              </div>
            </div>
            <button
              onClick={triggerScrape}
              disabled={scrapeLoading || scrapePlatforms.length === 0}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-md text-sm transition-colors"
            >
              {scrapeLoading ? 'Scraping...' : 'Scrape New Content'}
            </button>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading viral content...</p>
          </div>
        ) : content.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlatformColor(item.platform)}`}>
                      {item.platform.toUpperCase()}
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      Score: {item.viral_score}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {item.title}
                  </h3>

                  {item.content_text && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                      {item.content_text.substring(0, 150)}...
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>{formatEngagement(item.engagement_metrics, item.platform)}</span>
                    {item.author && <span>by {item.author}</span>}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-3 rounded text-sm transition-colors"
                      >
                        View Original
                      </a>
                      <button
                        onClick={() => toggleSaveContent(item.id)}
                        className={`px-3 py-2 rounded text-sm transition-colors ${
                          savedContent.has(item.id)
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {savedContent.has(item.id) ? '★' : '☆'}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => generateAIAnalysis(item.id)}
                        disabled={aiAnalysisLoading.has(item.id)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-2 px-3 rounded text-sm transition-colors"
                      >
                        {aiAnalysisLoading.has(item.id) ? 'Analyzing...' : '🤖 AI Analysis'}
                      </button>
                      <button
                        onClick={() => generateBrief(item.id)}
                        disabled={briefLoading.has(item.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2 px-3 rounded text-sm transition-colors"
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
          <div className="text-center py-12">
            <p className="text-gray-500">No content found. Try adjusting your filters or refresh the content.</p>
          </div>
        )}

        {/* AI Analysis Modal */}
        {showAnalysisModal && selectedAnalysis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">🤖 AI Analysis Results</h2>
                  <button
                    onClick={() => setShowAnalysisModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
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

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowAnalysisModal(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md transition-colors"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">📄 Content Brief</h2>
                  <button
                    onClick={() => setShowBriefModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
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

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowBriefModal(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md transition-colors"
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
