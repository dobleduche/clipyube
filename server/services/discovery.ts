import { getTrendingTopics } from '../adapters/trends';
import * as db from '../db';

/**
 * A service to run the content discovery process.
 * 1. Fetches raw trending topics from adapters.
 * 2. Processes them into discovery items.
 * 3. Saves new discoveries to the database.
 */
export const runDiscovery = async (niche: string, platforms: string[]) => {
    console.log('SERVICE: Starting discovery run...');
    const topics = await getTrendingTopics(niche, platforms);
    
    const discoveriesTable = db.getTable('discoveries');
    const newDiscoveries = [];

    for (const topic of topics) {
        // In a real app, you'd check if this topic (or a similar one) already exists.
        const newDiscovery = {
            id: `disc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            source_id: 'source_placeholder', // Would link to a source in the DB
            topic: topic.topic,
            url: topic.url,
            score: topic.score,
            payload: { raw: topic },
            status: 'new',
            fetched_at: new Date().toISOString()
        };
        db.addItem('discoveries', newDiscovery);
        newDiscoveries.push(newDiscovery);
    }
    
    console.log(`SERVICE: Discovery complete. Found ${newDiscoveries.length} new topics.`);
    return newDiscoveries;
};
