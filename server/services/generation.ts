// server/services/generation.ts
import * as db from '../db';
// FIX: Import addAutomationLog to make it available in this module.
import { addAutomationLog } from '../db';
import * as llm from '../adapters/llm';

/**
 * A service to build drafts from new discoveries.
 * 1. Finds the highest-scoring 'new' discoveries (up to limit).
 * 2. Generates a script/blog post for each using an LLM.
 * 3. Creates a 'draft' record in the database.
 * 4. Updates the discovery status.
 */
export const buildDrafts = async (limit: number = 1): Promise<Draft[]> => {
  addAutomationLog('Checking for new discoveries to draft...');
  const discoveries = await db.getTable('discoveries') as Discovery[];
  const newDiscoveries = discoveries
    .filter(d => d.status === 'new')
    .sort((a, b) => b.score - a.score) // Sort by score descending
    .slice(0, limit); // Process up to 'limit' discoveries

  if (newDiscoveries.length === 0) {
    addAutomationLog('No new discoveries to process.');
    return [];
  }

  const newDrafts: Draft[] = [];
  addAutomationLog(`Found ${newDiscoveries.length} new discoveries. Processing top ${limit}...`);

  for (const discoveryToProcess of newDiscoveries) {
    try {
      const prompt = `You are a viral content writer. Generate a script for a short, 60-second vertical video about the topic: "${discoveryToProcess.topic}". The script should have a strong hook, be engaging, and end with a call to action. The output must be just the script text, with no extra commentary.`;

      const generatedContent = await llm.generateTextContent(prompt);
      if (!generatedContent || typeof generatedContent !== 'string') {
        throw new Error('LLM returned invalid content.');
      }

      const newDraft: Draft = {
        id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        discovery_id: discoveryToProcess.id,
        kind: 'short_video',
        title: discoveryToProcess.topic,
        script_md: generatedContent,
        status: 'generated',
      };

      await db.addItem('drafts', newDraft);
      newDrafts.push(newDraft);
      discoveryToProcess.status = 'drafted';
      await db.updateItem('discoveries', discoveryToProcess.id, discoveryToProcess); // Persist status
      addAutomationLog(`Successfully created draft for topic: "${discoveryToProcess.topic}"`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      discoveryToProcess.status = 'dropped';
      await db.updateItem('discoveries', discoveryToProcess.id, discoveryToProcess); // Persist failed status
      addAutomationLog(`Failed to create draft for topic: "${discoveryToProcess.topic}". Reason: ${message}`, 'error');
    }
  }

  return newDrafts;
};

// Define interfaces for type safety
interface Discovery {
  id: string;
  topic: string;
  score: number;
  status: 'new' | 'drafted' | 'dropped';
  // Add other fields as needed
}

interface Draft {
  id: string;
  discovery_id: string;
  kind: string;
  title: string;
  script_md: string;
  status: 'generated' | 'rendering' | 'ready' | 'render-failed' | 'published' | 'publish-failed';
}
