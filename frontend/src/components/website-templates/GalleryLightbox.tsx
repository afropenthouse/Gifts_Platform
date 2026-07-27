import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryLightboxProps {
  images?: string[];
  imageClassName?: string;
}

export const GalleryLightbox = ({
  images,
  imageClassName = 'h-48 w-full object-cover rounded-lg object-top',
}: GalleryLightboxProps) => {
  const photos = Array.isArray(images) ? images.filter(Boolean) : [];
  const [preview, setPreview] = useState<string | null>(null);
  const [perPage, setPerPage] = useState(1);
  const [page, setPage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const next = window.innerWidth >= 1024 ? 2 : 1;
      setPerPage(next);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const maxPage = Math.max(0, photos.length - perPage);
  useEffect(() => {
    setPage((p) => Math.min(p, maxPage));
  }, [maxPage]);

  const scrollByPage = useCallback((dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const nextPage = Math.min(Math.max(page + dir, 0), maxPage);
    setPage(nextPage);
    const scrollAmt = (el.clientWidth / perPage) * nextPage;
    el.scrollTo({ left: scrollAmt, behavior: 'smooth' });
  }, [page, maxPage, perPage]);

  if (photos.length === 0) return null;

  const currentIndex = preview ? photos.indexOf(preview) : -1;

  const go = (dir: number) => {
    if (currentIndex < 0) return;
    const nextIdx = (currentIndex + dir + photos.length) % photos.length;
    setPreview(photos[nextIdx]);
  };

  return (
    <>
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden items-center"
        >
          {photos.map((src, i) => (
            <div
              key={i}
              className={`snap-center flex-shrink-0 mx-auto ${perPage === 2 ? 'w-1/2' : 'w-full max-w-md'}`}
            >
              <button
                type="button"
                onClick={() => setPreview(src)}
                className="block overflow-hidden rounded-lg w-full"
                title="Click to view"
              >
                <img
                  src={src}
                  alt={`Gallery ${i + 1}`}
                  className={`${imageClassName} transition-transform duration-300 hover:scale-[1.03] block mx-auto`}
                />
              </button>
            </div>
          ))}
        </div>
        {photos.length > perPage && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              disabled={page === 0}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              disabled={page >= maxPage}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
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
