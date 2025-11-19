
import React from 'react';
import { MailIcon, SupportIcon } from '../components/Icons';

const ContactPage: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto py-8 text-gray-300">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 text-center font-oswald text-gradient-cyan-sanguine">Get In Touch</h2>
            <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col items-center text-center p-6 bg-black/20 rounded-lg ring-1 ring-white/10">
                    <div className="p-4 bg-cyan-500/10 rounded-full mb-4">
                        <MailIcon />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">General Inquiries</h3>
                    <p className="text-slate-400 mb-4">For partnerships, media, and general questions.</p>
                    <a href="mailto:contact@clipyube.info" className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold">contact@clipyube.info</a>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-black/20 rounded-lg ring-1 ring-white/10">
                    <div className="p-4 bg-cyan-500/10 rounded-full mb-4">
                        <SupportIcon />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Technical Support</h3>
                    <p className="text-slate-400 mb-4">Need help with the app? Found a bug? Let us know.</p>
                    <a href="mailto:support@clipyube.info" className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold">support@clipyube.info</a>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;