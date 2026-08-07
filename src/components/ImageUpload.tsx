import { useState } from 'react';
import { Camera, X, Loader2, Video } from 'lucide-react';
import { getImageUrl, handleImgError, isVideo } from '../utils';

export default function ImageUpload({ images, onUpload, onRemove }: {
  images: string[];
  onUpload: (files: FileList) => Promise<void>;
  onRemove: (index: number) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setUploading(true);
      await onUpload(e.target.files);
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {images.map((img, idx) => (
          <div key={idx} className="relative shrink-0">
            {isVideo(img) ? (
              <div className="relative w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-black">
                <video src={getImageUrl(img) || img} className="w-full h-full object-cover" muted />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Video className="w-6 h-6 text-white" />
                </div>
              </div>
            ) : (
              <img
                src={getImageUrl(img) || img}
                alt=""
                onError={handleImgError}
                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
              />
            )}
            <button
              onClick={() => onRemove(idx)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {images.length < 5 && (
          <label className={`w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#1E5C20] transition-colors shrink-0 ${uploading ? 'opacity-50' : ''}`}>
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            ) : (
              <Camera className="w-6 h-6 text-gray-400" />
            )}
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>
      {images.length === 0 && (
        <p className="text-xs text-gray-500 text-center">Ajoutez jusqu'à 5 photos ou vidéos</p>
      )}
    </div>
  );
}
