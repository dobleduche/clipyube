import * as db from '../db';
import { generateTextWithOpenAI } from '../adapters/openai'; // Using OpenAI now

/**
 * A service to build drafts from new discoveries.
 * 1. Finds 'new' discoveries in the database.
 * 2. Generates a script/blog post for each using an LLM.
 * 3. Creates a 'draft' record in the database.
 * 4. Updates the discovery status.
 */
export const buildDrafts = async (): Promise<any[]> => {
    console.log('SERVICE: Checking for new discoveries to draft...');
    const discoveries = db.getTable('discoveries').filter(d => d.status === 'new');
    const newDrafts = [];

    if (discoveries.length === 0) {
        console.log('SERVICE: No new discoveries to process.');
        return [];
    }

    console.log(`SERVICE: Found ${discoveries.length} new discoveries. Generating drafts with OpenAI...`);

    for (const discovery of discoveries) {
        try {
            const prompt = `You are a viral content writer. Generate a script for a short, 60-second vertical video about the topic: "${discovery.topic}". The script should have a strong hook. The output must be just the script text, with no extra commentary.`;
            // Switching to OpenAI as requested by the user's install command
            const generatedContent = await generateTextWithOpenAI(prompt);

            const newDraft = {
                id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                discovery_id: discovery.id,
                kind: 'video', // Creating video drafts now
                title: discovery.topic,
                script_md: generatedContent,
                status: 'generated'
            };

            db.addItem('drafts', newDraft);
            newDrafts.push(newDraft);
            discovery.status = 'drafted'; // Update the original discovery item
            console.log(`SERVICE: Successfully created draft for topic: "${discovery.topic}"`);
        } catch (error) {
            console.error(`SERVICE: Failed to create draft for topic: "${discovery.topic}"`, error);
            discovery.status = 'dropped';
        }
    }
    return newDrafts;
};