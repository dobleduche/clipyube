
import React, { useState, useRef, useEffect } from 'react';
import { ScissorsIcon, PlayIcon, MenuIcon, XIcon, TrendingUpIcon, DocumentTextIcon, UserCircleIcon, RocketIcon, BriefcaseIcon, VideoIcon, LockIcon, GiftIcon, SparkleIcon, CreditCardIcon, SupportIcon, DiscordIcon, ChatIcon } from './Icons';
import { useAppContext } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';

interface NavLinkProps {
    route: string;
    children: React.ReactNode;
    onClick: () => void;
    isLocked?: boolean;
    onLockedClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ route, children, onClick, isLocked = false, onLockedClick }) => {
    const { route: currentRoute, navigateTo } = useAppContext();
    const isActive = (route === '#/blog' && currentRoute.startsWith('#/blog')) || currentRoute === route;
    
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (isLocked && onLockedClick) {
            onLockedClick();
        } else {
            navigateTo(route);
            onClick();
        }
    };

    return (
        <a 
            href={route} 
            onClick={handleClick} 
            className={`relative flex items-center gap-2 md:inline-block px-3 py-2 rounded-md text-base md:text-sm font-medium transition-all duration-200 ${
                isActive ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-300 hover:bg-white/5 hover:text-white'
            } ${isLocked ? 'opacity-50 grayscale cursor-not-allowed group' : ''}`}
            aria-current={isActive ? 'page' : undefined}
        >
            {children}
            {isLocked && (
                <span className="absolute -top-1 -right-1 text-amber-400">
                    <LockIcon className="w-3 h-3" />
                </span>
            )}
        </a>
    );
};

const Navbar: React.FC = () => {
    const { navigateTo, openUpgradeModal } = useAppContext();
    const { settings } = useSettings();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const closeMenu = () => setIsMenuOpen(false);
    
    const isFreeTier = settings.userTier === 'free';

    const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        navigateTo('/');
        closeMenu();
    };
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsUserDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleBillingClick = () => {
         // Logic to handle billing can go here, or navigation to settings
         setIsUserDropdownOpen(false);
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
                            
                            {/* Tier Locked Link */}
                            <NavLink 
                                route="#/automation" 
                                onClick={closeMenu} 
                                isLocked={isFreeTier}
                                onLockedClick={openUpgradeModal}
                            >
                                <RocketIcon /> Automation
                            </NavLink>
                            
                            <NavLink route="#/workspace" onClick={closeMenu}><BriefcaseIcon /> Workspace</NavLink>
                            <NavLink route="#/blog" onClick={closeMenu}><DocumentTextIcon /> Blog</NavLink>
                        </div>
                         
                         {/* User Dropdown */}
                         <div className="ml-6 border-l border-white/10 pl-6 relative" ref={dropdownRef}>
                             <button 
                                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                className="text-slate-300 hover:text-white transition-colors focus:outline-none"
                             >
                                <UserCircleIcon />
                             </button>
                             
                             <AnimatePresence>
                                 {isUserDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.1 }}
                                        className="absolute right-0 mt-2 w-72 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                                    >
                                        {/* Header */}
                                        <div className="p-4 border-b border-white/10 bg-white/5">
                                            <p className="font-bold text-white truncate">{settings.profileName || 'User'}</p>
                                            <p className="text-xs text-slate-400">{settings.billing.plan}</p>
                                        </div>

                                        {/* Billing Section */}
                                        <div className="p-2 border-b border-white/10">
                                            <button onClick={handleBillingClick} className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg text-left">
                                                <div className="text-cyan-400"><CreditCardIcon /></div>
                                                <div className="flex-grow">
                                                    <p className="text-sm font-semibold text-slate-200">Billing</p>
                                                    {isFreeTier ? (
                                                        <span 
                                                            onClick={(e) => { e.stopPropagation(); openUpgradeModal(); setIsUserDropdownOpen(false); }}
                                                            className="text-xs text-amber-400 hover:text-amber-300 underline cursor-pointer font-bold"
                                                        >
                                                            Upgrade to Pro
                                                        </span>
                                                    ) : (
                                                        <p className="text-xs text-slate-400">Next billing: {settings.billing.nextBillingDate || 'N/A'}</p>
                                                    )}
                                                </div>
                                            </button>
                                        </div>

                                        {/* Referrals (Always Unlocked) */}
                                        <div className="p-2 border-b border-white/10">
                                            <button className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg text-left group">
                                                <div className="text-amber-400 group-hover:scale-110 transition-transform"><GiftIcon /></div>
                                                <div>
                                                    <p className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-green-400">Referrals</p>
                                                    <p className="text-xs text-slate-400">Give $10, Get $10</p>
                                                </div>
                                            </button>
                                        </div>

                                        {/* Help & Support */}
                                        <div className="p-2 border-b border-white/10">
                                            <div className="px-2 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Help & Support</div>
                                            <button className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg text-left text-sm text-slate-300">
                                                {isFreeTier ? (
                                                    <>
                                                        <DiscordIcon />
                                                        <span>Community Discord</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChatIcon className="text-purple-400"/>
                                                        <span className="text-purple-100">Priority Live Chat</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Settings Link */}
                                        <div className="p-2">
                                            <button 
                                                onClick={() => { navigateTo('#/settings'); setIsUserDropdownOpen(false); }}
                                                className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg text-left text-sm text-slate-300"
                                            >
                                                <UserCircleIcon />
                                                <span>Settings</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                 )}
                             </AnimatePresence>
                         </div>
                    </div>
                    
                    {/* Mobile Menu Button */}
                    <div className="-mr-2 flex md:hidden">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} type="button" className="bg-slate-800/50 inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white" aria-controls="mobile-menu" aria-expanded={isMenuOpen}>
                            <span className="sr-only">Open main menu</span>
                            {isMenuOpen ? <XIcon /> : <MenuIcon />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden" id="mobile-menu">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <NavLink route="#/editor" onClick={closeMenu}>Editor</NavLink>
                        <NavLink route="#/clipyube" onClick={closeMenu}><VideoIcon /> Clip Engine</NavLink>
                        <NavLink route="#/viral-agent" onClick={closeMenu}><TrendingUpIcon /> Viral Agent</NavLink>
                        <NavLink route="#/automation" onClick={closeMenu} isLocked={isFreeTier} onLockedClick={openUpgradeModal}>
                            <RocketIcon /> Automation
                        </NavLink>
                        <NavLink route="#/workspace" onClick={closeMenu}><BriefcaseIcon /> Workspace</NavLink>
                        <NavLink route="#/blog" onClick={closeMenu}><DocumentTextIcon /> Blog</NavLink>
                        
                        <div className="border-t border-white/10 pt-4 mt-4 space-y-1">
                             {/* Mobile Referrals Item */}
                            <button className="flex items-center gap-2 px-3 py-2 w-full text-left text-base font-medium text-amber-400 hover:bg-white/5 hover:text-amber-300 rounded-md">
                                <GiftIcon /> Refer a Friend
                            </button>
                            
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
