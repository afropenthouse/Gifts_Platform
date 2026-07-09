import { Button } from '../ui/button';
import { Calendar, Heart, Gift, Users, ShoppingBag, MapPin, ChevronDown, Camera } from 'lucide-react';

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
    theme?: {
      primaryColor?: string;
      secondaryColor?: string;
      fontFamily?: string;
    };
  };
}

export const TemplateCleanClassic = ({
  title: propTitle,
  date: propDate,
  venue: propVenue,
  story: propStory,
  shareLink: propShareLink,
  picture: propPicture,
  primaryColor: propPrimaryColor = '#1e1b4b',
  secondaryColor: propSecondaryColor = '#818cf8',
  wishlists,
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

return (
    <div className="min-h-screen font-sans" style={{ fontFamily, backgroundColor: primaryColor }}>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {picture && (
          <div className="absolute inset-0">
            <img
              src={picture}
              alt=""
              className="w-full h-full object-cover object-[center_20%] opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
          </div>
        )}

        {!picture && (
          <div className="absolute inset-0" style={{
            background: `radial-gradient(ellipse at center, ${primaryColor}60 0%, ${primaryColor}40 30%, ${primaryColor} 100%)`
          }} />
        )}

        <div className="relative z-10 text-center px-6 py-20 max-w-5xl mx-auto">
          {data?.heroSubtitle && (
            <p className="text-xs md:text-sm tracking-[0.4em] uppercase mb-8 text-white/50">
              {data.heroSubtitle}
            </p>
          )}

          {data?.eventType === 'wedding' && data?.coupleNames ? (
            <div className="text-center mb-8 tracking-tight">
              {data.coupleNames.split('&').map((name, index, arr) => (
                <div key={index}>
                  <span className="text-6xl md:text-8xl lg:text-9xl font-black text-white">
                    {name.trim()}
                  </span>
                  {index < arr.length - 1 && (
                    <div className="my-3 md:my-5">
                      <span className="text-3xl md:text-5xl font-light" style={{ color: secondaryColor }}>
                        &
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : data?.eventType === 'wedding' ? (
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-8 tracking-tight text-white">
              {title}
            </h1>
          ) : data?.heroTitle ? (
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-8 tracking-tight text-white">
              {data.heroTitle}
            </h1>
          ) : (
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-8 tracking-tight text-white">
              {title}
            </h1>
          )}

          <div className="flex items-center justify-center gap-6 mb-12">
            <div className="h-px w-16" style={{ backgroundColor: secondaryColor }} />
            <div className="w-2 h-2 rotate-45" style={{ backgroundColor: secondaryColor }} />
            <div className="h-px w-16" style={{ backgroundColor: secondaryColor }} />
          </div>

          {date && (
            <div className="flex flex-col items-center gap-3 mb-6">
              <Calendar className="w-5 h-5" style={{ color: secondaryColor }} />
              <p className="text-lg md:text-xl tracking-widest text-white/80 font-light">
                {formatDate(date)}
              </p>
            </div>
          )}

          {venue && (
            <div className="flex flex-col items-center gap-3 mb-14">
              <MapPin className="w-5 h-5" style={{ color: secondaryColor }} />
              <p className="text-base md:text-lg tracking-wide text-white/60 font-light">
                {venue}
              </p>
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <Button
              size="lg"
              className="rounded-none px-12 py-7 text-sm tracking-[0.2em] uppercase font-bold"
              style={{ backgroundColor: secondaryColor, color: primaryColor }}
              onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
            >
              RSVP NOW
            </Button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6" style={{ color: primaryColor, opacity: 0.4 }} />
        </div>
      </section>

      {/* Story Section */}
      {story && (
        <section className="py-32 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1" style={{ backgroundColor: `${secondaryColor}30` }} />
              <span className="text-xs tracking-[0.3em] uppercase" style={{ color: secondaryColor }}>Our Story</span>
              <div className="h-px flex-1" style={{ backgroundColor: `${secondaryColor}30` }} />
            </div>
            <p className="text-xl md:text-2xl leading-relaxed text-white/70 font-light">
              {story}
            </p>
          </div>
        </section>
      )}

      {/* Actions Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
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
              <span className="text-xs tracking-[0.2em] uppercase font-bold">Asoebi</span>
            </button>
            {wishlists && wishlists.length > 0 && wishlists[0].shareLink && (
              <button
                onClick={() => window.open(`/${wishlists[0].shareLink}`, '_blank')}
                className="flex flex-col items-center gap-5 py-12 border transition-colors hover:bg-white/5"
                style={{ borderColor: `${secondaryColor}30`, color: secondaryColor }}
              >
                <Heart className="w-8 h-8" />
                <span className="text-xs tracking-[0.2em] uppercase font-bold">Wishlist</span>
              </button>
            )}
            <button
              onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
              className="flex flex-col items-center gap-5 py-12 border transition-colors hover:bg-white/5"
              style={{ borderColor: `${secondaryColor}30`, color: secondaryColor }}
            >
              <Gift className="w-8 h-8" />
              <span className="text-xs tracking-[0.2em] uppercase font-bold">Gifts</span>
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
        </div>
      </section>

          {/* Footer */}
          <footer className="py-16 text-center border-t border-stone-200/70" />
    </div>
  );
};
