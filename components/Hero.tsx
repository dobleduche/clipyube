import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRightIcon } from './Icons';
import { useAppContext } from '../context/AppContext';

export type HeroSpec = {
  title: React.ReactNode; // Allow rich titles with spans etc.
  subtitle?: string;
  cta?: {
    label: string;
    href: string;
  };
};

interface HeroProps {
  spec: HeroSpec;
}

const MotionH1 = motion.h1;
const MotionP = motion.p;
const MotionA = motion.a;

const Hero: React.FC<HeroProps> = ({ spec }) => {
    const { navigateTo } = useAppContext();

    const handleCTAClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (spec.cta) {
            navigateTo(spec.cta.href);
        }
    };
    
  return (
    <section className="relative w-full flex items-center justify-center text-center">
      <div className="z-10 p-4 flex flex-col items-center">
        <MotionH1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white mb-4 tracking-tighter font-oswald"
        >
          {spec.title}
        </MotionH1>

        {spec.subtitle && (
          <MotionP
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl text-lg md:text-xl text-slate-300 mb-8"
          >
            {spec.subtitle}
          </MotionP>
        )}
        
        {spec.cta && (
            <MotionA
                href={spec.cta.href}
                onClick={handleCTAClick}
                className="group inline-flex items-center justify-center gap-3 bg-cyan-500 text-black font-bold text-lg py-4 px-8 rounded-full hover:bg-cyan-400 transition-all duration-300 shadow-[0_0_25px_rgba(var(--cyan-glow),0.5)] hover:shadow-[0_0_40px_rgba(var(--cyan-glow),0.8)]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <span>{spec.cta.label}</span>
                <ArrowRightIcon className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </MotionA>
        )}
      </div>
    </section>
  );
};

export default Hero;
