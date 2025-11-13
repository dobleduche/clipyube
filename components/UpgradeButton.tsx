import React from 'react';

interface UpgradeButtonProps {
    onClick: () => void;
    disabled?: boolean;
    children?: React.ReactNode;
}

const UpgradeButton: React.FC<UpgradeButtonProps> = ({ onClick, disabled = false, children }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait"
    >
      {children || 'Upgrade to Pro'}
    </button>
  );
};

export default UpgradeButton;
