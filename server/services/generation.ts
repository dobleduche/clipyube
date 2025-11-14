// server/services/generation.ts
import * as db from '../db';
import * as llm from '../adapters/llm';
import { addAutomationLog } from '../db';

/**
 * A service to build drafts from new discoveries.
 * 1. Finds the highest-scoring 'new' discovery.
 * 2. Generates a script/blog post for it using an LLM.
 * 3. Creates a 'draft' record in the database.
 * 4. Updates the discovery status.
 */
export const buildDrafts = async (): Promise<any[]> => {
    addAutomationLog('Checking for new discoveries to draft...');
    const discoveries = db.getTable('discoveries')
        .filter(d => d.status === 'new')
        .sort((a, b) => b.score - a.score); // Sort by score descending

    if (discoveries.length === 0) {
        addAutomationLog('No new discoveries to process.');
        return [];
    }

    const discoveryToProcess = discoveries[0]; // Process the highest-scoring one
    addAutomationLog(`Found ${discoveries.length} new discoveries. Drafting highest score: "${discoveryToProcess.topic}" (${discoveryToProcess.score})`);
    
    const newDrafts = [];

    try {
        const prompt = `You are a viral content writer. Generate a script for a short, 60-second vertical video about the topic: "${discoveryToProcess.topic}". The script should have a strong hook, be engaging, and end with a call to action. The output must be just the script text, with no extra commentary.`;
        
        const generatedContent = await llm.generateTextContent(prompt);

        const newDraft = {
            id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            discovery_id: discoveryToProcess.id,
            kind: 'short_video', // Define the format for the pipeline
            title: discoveryToProcess.topic,
            script_md: generatedContent,
            status: 'generated'
        };

        db.addItem('drafts', newDraft);
        newDrafts.push(newDraft);
        discoveryToProcess.status = 'drafted'; // Update the original discovery item
        addAutomationLog(`Successfully created draft for topic: "${discoveryToProcess.topic}"`, 'success');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        addAutomationLog(`Failed to create draft for topic: "${discoveryToProcess.topic}". Reason: ${message}`, 'error');
        discoveryToProcess.status = 'dropped';
    }
    
    return newDrafts;
};
