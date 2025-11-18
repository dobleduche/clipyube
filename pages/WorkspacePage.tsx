import React from 'react';
import { useAppContext } from '../context/AppContext';
import { ArrowRightIcon, TrashIcon } from '../components/Icons';

const WorkspacePage: React.FC = () => {
    const { blogPosts, navigateTo, deleteBlogPost } = useAppContext();

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, route: string) => {
        e.preventDefault();
        navigateTo(route);
    };

    return (
        <div className="max-w-5xl mx-auto py-8">
            <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-3 font-oswald text-gradient-cyan-sanguine">
                    My Workspace
                </h2>
                <p className="text-lg text-slate-400">
                    All your saved content and projects in one place.
                </p>
            </div>

            <div className="space-y-10">
                {/* Editor Session */}
                <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-2xl font-bold text-white mb-4 font-oswald">Image Editor</h3>
                    <div className="flex items-center justify-between bg-black/20 p-4 rounded-lg">
                        <div>
                            <p className="font-semibold text-slate-200">Last Editing Session</p>
                            <p className="text-sm text-slate-400">Reopen the editor with your last used image and settings.</p>
                        </div>
                        <a 
                            href="#/editor" 
                            onClick={(e) => handleNavClick(e, '#/editor')} 
                            className="flex items-center gap-2 bg-cyan-600/80 text-white font-semibold py-2 px-4 rounded-lg hover:bg-cyan-600 transition-colors text-sm"
                        >
                            Reopen Editor <ArrowRightIcon className="w-4 h-4" />
                        </a>
                    </div>
                </div>

                {/* Blog Posts */}
                <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-2xl font-bold text-white mb-4 font-oswald">Generated Blog Posts</h3>
                    <div className="space-y-3">
                        {blogPosts.length > 0 ? (
                            blogPosts.map(post => (
                                <div key={post.slug} className="flex items-center justify-between bg-black/20 p-4 rounded-lg group">
                                    <div className="flex-grow">
                                        <a href={`#/blog/${post.slug}`} onClick={(e) => handleNavClick(e, `#/blog/${post.slug}`)} className="font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">{post.title}</a>
                                        <p className="text-sm text-slate-400">Created: {post.date}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a href={`#/blog/${post.slug}`} onClick={(e) => handleNavClick(e, `#/blog/${post.slug}`)} className="bg-slate-700/80 text-white font-semibold py-1 px-3 rounded-lg hover:bg-slate-700 transition-colors text-xs">View</a>
                                        <button onClick={() => deleteBlogPost(post.slug)} className="bg-red-900/80 text-white p-2 rounded-lg hover:bg-red-800 transition-colors">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-400 text-center py-4">You haven't generated any blog posts yet. Try the Viral Agent!</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkspacePage;