
import React from 'react';
import { TwitterIcon, GithubIcon } from './Icons';
import { useAppContext } from '../context/AppContext';

const Footer: React.FC = () => {
    const { navigateTo } = useAppContext();

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, route: string) => {
        e.preventDefault();
        navigateTo(route);
    };

    return (
        <footer className="bg-slate-900/40 border-t border-white/10 mt-12">
            <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                    <div>
                        <h3 className="text-lg font-semibold text-white font-oswald">ClipYube</h3>
                        <p className="mt-2 text-slate-400 text-sm">AI-Powered Image & Video Editor. <br/> Your imagination, realized.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-sm font-semibold text-slate-300 tracking-wider uppercase">Tools</h4>
                            <ul className="mt-4 space-y-2">
                                <li><a href="#/editor" onClick={(e) => handleNavClick(e, '#/editor')} className="text-base text-slate-400 hover:text-cyan-400 transition-colors">Editor</a></li>
                                <li><a href="#/viral-agent" onClick={(e) => handleNavClick(e, '#/viral-agent')} className="text-base text-slate-400 hover:text-cyan-400 transition-colors">Viral Agent</a></li>
                                <li><a href="#/automation" onClick={(e) => handleNavClick(e, '#/automation')} className="text-base text-slate-400 hover:text-cyan-400 transition-colors">Automation</a></li>
                                <li><a href="#/workspace" onClick={(e) => handleNavClick(e, '#/workspace')} className="text-base text-slate-400 hover:text-cyan-400 transition-colors">Workspace</a></li>
                            </ul>
                        </div>
                         <div>
                            <h4 className="text-sm font-semibold text-slate-300 tracking-wider uppercase">Resources</h4>
                            <ul className="mt-4 space-y-2">
                                <li><a href="#/blog" onClick={(e) => handleNavClick(e, '#/blog')} className="text-base text-slate-400 hover:text-cyan-400 transition-colors">Blog</a></li>
                                <li><a href="#/docs-faq" onClick={(e) => handleNavClick(e, '#/docs-faq')} className="text-base text-slate-400 hover:text-cyan-400 transition-colors">Docs & FAQ</a></li>
                                <li><a href="#/about" onClick={(e) => handleNavClick(e, '#/about')} className="text-base text-slate-400 hover:text-cyan-400 transition-colors">About</a></li>
                                <li><a href="#/contact" onClick={(e) => handleNavClick(e, '#/contact')} className="text-base text-slate-400 hover:text-cyan-400 transition-colors">Contact</a></li>
                                <li><a href="#/smoke-test" onClick={(e) => handleNavClick(e, '#/smoke-test')} className="text-base text-slate-400 hover:text-cyan-400 transition-colors">System Health</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col items-center md:items-end">
                         <h4 className="text-sm font-semibold text-slate-300 tracking-wider uppercase">Follow Us</h4>
                         <div className="flex mt-4 space-x-6">
                            <a href="https://twitter.com/google" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors" aria-label="Twitter">
                                <TwitterIcon />
                            </a>
                             <a href="https://github.com/google/generative-ai-docs" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors" aria-label="GitHub">
                                <GithubIcon />
                            </a>
                         </div>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-white/10 text-center text-slate-500 text-sm">
                    <p className="mb-2">&copy; {new Date().getFullYear()} Clip-Yube. All rights reserved. Powered by Gemini.</p>
                     <p>
                        <a href="#/privacy" onClick={(e) => handleNavClick(e, '#/privacy')} className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
                        <span className="mx-2">&bull;</span>
                        <a href="#/terms" onClick={(e) => handleNavClick(e, '#/terms')} className="hover:text-cyan-400 transition-colors">Terms of Service</a>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
