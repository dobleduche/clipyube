import { type BlogPost } from '../types/blog';

// Mock data that would eventually come from a database or CMS
export const initialBlogPosts: BlogPost[] = [
    {
        slug: 'ultimate-ai-workflow-social-media-graphics',
        title: 'The Ultimate 10-Minute AI Workflow for Stunning Social Media Graphics',
        author: 'AI Agent',
        date: 'October 26, 2023',
        image: 'https://images.pexels.com/photos/879109/pexels-photo-879109.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        snippet: 'A fast-paced tutorial showing how to go from a simple idea to a polished graphic using AI tools. Start with a text prompt, generate an image, use an AI editor to add text and branding, and export. Focus on speed and impressive results.',
        content: `
<p>In the fast-paced world of social media, speed and quality are everything. But what if you could create eye-catching graphics in minutes, not hours, without being a design pro? Welcome to the 10-minute AI workflow. This guide will show you how to leverage a suite of AI tools to turn a simple idea into a ready-to-post masterpiece.</p>
<h3 class="text-2xl font-bold text-white mt-6 mb-3">Step 1: The Prompt is Everything (2 Minutes)</h3>
<p>Forget blank canvases. Your new starting point is a text prompt. Open your favorite AI image generator and describe your vision. Don't just say "a cat." Say, "A cinematic, futuristic photo of a cat wearing sunglasses in a neon-lit Tokyo street." The more descriptive you are, the better your starting material will be.</p>
<h3 class="text-2xl font-bold text-white mt-6 mb-3">Step 2: Generate and Select (3 Minutes)</h3>
<p>Run your prompt! Most tools will give you a few variations. Spend a few minutes selecting the one that best captures the mood and composition you're aiming for. Look for good lighting, clear subjects, and space for text if you need it.</p>
<h3 class="text-2xl font-bold text-white mt-6 mb-3">Step 3: AI-Powered Editing with Clip-Yube (4 Minutes)</h3>
<p>This is where the magic happens. Upload your generated image to an AI editor like Clip-Yube. Instead of fiddling with sliders, use prompts:</p>
<ul class="list-disc list-inside space-y-2 my-4 pl-4">
    <li>'Add the text "CyberKitty" in a bold, futuristic font.'</li>
    <li>'Make the colors more vibrant and increase the contrast.'</li>
    <li>'Apply a retro, cinematic filter.'</li>
    <li>'Add my logo to the bottom right corner.'</li>
</ul>
<p>The AI handles the complex adjustments, allowing you to focus on the creative direction. This iterative, conversational process is incredibly fast and intuitive.</p>
<h3 class="text-2xl font-bold text-white mt-6 mb-3">Step 4: Export and Post (1 Minute)</h3>
<p>Once you're happy with the result, export your image. The entire process, from idea to finished graphic, is complete in about 10 minutes. You now have a high-quality, unique visual that's ready to grab attention on any platform.</p>
        `
    },
    {
        slug: 'we-tried-viral-ai-interior-designer',
        title: 'We Tried the Viral "AI Interior Designer" Trend - The Results Will Shock You!',
        author: 'AI Agent',
        date: 'October 24, 2023',
        image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        snippet: 'Based on the rising search term "AI interior design". We took a photo of a plain room and fed it to an AI with different style prompts. The results were... unexpected.',
        content: `
<p>The internet is buzzing with a new trend: using AI to redesign your home. The promise is simple: snap a photo of any room, feed it to an AI with a style prompt like "bohemian" or "industrial," and get instant inspiration. But does it actually work? We put it to the test.</p>
<h3 class="text-2xl font-bold text-white mt-6 mb-3">The Experiment</h3>
<p>Our test subject was a fairly standard, uninspired bedroom. We took a well-lit photo and gave an AI image editor four distinct prompts:</p>
<ol class="list-decimal list-inside space-y-2 my-4 pl-4">
    <li>'Redesign this room in a minimalist Scandinavian style.'</li>
    <li>'Transform this into a cozy, cluttered bohemian paradise.'</li>
    <li>'Give this room a dark, industrial loft aesthetic.'</li>
    <li>'Make it a futuristic, cyberpunk-themed bedroom.'</li>
</ol>
<h3 class="text-2xl font-bold text-white mt-6 mb-3">The Good, The Bad, and The AI</h3>
<p>The results were a fascinating mix. The Scandinavian design was surprisingly elegant and practical. The AI understood the core concepts of light woods, neutral colors, and clean lines. The bohemian room was also a success, filled with plants, textiles, and a warm, inviting clutter that felt authentic.</p>
<p>The industrial loft, however, was where things got weird. The AI added exposed brick and metal pipes, but it also decided to remove the window entirely, replacing it with a solid concrete wall. A bold choice, to say the least.</p>
<p>And the cyberpunk room? Let's just say it involved more neon than is probably safe for sleeping and a bed that looked like it was taken from the set of Blade Runner. It was visually stunning but utterly impractical.</p>
<h3 class="text-2xl font-bold text-white mt-6 mb-3">The Verdict</h3>
<p>AI interior design is an incredible tool for brainstorming and inspiration. It can help you visualize styles you might never have considered. But it's not ready to replace human designers just yet. Use it to generate ideas, find color palettes, and experiment with layouts, but maybe double-check that it doesn't remove all your windows before you start renovating.</p>
        `
    }
];
