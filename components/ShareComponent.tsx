import React, { useState } from 'react';
import { TwitterIcon, TelegramIcon, MailIcon, CopyIcon } from './Icons';
import { useSettings } from '../context/SettingsContext';

interface ShareComponentProps {
    url: string;
    title: string;
}

const ShareComponent: React.FC<ShareComponentProps> = ({ url, title }) => {
    const { settings } = useSettings();
    const [copied, setCopied] = useState(false);

    const twitterHandle = settings.twitterHandle ? ` via @${settings.twitterHandle}` : '';
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(`${title}${twitterHandle}`);

    const shareLinks = {
        twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
        email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check this out:\n\n${url}`)}`,
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm p-2 rounded-full border border-white/10">
            <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-white/10 transition-colors" title="Share on Twitter">
                <TwitterIcon className="h-5 w-5" />
            </a>
            <a href={shareLinks.telegram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-white/10 transition-colors" title="Share on Telegram">
                <TelegramIcon className="h-5 w-5" />
            </a>
            <a href={shareLinks.email} className="p-2 rounded-full hover:bg-white/10 transition-colors" title="Share via Email">
                <MailIcon className="h-5 w-5 text-current" />
            </a>
            <button onClick={handleCopy} className="p-2 rounded-full hover:bg-white/10 transition-colors relative" title="Copy Link">
                <CopyIcon className="h-5 w-5" />
                {copied && <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-green-600 text-white text-xs px-2 py-1 rounded-md">Copied!</span>}
            </button>
        </div>
    );
};

export default ShareComponent;