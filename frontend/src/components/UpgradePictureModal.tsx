import React, { useEffect, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { CheckCircle, CreditCard, Crown, X } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'upgrade_picture_modal_dismissed';

// @ts-expect-error kept for reference
const IMAGES = ['/upload1.jpeg', '/upload2.jpeg'];
// @ts-expect-error kept for reference
const AUTO_PLAY_INTERVAL = 4000;

const OPEN_DELAY_MS = 300;

interface UpgradeEventOption {
  id: number;
  title: string;
}

interface UpgradePictureModalProps {
  title?: string;
  description?: string;
  upgradeLabel?: string;
  events: UpgradeEventOption[];
  isProcessingPayment?: boolean;
  onUpgrade?: (eventId: number) => void;
}

const UpgradePictureModal: React.FC<UpgradePictureModalProps> = ({
  title = 'Upgrade to VIP',
  description = 'Unlock premium templates and keep 100% of all cash gifts and Asoebi sales',
  upgradeLabel = 'Pay Now',
  events,
  isProcessingPayment = false,
  onUpgrade,
}: UpgradePictureModalProps) => {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  // @ts-expect-error carousel kept for reference
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  // @ts-expect-error kept for reference
  const [currentSlide, setCurrentSlide] = useState(0);
  // @ts-expect-error kept for reference
  const [slideCount, setSlideCount] = useState(0);
  // @ts-expect-error kept for reference
  const [isLarge, setIsLarge] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'true') return;
    if (!events || events.length === 0) return;
    const timer = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [events]);

  useEffect(() => {
    if (events && events.length > 0 && selectedEventId === null) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  // @ts-expect-error carousel kept for reference
  useEffect(() => {
    const handleResize = () => setIsLarge(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // @ts-expect-error carousel kept for reference
  const images = isLarge ? ['/large1.jpeg', '/large2.jpeg'] : ['/upload1.jpeg', '/upload2.jpeg'];

  // @ts-expect-error carousel kept for reference
  useEffect(() => {
    if (!carouselApi || !open) return;

    const autoplayTimer = setInterval(() => {
      carouselApi.scrollNext();
    }, AUTO_PLAY_INTERVAL);

    return () => clearInterval(autoplayTimer);
  }, [carouselApi, open]);

  // @ts-expect-error carousel kept for reference
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
    if (!selectedEventId) return;
    if (dontShowAgain) localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
    onUpgrade?.(selectedEventId);
  };

  // @ts-expect-error carousel kept for reference
  const goToSlide = useCallback(
    (index: number) => {
      carouselApi?.scrollTo(index);
    },
    [carouselApi]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4">
      <div className="relative w-full max-w-lg h-[84vh] rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 rounded-full bg-white/80 backdrop-blur-sm p-1.5 text-gray-500 hover:text-gray-700 hover:bg-white transition-all shadow-sm"
        >
          <X className="h-5 w-5" />
        </button>

        {/* PICTURE CAROUSEL - COMMENTED OUT
        <div className="relative">
          <Carousel
            setApi={setCarouselApi}
            opts={{ loop: true, align: 'start' }}
            className="w-full"
          >
            <CarouselContent className="-ml-0">
              {images.map((src, idx) => (
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
        PICTURE CAROUSEL END */}

        <div className="px-5 pt-5 pb-1 flex-1 overflow-y-auto min-h-0">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          {description && (
            <p className="text-gray-600 mt-1.5 text-sm">{description}</p>
          )}

          <div className="px-3 py-2.5 rounded-xl border mt-3 bg-yellow-50 border-yellow-200">
            <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">VIP Benefits</h4>
            <ul className="space-y-1 text-xs text-gray-600">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span>0% commission on all cash gifts</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span>0% commission on all asoebi orders</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span>Premium website templates</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span>Premium invitation templates</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span>Event check-in</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span>Photobook</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span>Personalized event planner (on request)</span>
              </li>
            </ul>
          </div>

          {events.length > 1 && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Select Event
              </label>
              <Select
                value={selectedEventId ? String(selectedEventId) : undefined}
                onValueChange={(v) => setSelectedEventId(Number(v))}
              >
                <SelectTrigger className="w-full h-9 bg-white text-gray-900 border border-[#2E235C] hover:bg-[#2E235C]/5 text-sm">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900">
                  {events.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id.toString()}>
                      {ev.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {events.length === 1 && (
            <div className="mt-3 px-3 py-2 rounded-xl border bg-gray-50 border-gray-200">
              <span className="text-[11px] text-gray-500 block mb-0.5">Event</span>
              <span className="text-sm font-medium text-gray-900">{events[0].title}</span>
            </div>
          )}
        </div>

        <div className="px-5 py-4 flex-shrink-0 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                id="upgrade-modal-dont-show"
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-[#2E235C] focus:ring-[#2E235C]"
              />
              <label htmlFor="upgrade-modal-dont-show" className="text-xs text-gray-600">
                Don&apos;t show again
              </label>
            </div>
            <p className="text-base font-bold text-gray-900">₦50,000</p>
          </div>

          <div className="mt-3.5 flex flex-col sm:flex-row gap-2.5">
            <Button
              variant="outline"
              onClick={close}
              disabled={isProcessingPayment}
              size="sm"
              className="w-full sm:w-auto flex-1 h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpgrade}
              disabled={isProcessingPayment || !selectedEventId}
              size="sm"
              className="w-full sm:w-auto flex-1 h-9 text-white bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
            >
              {isProcessingPayment ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5" />
                  {upgradeLabel}
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePictureModal;
