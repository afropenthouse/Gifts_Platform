import { useState } from 'react';
import { X } from 'lucide-react';

interface GalleryLightboxProps {
  images?: string[];
  columns?: number;
  imageClassName?: string;
}

export const GalleryLightbox = ({
  images,
  columns = 2,
  imageClassName = 'w-full h-48 object-cover rounded-lg',
}: GalleryLightboxProps) => {
  const photos = Array.isArray(images) ? images.filter(Boolean) : [];
  const [preview, setPreview] = useState<string | null>(null);

  if (photos.length === 0) return null;

  const currentIndex = preview ? photos.indexOf(preview) : -1;

  const go = (dir: number) => {
    const next = (currentIndex + dir + photos.length) % photos.length;
    setPreview(photos[next]);
  };

  return (
    <>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {photos.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPreview(src)}
            className="block overflow-hidden rounded-lg"
            title="Click to view"
          >
            <img
              src={src}
              alt={`Gallery ${i + 1}`}
              className={`${imageClassName} transition-transform duration-300 hover:scale-[1.03]`}
            />
          </button>
        ))}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 p-2"
          >
            <X className="w-5 h-5" />
          </button>
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); go(-1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 p-3"
            >
              <span className="text-xl leading-none">‹</span>
            </button>
          )}
          <img
            src={preview}
            alt="Preview"
            className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); go(1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 p-3"
            >
              <span className="text-xl leading-none">›</span>
            </button>
          )}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs">
            {currentIndex + 1} / {photos.length}
          </p>
        </div>
      )}
    </>
  );
};
