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
                
                <DocSection title="User Guide: Getting the Best Results">
                    <p>Welcome to Clip-Yube! This guide will help you unlock the full potential of our AI-powered creative suite.</p>
                    
                    <h4>Mastering the Prompt</h4>
                    <p>The quality of your output depends heavily on the quality of your input. Think of prompting as a conversation with a creative partner. The more detail you provide, the better.</p>
                    <ul>
                        <li><strong>Be Descriptive:</strong> Instead of <code>"a cat"</code>, try <code>"A fluffy Persian cat sleeping on a velvet cushion in a sunbeam."</code></li>
                        <li><strong>Use Adjectives for Style:</strong> Words like <code>"cinematic"</code>, <code>"vintage"</code>, <code>"futuristic"</code>, or <code>"whimsical"</code> can dramatically change the mood.</li>
                        <li><strong>Specify Composition & Lighting:</strong> Use terms like <code>"close-up shot"</code>, <code>"wide-angle landscape"</code>, or <code>"dramatic side-lighting"</code>.</li>
                        <li><strong>Reference Artists or Styles:</strong> Get creative by asking for results <code>"in the style of Van Gogh"</code> or <code>"like a 90s comic book."</code></li>
                    </ul>

                    <h4>The Creative Workflow in the Editor</h4>
                    <p>Combine tools for professional results. Here’s a recommended workflow:</p>
                    <ol>
                        <li><strong>Start with a Base:</strong> Upload a high-quality image. A clear, well-lit subject works best.</li>
                        <li><strong>Iterate with Prompts:</strong> Make incremental changes. First, change the background. Then, adjust the subject's clothing. Then, change the lighting. Each successful generation can be the base for your next prompt.</li>
                        <li><strong>Leverage Advanced Tools:</strong> Use the panels for specific tasks. <strong>Upscale</strong> your image *after* you're happy with the composition. Use <strong>Remove Background</strong> to isolate subjects for posters or collages.</li>
                        <li><strong>Final Polish:</strong> Use the <strong>Filters & Adjustments</strong> panels for the final color grading and polish. Remember to click <strong>Apply</strong> to "bake" these changes into the image history before further AI edits.</li>
                    </ol>

                    <h4>Unlocking the Viral Agent</h4>
                    <p>The Viral Agent is your automated research assistant. To get the best ideas:</p>
                    <ul>
                        <li><strong>Define Your Niche:</strong> Be specific. Instead of <code>"food"</code>, try <code>"vegan air fryer recipes"</code> or <code>"sourdough bread for beginners"</code>. A focused niche yields more relevant and actionable ideas.</li>
                        <li><strong>Interpret the Metrics:</strong> Use the Trend Score to gauge popularity, Engagement to predict audience reaction, and Difficulty to plan your production schedule.</li>
                        <li><strong>One-Click Creation:</strong> The fastest way to start is to use the buttons on an idea card. This sends the title and brief directly to the blog or video generator, saving you time.</li>
                    </ul>
                </DocSection>

                <DocSection title="Automation Guide: Your AI-Powered Workflow">
                    <h4>The Philosophy: AI as Your Assistant</h4>
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

                    <h4>Putting It All Together: A Weekly Workflow Example</h4>
                    <ul>
                        <li><strong>Monday Morning:</strong> Run the Viral Agent for your niche. Select the top 2-3 ideas for the week.</li>
                        <li><strong>Monday Afternoon:</strong> One-click generate the first drafts for all blog posts.</li>
                        <li><strong>Tuesday:</strong> Spend a few hours editing and personalizing the AI-generated drafts into final masterpieces.</li>
                        <li><strong>Wednesday:</strong> For each blog post, generate 1-2 promotional video clips. Schedule them on your social channels.</li>
                    </ul>
                    <p>With this workflow, you've created a week's worth of high-quality, trend-aligned content in just a few hours of focused, high-level creative work.</p>
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
                                You can currently upload images in <strong>PNG, JPEG, and WEBP</strong> formats. For the best results, especially with features like background removal, we recommend using high-quality images.
                            </p>
                        </FaqItem>
                        <FaqItem question="Is there a paid version with more features?">
                            <p>
                                Currently, Clip-Yube is available as a free tool. We've introduced a small, non-intrusive watermark on downloaded images for non-subscribers to support the platform. We are exploring premium features for a future subscription, which would include things like higher resolution exports, batch processing, no watermarks, and increased generation limits.
                            </p>
                        </FaqItem>
                        <FaqItem question="How is my data and privacy handled?" defaultOpen={true}>
                            <p>
                                We take your privacy and security seriously. Here’s how we protect you:
                            </p>
                             <ul>
                                <li><strong>Secure API Proxy:</strong> All communication with external AI models (like Google Gemini) goes through a secure proxy layer. This means your API keys are never exposed in your browser, protecting them from being stolen.</li>
                                <li><strong>Content Sanitization:</strong> All AI-generated HTML content (like blog posts) is automatically sanitized to remove potentially malicious code (e.g., <code>&lt;script&gt;</code> tags). This protects you and your visitors from Cross-Site Scripting (XSS) attacks.</li>
                                <li><strong>Local Storage:</strong> Your creative work, such as generated blog posts and editor state, is saved directly in your browser's local storage for your convenience. This data is not sent to our servers and is not accessible by us.</li>
                            </ul>
                        </FaqItem>
                    </div>
                </DocSection>
            </div>
        </div>
    );
};

export default DocsFaqPage;