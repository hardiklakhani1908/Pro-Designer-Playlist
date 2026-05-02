import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { buildEmbedUrl } from '../lib/youtube';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId?: string | null;
  playlistId?: string | null;
  title: string | null;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, videoId, playlistId, title }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent scrolling on the body when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  const embedUrl = buildEmbedUrl({ videoId, playlistId, autoplay: true });

  if (!isOpen || !embedUrl) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-[#0A0A0A] border border-[#1f1f1f] rounded-xl overflow-hidden w-full max-w-5xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-full">
        <div className="flex items-center justify-between p-4 border-b border-[#1f1f1f]">
          <h3 className="font-medium text-white truncate pr-4">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#8a8f98] hover:text-white transition-colors p-1 rounded-md hover:bg-[#1f1f1f]"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' /* 16:9 Aspect Ratio */ }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={embedUrl}
            title={title || "YouTube video player"}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
};
