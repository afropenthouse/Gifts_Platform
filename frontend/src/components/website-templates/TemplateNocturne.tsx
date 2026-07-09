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

export const TemplateNocturne = ({ 
  title: propTitle, 
  date: propDate, 
  venue: propVenue, 
  story: propStory, 
  shareLink: propShareLink, 
  picture: propPicture, 
  primaryColor: propPrimaryColor = '#0f172a', 
  secondaryColor: propSecondaryColor = '#fb923c',
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
    <div className="min-h-screen font-sans" style={{ fontFamily, backgroundColor: '#0c0a09', color: '#fafaf9' }}>
      <div className="md:grid md:grid-cols-2">
        {/* Picture column - sticky for the whole page scroll */}
        <div className="md:order-1">
          <div className="sticky top-0 h-[55vh] md:h-screen w-full overflow-hidden">
            {picture ? (
              <img src={picture} alt="" className="w-full h-full object-cover object-top" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-900 via-stone-900 to-neutral-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/70 md:from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
              <p className="text-2xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">{heroName}</p>
              <p className="mt-3 text-xs md:text-sm text-white/70 max-w-md leading-relaxed">{slogan}</p>
            </div>
          </div>
        </div>

        {/* Content column */}
        <div className="md:order-2 relative bg-gradient-to-br from-slate-900 via-stone-900 to-neutral-900 overflow-hidden">
          <div className="absolute top-0 left-1/3 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-3xl hidden md:block" />
          <div className="absolute bottom-0 right-1/3 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-3xl hidden md:block" />

          {/* Hero details */}
          <section className="relative z-10 px-8 py-20 md:px-14 md:py-28 max-w-xl mx-auto">
            <FlowerDecor className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-auto opacity-20 pointer-events-none text-orange-400" />
            <div className="relative z-10 flex flex-col items-center md:items-start w-full">
            <div className="hidden md:block mb-8">
              {data?.heroSubtitle && (
                <p className="text-xs tracking-[0.3em] uppercase font-bold text-orange-300">{data.heroSubtitle}</p>
              )}
            </div>

            <div className="flex items-center justify-center md:justify-start gap-4 mb-8">
              <div className="h-px w-8 bg-gradient-to-r from-transparent via-orange-500/50 to-orange-500/50" />
              <span className="text-sm tracking-[0.2em] uppercase text-orange-300">{countdownText}</span>
              <div className="h-px w-8 bg-gradient-to-l from-transparent via-orange-500/50 to-orange-500/50" />
            </div>

            <div className="flex flex-col items-center md:items-start gap-4 mb-12">
              <Button
                size="lg"
                className="rounded-full px-12 py-7 text-sm tracking-[0.2em] uppercase font-bold shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40 hover:scale-105 transition-all duration-300"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, color: 'white' }}
                onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
              >
                <Heart className="w-4 h-4 mr-2" />
                RSVP Now
              </Button>
            </div>

            {data?.ceremony && (
              <div className="w-full mb-8">
                <p className="text-xs tracking-[0.3em] uppercase mb-2 text-orange-400">Ceremony</p>
                <p className="text-orange-100/80 whitespace-pre-line leading-relaxed">{data.ceremony}</p>
              </div>
            )}

            {data?.reception && (
              <div className="w-full">
                <p className="text-xs tracking-[0.3em] uppercase mb-2 text-orange-400">Reception</p>
                <p className="text-orange-100/80 whitespace-pre-line leading-relaxed">{data.reception}</p>
              </div>
            )}
            </div>
          </section>

          {/* Story Section */}
          {story && (
            <section className="relative z-10 px-8 md:px-14 py-12 max-w-xl mx-auto">
              <div className="text-center">
                <div className="flex items-center justify-center gap-4 mb-10">
                  <div className="h-px w-16 bg-gradient-to-r from-transparent via-orange-500/30 to-orange-500/30" />
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                  <div className="h-px w-16 bg-gradient-to-l from-transparent via-amber-500/30 to-amber-500/30" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-8 text-white tracking-tight">Our Story</h2>
                <p className="text-xl leading-relaxed text-stone-400 font-light">{story}</p>
              </div>
            </section>
          )}

          {/* Gallery Section */}
          {gallery && gallery.length > 0 && (
            <section className="relative z-10 px-8 md:px-14 py-12 max-w-xl mx-auto">
              <div className="text-center">
                <div className="flex items-center justify-center gap-4 mb-10">
                  <div className="h-px w-16 bg-gradient-to-r from-transparent via-orange-500/30 to-orange-500/30" />
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                  <div className="h-px w-16 bg-gradient-to-l from-transparent via-amber-500/30 to-amber-500/30" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-8 text-white tracking-tight">Gallery</h2>
                <GalleryLightbox images={gallery} imageClassName="w-full h-48 object-cover rounded-lg" />
              </div>
            </section>
          )}

          {/* Actions Section */}
          <section className="relative z-10 px-8 md:px-14 pb-20 max-w-xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 mb-8 shadow-lg shadow-orange-500/30">
                <span className="text-xs tracking-[0.25em] uppercase font-bold text-white">Celebrate With Us</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-3 text-white tracking-tight">Join Our Celebration</h2>
              <p className="text-stone-500 mb-12 tracking-wide font-light">We would love to have you with us</p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
                  className="group flex flex-col items-center gap-5 py-10 rounded-2xl border border-orange-500/20 bg-white/5 hover:border-orange-500/40 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 group-hover:from-orange-600 group-hover:to-orange-700 transition-colors shadow-lg shadow-orange-500/30">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-sm tracking-[0.15em] uppercase font-bold text-orange-100">RSVP</span>
                </button>
                <button
                  onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
                  className="group flex flex-col items-center gap-5 py-10 rounded-2xl border border-amber-500/20 bg-white/5 hover:border-amber-500/40 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 group-hover:from-amber-600 group-hover:to-amber-700 transition-colors shadow-lg shadow-amber-500/30">
                    <ShoppingBag className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-sm tracking-[0.15em] uppercase font-bold text-amber-100">Buy Asoebi</span>
                </button>
                {enableWishlistButton && wishlists && wishlists.length > 0 && wishlists[0].shareLink && (
                  <button
                    onClick={() => window.open(`/${wishlists[0].shareLink}`, '_blank')}
                    className="group flex flex-col items-center gap-5 py-10 rounded-2xl border border-rose-500/20 bg-white/5 hover:border-rose-500/40 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 group-hover:from-rose-600 group-hover:to-rose-700 transition-colors shadow-lg shadow-rose-500/30">
                      <Heart className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-sm tracking-[0.15em] uppercase font-bold text-rose-100">Our Wishlists</span>
                  </button>
                )}
                {showWellWishes && (
                  <button
                    onClick={() => window.open(`/gift/${shareLink}#wishes`, '_blank')}
                    className="group flex flex-col items-center gap-5 py-10 rounded-2xl border border-pink-500/20 bg-white/5 hover:border-pink-500/40 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 group-hover:from-pink-600 group-hover:to-pink-700 transition-colors shadow-lg shadow-pink-500/30">
                      <MessageSquareHeart className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-sm tracking-[0.15em] uppercase font-bold text-pink-100">Well-wishes</span>
                  </button>
                )}
                <button
                  onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
                  className="group flex flex-col items-center gap-5 py-10 rounded-2xl border border-yellow-500/20 bg-white/5 hover:border-yellow-500/40 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 group-hover:from-yellow-600 group-hover:to-yellow-700 transition-colors shadow-lg shadow-yellow-500/30">
                    <Gift className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-sm tracking-[0.15em] uppercase font-bold text-yellow-100">Cash Gifts</span>
                </button>
                <button
                  onClick={() => window.open(`/qr-gift/${shareLink}`, '_blank')}
                  className="group flex flex-col items-center gap-5 py-10 rounded-2xl border border-orange-500/20 bg-white/5 hover:border-orange-500/40 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 group-hover:from-orange-600 group-hover:to-amber-700 transition-colors shadow-lg shadow-orange-500/30">
                    <Camera className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-sm tracking-[0.15em] uppercase font-bold text-orange-100">Photobook</span>
                </button>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="relative z-10 py-16 text-center border-t border-white/5">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-10 bg-gradient-to-r from-transparent to-orange-500/30" />
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Heart className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="h-px w-10 bg-gradient-to-l from-transparent to-amber-500/30" />
            </div>
            <p className="text-sm tracking-[0.25em] uppercase text-stone-600 font-medium">&nbsp;</p>
          </footer>
        </div>
      </div>
    </div>
  );
};
