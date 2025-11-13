
import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 text-gray-300">
      <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 text-center font-oswald text-gradient-cyan-sanguine">About Clip-Yube</h2>
      <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-2xl space-y-6">
        <p className="text-lg leading-relaxed">
          Clip-Yube is a cutting-edge creative suite designed to bridge the gap between imagination and reality. Our mission is to empower creators, designers, and enthusiasts with powerful yet intuitive tools to bring their visual ideas to life.
        </p>
        <p className="text-lg leading-relaxed">
          At the heart of Clip-Yube is the revolutionary <strong className="text-cyan-400 font-semibold">Gemini 2.5 Flash Image model</strong> and the powerful <strong className="text-cyan-400 font-semibold">Veo video generation model</strong>. This allows you to perform complex image edits and generate stunning video clips using simple, natural language prompts. Whether you want to "add a retro filter," "turn a photo into an abstract painting," or "create a video of a dragon flying through a cyberpunk city," our AI understands your vision and executes it in seconds.
        </p>
        <div className="border-t border-white/10 pt-6">
            <h3 className="text-2xl font-bold text-white mb-4">Our Philosophy</h3>
            <p className="text-lg leading-relaxed">
                We believe that creativity should be accessible to everyone, regardless of technical skill. Clip-Yube removes the steep learning curve of traditional editing software, replacing complex menus and tools with the simplicity of conversation. Our focus is on speed, quality, and a seamless user experience, allowing you to stay in your creative flow.
            </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;