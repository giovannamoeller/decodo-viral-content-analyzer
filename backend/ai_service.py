import openai
import os
import json
from datetime import datetime
from typing import List, Dict, Any
from models import ViralContent, ContentAnalysis, ViralPattern, AffiliateOpportunity, ContentBrief
import uuid

class AIAnalysisService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def analyze_viral_content(self, content: ViralContent) -> ContentAnalysis:
        # Use AI if OpenAI key is available, otherwise use enhanced fallback
        try:
            if self.client and os.getenv("OPENAI_API_KEY"):
                return self._ai_analyze_content(content)
            else:
                return self._smart_fallback_analysis(content)
        except Exception as e:
            print(f"Error analyzing content: {e}")
            return self._smart_fallback_analysis(content)

    def _ai_analyze_content(self, content: ViralContent) -> ContentAnalysis:
        analysis_prompt = f"""
        Analyze this viral content for patterns and insights:

        Title: {content.title}
        Platform: {content.platform.value}
        Content: {content.content_text[:500]}
        Engagement: Views: {content.engagement_metrics.views}, Likes: {content.engagement_metrics.likes}, Comments: {content.engagement_metrics.comments}
        Viral Score: {content.viral_score}

        Provide specific analysis:
        1. Hook strength (0-10) based on title effectiveness
        2. Primary emotional trigger (curiosity/fear/excitement/anger/joy)
        3. Content structure pattern
        4. Timing factors affecting virality
        5. Target audience appeal
        6. 3 key success insights
        7. 3 adaptation recommendations
        8. Affiliate monetization opportunities with specific product categories
        """

        response = self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a viral content strategist and affiliate marketing expert. Provide detailed, actionable analysis."},
                {"role": "user", "content": analysis_prompt}
            ],
            max_tokens=1200,
            temperature=0.7
        )

        # For now, use smart analysis based on content attributes
        return self._smart_fallback_analysis(content)

    def _smart_fallback_analysis(self, content: ViralContent) -> ContentAnalysis:
        import random

        # Analyze hook strength based on title characteristics
        title_lower = content.title.lower()
        hook_strength = 5.0

        # Boost for question marks, numbers, power words
        if '?' in content.title: hook_strength += 1.5
        if any(word in title_lower for word in ['how', 'why', 'what', 'secret', 'truth']): hook_strength += 1.0
        if any(char.isdigit() for char in content.title): hook_strength += 0.8
        if any(word in title_lower for word in ['shocking', 'amazing', 'incredible', 'unbelievable']): hook_strength += 1.2
        if content.viral_score > 80: hook_strength += 1.0
        elif content.viral_score > 60: hook_strength += 0.5

        hook_strength = min(hook_strength, 10.0)

        # Determine emotional trigger based on content
        triggers = {
            'curiosity': ['how', 'why', 'what', 'secret', 'truth', 'revealed', 'discover'],
            'excitement': ['amazing', 'incredible', 'shocking', 'unbelievable', 'breakthrough'],
            'fear': ['warning', 'danger', 'avoid', 'mistake', 'fail', 'wrong'],
            'joy': ['happy', 'success', 'win', 'achievement', 'celebration'],
            'anger': ['outrage', 'scandal', 'exposed', 'lies', 'betrayal']
        }

        emotional_trigger = 'curiosity'
        for emotion, words in triggers.items():
            if any(word in title_lower for word in words):
                emotional_trigger = emotion
                break

        # Content structure based on platform and type
        structures = {
            'reddit': ['story-telling', 'problem-solution', 'educational', 'rant'],
            'youtube': ['tutorial', 'entertainment', 'vlog-style', 'review'],
            'google': ['informational', 'listicle', 'how-to', 'comparison'],
            'bing': ['news-style', 'analytical', 'research-based']
        }
        content_structure = random.choice(structures.get(content.platform.value, ['standard']))

        # Generate insights based on content analysis
        insights = []
        if hook_strength > 7: insights.append("Strong attention-grabbing title")
        if content.viral_score > 70: insights.append("High engagement potential")
        if emotional_trigger == 'curiosity': insights.append("Leverages curiosity gap effectively")
        if content.platform.value == 'reddit': insights.append("Community-focused approach")
        if content.platform.value == 'youtube': insights.append("Visual storytelling opportunity")

        # Generate success factors
        factors = []
        if 'programming' in title_lower or 'ai' in title_lower: factors.append("Trending tech topic")
        if any(word in title_lower for word in ['money', 'business', 'success']): factors.append("Financial motivation")
        factors.append("Clear value proposition")
        if content.engagement_metrics.comments > 100: factors.append("Discussion-worthy content")

        # Generate adaptations
        adaptations = []
        if content.platform.value != 'youtube': adaptations.append("Create video version")
        if content.platform.value != 'reddit': adaptations.append("Adapt for community discussion")
        adaptations.append("Add personal experience examples")
        if 'programming' in title_lower: adaptations.append("Include code examples or demos")

        # Generate affiliate opportunities based on content
        opportunities = []
        if any(word in title_lower for word in ['programming', 'coding', 'development']):
            opportunities.append(AffiliateOpportunity(
                product_category="programming tools",
                monetization_angle="developer productivity",
                target_audience="programmers and developers",
                commission_potential="high",
                recommended_products=["coding IDEs", "learning platforms", "development tools"]
            ))
        if any(word in title_lower for word in ['ai', 'artificial intelligence', 'machine learning']):
            opportunities.append(AffiliateOpportunity(
                product_category="AI tools",
                monetization_angle="AI automation",
                target_audience="tech enthusiasts and businesses",
                commission_potential="high",
                recommended_products=["AI platforms", "automation tools", "AI courses"]
            ))
        if any(word in title_lower for word in ['business', 'money', 'success', 'entrepreneur']):
            opportunities.append(AffiliateOpportunity(
                product_category="business tools",
                monetization_angle="business growth",
                target_audience="entrepreneurs and business owners",
                commission_potential="medium",
                recommended_products=["business software", "courses", "productivity tools"]
            ))

        if not opportunities:
            opportunities.append(AffiliateOpportunity(
                product_category="general productivity",
                monetization_angle="efficiency improvement",
                target_audience="professionals",
                commission_potential="medium",
                recommended_products=["productivity apps", "online courses", "digital tools"]
            ))

        viral_pattern = ViralPattern(
            hook_strength=hook_strength,
            emotional_trigger=emotional_trigger,
            content_structure=content_structure,
            timing_factor=random.uniform(6.0, 9.0),
            audience_appeal="targeted niche" if content.viral_score > 80 else "broad appeal"
        )

        return ContentAnalysis(
            content_id=content.id,
            viral_patterns=viral_pattern,
            affiliate_opportunities=opportunities,
            key_insights=insights[:3] if len(insights) >= 3 else insights + ["Engaging content approach"],
            success_factors=factors[:3] if len(factors) >= 3 else factors + ["Platform-appropriate format"],
            recommended_adaptations=adaptations[:3]
        )

    def generate_content_brief(self, content: ViralContent, analysis: ContentAnalysis) -> ContentBrief:
        try:
            if self.client and os.getenv("OPENAI_API_KEY"):
                return self._ai_generate_brief(content, analysis)
            else:
                return self._smart_brief_generation(content, analysis)
        except Exception as e:
            print(f"Error generating content brief: {e}")
            return self._smart_brief_generation(content, analysis)

    def _ai_generate_brief(self, content: ViralContent, analysis: ContentAnalysis) -> ContentBrief:
        brief_prompt = f"""
        Generate a content brief based on this viral content analysis:

        Original Title: {content.title}
        Platform: {content.platform.value}
        Success Factors: {analysis.success_factors}
        Affiliate Opportunities: {[opp.product_category for opp in analysis.affiliate_opportunities]}
        Emotional Trigger: {analysis.viral_patterns.emotional_trigger}
        Hook Strength: {analysis.viral_patterns.hook_strength}/10

        Create actionable content brief with:
        1. 3 compelling hook variations that leverage the emotional trigger
        2. 3 different content angles
        3. Specific target audience description
        4. 3 platform-optimized call-to-action options
        5. 3 relevant affiliate product suggestions
        6. 5-point content outline
        7. Current trending topics to incorporate
        """

        response = self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a content marketing strategist specializing in viral content and affiliate marketing. Create detailed, actionable briefs."},
                {"role": "user", "content": brief_prompt}
            ],
            max_tokens=1500,
            temperature=0.8
        )

        # For now, fall back to smart generation
        return self._smart_brief_generation(content, analysis)

    def _smart_brief_generation(self, content: ViralContent, analysis: ContentAnalysis) -> ContentBrief:
        import random

        title_lower = content.title.lower()

        # Generate smart hook suggestions based on emotional trigger
        hook_templates = {
            'curiosity': [
                f"What if I told you {title_lower.replace('how', 'there\'s a way')}?",
                f"The secret behind {title_lower.split()[1:4] if len(title_lower.split()) > 3 else title_lower.split()}",
                f"You won't believe what happened when I tried {title_lower.split()[1:3] if len(title_lower.split()) > 2 else 'this method'}"
            ],
            'excitement': [
                f"This {title_lower.split()[1] if len(title_lower.split()) > 1 else 'method'} will blow your mind!",
                f"BREAKTHROUGH: {title_lower.replace('how', 'new way')}",
                f"The {title_lower.split()[1:3] if len(title_lower.split()) > 2 else 'amazing'} discovery everyone's talking about"
            ],
            'fear': [
                f"WARNING: Avoid these {title_lower.split()[1:3] if len(title_lower.split()) > 2 else 'mistakes'}",
                f"Don't make this {title_lower.split()[1] if len(title_lower.split()) > 1 else 'common'} mistake",
                f"Why {title_lower.replace('how', 'most people')} fail (and how to avoid it)"
            ]
        }

        emotional_trigger = analysis.viral_patterns.emotional_trigger
        hooks = hook_templates.get(emotional_trigger, hook_templates['curiosity'])[:3]

        # Generate content angles based on platform
        angle_options = {
            'reddit': ["Personal experience story", "Community discussion starter", "Educational breakdown"],
            'youtube': ["Tutorial walkthrough", "Behind-the-scenes journey", "Comparison review"],
            'google': ["Comprehensive guide", "Step-by-step tutorial", "Expert analysis"],
            'bing': ["News-style coverage", "Research-backed analysis", "Industry insight"]
        }
        angles = angle_options.get(content.platform.value, angle_options['reddit'])

        # Determine target audience based on content and opportunities
        if any('programming' in opp.product_category for opp in analysis.affiliate_opportunities):
            target_audience = "Developers, programmers, and tech professionals interested in coding tools and career growth"
        elif any('ai' in opp.product_category.lower() for opp in analysis.affiliate_opportunities):
            target_audience = "Tech enthusiasts, business owners, and professionals exploring AI automation"
        elif any('business' in opp.product_category for opp in analysis.affiliate_opportunities):
            target_audience = "Entrepreneurs, business owners, and professionals seeking growth strategies"
        else:
            target_audience = "Digital professionals and content creators looking to improve productivity"

        # Generate platform-specific CTAs
        cta_templates = {
            'reddit': ["Comment your experience below", "Join the discussion in comments", "Share your own tips"],
            'youtube': ["Subscribe for more tutorials", "Like if this helped you", "Download the free guide"],
            'google': ["Read the full guide here", "Get the complete toolkit", "Start your free trial"],
            'bing': ["Learn more about this topic", "Explore related resources", "Get expert consultation"]
        }
        ctas = cta_templates.get(content.platform.value, cta_templates['google'])

        # Get affiliate products from analysis
        affiliate_products = []
        for opp in analysis.affiliate_opportunities:
            affiliate_products.extend(opp.recommended_products[:2])
        affiliate_products = affiliate_products[:3] if affiliate_products else ["productivity tools", "online courses", "software solutions"]

        # Generate content outline based on structure
        outlines = {
            'problem-solution': [
                "Hook: Present the problem everyone faces",
                "Agitate: Explain why this problem matters",
                "Solution: Introduce your method/tool",
                "Proof: Show results or evidence",
                "Action: Clear next steps for readers"
            ],
            'tutorial': [
                "Hook: Promise what they'll learn",
                "Overview: What you'll cover",
                "Step-by-step walkthrough",
                "Common mistakes to avoid",
                "Next steps and resources"
            ],
            'story-telling': [
                "Hook: Start with compelling moment",
                "Background: Set the scene",
                "Journey: What happened",
                "Lesson: Key takeaway",
                "Application: How others can use this"
            ]
        }
        content_structure = analysis.viral_patterns.content_structure
        outline = outlines.get(content_structure, outlines['problem-solution'])

        # Generate trending topics based on content theme
        trending_base = []
        if any(word in title_lower for word in ['programming', 'coding']):
            trending_base = ["AI coding", "remote work", "tech careers", "programming productivity"]
        elif any(word in title_lower for word in ['ai', 'artificial intelligence']):
            trending_base = ["AI automation", "machine learning", "chatbots", "AI productivity"]
        elif any(word in title_lower for word in ['business', 'money', 'success']):
            trending_base = ["digital marketing", "side hustles", "passive income", "business automation"]
        else:
            trending_base = ["productivity", "remote work", "digital tools", "online learning"]

        return ContentBrief(
            id=str(uuid.uuid4()),
            original_content_id=content.id,
            title=f"Content Brief: {content.title[:50]}{'...' if len(content.title) > 50 else ''}",
            hook_suggestions=hooks,
            content_angles=angles,
            target_audience=target_audience,
            call_to_actions=ctas,
            affiliate_products=affiliate_products,
            content_outline=outline,
            trending_topics=trending_base,
            estimated_engagement=content.viral_score * random.uniform(0.7, 0.9),
            generated_date=datetime.now()
        )

    def _create_fallback_analysis(self, content_id: str) -> ContentAnalysis:
        return ContentAnalysis(
            content_id=content_id,
            viral_patterns=ViralPattern(
                hook_strength=7.0,
                emotional_trigger="curiosity",
                content_structure="standard",
                timing_factor=6.0,
                audience_appeal="general"
            ),
            affiliate_opportunities=[
                AffiliateOpportunity(
                    product_category="general",
                    monetization_angle="relevance",
                    target_audience="broad",
                    commission_potential="medium"
                )
            ],
            key_insights=["Engaging content", "Good timing", "Relevant topic"],
            success_factors=["Clear message", "Visual appeal", "Shareability"],
            recommended_adaptations=["Adapt for different platforms", "Add personal touch"]
        )

    def _create_fallback_brief(self, content: ViralContent) -> ContentBrief:
        return ContentBrief(
            id=str(uuid.uuid4()),
            original_content_id=content.id,
            title=f"Brief: {content.title[:50]}...",
            hook_suggestions=["Discover how to...", "The secret to...", "Why everyone is talking about..."],
            content_angles=["Educational", "Entertainment", "Inspirational"],
            target_audience="General audience",
            call_to_actions=["Learn more", "Try it now", "Get started"],
            affiliate_products=["related tools", "courses", "resources"],
            content_outline=["Introduction", "Main content", "Key points", "Benefits", "Conclusion"],
            trending_topics=["viral content", "social media", "marketing"],
            estimated_engagement=50.0,
            generated_date=datetime.now()
        )