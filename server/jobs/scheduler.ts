// This file sets up scheduled jobs for the BullMQ queuing system.

import { discoveryQueue } from '../queues';

console.log('BullMQ job scheduler starting...');

const setupScheduledJobs = async () => {
    // Clear any existing repeatable jobs to avoid duplicates on server restart
    const repeatableJobs = await discoveryQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
        await discoveryQueue.removeRepeatableByKey(job.key);
    }

    // Schedule the discovery job to run automatically.
    // This job will kick off the entire content pipeline by chaining subsequent jobs.
    await discoveryQueue.add('discover-content', 
        { niche: 'AI Technology', platforms: ['google', 'youtube'] }, 
        { 
            // Using a cron expression for the schedule (e.g., every 30 minutes)
            repeat: { cron: '*/30 * * * *' } 
        }
    );

    console.log('Automated discovery job scheduled with BullMQ.');
};

// Initialize the scheduler when the server starts.
setupScheduledJobs().catch(console.error);