
import React, { useState } from 'react';
import { ArrowLeftIcon, PrintIcon, DownloadIcon, YouTubeIcon, XIcon, CopyIcon } from '../components/Icons';
import { useAppContext } from '../context/AppContext';
import ShareComponent from '../components/ShareComponent';
import { motion, AnimatePresence } from 'framer-motion';
import { generateYouTubeDescriptionRequest } from '../api/client';
import Loader from '../components/Loader';
import { type BlogPost } from '../types/blog';

interface BlogPageProps {
    posts: BlogPost[];
    slug?: string;
}

const MotionA = motion.a;

const BlogPage: React.FC<BlogPageProps> = ({ posts, slug }) => {
    const { navigateTo } = useAppContext();
    
    // State for YouTube Description Generator
    const [showYoutubeModal, setShowYoutubeModal] = useState(false);
    const [youtubeDescription, setYoutubeDescription] = useState('');
    const [isGeneratingYoutube, setIsGeneratingYoutube] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, route: string) => {
        e.preventDefault();
        navigateTo(route);
    };

    if (slug) {
        const post = posts.find(p => p.slug === slug);

        if (!post) {
            return (
                <div className="text-center">
                    <h2 className="text-4xl font-bold text-white mb-4">Post Not Found</h2>
                    <p className="text-slate-400 mb-6">The blog post you're looking for doesn't exist.</p>
                    <a href="#/blog" onClick={(e) => handleNavClick(e, '#/blog')} className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center justify-center gap-2">
                        <ArrowLeftIcon />
                        Back to Blog
                    </a>
                </div>
            );
        }
        
        const postUrl = window.location.href;

        const handlePrint = () => {
            window.print();
        };

        const handleDownloadDoc = (title: string, content: string) => {
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const filename = `${slug}.doc`;
            
            // This is a trick to make Word open the HTML file.
            const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${title}</title></head><body>`;
            const footer = "</body></html>";
            const sourceHTML = header + `<h1>${title}</h1>` + content + footer;

            const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
            const fileDownload = document.createElement("a");
            document.body.appendChild(fileDownload);
            fileDownload.href = source;
            fileDownload.download = filename;
            fileDownload.click();
            document.body.removeChild(fileDownload);
        };

        const handleGenerateYoutube = async () => {
            setShowYoutubeModal(true);
            if (youtubeDescription) return; // Don't regenerate if already has content for this session

            setIsGeneratingYoutube(true);
            try {
                const desc = await generateYouTubeDescriptionRequest(post.title, post.content);
                setYoutubeDescription(desc);
            } catch (e) {
                console.error(e);
                setYoutubeDescription("Failed to generate description. Please try again later.");
            } finally {
                setIsGeneratingYoutube(false);
            }
        };

        const handleCopyYoutube = () => {
            navigator.clipboard.writeText(youtubeDescription);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        };

        return (
            <div className="max-w-4xl mx-auto relative">
                 {/* YouTube Generator Modal */}
                 <AnimatePresence>
                    {showYoutubeModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                             <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative"
                            >
                                <button onClick={() => setShowYoutubeModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><XIcon /></button>
                                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                    <YouTubeIcon /> YouTube Description
                                </h3>
                                {isGeneratingYoutube ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <Loader />
                                        <p className="mt-4 text-slate-300">Generating optimized description...</p>
                                    </div>
                                ) : (
                                    <>
                                        <textarea 
                                            readOnly 
                                            value={youtubeDescription} 
                                            className="w-full h-64 bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-slate-300 font-mono text-sm mb-4 focus:ring-2 focus:ring-cyan-500 outline-none resize-none" 
                                        />
                                        <div className="flex justify-end gap-3">
                                            <button onClick={handleCopyYoutube} className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-500 font-semibold transition-colors relative">
                                                <CopyIcon />
                                                {isCopied ? 'Copied!' : 'Copy Text'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <a href="#/blog" onClick={(e) => handleNavClick(e, '#/blog')} className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold mb-6 transition-colors non-printable">
                    <ArrowLeftIcon />
                    Back to All Posts
                </a>
                <article className="bg-slate-900/20 p-8 rounded-2xl">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">{post.title}</h1>
                    <div className="flex flex-wrap items-center justify-between gap-4 text-slate-400 text-sm mb-6">
                        <div>
                            <span>By {post.author}</span> &bull; <span>{post.date}</span>
                        </div>
                        <div className="sharing-controls flex items-center gap-2">
                            <button onClick={handlePrint} title="Print or Save as PDF" className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-300">
                                <PrintIcon />
                            </button>
                            <button onClick={() => handleDownloadDoc(post.title, post.content)} title="Download as Word (.doc)" className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-300">
                                <DownloadIcon />
                            </button>
                            <button onClick={handleGenerateYoutube} title="Generate YouTube Description" className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-300 hover:text-red-500">
                                <YouTubeIcon />
                            </button>
                            <ShareComponent url={postUrl} title={post.title} />
                        </div>
                    </div>
                    <img src={post.image} alt={post.title} className="w-full h-auto max-h-96 object-cover rounded-xl shadow-lg mb-8 ring-1 ring-white/10" />
                    <div 
                        className="prose prose-lg max-w-none text-slate-300"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                </article>
            </div>
        );
    }

    return (
        <div>
            <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-3 font-oswald text-gradient-cyan-sanguine">The Clip-Yube Blog</h2>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto">Insights, tutorials, and inspiration powered by our own AI Content Agent.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {posts.map(post => (
                    <MotionA
                        href={`#/blog/${post.slug}`}
                        onClick={(e) => handleNavClick(e, `#/blog/${post.slug}`)}
                        key={post.slug}
                        className="block bg-slate-900/40 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg overflow-hidden group transition-colors duration-300 hover:border-cyan-500/50 hover:shadow-cyan-500/10"
                        whileHover={{ y: -8 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <img src={post.image} alt={post.title} className="w-full h-56 object-cover" />
                        <div className="p-6">
                            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">{post.title}</h3>
                            <p className="text-slate-400 text-sm mb-4">{post.date}</p>
                            <p className="text-slate-300">{post.snippet}</p>
                        </div>
                    </MotionA>
                ))}
            </div>
        </div>
    );
};

export default BlogPage;
