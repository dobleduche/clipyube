import React, { useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, MagicWandIcon } from './Icons';

type Example = {
  beforeSrc: string;
  afterSrc: string;
  prompt: string;
};

// Royalty-free images from Pexels, cropped to 1:1 aspect ratio for consistency
const examples: Example[] = [
  {
    beforeSrc: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2&fit=crop',
    afterSrc: 'https://images.pexels.com/photos/1741205/pexels-photo-1741205.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2&fit=crop',
    prompt: 'Turn this cat into a vibrant, abstract painting with bold colors.',
  },
  {
    beforeSrc: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2&fit=crop',
    afterSrc: 'https://images.pexels.com/photos/208821/pexels-photo-208821.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2&fit=crop',
    prompt: 'Transform this house into a whimsical fairytale cottage with a thatched roof.',
  },
  {
    beforeSrc: 'https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2&fit=crop',
    afterSrc: 'https://images.pexels.com/photos/1528640/pexels-photo-1528640.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2&fit=crop',
    prompt: 'Change the season to autumn with golden leaves and a warm color palette.',
  },
  {
    beforeSrc: 'https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2&fit=crop',
    afterSrc: 'https://images.pexels.com/photos/1010079/pexels-photo-1010079.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2&fit=crop',
    prompt: 'Convert this photo into a detailed pencil sketch.',
  },
  {
    beforeSrc: 'https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2&fit=crop',
    afterSrc: 'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2&fit=crop',
    prompt: 'Dramatically enhance the colors to make the landscape look more vibrant and epic.',
  },
  {
    beforeSrc: 'https://images.pexels.com/photos/36082/red-panda-panda-ailurus-fulgens-animals.jpg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2&fit=crop',
    afterSrc: 'https://images.pexels.com/photos/66898/red-panda-ailurus-fulgens-mustelidae-mammal-66898.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2&fit=crop',
    prompt: 'Place this red panda in a snowy, winter environment.',
  },
];

interface ExampleCarouselProps {
    onTryExample: (imageUrl: string, prompt: string) => void;
}

const ExampleCarousel: React.FC<ExampleCarouselProps> = ({ onTryExample }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const currentExample = examples[currentIndex];

    const changeSlide = (newIndex: number) => {
        setIsTransitioning(true);
        setTimeout(() => {
            let finalIndex = newIndex;
            if (newIndex < 0) {
                finalIndex = examples.length - 1;
            } else if (newIndex >= examples.length) {
                finalIndex = 0;
            }
            setCurrentIndex(finalIndex);
            // Allow time for the new content to render before fading in
            setTimeout(() => setIsTransitioning(false), 50);
        }, 200); // Corresponds to fade-out transition duration
    };
    
    const nextExample = () => changeSlide(currentIndex + 1);
    const prevExample = () => changeSlide(currentIndex - 1);

    const handleTryIt = () => {
        onTryExample(currentExample.beforeSrc, currentExample.prompt);
    };

    return (
        <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-6 font-oswald">Or try one of these examples</h3>
            <div className="relative bg-slate-900/40 backdrop-blur-lg border border-white/10 p-4 sm:p-6 rounded-2xl shadow-2xl max-w-3xl mx-auto">
                <div className={`transition-opacity duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="flex flex-col items-center">
                            <h4 className="text-lg font-semibold text-slate-300 mb-2 font-oswald">Before</h4>
                            <div className="aspect-square w-full rounded-lg overflow-hidden bg-black/20 ring-1 ring-white/10">
                                <img src={currentExample.beforeSrc} alt="Before example" className="w-full h-full object-cover" loading="lazy" />
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                             <h4 className="text-lg font-semibold text-slate-300 mb-2 font-oswald">After</h4>
                             <div className="aspect-square w-full rounded-lg overflow-hidden bg-black/20 ring-1 ring-white/10">
                                <img src={currentExample.afterSrc} alt="After example" className="w-full h-full object-cover" loading="lazy" />
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-slate-300 italic mb-4 h-12 flex items-center justify-center px-4">"{currentExample.prompt}"</p>

                    <button
                        onClick={handleTryIt}
                        className="inline-flex items-center justify-center gap-2 bg-cyan-500 text-black font-bold py-2 px-6 rounded-lg hover:bg-cyan-400 transition-all duration-300 transform hover:scale-105 shadow-[0_0_15px_rgba(var(--cyan-glow),0.4)] hover:shadow-[0_0_25px_rgba(var(--cyan-glow),0.6)]"
                    >
                        <MagicWandIcon />
                        <span>Try This Example</span>
                    </button>
                </div>
                
                {/* Navigation Buttons */}
                <button 
                    onClick={prevExample} 
                    className="absolute top-1/2 left-0 sm:-left-4 transform -translate-y-1/2 bg-slate-800/50 hover:bg-slate-700/80 backdrop-blur-sm p-2 rounded-full text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    aria-label="Previous example"
                >
                    <ArrowLeftIcon />
                </button>
                <button 
                    onClick={nextExample} 
                    className="absolute top-1/2 right-0 sm:-right-4 transform -translate-y-1/2 bg-slate-800/50 hover:bg-slate-700/80 backdrop-blur-sm p-2 rounded-full text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    aria-label="Next example"
                >
                    <ArrowRightIcon />
                </button>
            </div>
        </div>
    );
};

export default ExampleCarousel;