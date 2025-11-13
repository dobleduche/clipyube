import React from 'react';
import SphereAnimation from '../components/SphereAnimation';
import Hero, { HeroSpec } from '../components/Hero';

const LandingPage: React.FC = () => {

    const heroSpec: HeroSpec = {
        title: (
            <>
                <span className="text-gradient-cyan-sanguine">Create</span> at the Speed
                <br />
                of Thought.
            </>
        ),
        subtitle: "Unleash your creativity with Clip-Yube. Transform images, generate videos, and craft viral content with our powerfully simple AI-driven suite.",
        cta: {
            label: "Start Creating Now",
            href: "#/editor"
        }
    };

    return (
        <div className="relative w-full h-[calc(100vh-4rem)] flex items-center justify-center text-center overflow-hidden -mt-16">
            <SphereAnimation />
            <Hero spec={heroSpec} />
        </div>
    );
};

export default LandingPage;
