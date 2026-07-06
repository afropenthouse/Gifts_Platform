import { Button } from '../ui/button';
import { Calendar, Heart, Gift, Users, ShoppingBag, MapPin, ChevronDown } from 'lucide-react';

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

export const TemplateRomantic = ({ 
  title: propTitle, 
  date: propDate, 
  venue: propVenue, 
  story: propStory, 
  shareLink: propShareLink, 
  picture: propPicture, 
  primaryColor: propPrimaryColor = '#5c6b4f', 
  secondaryColor: propSecondaryColor = '#d4a574',
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
  const fontFamily = data?.theme?.fontFamily || 'Georgia, serif';

  const formatDate = (d?: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen" style={{ fontFamily, backgroundColor: '#faf8f5' }}>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] md:min-h-[70vh] lg:min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          {picture ? (
            <>
              <img src={picture} alt="" className="w-full h-full object-cover object-[center_20%]" />
              <div className="absolute inset-0 bg-black/30" />
            </>
          ) : (
            <div className="absolute inset-0" style={{ 
              background: `linear-gradient(180deg, ${primaryColor}08 0%, ${secondaryColor}10 50%, ${primaryColor}05 100%)` 
            }} />
          )}
        </div>

        <div className="relative z-10 text-center px-6 py-20 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-12" style={{ backgroundColor: secondaryColor }} />
            <Heart className="w-5 h-5" style={{ color: secondaryColor }} />
            <div className="h-px w-12" style={{ backgroundColor: secondaryColor }} />
          </div>

          {data?.heroSubtitle && (
            <p className="text-xs tracking-[0.3em] uppercase mb-6" style={{ color: primaryColor, opacity: 0.7 }}>
              {data.heroSubtitle}
            </p>
          )}
          
          {data?.eventType === 'wedding' && data?.coupleNames ? (
            <div className="text-center mb-6 leading-tight">
              {data.coupleNames.split('&').map((name, index, arr) => (
                <div key={index}>
                  <span className="text-5xl md:text-7xl lg:text-8xl font-bold" style={{ color: primaryColor }}>
                    {name.trim()}
                  </span>
                  {index < arr.length - 1 && (
                    <div className="my-2 md:my-4">
                      <span className="text-2xl md:text-4xl font-light" style={{ color: secondaryColor }}>
                        &
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : data?.eventType === 'wedding' ? (
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight" style={{ color: primaryColor }}>
              {title}
            </h1>
          ) : data?.heroTitle ? (
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight" style={{ color: primaryColor }}>
              {data.heroTitle}
            </h1>
          ) : (
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight" style={{ color: primaryColor }}>
              {title}
            </h1>
          )}
          
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="h-px w-8" style={{ backgroundColor: `${secondaryColor}60` }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
            <div className="h-px w-8" style={{ backgroundColor: `${secondaryColor}60` }} />
          </div>
          
          {date && (
            <div className="flex flex-col items-center gap-2 mb-5">
              <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
              <p className="text-lg md:text-xl tracking-wide" style={{ color: primaryColor, opacity: 0.8 }}>
                {formatDate(date)}
              </p>
            </div>
          )}
          
          {venue && (
            <div className="flex flex-col items-center gap-2 mb-12">
              <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
              <p className="text-base md:text-lg tracking-wide" style={{ color: primaryColor, opacity: 0.7 }}>
                {venue}
              </p>
            </div>
          )}
          
          <div className="flex flex-col items-center gap-4">
            <Button 
              size="lg"
              className="rounded-full px-10 py-6 text-sm tracking-widest uppercase font-medium shadow-lg"
              style={{ backgroundColor: primaryColor, color: 'white' }}
              onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
            >
              <Heart className="w-4 h-4 mr-2" />
              RSVP Now
            </Button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6" style={{ color: primaryColor, opacity: 0.4 }} />
        </div>
      </section>

      {/* Story Section */}
      {story && (
        <section className="py-24 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-10">
              <div className="h-px w-10" style={{ backgroundColor: `${secondaryColor}40` }} />
              <Heart className="w-4 h-4" style={{ color: secondaryColor }} />
              <div className="h-px w-10" style={{ backgroundColor: `${secondaryColor}40` }} />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-10" style={{ color: primaryColor, fontFamily }}>
              Our Story
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: primaryColor, opacity: 0.7 }}>
              {story}
            </p>
          </div>
        </section>
      )}

      {/* Actions Section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: primaryColor, fontFamily }}>
            Join Our Celebration
          </h2>
          <p className="mb-14 tracking-wide" style={{ color: primaryColor, opacity: 0.5 }}>
            We are so excited to celebrate with you
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
              className="flex flex-col items-center gap-4 py-10 rounded-full shadow-sm hover:shadow-md transition-shadow"
              style={{ backgroundColor: primaryColor, color: 'white' }}
            >
              <Users className="w-7 h-7" />
              <span className="text-xs tracking-[0.15em] uppercase font-medium">RSVP</span>
            </button>
            <button
              onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
              className="flex flex-col items-center gap-4 py-10 rounded-full border-2 hover:bg-gray-50 transition-colors"
              style={{ borderColor: `${primaryColor}20`, color: primaryColor }}
            >
              <ShoppingBag className="w-7 h-7" />
              <span className="text-xs tracking-[0.15em] uppercase font-medium">Asoebi</span>
            </button>
            {wishlists && wishlists.length > 0 && wishlists[0].shareLink && (
              <button
                onClick={() => window.open(`/${wishlists[0].shareLink}`, '_blank')}
                className="flex flex-col items-center gap-4 py-10 rounded-full border-2 hover:bg-gray-50 transition-colors"
                style={{ borderColor: `${primaryColor}20`, color: primaryColor }}
              >
                <Heart className="w-7 h-7" />
                <span className="text-xs tracking-[0.15em] uppercase font-medium">Wishlist</span>
              </button>
            )}
            <button
              onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
              className="flex flex-col items-center gap-4 py-10 rounded-full border-2 hover:bg-gray-50 transition-colors"
              style={{ borderColor: `${primaryColor}20`, color: primaryColor }}
            >
              <Gift className="w-7 h-7" />
              <span className="text-xs tracking-[0.15em] uppercase font-medium">Gifts</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-14 text-center" style={{ backgroundColor: `${primaryColor}08` }}>
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-px w-8" style={{ backgroundColor: `${secondaryColor}40` }} />
          <Heart className="w-4 h-4" style={{ color: secondaryColor }} />
          <div className="h-px w-8" style={{ backgroundColor: `${secondaryColor}40` }} />
        </div>
        <p className="text-sm tracking-widest uppercase" style={{ color: primaryColor, opacity: 0.5, fontFamily }}>
          Made with love
        </p>
      </footer>
    </div>
  );
};
