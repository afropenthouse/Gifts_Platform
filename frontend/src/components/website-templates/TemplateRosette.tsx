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

export const TemplateRosette = ({ 
  title: propTitle, 
  date: propDate, 
  venue: propVenue, 
  story: propStory, 
  shareLink: propShareLink, 
  picture: propPicture, 
  primaryColor: propPrimaryColor = '#be123c', 
  secondaryColor: propSecondaryColor = '#fbbf24',
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
    <div className="min-h-screen font-sans" style={{ fontFamily, backgroundColor: '#fef2f2' }}>
      <div className="md:grid md:grid-cols-2">
        {/* Picture column - sticky for the whole page scroll */}
        <div className="md:order-1">
          <div className="sticky top-0 h-[55vh] md:h-screen w-full overflow-hidden">
            {picture ? (
              <img src={picture} alt="" className="w-full h-full object-cover object-top" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-rose-100/80 via-red-50/60 to-amber-50/50" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-white/70 md:from-white/40 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <p className="text-2xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">{heroName}</p>
              <p className="mt-3 text-xs md:text-sm text-white/80 max-w-md leading-relaxed">{slogan}</p>
            </div>
          </div>
        </div>

        {/* Content column */}
        <div className="md:order-2 relative bg-gradient-to-br from-rose-100/80 via-red-50/60 to-amber-50/50 overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-rose-300/30 rounded-full blur-3xl hidden md:block" />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-red-300/30 rounded-full blur-3xl hidden md:block" />

          {/* Hero details */}
          <section className="relative z-10 px-8 py-20 md:px-14 md:py-28 max-w-xl mx-auto">
            <FlowerDecor className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-auto opacity-30 pointer-events-none text-rose-400" />
            <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="hidden md:block mb-8">
              {data?.heroSubtitle && (
                <p className="text-xs tracking-[0.3em] uppercase font-bold text-rose-700">{data.heroSubtitle}</p>
              )}
            </div>

            <div className="flex items-center justify-center md:justify-start gap-4 mb-8">
              <div className="h-px w-8 bg-gradient-to-r from-transparent via-rose-300 to-rose-300" />
              <span className="text-sm tracking-[0.2em] uppercase text-rose-700">{countdownText}</span>
              <div className="h-px w-8 bg-gradient-to-l from-transparent via-rose-300 to-rose-300" />
            </div>

            <div className="flex flex-col items-center md:items-start gap-4 mb-12">
              <Button
                size="lg"
                className="rounded-full px-12 py-7 text-sm tracking-[0.2em] uppercase font-bold shadow-xl shadow-rose-200/50 hover:shadow-2xl hover:shadow-rose-300/50 hover:scale-105 transition-all duration-300"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, color: 'white' }}
                onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
              >
                <Heart className="w-4 h-4 mr-2" />
                RSVP Now
              </Button>
            </div>

            {data?.ceremony && (
              <div className="w-full mb-8">
                <p className="text-xs tracking-[0.3em] uppercase mb-2 text-rose-600">Ceremony</p>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{data.ceremony}</p>
              </div>
            )}

            {data?.reception && (
              <div className="w-full">
                <p className="text-xs tracking-[0.3em] uppercase mb-2 text-rose-600">Reception</p>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{data.reception}</p>
              </div>
            )}
            </div>
          </section>

          {/* Story Section */}
          {story && (
            <section className="relative z-10 px-8 md:px-14 py-12 max-w-xl mx-auto">
              <div className="text-center">
                <div className="flex items-center justify-center gap-4 mb-10">
                  <div className="h-px w-16 bg-gradient-to-r from-transparent via-rose-200 to-rose-200" />
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-600 to-red-500 flex items-center justify-center shadow-lg shadow-rose-200/50">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                  <div className="h-px w-16 bg-gradient-to-l from-transparent via-red-200 to-red-200" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-8 text-gray-900 tracking-tight">Our Story</h2>
                <p className="text-xl leading-relaxed text-gray-600 font-light">{story}</p>
              </div>
            </section>
          )}

          {/* Gallery Section */}
          {gallery && gallery.length > 0 && (
            <section className="relative z-10 px-8 md:px-14 py-12 max-w-xl mx-auto">
              <div className="text-center">
                <div className="flex items-center justify-center gap-4 mb-10">
                  <div className="h-px w-16 bg-gradient-to-r from-transparent via-rose-200 to-rose-200" />
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-600 to-red-500 flex items-center justify-center shadow-lg shadow-rose-200/50">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                  <div className="h-px w-16 bg-gradient-to-l from-transparent via-red-200 to-red-200" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-8 text-gray-900 tracking-tight">Gallery</h2>
                <GalleryLightbox images={gallery} imageClassName="w-full h-48 object-cover rounded-lg" />
              </div>
            </section>
          )}

          {/* Actions Section */}
          <section className="relative z-10 px-8 md:px-14 pb-20 max-w-xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-600 to-red-500 mb-8 shadow-lg shadow-rose-200/40">
                <span className="text-xs tracking-[0.25em] uppercase font-bold text-white">Celebrate With Us</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-3 text-gray-900 tracking-tight">Join Our Celebration</h2>
              <p className="text-gray-500 mb-12 tracking-wide font-light">We would love to have you with us</p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
                  className="group flex flex-col items-center gap-5 py-10 rounded-2xl border border-rose-100 bg-white hover:border-rose-300 hover:shadow-2xl hover:shadow-rose-100/40 transition-all duration-300"
                >
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 group-hover:from-rose-700 group-hover:to-rose-800 transition-colors shadow-lg shadow-rose-200/40">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-sm tracking-[0.15em] uppercase font-bold text-gray-800">RSVP</span>
                </button>
                <button
                  onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
                  className="group flex flex-col items-center gap-5 py-10 rounded-2xl border border-red-100 bg-white hover:border-red-300 hover:shadow-2xl hover:shadow-red-100/40 transition-all duration-300"
                >
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 group-hover:from-red-600 group-hover:to-red-700 transition-colors shadow-lg shadow-red-200/40">
                    <ShoppingBag className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-sm tracking-[0.15em] uppercase font-bold text-gray-800">Buy Asoebi</span>
                </button>
                {enableWishlistButton && wishlists && wishlists.length > 0 && wishlists[0].shareLink && (
                  <button
                    onClick={() => window.open(`/${wishlists[0].shareLink}`, '_blank')}
                    className="group flex flex-col items-center gap-5 py-10 rounded-2xl border border-pink-100 bg-white hover:border-pink-300 hover:shadow-2xl hover:shadow-pink-100/40 transition-all duration-300"
                  >
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 group-hover:from-pink-600 group-hover:to-pink-700 transition-colors shadow-lg shadow-pink-200/40">
                      <Heart className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-sm tracking-[0.15em] uppercase font-bold text-gray-800">Our Wishlists</span>
                  </button>
                )}
                {showWellWishes && (
                  <button
                    onClick={() => window.open(`/gift/${shareLink}#wishes`, '_blank')}
                    className="group flex flex-col items-center gap-5 py-10 rounded-2xl border border-rose-100 bg-white hover:border-rose-300 hover:shadow-2xl hover:shadow-rose-100/40 transition-all duration-300"
                  >
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 group-hover:from-rose-600 group-hover:to-rose-700 transition-colors shadow-lg shadow-rose-200/40">
                      <MessageSquareHeart className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-sm tracking-[0.15em] uppercase font-bold text-gray-800">Well-wishes</span>
                  </button>
                )}
                <button
                  onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
                  className="group flex flex-col items-center gap-5 py-10 rounded-2xl border border-amber-100 bg-white hover:border-amber-300 hover:shadow-2xl hover:shadow-amber-100/40 transition-all duration-300"
                >
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 group-hover:from-amber-600 group-hover:to-amber-700 transition-colors shadow-lg shadow-amber-200/40">
                    <Gift className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-sm tracking-[0.15em] uppercase font-bold text-gray-800">Cash Gifts</span>
                </button>
                <button
                  onClick={() => window.open(`/qr-gift/${shareLink}`, '_blank')}
                  className="group flex flex-col items-center gap-5 py-10 rounded-2xl border border-rose-100 bg-white hover:border-rose-300 hover:shadow-2xl hover:shadow-rose-100/40 transition-all duration-300"
                >
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 group-hover:from-rose-600 group-hover:to-rose-700 transition-colors shadow-lg shadow-rose-200/40">
                    <Camera className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-sm tracking-[0.15em] uppercase font-bold text-gray-800">Photobook</span>
                </button>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="relative z-10 py-16 text-center border-t border-rose-200/50">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-10 bg-gradient-to-r from-transparent to-rose-200" />
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-600 to-red-500 flex items-center justify-center shadow-lg shadow-rose-200/50">
                <Heart className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="h-px w-10 bg-gradient-to-l from-transparent to-red-200" />
            </div>
            <p className="text-sm tracking-[0.25em] uppercase text-gray-400 font-medium">&nbsp;</p>
          </footer>
        </div>
      </div>
    </div>
  );
};
