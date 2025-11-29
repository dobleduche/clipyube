// server/services/discovery.ts
import { getTrendingTopics, type TrendData } from '../adapters/trends.js';
import * as db from '../db/index.js';
import { addAutomationLog } from '../db/index.js';

/**
 * Calculates a score for a trend to prioritize it.
 * This is a simplified heuristic. A real system would be more complex.
 */
const scoreTrend = (trend: TrendData): number => {
    let score = 50; // Base score
    
    // Velocity is a strong indicator
    if (trend.metrics.velocity === 'high') score += 30;
    if (trend.metrics.velocity === 'medium') score += 15;

    // Competition can be negative
    if (trend.metrics.competition === 'high') score -= 10;
    if (trend.metrics.competition === 'low') score += 10;

    // Search volume provides a small boost
    if (trend.metrics.searchVolume && trend.metrics.searchVolume > 100000) {
        score += 5;
    }
    
    return Math.max(0, Math.min(100, score)); // Clamp score between 0 and 100
};


/**
 * A service to run the content discovery process.
 * 1. Fetches raw trending topics from adapters.
 * 2. Scores and processes them into discovery items.
 * 3. Saves new, unique discoveries to the database.
 */
export const runDiscovery = async (niche: string, platforms: string[], geo: string) => {
    addAutomationLog(`Starting discovery for niche: "${niche}" in geo: ${geo}`);
    const topics = await getTrendingTopics(niche, platforms, geo);
    
    const discoveriesTable = db.getTable('discoveries');
    const existingUrls = new Set(discoveriesTable.map(d => d.url));
    const newDiscoveries = [];

    for (const topic of topics) {
        if (existingUrls.has(topic.url)) {
            continue; // Skip duplicates
        }

        const calculatedScore = scoreTrend(topic);

        const newDiscovery = {
            id: `disc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            topic: topic.topic,
            url: topic.url,
            score: calculatedScore,
            payload: topic, // Store the raw data
            status: 'new',
            fetched_at: new Date().toISOString()
        };
        db.addItem('discoveries', newDiscovery);
        newDiscoveries.push(newDiscovery);
    }
    
    if (newDiscoveries.length > 0) {
        addAutomationLog(`Discovery complete. Found ${newDiscoveries.length} new topics.`, 'success');
    } else {
        addAutomationLog(`Discovery complete. No new topics found.`);
    }
    return newDiscoveries;
};
