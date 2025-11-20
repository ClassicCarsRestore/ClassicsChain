import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { generateStorageUrl } from '@/lib/storage';

interface Photo {
  id: string;
  objectKey: string;
}

interface PhotoLightboxProps {
  isOpen: boolean;
  photos: Photo[];
  selectedIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function PhotoLightbox({
  isOpen,
  photos,
  selectedIndex,
  onClose,
  onNext,
  onPrevious,
}: PhotoLightboxProps) {
  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        onNext();
      } else if (e.key === 'ArrowLeft') {
        onPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrevious]);

  if (!isOpen || photos.length === 0) {
    return null;
  }

  const photo = photos[selectedIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Main content container */}
      <div
        className="relative flex h-full w-full flex-col items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          aria-label="Close lightbox"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Photo counter */}
        <div className="absolute left-4 top-4 text-white text-sm font-medium">
          {selectedIndex + 1} / {photos.length}
        </div>

        {/* Image container */}
        <div className="relative h-full w-full max-h-[90vh] max-w-[90vw] flex items-center justify-center">
          <img
            src={generateStorageUrl(photo.objectKey)}
            alt={`Photo ${selectedIndex + 1}`}
            className="h-full w-full object-contain"
          />
        </div>

        {/* Navigation buttons */}
        {photos.length > 1 && (
          <>
            <button
              onClick={onPrevious}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
