// server/adapters/trends.ts
// This is a mock adapter. In a real application, this would use libraries like 'google-trends-api'
// or an RSS parser to fetch data from whitelisted sources.

export interface TrendData {
    topic: string;
    url: string;
    source: 'Google Trends' | 'YouTube Trending' | 'TikTok';
    geo: string;
    metrics: {
        searchVolume?: number;
        velocity?: 'high' | 'medium' | 'low';
        competition?: 'high' | 'medium' | 'low';
    };
}

const mockData: Omit<TrendData, 'geo'>[] = [
    {
        topic: `Top AI Gadgets to Watch in ${new Date().getFullYear()}`,
        url: 'https://trends.google.com/trends/explore?q=ai+gadgets',
        source: 'Google Trends',
        metrics: { searchVolume: 150000, velocity: 'medium', competition: 'high' }
    },
    {
        topic: `New "Cinematic Director" mode in Veo 3.1`,
        url: 'https://youtube.com/feed/trending',
        source: 'YouTube Trending',
        metrics: { velocity: 'high', competition: 'medium' }
    },
    {
        topic: `Viral "AI replaces my job for a day" challenge`,
        url: `https://www.tiktok.com/discover/ai-job-challenge`,
        source: 'TikTok',
        metrics: { velocity: 'high', competition: 'high' }
    },
    {
        topic: 'Is AGI closer than we think? Experts debate.',
        url: 'https://trends.google.com/trends/explore?q=artificial+general+intelligence',
        source: 'Google Trends',
        metrics: { searchVolume: 80000, velocity: 'low', competition: 'high' }
    },
    {
        topic: 'The ultimate productivity setup with AI tools',
        url: 'https://youtube.com/feed/trending',
        source: 'YouTube Trending',
        metrics: { velocity: 'medium', competition: 'medium' }
    }
];


export const getTrendingTopics = async (niche: string, platforms: string[], geo: string = 'US'): Promise<TrendData[]> => {
    console.log(`ADAPTER: Fetching trends for niche "${niche}" from platforms: ${platforms.join(', ')} in geo: ${geo}`);

    // Simulate an API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Return mock data, filtered by platform and with the geo added
    const platformSources = platforms.map(p => {
        if (p.toLowerCase().includes('google')) return 'Google Trends';
        if (p.toLowerCase().includes('youtube')) return 'YouTube Trending';
        if (p.toLowerCase().includes('tiktok')) return 'TikTok';
        return '';
    }).filter(Boolean);

    return mockData
        .filter(d => platformSources.includes(d.source))
        .map(d => ({ ...d, geo }));
};
