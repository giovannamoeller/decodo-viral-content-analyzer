import requests
import os
from dotenv import load_dotenv

load_dotenv()

DECODO_AUTH_TOKEN = os.getenv("DECODO_AUTH_TOKEN")
DECODO_SCRAPE_API_URL = os.getenv("DECODO_SCRAPE_API_URL")

class Scraper:
  def __init__(self):
    self.DECODO_AUTH_TOKEN = DECODO_AUTH_TOKEN
    self.DECODO_SCRAPE_API_URL = DECODO_SCRAPE_API_URL
  
  def base_scraper(self, payload):
    url = self.DECODO_SCRAPE_API_URL
    headers = {
      "accept": "application/json",
      "content-type": "application/json",
      "authorization": f"Basic {self.DECODO_AUTH_TOKEN}"
    }
    response = requests.post(url, json=payload, headers=headers)
    return response.text
  
  def google_scraper(self, query):
    payload = {
      "target": "google",
      "url": f"https://www.google.com/search?q={query}&source=hp&ei=OrK3ZITEEY6Ixc8P3NemmA4&iflsig=AD69kcEAAAAAZLfASni8y8AdTBIjpShc1wPCNRMLoubj&ved=0ahUKEwiEyafav5qAAxUORPEDHdyrCeMQ4dUDCAk&uact=5&oq={query}&gs_lp=Egdnd3Mtd2l6IgVwaXp6YTILEC4YgAQYxwEY0QMyBRAAGIAEMgUQLhiABDIFEAAYgAQyBRAAGIAEMgUQABiABDIFEAAYgAQyCxAuGIAEGMcBGK8BMgsQLhiABBjHARivATIFEC4YgARI1ApQgARYyQlwAXgAkAEAmAF1oAGuBKoBAzAuNbgBA8gBAPgBAagCAA&sclient=gws-wiz",
      "parse": True
    }
    return self.base_scraper(payload)
  
  def google_with_ai_overview_scraper(self, query, limit=10, language="en"):
    payload = {
      "target": "google_search",
      "query": query,
      "headless": "html",
      "page_from": "1",
      "limit": limit,
      "google_results_language": language,
      "parse": True
    }
    return self.base_scraper(payload)
  
  def youtube_transcript_scraper(self, query, language="en"):
    payload = {
      "target": "youtube_transcript",
      "query": query,
      "language_code": language
    }
    return self.base_scraper(payload)
  
  def reddit_post_scraper(self, url):
    payload = {
      "target": "reddit_post",
      "url": url
    }
    return self.base_scraper(payload)

  def reddit_subreddit_scraper(self, url):
    payload = {
      "target": "reddit_subreddit",
      "url": url
    }
    return self.base_scraper(payload)
  
  def bing_search_scraper(self, query, limit=10):
    payload = {
      "target": "bing_search",
      "query": query,
      "page_from": "1",
      "limit": limit,
      "parse": True
    }
    return self.base_scraper(payload)

  def chatgpt_scraper(self, prompt):
    payload = {
      "target": "chatgpt",
      "prompt": prompt,
      "search": False,
      "parse": True
    }
    return self.base_scraper(payload)

  def perplexity_scraper(self, prompt):
    payload = {
      "target": "perplexity",
      "prompt": prompt,
      "parse": True
    }
    return self.base_scraper(payload)
  
  



  




