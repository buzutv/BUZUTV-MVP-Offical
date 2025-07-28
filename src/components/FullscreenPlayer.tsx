
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { getYouTubeEmbedUrl } from "@/utils/youtubeUtils";

interface FullscreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
}

const FullscreenPlayer = ({ isOpen, onClose, videoUrl, title }: FullscreenPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when fullscreen is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Set up iframe with autoplay when opened
  useEffect(() => {
    if (isOpen && iframeRef.current && videoUrl) {
      const embedUrl = getYouTubeEmbedUrl(videoUrl);
      
      if (embedUrl) {
        const autoplayUrl = `${embedUrl}?autoplay=1&mute=0&controls=1&showinfo=0&rel=0&playsinline=1&enablejsapi=1`;
        iframeRef.current.src = autoplayUrl;
      }
    } else if (!isOpen && iframeRef.current) {
      // Clear the iframe when closing to stop playback
      iframeRef.current.src = '';
    }
  }, [isOpen, videoUrl]);

  if (!isOpen) return null;

  const player = (
    <div 
      className="fixed inset-0 bg-black" 
      style={{ 
        zIndex: 999999,
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        transform: 'translateZ(0)', // Force hardware acceleration
        isolation: 'isolate' // Create new stacking context
      }}
    >
      <div className="relative w-full h-full" style={{ isolation: 'isolate' }}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[1000000] bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
          aria-label="Close fullscreen player"
          style={{ isolation: 'isolate' }}
        >
          <X className="w-6 h-6" />
        </button>
        <iframe
          ref={iframeRef}
          title={title}
          className="w-full h-full border-0"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            isolation: 'isolate'
          }}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        />
      </div>
    </div>
  );

  return createPortal(player, document.body);
};

export default FullscreenPlayer;
