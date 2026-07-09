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

export const TemplateModern = ({ 
  title: propTitle, 
  date: propDate, 
  venue: propVenue, 
  story: propStory, 
  shareLink: propShareLink, 
  picture: propPicture, 
  primaryColor: propPrimaryColor = '#0a0a0a', 
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
  const fontFamily = data?.theme?.fontFamily || 'system-ui, sans-serif';

  const formatDate = (d?: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
  };

  const heroName = data?.eventType === 'wedding' && data?.coupleNames ? data.coupleNames : title;
  const eventLabel = data?.eventType && data.eventType !== 'wedding' ? data.eventType : 'wedding';
  const slogan = `We can't wait to share our special day with you. help us capture our ${eventLabel} with Bethere`;
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
    <div className="min-h-screen" style={{ fontFamily, backgroundColor: '#0a0a0a', color: '#fafafa' }}>
      <div className="md:grid md:grid-cols-2">
        {/* Picture column - sticky for the whole page scroll */}
        <div className="md:order-1">
          <div className="sticky top-0 h-[55vh] md:h-screen w-full overflow-hidden">
            {picture ? (
              <img src={picture} alt="" className="w-full h-full object-cover object-top" />
            ) : (
              <div className="w-full h-full" style={{ background: `radial-gradient(ellipse at center, ${primaryColor}40 0%, #0a0a0a 70%)` }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/70 md:from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
              <p className="text-2xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">{heroName}</p>
              <p className="mt-3 text-xs md:text-sm text-white/70 max-w-md leading-relaxed">{slogan}</p>
            </div>
          </div>
        </div>

        {/* Content column */}
        <div className="md:order-2 relative" style={{ backgroundColor: '#0a0a0a' }}>
          {/* Hero details */}
          <section className="px-8 py-20 md:px-14 md:py-28 max-w-xl mx-auto">
            <FlowerDecor className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-auto opacity-25 pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="hidden md:block mb-8">
              {data?.heroSubtitle && (
                <p className="text-xs md:text-sm tracking-[0.4em] uppercase text-white/50">{data.heroSubtitle}</p>
              )}
            </div>

            <div className="flex items-center justify-center md:justify-start gap-4 mb-8">
              <div className="h-px w-8" style={{ backgroundColor: secondaryColor }} />
              <span className="text-sm tracking-[0.2em] uppercase" style={{ color: secondaryColor }}>{countdownText}</span>
              <div className="h-px w-8" style={{ backgroundColor: secondaryColor }} />
            </div>

            <div className="flex flex-col items-center md:items-start gap-4 mb-12">
              <Button
                size="lg"
                className="rounded-none px-12 py-7 text-sm tracking-[0.2em] uppercase font-bold"
                style={{ backgroundColor: secondaryColor, color: primaryColor }}
                onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
              >
                RSVP NOW
              </Button>
            </div>

            {data?.ceremony && (
              <div className="w-full mb-8">
                <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: secondaryColor }}>Ceremony</p>
                <p className="text-white/80 whitespace-pre-line leading-relaxed">{data.ceremony}</p>
              </div>
            )}

            {data?.reception && (
              <div className="w-full">
                <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: secondaryColor }}>Reception</p>
                <p className="text-white/80 whitespace-pre-line leading-relaxed">{data.reception}</p>
              </div>
            )}
            </div>
          </section>

          {/* Story Section */}
          {story && (
            <section className="py-24 px-8 md:px-14 max-w-xl mx-auto">
              <div className="flex items-center gap-4 mb-12">
                <div className="h-px flex-1" style={{ backgroundColor: `${secondaryColor}30` }} />
                <span className="text-xs tracking-[0.3em] uppercase" style={{ color: secondaryColor }}>Our Story</span>
                <div className="h-px flex-1" style={{ backgroundColor: `${secondaryColor}30` }} />
              </div>
              <p className="text-xl md:text-2xl leading-relaxed text-white/70 font-light">
                {story}
              </p>
            </section>
          )}

          {/* Gallery Section */}
          {gallery && gallery.length > 0 && (
            <section className="py-24 px-8 md:px-14 max-w-xl mx-auto">
              <div className="flex items-center gap-4 mb-12">
                <div className="h-px flex-1" style={{ backgroundColor: `${secondaryColor}30` }} />
                <span className="text-xs tracking-[0.3em] uppercase" style={{ color: secondaryColor }}>Gallery</span>
                <div className="h-px flex-1" style={{ backgroundColor: `${secondaryColor}30` }} />
              </div>
              <GalleryLightbox images={gallery} imageClassName="w-full h-48 object-cover rounded-lg" />
            </section>
          )}

          {/* Actions Section */}
          <section className="py-24 px-8 md:px-14 max-w-xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-center mb-4 text-white tracking-tight">
              CELEBRATE WITH US
            </h2>
            <p className="text-center text-white/40 mb-16 tracking-wide text-sm uppercase">
              Your presence is the greatest gift
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
                className="flex flex-col items-center gap-5 py-12 border transition-colors hover:bg-white/5"
                style={{ borderColor: `${secondaryColor}30`, color: secondaryColor }}
              >
                <Users className="w-8 h-8" />
                <span className="text-xs tracking-[0.2em] uppercase font-bold">RSVP</span>
              </button>
              <button
                onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
                className="flex flex-col items-center gap-5 py-12 border transition-colors hover:bg-white/5"
                style={{ borderColor: `${secondaryColor}30`, color: secondaryColor }}
              >
                <ShoppingBag className="w-8 h-8" />
                <span className="text-xs tracking-[0.2em] uppercase font-bold">Buy Asoebi</span>
              </button>
              {enableWishlistButton && wishlists && wishlists.length > 0 && wishlists[0].shareLink && (
                <button
                  onClick={() => window.open(`/${wishlists[0].shareLink}`, '_blank')}
                  className="flex flex-col items-center gap-5 py-12 border transition-colors hover:bg-white/5"
                  style={{ borderColor: `${secondaryColor}30`, color: secondaryColor }}
                >
                  <Heart className="w-8 h-8" />
                  <span className="text-xs tracking-[0.2em] uppercase font-bold">Our Wishlists</span>
                </button>
              )}
              {showWellWishes && (
                <button
                  onClick={() => window.open(`/gift/${shareLink}#wishes`, '_blank')}
                  className="flex flex-col items-center gap-5 py-12 border transition-colors hover:bg-white/5"
                  style={{ borderColor: `${secondaryColor}30`, color: secondaryColor }}
                >
                  <MessageSquareHeart className="w-8 h-8" />
                  <span className="text-xs tracking-[0.2em] uppercase font-bold">Well-wishes</span>
                </button>
              )}
              <button
                onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
                className="flex flex-col items-center gap-5 py-12 border transition-colors hover:bg-white/5"
                style={{ borderColor: `${secondaryColor}30`, color: secondaryColor }}
              >
                <Gift className="w-8 h-8" />
                <span className="text-xs tracking-[0.2em] uppercase font-bold">Cash Gifts</span>
              </button>
              <button
                onClick={() => window.open(`/qr-gift/${shareLink}`, '_blank')}
                className="flex flex-col items-center gap-5 py-12 border transition-colors hover:bg-white/5"
                style={{ borderColor: `${secondaryColor}30`, color: secondaryColor }}
              >
                <Camera className="w-8 h-8" />
                <span className="text-xs tracking-[0.2em] uppercase font-bold">Photobook</span>
              </button>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-16 text-center border-t border-white/5" />
        </div>
      </div>
    </div>
  );
};
