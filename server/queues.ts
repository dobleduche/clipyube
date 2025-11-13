
// FIX: QueueScheduler has been removed in newer versions of BullMQ.
// Repeatable jobs are now handled by the Worker, so this is no longer needed.
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// In a real app, connection details would come from environment variables.
// A mock is used here for compatibility with the development environment.
const connection = new IORedis({ maxRetriesPerRequest: null });

// Reusable function to create queues with the shared connection
const createQueue = (name: string) => new Queue(name, { connection });

// Define and export all application queues
export const discoveryQueue = createQueue('discovery');
export const generationQueue = createQueue('generation');
export const renderQueue = createQueue('render');
export const publishQueue = createQueue('publish');

// Instantiate schedulers for each queue to enable repeatable jobs
// FIX: Commented out deprecated QueueScheduler instantiations.
// new QueueScheduler('discovery', { connection });
// new QueueScheduler('generation', { connection });
// new QueueScheduler('render', { connection });
// new QueueScheduler('publish', { connection });

// Export the connection for workers to use
export const redisConnection = connection;
