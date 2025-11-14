import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COOKIE_CONSENT_KEY = 'clipyube-cookie-consent';

const MotionDiv = motion.div;

const CookieConsentBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // We only run this on the client side
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleConsent = (consentType: 'accepted-all' | 'accepted-essential' | 'declined') => {
        localStorage.setItem(COOKIE_CONSENT_KEY, consentType);
        setIsVisible(false);
        if (consentType === 'accepted-all') {
            console.log('Analytics cookies enabled. In a real app, you would initialize analytics scripts here.');
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <MotionDiv
                    initial={{ y: '100%' }}
                    animate={{ y: '0%' }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-lg border-t border-white/10 p-4 z-50"
                    aria-live="polite"
                    role="dialog"
                    aria-labelledby="cookie-banner-title"
                    aria-describedby="cookie-banner-description"
                >
                    <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-slate-300 text-center md:text-left">
                            <h2 id="cookie-banner-title" className="font-bold sr-only">Cookie Consent</h2>
                            <p id="cookie-banner-description">
                                This web app uses essential cookies for functionality. We also use analytics cookies to improve performance and community engagement. Do you consent?
                            </p>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-3">
                            <button
                                onClick={() => handleConsent('accepted-all')}
                                className="bg-cyan-500 text-black font-semibold py-2 px-4 rounded-lg hover:bg-cyan-400 transition-colors text-sm"
                            >
                                Accept All
                            </button>
                            <button
                                onClick={() => handleConsent('accepted-essential')}
                                className="bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors text-sm"
                            >
                                Essential Only
                            </button>
                             <button
                                onClick={() => handleConsent('declined')}
                                className="text-slate-400 hover:text-white transition-colors text-sm px-4 py-2"
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                </MotionDiv>
            )}
        </AnimatePresence>
    );
};

export default CookieConsentBanner;
