import React, { useState } from 'react';
import { ScissorsIcon, PlayIcon, MenuIcon, XIcon, TrendingUpIcon, DocumentTextIcon, UserCircleIcon, RocketIcon, BriefcaseIcon, VideoIcon } from './Icons';
import { useAppContext } from '../context/AppContext';

interface NavLinkProps {
    route: string;
    children: React.ReactNode;
    onClick: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ route, children, onClick }) => {
    const { route: currentRoute, navigateTo } = useAppContext();
    // Make #/blog active even when on #/blog/some-slug
    const isActive = (route === '#/blog' && currentRoute.startsWith('#/blog')) || currentRoute === route;
    
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        navigateTo(route);
        onClick();
    };

    return (
        <a 
            href={route} 
            onClick={handleClick} 
            className={`flex items-center gap-2 md:inline-block px-3 py-2 rounded-md text-base md:text-sm font-medium transition-all duration-200 ${
                isActive ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
            aria-current={isActive ? 'page' : undefined}
        >
            {children}
        </a>
    );
};

const Navbar: React.FC = () => {
    const { navigateTo } = useAppContext();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const closeMenu = () => setIsMenuOpen(false);

    const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        navigateTo('/');
        closeMenu();
    };

    return (
        <nav className="sticky top-0 z-40 bg-slate-900/40 backdrop-blur-lg border-b border-white/10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <a href="#/" className="flex-shrink-0 flex items-center space-x-2" onClick={handleLogoClick}>
                            <div className="relative w-16 h-12 flex items-center justify-center">
                                <div className="absolute left-0 top-1 text-slate-400">
                                    <ScissorsIcon />
                                </div>
                                <div className="absolute right-0 top-1 text-red-500">
                                    <PlayIcon className="h-12 w-12" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight font-oswald">
                                <span className="text-slate-400">Clip</span>
                                <span className="text-white">Yube</span>
                            </h1>
                        </a>
                    </div>
                    <div className="hidden md:flex items-center">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <NavLink route="#/editor" onClick={closeMenu}>Editor</NavLink>
                            <NavLink route="#/clipyube" onClick={closeMenu}><VideoIcon /> Clip Engine</NavLink>
                            <NavLink route="#/viral-agent" onClick={closeMenu}><TrendingUpIcon /> Viral Agent</NavLink>
                            <NavLink route="#/automation" onClick={closeMenu}><RocketIcon /> Automation</NavLink>
                            <NavLink route="#/workspace" onClick={closeMenu}><BriefcaseIcon /> Workspace</NavLink>
                            <NavLink route="#/blog" onClick={closeMenu}><DocumentTextIcon /> Blog</NavLink>
                        </div>
                         <div className="ml-6 border-l border-white/10 pl-6">
                             <NavLink route="#/settings" onClick={closeMenu}>
                                <UserCircleIcon />
                            </NavLink>
                         </div>
                    </div>
                    <div className="-mr-2 flex md:hidden">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} type="button" className="bg-slate-800/50 inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white" aria-controls="mobile-menu" aria-expanded={isMenuOpen}>
                            <span className="sr-only">Open main menu</span>
                            {isMenuOpen ? <XIcon /> : <MenuIcon />}
                        </button>
                    </div>
                </div>
            </div>

            {isMenuOpen && (
                <div className="md:hidden" id="mobile-menu">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <NavLink route="#/editor" onClick={closeMenu}>Editor</NavLink>
                        <NavLink route="#/clipyube" onClick={closeMenu}><VideoIcon /> Clip Engine</NavLink>
                        <NavLink route="#/viral-agent" onClick={closeMenu}><TrendingUpIcon /> Viral Agent</NavLink>
                        <NavLink route="#/automation" onClick={closeMenu}><RocketIcon /> Automation</NavLink>
                        <NavLink route="#/workspace" onClick={closeMenu}><BriefcaseIcon /> Workspace</NavLink>
                        <NavLink route="#/blog" onClick={closeMenu}><DocumentTextIcon /> Blog</NavLink>
                        <div className="border-t border-white/10 pt-4 mt-4 space-y-1">
                            <NavLink route="#/settings" onClick={closeMenu}><UserCircleIcon /> Settings</NavLink>
                            <NavLink route="#/docs-faq" onClick={closeMenu}>Docs & FAQ</NavLink>
                            <NavLink route="#/about" onClick={closeMenu}>About</NavLink>
                            <NavLink route="#/contact" onClick={closeMenu}>Contact</NavLink>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;