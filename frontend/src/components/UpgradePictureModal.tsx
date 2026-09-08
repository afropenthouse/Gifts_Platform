import React, { useEffect, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Crown, X } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'upgrade_picture_modal_dismissed';

const IMAGES = ['/upload1.jpeg', '/upload2.jpeg'];

const AUTO_PLAY_INTERVAL = 4000;

const OPEN_DELAY_MS = 300;

interface UpgradePictureModalProps {
  title?: string;
  description?: string;
  upgradeLabel?: string;
  onUpgrade?: () => void;
}

const UpgradePictureModal: React.FC<UpgradePictureModalProps> = ({
  title = 'Upgrade Your Experience',
  description = '',
  upgradeLabel = 'Upgrade Now',
  onUpgrade,
}: UpgradePictureModalProps) => {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'true') return;
    const timer = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!carouselApi || !open) return;

    const autoplayTimer = setInterval(() => {
      carouselApi.scrollNext();
    }, AUTO_PLAY_INTERVAL);

    return () => clearInterval(autoplayTimer);
  }, [carouselApi, open]);

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
      setSlideCount(carouselApi.scrollSnapList().length);
    };

    onSelect();
    carouselApi.on('select', onSelect);
    carouselApi.on('reInit', onSelect);

    return () => {
      carouselApi.off('select', onSelect);
      carouselApi.off('reInit', onSelect);
    };
  }, [carouselApi]);

  const close = () => {
    if (dontShowAgain) localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
  };

  const handleUpgrade = () => {
    if (dontShowAgain) localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
    onUpgrade?.();
  };

  const goToSlide = useCallback(
    (index: number) => {
      carouselApi?.scrollTo(index);
    },
    [carouselApi]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4">
      <div className="relative w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-xl rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 rounded-full bg-white/80 backdrop-blur-sm p-1.5 text-gray-500 hover:text-gray-700 hover:bg-white transition-all shadow-sm"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative">
          <Carousel
            setApi={setCarouselApi}
            opts={{ loop: true, align: 'start' }}
            className="w-full"
          >
            <CarouselContent className="-ml-0">
              {IMAGES.map((src, idx) => (
                <CarouselItem key={idx} className="pl-0">
                  <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] md:aspect-auto md:h-[360px] lg:h-[300px] overflow-hidden rounded-t-2xl">
                    <img
                      src={src}
                      alt={`Upgrade ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {slideCount > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
              {Array.from({ length: slideCount }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    idx === currentSlide
                      ? 'w-6 bg-white shadow-md'
                      : 'w-2 bg-white/60 hover:bg-white/80'
                  )}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6 pt-4 sm:pt-5 flex-shrink-0 overflow-y-auto">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h3>
          {description && (
            <p className="mt-2 text-sm text-gray-600">{description}</p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <input
              id="upgrade-modal-dont-show"
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#2E235C] focus:ring-[#2E235C]"
            />
            <label htmlFor="upgrade-modal-dont-show" className="text-sm text-gray-600">
              Don&apos;t show again
            </label>
          </div>

          <div className="mt-5 sm:mt-6 flex gap-3">
            <Button variant="outline" onClick={close} className="flex-1">
              Not now
            </Button>
            <Button
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-[#2E235C] to-[#392B74] text-white hover:from-[#2E235C]/90 hover:to-[#392B74]/90"
            >
              <Crown className="h-4 w-4 mr-2" />
              {upgradeLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePictureModal;
