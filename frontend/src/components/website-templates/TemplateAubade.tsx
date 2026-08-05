import { Button } from '../ui/button';
import { Calendar, Heart, Gift, Users, ShoppingBag, MapPin, MessageSquareHeart, Camera } from 'lucide-react';
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

// Signature divider: a thin sunrise arc with radiating lines — stands in for
// the "dawn" idea (Aubade = a song for parting lovers at daybreak), used
// everywhere the Nocturne template would reach for a heart-in-circle.
const SunriseDivider = ({ color = '#B98D4D' }: { color?: string }) => (
  <svg viewBox="0 0 120 32" className="w-28 h-auto mx-auto" fill="none">
    <path d="M8 26C8 14.5 24 5 60 5C96 5 112 14.5 112 26" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    {[18, 34, 50, 60, 70, 86, 102].map((x, i) => (
      <line key={i} x1={x} y1={26} x2={x} y2={i % 2 === 0 ? 30 : 29} stroke={color} strokeWidth="1" strokeLinecap="round" opacity={0.6} />
    ))}
  </svg>
);

export const TemplateAubade = ({
  title: propTitle,
  date: propDate,
  venue: propVenue,
  story: propStory,
  shareLink: propShareLink,
  picture: propPicture,
  primaryColor: propPrimaryColor = '#C17F72',
  secondaryColor: propSecondaryColor = '#7C8B6F',
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
  const primaryColor = data?.theme?.primaryColor || propPrimaryColor; // dusty rose
  const secondaryColor = data?.theme?.secondaryColor || propSecondaryColor; // sage
  const gold = '#B98D4D';
  const cream = '#FAF6F0';
  const ink = '#2B2A28';
  const fontDisplay = data?.theme?.fontFamily || "'Cormorant Garamond', Georgia, serif";

  const formatDate = (d?: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const heroName = data?.eventType === 'wedding' && data?.coupleNames ? data.coupleNames : title;
  const eventLabel = data?.eventType && data.eventType !== 'wedding' ? data.eventType : 'wedding';
  const slogan = `At first light, we begin. Join us as we celebrate our ${eventLabel}.`;

  const countdownText = (() => {
    if (!date) return '';
    const eventDay = new Date(date);
    if (isNaN(eventDay.getTime())) return '';
    const startOfEvent = new Date(eventDay.getFullYear(), eventDay.getMonth(), eventDay.getDate());
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.round((startOfEvent.getTime() - startOfToday.getTime()) / 86400000);
    if (diff > 1) return `${diff} days until sunrise`;
    if (diff === 1) return '1 day until sunrise';
    if (diff === 0) return "Today's the day!";
    return 'The celebration has passed';
  })();

  const actions = [
    { key: 'rsvp', label: 'RSVP', icon: Users, href: `/gift/${shareLink}`, color: primaryColor },
    { key: 'asoebi', label: 'Buy Asoebi', icon: ShoppingBag, href: `/gift/${shareLink}`, color: secondaryColor },
    ...(enableWishlistButton && wishlists && wishlists.length > 0 && wishlists[0].shareLink
      ? [{ key: 'wishlists', label: 'Wishlists', icon: Heart, href: `/${wishlists[0].shareLink}`, color: gold }]
      : []),
    ...(showWellWishes
      ? [{ key: 'wishes', label: 'Well Wishes', icon: MessageSquareHeart, href: `/gift/${shareLink}#wishes`, color: primaryColor }]
      : []),
    { key: 'cash', label: 'Cash Gifts', icon: Gift, href: `/gift/${shareLink}`, color: secondaryColor },
    { key: 'photobook', label: 'Photobook', icon: Camera, href: `/qr-gift/${shareLink}`, color: gold },
  ];

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif", backgroundColor: cream, color: ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap');
        @keyframes aubadeRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .aub-in{animation:aubadeRise .9s cubic-bezier(.2,.7,.2,1) both}
        .aub-in-1{animation-delay:.08s}.aub-in-2{animation-delay:.18s}.aub-in-3{animation-delay:.28s}.aub-in-4{animation-delay:.38s}
        @media (prefers-reduced-motion: reduce){.aub-in{animation:none}}
      `}</style>

      {/* Full-bleed hero — a single wide frame rather than a sticky split screen */}
      <div className="relative w-full h-[62vh] md:h-[78vh] overflow-hidden">
        {picture ? (
          <img src={picture} alt="" className="w-full h-full object-cover object-top" />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(160deg, ${primaryColor}22, ${cream} 70%)` }} />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 40%, rgba(250,246,240,0.94) 96%)' }} />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center text-center px-6 pb-10 aub-in">
          <p className="text-xs tracking-[0.35em] uppercase mb-3" style={{ color: gold }}>
            {data?.heroSubtitle || `An ${eventLabel} celebration`}
          </p>
          <h1 className="text-4xl md:text-6xl leading-none" style={{ fontFamily: fontDisplay, color: ink }}>
            {heroName}
          </h1>
        </div>
      </div>

      <main className="max-w-xl mx-auto px-6 md:px-8">
        {/* Intro */}
        <section className="text-center pt-12 pb-8">
          <p className="text-base md:text-lg italic text-stone-600 aub-in aub-in-1" style={{ fontFamily: fontDisplay }}>
            {slogan}
          </p>

          {countdownText && (
            <div className="inline-flex items-center gap-3 mt-8 aub-in aub-in-2">
              <span className="h-px w-8" style={{ backgroundColor: `${gold}66` }} />
              <span className="text-xs tracking-[0.25em] uppercase" style={{ color: primaryColor }}>{countdownText}</span>
              <span className="h-px w-8" style={{ backgroundColor: `${gold}66` }} />
            </div>
          )}
        </section>

        {/* Date & venue */}
        {(date || venue) && (
          <section className="grid sm:grid-cols-2 gap-3 mb-8 aub-in aub-in-3">
            {date && (
              <div className="flex items-start gap-3 px-5 py-4 rounded-md border" style={{ borderColor: `${primaryColor}33`, backgroundColor: '#ffffffaa' }}>
                <Calendar className="w-4 h-4 mt-1 shrink-0" style={{ color: primaryColor }} />
                <div className="min-w-0">
                  <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ color: primaryColor }}>When</p>
                  <p className="text-sm leading-snug">{formatDate(date)}</p>
                </div>
              </div>
            )}
            {venue && (
              <div className="flex items-start gap-3 px-5 py-4 rounded-md border" style={{ borderColor: `${secondaryColor}33`, backgroundColor: '#ffffffaa' }}>
                <MapPin className="w-4 h-4 mt-1 shrink-0" style={{ color: secondaryColor }} />
                <div className="min-w-0">
                  <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ color: secondaryColor }}>Where</p>
                  <p className="text-sm leading-snug">{venue}</p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Primary CTA */}
        <section className="flex justify-center mb-14 aub-in aub-in-4">
          <Button
            size="lg"
            className="rounded-full px-12 py-6 text-sm tracking-[0.2em] uppercase font-medium border-0 hover:scale-105 transition-transform duration-300"
            style={{ backgroundColor: primaryColor, color: cream }}
            onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
          >
            RSVP Now
          </Button>
        </section>

        {/* Ceremony / Reception */}
        {(data?.ceremony || data?.reception) && (
          <section className="grid gap-4 mb-16">
            {data?.ceremony && (
              <div className="rounded-md px-6 py-5" style={{ backgroundColor: '#ffffffaa', borderLeft: `3px solid ${primaryColor}` }}>
                <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: primaryColor }}>Ceremony</p>
                <p className="text-stone-700 whitespace-pre-line leading-relaxed">{data.ceremony}</p>
              </div>
            )}
            {data?.reception && (
              <div className="rounded-md px-6 py-5" style={{ backgroundColor: '#ffffffaa', borderLeft: `3px solid ${secondaryColor}` }}>
                <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: secondaryColor }}>Reception</p>
                <p className="text-stone-700 whitespace-pre-line leading-relaxed">{data.reception}</p>
              </div>
            )}
          </section>
        )}

        {/* Story */}
        {story && (
          <section className="text-center mb-16">
            <SunriseDivider color={gold} />
            <h2 className="text-3xl md:text-4xl mt-6 mb-6" style={{ fontFamily: fontDisplay }}>Our Story</h2>
            <p className="text-lg leading-8 text-stone-600 italic" style={{ fontFamily: fontDisplay }}>{story}</p>
          </section>
        )}

        {/* Gallery */}
        {gallery && gallery.length > 0 && (
          <section className="text-center mb-16">
            <SunriseDivider color={gold} />
            <h2 className="text-3xl md:text-4xl mt-6 mb-6" style={{ fontFamily: fontDisplay }}>Gallery</h2>
            <GalleryLightbox images={gallery} imageClassName="w-full h-48 object-cover rounded-md" />
          </section>
        )}

        {/* Actions */}
        <section className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: gold }}>Celebrate With Us</p>
          <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: fontDisplay }}>Join Our Celebration</h2>
          <p className="text-stone-500 mb-10">We would love to have you with us</p>

          <div className="grid grid-cols-2 gap-3">
            {actions.map(({ key, label, icon: Icon, href, color }) => (
              <button
                key={key}
                onClick={() => window.open(href, '_blank')}
                className="group flex flex-col items-center gap-4 py-9 rounded-md border bg-white/60 hover:bg-white transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ borderColor: `${color}33` }}
              >
                <div className="p-3.5 rounded-full" style={{ backgroundColor: `${color}18` }}>
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <span className="text-xs tracking-[0.1em] uppercase" style={{ color: ink }}>{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="pb-16 text-center">
          <SunriseDivider color={gold} />
          <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400 mt-4">&nbsp;</p>
        </footer>
      </main>
    </div>
  );
};
