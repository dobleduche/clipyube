
import React, { useState } from 'react';
import { ChevronDownIcon } from '../components/Icons';

const FaqItem: React.FC<{ question: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ question, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-white/10">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left py-5 px-2"
                aria-expanded={isOpen}
            >
                <h3 className="text-lg font-semibold text-white">{question}</h3>
                <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="pb-5 px-2 text-slate-300 leading-relaxed prose">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DocSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-12">
        <h3 className="text-3xl font-bold text-white mb-6 pb-2 border-b-2 border-cyan-500/50 font-oswald tracking-wide">{title}</h3>
        <div className="prose prose-lg max-w-none text-slate-300 space-y-4">
            {children}
        </div>
    </div>
);

const DocsFaqPage: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-3 font-oswald text-gradient-cyan-sanguine">
                    Documentation
                </h2>
                <p className="text-lg text-slate-400">
                    Your guide to mastering Clip-Yube and automating your content creation.
                </p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-4 sm:p-8 rounded-2xl shadow-2xl">
                
                <DocSection title="The Editor: Your Creative Canvas">
                    <p>The Clip-Yube editor is where your ideas become reality. It's designed for speed and intuitive control, replacing complex tools with the power of language.</p>
                    
                    <h4>The Art of the Prompt: From Idea to Image</h4>
                    <p>The quality of your output is directly tied to the quality of your input prompt. Think of it as briefing a world-class artist. The more context and detail you provide, the closer the result will be to your vision.</p>
                    <ul>
                        <li><strong>Be Hyper-Descriptive:</strong> Don't just say <code>"a car"</code>. Specify the model, color, condition, and environment: <code>"A vintage, cherry-red 1960s convertible Mustang, parked on a wet cobblestone street in Paris at dusk, with streetlights reflecting on its hood."</code></li>
                        <li><strong>Evoke a Mood and Style:</strong> Use artistic and emotional adjectives. Words like <code>"cinematic lighting"</code>, <code>"serene atmosphere"</code>, <code>"whimsical fairytale illustration"</code>, <code>"dystopian cyberpunk aesthetic"</code>, or <code>"in the style of Ansel Adams"</code> will dramatically guide the AI.</li>
                        <li><strong>Control the Camera:</strong> Direct the shot like a photographer. Use terms like <code>"extreme close-up shot"</code>, <code>"wide-angle landscape"</code>, <code>"dutch angle"</code>, <code>"drone footage perspective"</code>, or <code>"macro photography"</code> to control composition and perspective.</li>
                        <li><strong>Chain Prompting for Iteration:</strong> Don't try to get everything perfect in one go. Build your image layer by layer. Start with a base image, then issue follow-up prompts like <code>"Now, add a person walking a dog in the background"</code> or <code>"Change the season to a snowy winter."</code> Each successful generation becomes the foundation for your next creative step.</li>
                    </ul>

                    <h4>Mastering the Workflow: A Step-by-Step Example</h4>
                    <p>Let's create a promotional graphic for a fictional brand, "AstroCoffee," to see the workflow in action.</p>
                    <ol>
                        <li><strong>Step 1: The Base Image.</strong> We start by uploading a simple, clean photo of a coffee mug.</li>
                        <li><strong>Step 2: Establish the Scene.</strong> With the mug uploaded, we give our first prompt: <code>"Place this coffee mug on a wooden table inside a spaceship, with a large window showing a vibrant nebula in the background."</code> The AI generates a new image with our core scene set.</li>
                        <li><strong>Step 3: Add a Magical Touch.</strong> The scene is good, but let's make it more dynamic. Next prompt: <code>"Make the steam rising from the coffee look like a swirling purple and blue galaxy."</code></li>
                        <li><strong>Step 4: Refine with the Brush.</strong> The galaxy steam is cool, but we want some highlights. We open the <strong>Brush Tool</strong>, select a bright white color with a small size, and add a few sparkling star-like dots on the nebula and steam to make it pop. We then click "Apply Drawing."</li>
                        <li><strong>Step 5: Final Polish.</strong> The image looks a bit flat. We navigate to the <strong>Filters & Adjustments</strong> panel, apply the "Cinematic" filter, and then slightly increase the <strong>Contrast</strong> and <strong>Saturation</strong> sliders to make the colors richer.</li>
                        <li><strong>Step 6: Branding.</strong> Finally, we open the <strong>Watermark Tool</strong>, type "AstroCoffee" as the text, select the "Oswald" font, and position it in the bottom-right corner. We now have a unique, branded graphic ready for social media.</li>
                    </ol>
                    
                    <h4>Deep Dive: Understanding Your Tools</h4>
                    <ul>
                        <li><strong>Filters:</strong> One-click presets for common looks like "Vintage" or "Cinematic." These are CSS filters that provide a live preview. Applying a "Canvas" filter (like Vignette) will bake the effect into the image, creating a new entry in your history.</li>
                        <li><strong>Video Generation:</strong> This tool uses your current image as an optional starting frame and a text prompt to generate a short video clip using Google's Veo model. It's perfect for creating engaging social media content or animated versions of your static images.</li>
                        <li><strong>Brush Tool:</strong> A freeform drawing tool. Use it for quick annotations, highlights, or creative flourishes directly on your image. When you're done, click "Apply Drawing" to merge your strokes with the current image.</li>
                    </ul>
                </DocSection>

                <DocSection title="The Automation Engine: Your Content Factory">
                    <h4>The Human-in-the-Loop Philosophy</h4>
                    <p>We believe in a <strong>human-first</strong> approach. AI tools are not here to replace your creativity; they are here to amplify it. This system is designed to be your tireless creative assistant. It handles the research, the first drafts, and the promotional material, freeing you to focus on strategy, refinement, and adding your unique human touch.</p>

                    <h4>The 3-Step Automated Workflow</h4>
                    <p>You can automate 90% of your content pipeline with this simple, powerful workflow:</p>
                    <ol>
                        <li>
                            <strong>Step 1: Automated Discovery (The Viral Agent)</strong>
                            <p>Set your niche in the Viral Content Agent. Think of this as giving your assistant their weekly assignment. Run the agent to get a curated list of high-potential content ideas. This is your entire research phase, done in minutes.</p>
                        </li>
                        <li>
                            <strong>Step 2: Automated First Drafts (Blog Generation)</strong>
                            <p>From the idea list, click <strong>"Create Blog Post"</strong>. The AI will instantly write a full first draft, complete with HTML formatting. Your job is now to be the <strong>Editor-in-Chief</strong>. Review the draft, add personal stories, inject your brand's voice, and ensure it aligns perfectly with your vision. The AI does the heavy lifting; you provide the final polish and humanity.</p>
                        </li>
                        <li>
                            <strong>Step 3: Automated Promotion (Video Snippets)</strong>
                            <p>From the same idea card, click <strong>"Generate Video"</strong>. The agent's brief is automatically sent to the video editor. Generate a short, eye-catching video clip perfect for social media. Your job is the <strong>Creative Director</strong>. Add your brand's music, use the caption feature, and schedule the posts to drive traffic to your full article.</p>
                        </li>
                    </ol>

                    <h4>Best Practices for AI-Assisted Content Creation</h4>
                    <ul>
                      <li><strong>Always Fact-Check:</strong> Generative models can sometimes "hallucinate" or state incorrect information with confidence. Always verify statistics, names, and key facts, especially for non-fiction content.</li>
                      <li><strong>Inject Your Voice:</strong> An AI draft is a starting point. The most valuable part of your content is you. Add personal anecdotes, opinions, and your unique brand voice to transform the generic draft into something authentic and compelling.</li>
                      <li><strong>Review and Refine:</strong> Don't just publish the raw output. Read through the generated text to check for flow, repetitive phrasing, and tone. Use your human expertise to elevate the content from good to great.</li>
                    </ul>
                </DocSection>

                <DocSection title="Frequently Asked Questions">
                    <div className="-mx-2">
                        <FaqItem question="How does the AI image editing work?">
                            <p>
                                Our image editor is powered by Google's advanced Gemini 2.5 Flash Image model. When you upload an image and provide a text prompt (e.g., "add a retro filter"), the model analyzes both the image and your text to generate a new image that reflects your command. It's like having a conversation with a professional photo editor!
                            </p>
                        </FaqItem>
                        <FaqItem question="What file formats are supported for upload?">
                            <p>
                                You can currently upload images in <strong>PNG, JPEG, and WEBP</strong> formats. For the best results, especially with features like background removal, we recommend using high-quality images with clear subjects.
                            </p>
                        </FaqItem>
                        <FaqItem question="My AI generation failed. What are common reasons?">
                          <p>Generation can fail for a few reasons. Here are the most common:</p>
                          <ul>
                            <li><strong>API Key Issue:</strong> For video generation with Veo, your API key might be invalid or lack the necessary permissions. The prompt to re-select your key is designed to fix this. For other features, ensure your key is correctly configured.</li>
                            <li><strong>Content Policy:</strong> Your prompt may have been blocked by the AI's safety filters. Try rephrasing your request to be more specific and avoid ambiguous or potentially sensitive terms.</li>
                            <li><strong>Billing or Quota Limits:</strong> You may have exceeded the usage limits on your Google AI Studio account. Please check your account status and billing information on their website to ensure your account is active.</li>
                            <li><strong>Network Error:</strong> A temporary connection issue might have occurred. Simply trying again often resolves the problem.</li>
                          </ul>
                        </FaqItem>
                        <FaqItem question="How is my data and privacy handled?" defaultOpen={true}>
                            <p>
                                We take your privacy and security seriously. Here’s how we protect you:
                            </p>
                             <ul>
                                <li><strong>Secure API Proxy:</strong> All communication with external AI models (like Google Gemini) goes through a secure proxy layer. This means your API keys are never exposed in your browser, protecting them from being stolen.</li>
                                <li><strong>Content Sanitization:</strong> All AI-generated HTML content (like blog posts) is automatically sanitized to remove potentially malicious code (e.g., <code>&lt;script&gt;</code> tags). This protects you and your visitors from Cross-Site Scripting (XSS) attacks.</li>
                                <li><strong>Local Storage:</strong> Your creative work, such as generated blog posts and editor state, is saved directly in your browser's local storage for your convenience. This data is not sent to our servers and is not accessible by us. You can clear this data at any time by clearing your browser's site data.</li>
                            </ul>
                        </FaqItem>
                         <FaqItem question="How do I save my work in the editor?">
                            <p>The editor features a robust auto-save system. Your current image, prompt, and settings are automatically saved to your browser's local storage every few seconds. If you accidentally close the tab or your browser crashes, simply reopen the editor, and it will restore your last session. You can clear this saved state by clicking the "Trash" icon in the editor to start fresh.</p>
                        </FaqItem>
                         <FaqItem question="How do the default watermark settings work?">
                            <p>You can set up your preferred default text watermark in the <strong>Settings</strong> page. Configure your brand name, favorite font, color, and opacity. The next time you open the Watermark tool in the editor, these settings will be automatically applied, saving you time and ensuring brand consistency across your creations.</p>
                        </FaqItem>
                    </div>
                </DocSection>
            </div>
        </div>
    );
};

export default DocsFaqPage;
