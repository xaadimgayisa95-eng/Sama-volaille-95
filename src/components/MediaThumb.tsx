import { Video } from 'lucide-react';
import { getImageUrl, handleImgError, isVideo } from '../utils';

// Shared card thumbnail for listing lists (Home, Search, Favorites, Admin):
// renders the first media item, correctly as a video-camera badge when it's
// a video (an <img> pointed at an .mp4 would just show a broken icon).
export default function MediaThumb({ path, fallbackIcon, className }: {
  path: string | undefined;
  fallbackIcon: string;
  className?: string;
}) {
  if (!path) return <>{fallbackIcon}</>;

  if (isVideo(path)) {
    return (
      <div className={`relative w-full h-full ${className || ''}`}>
        <video src={getImageUrl(path) || path} className="w-full h-full object-cover" muted />
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <Video className="w-5 h-5 text-white" />
        </div>
      </div>
    );
  }

  return <img src={getImageUrl(path) || path} alt="" onError={handleImgError} className={`w-full h-full object-cover ${className || ''}`} />;
}
