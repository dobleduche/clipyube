import React from 'react';

const SphereAnimation: React.FC = () => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="sphere-container absolute inset-[-20vw] flex items-center justify-center">
        <div 
          className="sphere-item" 
          style={{ 
            width: '60vmin', 
            height: '60vmin', 
            background: 'radial-gradient(circle, #f64d6b 0%, transparent 70%)',
            animation: 'rotate 40s linear infinite alternate'
          }}
        />
        <div 
          className="sphere-item" 
          style={{ 
            width: '70vmin', 
            height: '70vmin', 
            background: 'radial-gradient(circle, var(--cyan) 0%, transparent 70%)',
            animation: 'rotate-reverse 35s linear infinite alternate-reverse'
          }}
        />
        <div 
          className="sphere-item" 
          style={{ 
            width: '50vmin', 
            height: '50vmin', 
            background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)',
            animation: 'rotate 50s linear infinite'
          }}
        />
      </div>
    </div>
  );
};

export default SphereAnimation;
