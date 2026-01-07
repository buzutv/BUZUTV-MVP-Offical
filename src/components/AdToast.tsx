import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface AdToastProps {
    isVisible: boolean;
    onClose: () => void;
}

const AdToast: React.FC<AdToastProps> = ({ isVisible, onClose }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[10000] animate-in slide-in-from-right-full fade-in duration-500">
            <div className="bg-red-600/90 backdrop-blur-md rounded-xl shadow-2xl p-4 flex items-center gap-4 border border-white/20 max-w-sm">
                {/* Coke Image */}
                <div className="relative w-12 h-20 flex-shrink-0">
                    <img
                        src="https://freepngimg.com/thumb/coca_cola/5-2-coca-cola-png-image.png"
                        alt="Coca Cola"
                        className="w-full h-full object-contain filter drop-shadow-lg"
                        onError={(e) => {
                            // Fallback if the image fails
                            (e.target as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/c/ce/Coca-Cola_logo.svg";
                            (e.target as HTMLImageElement).className = "w-full h-auto object-contain";
                        }}
                    />
                </div>

                {/* Text */}
                <div className="flex-1">
                    <h3 className="text-white font-bold text-lg leading-tight">Thirsty?</h3>
                    <p className="text-white/90 text-sm font-medium">Drink Coca Cola</p>
                </div>

                {/* Close Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors text-white"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default AdToast;
