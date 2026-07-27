import { Fragment } from 'react';
import { Button } from '../ui/button';
import { Calendar, Heart, Gift, Users, ShoppingBag, MapPin, MessageSquareHeart, Camera } from 'lucide-react';
import { FlowerDecor } from './FlowerDecor';
import { GalleryLightbox } from './GalleryLightbox';

interface TemplateProps {
  title?: string;
  date?: string;
  venue?: string;
  story?: string;
  shareLink?: string;
  picture?: string;
  primaryColor?: string;
  secondaryColor?: string;
  wishlists?: any[];
  gallery?: string[];
  showWellWishes?: boolean;
  enableWishlistButton?: boolean;
  data?: {
    heroImage?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    eventName?: string;
    eventDate?: string;
    eventLocation?: string;
    eventType?: string;
    coupleNames?: string;
    story?: string;
    ceremony?: string;
    reception?: string;
    theme?: {
      primaryColor?: string;
      secondaryColor?: string;
      fontFamily?: string;
    };
  };
}

export const TemplateMilk = ({ 
  title: propTitle, 
  date: propDate, 
  venue: propVenue, 
  story: propStory, 
  shareLink: propShareLink, 
  picture: propPicture, 
  primaryColor: propPrimaryColor = '#1c1917', 
  secondaryColor: propSecondaryColor = '#c9a96e',
  wishlists,
  gallery = [],
  showWellWishes = false,
  enableWishlistButton = true,
  data 
}: TemplateProps) => {
  const title = data?.eventName || propTitle || 'Our Wedding';
  const date = data?.eventDate || propDate;
  const venue = data?.eventLocation || propVenue;
  const story = data?.story || propStory;
  const shareLink = propShareLink || '';
  const picture = data?.heroImage || propPicture;
  const primaryColor = data?.theme?.primaryColor || propPrimaryColor;
  const secondaryColor = data?.theme?.secondaryColor || propSecondaryColor;
  const fontFamily = data?.theme?.fontFamily || 'Playfair Display, Georgia, serif';

  const formatDate = (d?: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
  };

  const heroName = data?.eventType === 'wedding' && data?.coupleNames ? data.coupleNames : title;
  const eventLabel = data?.eventType && data.eventType !== 'wedding' ? data.eventType : 'wedding';
  const slogan = `We can't wait to share our special day with you. help us capture our ${eventLabel}`;
  const countdownText = (() => {
    if (!date) return '';
    const eventDay = new Date(date);
    if (isNaN(eventDay.getTime())) return '';
    const startOfEvent = new Date(eventDay.getFullYear(), eventDay.getMonth(), eventDay.getDate());
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.round((startOfEvent.getTime() - startOfToday.getTime()) / 86400000);
    if (diff > 1) return `${diff} days to go`;
    if (diff === 1) return '1 day to go';
    if (diff === 0) return "Today's the day!";
    return 'The celebration has passed';
  })();

  return (
    <div className="min-h-screen font-sans" style={{ fontFamily, backgroundColor: '#fefdfb', color: '#1c1917' }}>
      <div className="md:grid md:grid-cols-2">
        {/* Picture column - sticky for the whole page scroll */}
        <div className="md:order-1">
          <div className="sticky top-0 h-[55vh] md:h-screen w-full overflow-hidden">
            {picture ? (
              <img src={picture} alt="" className="w-full h-full object-cover object-top" />
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-white via-[#fefdfb] to-[#faf8f5]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#fefdfb]/70 md:from-[#fefdfb]/40 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <p className="text-2xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">{heroName}</p>
              <p className="mt-3 text-xs md:text-sm text-white/80 max-w-md leading-relaxed">{slogan}</p>
            </div>
          </div>
        </div>

        {/* Content column */}
        <div className="md:order-2 relative" style={{ backgroundColor: '#fefdfb' }}>
          {/* Hero details */}
          <section className="px-8 py-20 md:px-14 md:py-28 max-w-xl mx-auto">
            <FlowerDecor className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-auto opacity-40 pointer-events-none text-stone-300" />
            <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="hidden md:block mb-8">
              {data?.heroSubtitle && (
                <p className="text-xs md:text-sm tracking-[0.4em] text-stone-500 font-light">{data.heroSubtitle}</p>
              )}
            </div>

            <div className="flex items-center justify-center md:justify-start gap-4 mb-8">
              <div className="h-px w-8 bg-stone-300" />
              <span className="text-sm tracking-[0.2em] uppercase text-stone-500">{countdownText}</span>
              <div className="h-px w-8 bg-stone-300" />
            </div>

            <div className="flex flex-col items-center md:items-start gap-5 mb-12">
              <Button
                size="lg"
                className="rounded-none px-12 py-6 text-xs tracking-[0.25em] uppercase font-medium bg-transparent border border-stone-300 text-stone-700 hover:bg-stone-50 hover:border-stone-400 transition-all duration-500"
                onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
              >
                RSVP
              </Button>
            </div>

            {data?.ceremony && (
              <div className="w-full mb-8">
                <p className="text-xs tracking-[0.3em] uppercase mb-2 text-stone-400">Ceremony</p>
                <p className="text-stone-600 whitespace-pre-line leading-relaxed">{data.ceremony}</p>
              </div>
            )}

            {data?.reception && (
              <div className="w-full">
                <p className="text-xs tracking-[0.3em] uppercase mb-2 text-stone-400">Reception</p>
                <p className="text-stone-600 whitespace-pre-line leading-relaxed">{data.reception}</p>
              </div>
            )}
            </div>
          </section>

          {/* Story Section */}
          {story && (
            <section className="py-16 px-8 md:px-14 max-w-xl mx-auto text-center">
              <div className="w-8 h-px bg-stone-200 mx-auto mb-10" />
              <h2 className="text-2xl md:text-3xl font-normal mb-10 text-stone-800 tracking-wide">
                Our Story
              </h2>
              <p className="text-lg leading-8 text-stone-600 font-light">
                {story}
              </p>
              <div className="w-8 h-px bg-stone-200 mx-auto mt-10" />
            </section>
          )}

          {/* Gallery Section */}
          {gallery && gallery.length > 0 && (
            <section className="py-16 px-8 md:px-14 max-w-xl mx-auto text-center">
              <div className="w-8 h-px bg-stone-200 mx-auto mb-10" />
              <h2 className="text-2xl md:text-3xl font-normal mb-10 text-stone-800 tracking-wide">
                Gallery
              </h2>
              <GalleryLightbox images={gallery} imageClassName="w-full h-48 object-cover rounded-lg object-top" />
              <div className="w-8 h-px bg-stone-200 mx-auto mt-10" />
            </section>
          )}

          {/* Actions Section */}
          <section className="py-16 px-8 md:px-14 max-w-xl mx-auto border-t border-stone-100">
            <p className="text-xs tracking-[0.3em] uppercase text-stone-400 mb-6 text-center">
              Celebrate With Us
            </p>
            <h2 className="text-2xl md:text-3xl font-normal mb-3 text-stone-800 tracking-wide text-center">
              Join Our Celebration
            </h2>
            <p className="text-sm text-stone-500 mb-16 tracking-wide font-light text-center">
              We would love to have you with us
            </p>
            
            <div className="grid grid-cols-2 gap-px bg-stone-100">
              <button
                onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
                className="flex flex-col items-center gap-4 py-10 bg-white hover:bg-stone-50 transition-colors duration-500 group"
              >
                <Users className="w-5 h-5 text-stone-500 group-hover:text-stone-700 transition-colors" />
                <span className="text-[10px] tracking-[0.1em] font-medium text-stone-600">RSVP</span>
              </button>
              <button
                onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
                className="flex flex-col items-center gap-4 py-10 bg-white hover:bg-stone-50 transition-colors duration-500 group"
              >
                <ShoppingBag className="w-5 h-5 text-stone-500 group-hover:text-stone-700 transition-colors" />
                <span className="text-[10px] tracking-[0.1em] font-medium text-stone-600">Buy Asoebi</span>
              </button>
              {enableWishlistButton && wishlists && wishlists.length > 0 && wishlists[0].shareLink && (
                <button
                  onClick={() => window.open(`/${wishlists[0].shareLink}`, '_blank')}
                  className="flex flex-col items-center gap-4 py-10 bg-white hover:bg-stone-50 transition-colors duration-500 group"
                >
                  <Heart className="w-5 h-5 text-stone-500 group-hover:text-stone-700 transition-colors" />
                  <span className="text-[10px] tracking-[0.1em] font-medium text-stone-600">Wishlists</span>
                </button>
              )}
              {showWellWishes && (
                <button
                  onClick={() => window.open(`/gift/${shareLink}#wishes`, '_blank')}
                  className="flex flex-col items-center gap-4 py-10 bg-white hover:bg-stone-50 transition-colors duration-500 group"
                >
                  <MessageSquareHeart className="w-5 h-5 text-stone-500 group-hover:text-stone-700 transition-colors" />
                  <span className="text-[10px] tracking-[0.1em] font-medium text-stone-600">Well Wishes</span>
                </button>
              )}
              <button
                onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
                className="flex flex-col items-center gap-4 py-10 bg-white hover:bg-stone-50 transition-colors duration-500 group"
              >
                <Gift className="w-5 h-5 text-stone-500 group-hover:text-stone-700 transition-colors" />
                <span className="text-[10px] tracking-[0.1em] font-medium text-stone-600">Cash Gifts</span>
              </button>
              <button
                onClick={() => window.open(`/qr-gift/${shareLink}`, '_blank')}
                className="flex flex-col items-center gap-4 py-10 bg-white hover:bg-stone-50 transition-colors duration-500 group"
              >
                <Camera className="w-5 h-5 text-stone-500 group-hover:text-stone-700 transition-colors" />
                <span className="text-[10px] tracking-[0.1em] font-medium text-stone-600">Photobook</span>
              </button>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-16 text-center border-t border-stone-200/70" />
        </div>
      </div>
    </div>
  );
};
