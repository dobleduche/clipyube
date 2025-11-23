
import React from 'react';
import { useSettings } from '../context/SettingsContext';
import Loader from '../components/Loader';

const SettingsPage: React.FC = () => {
    const { settings, updateSettings, isLoaded } = useSettings();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        updateSettings({ [name]: name === 'automationInterval' ? parseInt(value, 10) : value });
    };

    const handleWatermarkChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['fontSize', 'opacity', 'scale'].includes(name);
        updateSettings({
            watermarkDefaults: {
                ...settings.watermarkDefaults,
                [name]: isNumeric ? parseFloat(value) : value,
            }
        });
    };
    
    const handleNewsletterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        updateSettings({
            newsletter: {
                ...settings.newsletter,
                [name]: checked,
            }
        });
    };

    if (!isLoaded) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader />
                <span className="ml-4 text-slate-300">Loading settings...</span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="text-center mb-12">
                <h2 className="text-4xl md-text-5xl font-extrabold text-white mb-3 font-oswald text-gradient-cyan-sanguine">
                    Settings & Profile
                </h2>
                <p className="text-lg text-slate-400">
                    Personalize your Clip-Yube experience and automate your workflow.
                </p>
            </div>

            <div className="space-y-8">
                {/* Profile Settings */}
                <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-2xl font-bold text-white mb-4 font-oswald">Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="profileName" className="block text-sm font-medium text-slate-300 mb-2">Your Name / Brand Name</label>
                            <input
                                type="text"
                                id="profileName"
                                name="profileName"
                                value={settings.profileName}
                                onChange={handleInputChange}
                                className="w-full p-2 bg-slate-800/50 border border-slate-700 rounded-lg"
                                placeholder="e.g., Creative Genius"
                            />
                        </div>
                        <div>
                            <label htmlFor="twitterHandle" className="block text-sm font-medium text-slate-300 mb-2">Twitter Handle (optional)</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">@</span>
                                <input
                                    type="text"
                                    id="twitterHandle"
                                    name="twitterHandle"
                                    value={settings.twitterHandle}
                                    onChange={handleInputChange}
                                    className="w-full p-2 pl-7 bg-slate-800/50 border border-slate-700 rounded-lg"
                                    placeholder="yourhandle"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Newsletter / Notifications (New) */}
                <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-2xl font-bold text-white mb-4 font-oswald">Notifications</h3>
                    <p className="text-sm text-slate-400 mb-4">Manage how you receive updates about new features, viral trends, and your account.</p>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label htmlFor="email-newsletter" className="text-slate-200">Newsletter (Email)</label>
                            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input 
                                    type="checkbox" 
                                    name="email" 
                                    id="email-newsletter" 
                                    checked={settings.newsletter.email} 
                                    onChange={handleNewsletterChange}
                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-cyan-500 right-6 border-slate-500"
                                />
                                <label htmlFor="email-newsletter" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.newsletter.email ? 'bg-cyan-500' : 'bg-slate-700'}`}></label>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="in-app-updates" className="text-slate-200">In-App Updates</label>
                            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input 
                                    type="checkbox" 
                                    name="inApp" 
                                    id="in-app-updates" 
                                    checked={settings.newsletter.inApp} 
                                    onChange={handleNewsletterChange}
                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-cyan-500 right-6 border-slate-500"
                                />
                                <label htmlFor="in-app-updates" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.newsletter.inApp ? 'bg-cyan-500' : 'bg-slate-700'}`}></label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Automation Settings */}
                <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-2xl font-bold text-white mb-4 font-oswald">Automation Engine</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label htmlFor="defaultNiche" className="block text-sm font-medium text-slate-300 mb-2">Default Content Niche</label>
                            <input
                                type="text"
                                id="defaultNiche"
                                name="defaultNiche"
                                value={settings.defaultNiche}
                                onChange={handleInputChange}
                                className="w-full p-2 bg-slate-800/50 border border-slate-700 rounded-lg"
                                placeholder="e.g., AI Technology"
                            />
                        </div>
                        <div>
                            <label htmlFor="automationInterval" className="block text-sm font-medium text-slate-300 mb-2">Run Agent Every...</label>
                            <select
                                id="automationInterval"
                                name="automationInterval"
                                value={settings.automationInterval}
                                onChange={handleInputChange}
                                className="w-full p-2 bg-slate-800/50 border border-slate-700 rounded-lg"
                            >
                                <option value={60000 * 5}>5 Minutes (for testing)</option>
                                <option value={3600000}>1 Hour</option>
                                <option value={21600000}>6 Hours</option>
                                <option value={43200000}>12 Hours</option>
                                <option value={86400000}>24 Hours</option>
                            </select>
                        </div>
                    </div>
                </div>

                 {/* Watermark Settings */}
                <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-2xl font-bold text-white mb-4 font-oswald">Default Watermark</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Default Text</label>
                            <input type="text" name="text" value={settings.watermarkDefaults.text || ''} onChange={handleWatermarkChange} className="w-full p-2 bg-slate-800/50 border border-slate-700 rounded-lg"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Default Font</label>
                            <select name="font" value={settings.watermarkDefaults.font} onChange={handleWatermarkChange} className="w-full p-2 bg-slate-800/50 border border-slate-700 rounded-lg">
                                <option>Inter</option>
                                <option>Oswald</option>
                                <option>Lora</option>
                                <option>Poppins</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Default Color</label>
                            <input type="color" name="color" value={settings.watermarkDefaults.color} onChange={handleWatermarkChange} className="w-full h-10 p-1 bg-transparent border border-slate-600 rounded-lg"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Default Opacity: {Math.round((settings.watermarkDefaults.opacity || 0) * 100)}%</label>
                            <input type="range" name="opacity" min="0.1" max="1" step="0.01" value={settings.watermarkDefaults.opacity} onChange={handleWatermarkChange} className="w-full"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
