import { Button } from '../ui/button';
import { Calendar, Heart, Gift, Users, ShoppingBag, MapPin, ChevronDown, MessageSquareHeart, Camera } from 'lucide-react';

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
    theme?: {
      primaryColor?: string;
      secondaryColor?: string;
      fontFamily?: string;
    };
  };
}

export const TemplateElegant = ({ 
  title: propTitle, 
  date: propDate, 
  venue: propVenue, 
  story: propStory, 
  shareLink: propShareLink, 
  picture: propPicture, 
  primaryColor: propPrimaryColor = '#2E235C', 
  secondaryColor: propSecondaryColor = '#E2B06B',
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
  const fontFamily = data?.theme?.fontFamily || 'Georgia, serif';

  const formatDate = (d?: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen font-sans" style={{ fontFamily, backgroundColor: '#fdfbf7' }}>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] md:min-h-[70vh] lg:min-h-[80vh] flex items-center justify-center overflow-hidden">
        {picture ? (
          <div className="absolute inset-0">
            <img src={picture} alt="" className="w-full h-full object-cover object-[center_20%]" />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${primaryColor}08, ${secondaryColor}15)` }} />
        )}
        
        <div className="relative z-10 text-center px-6 py-20 max-w-4xl mx-auto">
          {data?.heroSubtitle && (
            <p className="text-sm md:text-base tracking-[0.3em] mb-6" style={{ color: primaryColor, opacity: 0.8 }}>
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
          
          <div className="w-24 h-0.5 mx-auto mb-8" style={{ backgroundColor: secondaryColor }} />
          
          {date && (
            <div className="flex flex-col items-center gap-2 mb-6">
              <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
              <p className="text-lg md:text-xl tracking-wide" style={{ color: primaryColor }}>
                {formatDate(date)}
              </p>
            </div>
          )}
          
          {venue && (
            <div className="flex flex-col items-center gap-2 mb-12">
              <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
              <p className="text-lg md:text-xl tracking-wide" style={{ color: primaryColor, opacity: 0.8 }}>
                {venue}
              </p>
            </div>
          )}
          
          <div className="flex flex-col items-center gap-4">
            <Button 
              size="lg"
              className="rounded-none px-10 py-6 text-sm tracking-widest uppercase font-medium"
              style={{ backgroundColor: primaryColor, color: 'white' }}
              onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
            >
              <Users className="w-4 h-4 mr-2" />
              RSVP
            </Button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6" style={{ color: primaryColor }} />
        </div>
      </section>

      {/* Story Section */}
      {story && (
        <section className="py-24 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-12 h-0.5 mx-auto mb-10" style={{ backgroundColor: secondaryColor }} />
            <h2 className="text-3xl md:text-4xl font-bold mb-10" style={{ color: primaryColor, fontFamily }}>
              Our Story
            </h2>
            <p className="text-lg leading-8" style={{ color: primaryColor, opacity: 0.75 }}>
              {story}
            </p>
            <div className="w-12 h-0.5 mx-auto mt-10" style={{ backgroundColor: secondaryColor }} />
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {gallery && gallery.length > 0 && (
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="w-12 h-0.5 mx-auto mb-10" style={{ backgroundColor: secondaryColor }} />
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center" style={{ color: primaryColor, fontFamily }}>
              Gallery
            </h2>
            <GalleryLightbox images={gallery} imageClassName="w-full h-48 object-cover rounded-lg object-top" />
            <div className="w-12 h-0.5 mx-auto mt-10" style={{ backgroundColor: secondaryColor }} />
          </div>
        </section>
      )}

      {/* Actions Section */}
      <section className="py-24 px-6" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white" style={{ fontFamily }}>
            Join Our Celebration
          </h2>
          <p className="text-white/60 mb-12 tracking-wide">
            We would love to have you with us
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
              className="flex flex-col items-center gap-4 py-8 text-white hover:bg-white/10 transition-colors"
            >
              <Users className="w-7 h-7" />
              <span className="text-sm tracking-wide">RSVP</span>
            </button>
            <button
              onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
              className="flex flex-col items-center gap-4 py-8 text-white hover:bg-white/10 transition-colors"
            >
              <ShoppingBag className="w-7 h-7" />
              <span className="text-sm tracking-wide">Asoebi</span>
            </button>
            {enableWishlistButton && wishlists && wishlists.length > 0 && wishlists[0].shareLink && (
              <button
                onClick={() => window.open(`/${wishlists[0].shareLink}`, '_blank')}
                className="flex flex-col items-center gap-4 py-8 text-white hover:bg-white/10 transition-colors"
              >
                <Heart className="w-7 h-7" />
                <span className="text-sm tracking-wide">Wishlists</span>
              </button>
            )}
            {showWellWishes && (
              <button
                onClick={() => window.open(`/gift/${shareLink}#wishes`, '_blank')}
                className="flex flex-col items-center gap-4 py-8 text-white hover:bg-white/10 transition-colors"
              >
                <MessageSquareHeart className="w-7 h-7" />
                <span className="text-sm tracking-wide">Well Wishes</span>
              </button>
            )}
            <button
              onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
              className="flex flex-col items-center gap-4 py-8 text-white hover:bg-white/10 transition-colors"
            >
              <Gift className="w-7 h-7" />
              <span className="text-sm tracking-wide">Cash Gifts</span>
            </button>
            <button
              onClick={() => window.open(`/qr-gift/${shareLink}`, '_blank')}
              className="flex flex-col items-center gap-4 py-8 text-white hover:bg-white/10 transition-colors"
            >
              <Camera className="w-7 h-7" />
              <span className="text-sm tracking-wide">Photobook</span>
            </button>
          </div>
        </div>
      </section>

          {/* Footer */}
          <footer className="py-16 text-center border-t border-stone-100" />
    </div>
  );
};
