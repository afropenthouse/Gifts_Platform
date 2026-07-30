import { Button } from '../ui/button';
import { Camera, Gift, Heart, MapPin, MessageSquareHeart, ShoppingBag, Sparkles, Users } from 'lucide-react';
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
  secondaryColor: propSecondaryColor = '#f59e0b',
  wishlists,
  gallery = [],
  showWellWishes = false,
  enableWishlistButton = true,
  data,
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
  const heroName = data?.eventType === 'wedding' && data?.coupleNames ? data.coupleNames : title;
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })
    : 'Date coming soon';

  // A short, editorial-style countdown line — reuses the date the couple already
  // entered rather than asking for new data, and quietly disappears once it's passed.
  const countdownLabel = (() => {
    if (!date) return null;
    const eventDay = new Date(date);
    if (isNaN(eventDay.getTime())) return null;
    const startOfEvent = new Date(eventDay.getFullYear(), eventDay.getMonth(), eventDay.getDate());
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.round((startOfEvent.getTime() - startOfToday.getTime()) / 86400000);
    if (diff > 1) return `${diff} days away`;
    if (diff === 1) return 'Tomorrow';
    if (diff === 0) return "Today's the day";
    return null;
  })();

  const actionLinks = [
    { label: 'RSVP', icon: Users, url: `/gift/${shareLink}` },
    { label: 'Asoebi', icon: ShoppingBag, url: `/gift/${shareLink}` },
    { label: 'Cash Gifts', icon: Gift, url: `/gift/${shareLink}` },
    { label: 'Photobook', icon: Camera, url: `/qr-gift/${shareLink}` },
  ];

  return (
    <div className="min-h-screen bg-[#fff8f5] text-[#35131c]" style={{ fontFamily }}>
      <style>{`@keyframes rosetteIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .rst-in{animation:rosetteIn .7s cubic-bezier(.2,.7,.2,1) both}
        .rst-in-1{animation-delay:.08s}.rst-in-2{animation-delay:.16s}.rst-in-3{animation-delay:.24s}
        @media (prefers-reduced-motion: reduce){.rst-in{animation:none}}`}</style>

      <section className="px-5 py-6 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1.12fr_.88fr]">
          <div className="relative min-h-[52vh] sm:min-h-[62vh] lg:min-h-[78vh] overflow-hidden bg-[#f8d8d3]">
            {picture ? (
              <img src={picture} alt={heroName} className="absolute inset-0 h-full w-full object-cover object-top" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#f8d8d3] via-[#fff8f5] to-[#f1a6a1]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#35131c]/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 max-w-3xl p-7 text-white md:p-10">
              <p className="rst-in mb-4 text-xs font-bold tracking-[0.34em] text-[#ffd7b0]">{data?.heroSubtitle || 'A love celebration'}</p>
              <h1 className="rst-in rst-in-1 text-5xl font-semibold leading-none md:text-7xl lg:text-8xl">{heroName}</h1>
            </div>
          </div>

          <aside className="grid gap-5">
            <div className="rst-in rst-in-1 flex min-h-[220px] flex-col justify-between bg-white p-7 shadow-sm">
              <div className="flex items-center justify-between">
                <Sparkles className="h-7 w-7" style={{ color: secondaryColor }} />
                {countdownLabel && (
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {countdownLabel}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: primaryColor }}>Date</p>
                <p className="mt-3 text-3xl leading-tight">{formattedDate}</p>
              </div>
            </div>
            <div className="rst-in rst-in-2 flex min-h-[220px] flex-col justify-between p-7 text-white" style={{ backgroundColor: primaryColor }}>
              <MapPin className="h-7 w-7 text-white/70" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/65">Venue</p>
                <p className="mt-3 text-3xl leading-tight">{venue || 'Venue coming soon'}</p>
              </div>
            </div>
            <Button
              size="lg"
              className="rst-in rst-in-3 rounded-none py-8 text-sm font-bold uppercase tracking-[0.25em] text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ backgroundColor: secondaryColor, outlineColor: primaryColor }}
              onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
            >
              RSVP
            </Button>
          </aside>
        </div>
      </section>

      <main className="px-6 py-14 md:px-10 md:py-20">
        {(data?.ceremony || data?.reception) && (
          <section className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
            {data?.ceremony && (
              <div className="border-t-4 bg-white p-8 shadow-sm" style={{ borderColor: secondaryColor }}>
                <p className="mb-3 flex items-baseline gap-2 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: primaryColor }}>
                  <span className="text-base font-black" style={{ color: secondaryColor }}>01</span> Ceremony
                </p>
                <p className="text-lg leading-8 text-[#68414a]">{data.ceremony}</p>
              </div>
            )}
            {data?.reception && (
              <div className="border-t-4 bg-white p-8 shadow-sm" style={{ borderColor: primaryColor }}>
                <p className="mb-3 flex items-baseline gap-2 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: primaryColor }}>
                  <span className="text-base font-black" style={{ color: primaryColor }}>02</span> Reception
                </p>
                <p className="text-lg leading-8 text-[#68414a]">{data.reception}</p>
              </div>
            )}
          </section>
        )}

        {story && (
          <section className="mx-auto mt-20 max-w-5xl text-center">
            <span className="mx-auto mb-6 block h-px w-16" style={{ backgroundColor: `${secondaryColor}66` }} />
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.35em]" style={{ color: secondaryColor }}>Our Story</p>
            <p className="text-lg leading-8 md:text-xl">{story}</p>
          </section>
        )}

        {gallery.length > 0 && (
          <section className="mx-auto mt-20 max-w-6xl">
            <div className="mb-8 flex items-end justify-between gap-4">
              <h2 className="text-4xl font-semibold">Gallery</h2>
              <div className="h-px flex-1" style={{ backgroundColor: `${primaryColor}33` }} />
            </div>
            <GalleryLightbox images={gallery} imageClassName="h-72 w-full object-cover object-top" />
          </section>
        )}

        <section className="mx-auto mt-20 max-w-6xl">
          <div className="grid gap-4 md:grid-cols-3">
            {actionLinks.map((item, index) => {
              const Icon = item.icon;
              const bg = index % 2 === 0 ? primaryColor : secondaryColor;
              return (
                <button
                  key={item.label}
                  onClick={() => window.open(item.url, '_blank')}
                  className={`p-7 text-left text-white transition hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${index === 0 ? 'md:col-span-2' : ''}`}
                  style={{ backgroundColor: bg }}
                >
                  <Icon className="mb-8 h-7 w-7" />
                   <span className="text-sm tracking-[0.12em]">{item.label}</span>
                </button>
              );
            })}
            {enableWishlistButton && wishlists?.[0]?.shareLink && (
              <button
                onClick={() => window.open(`/${wishlists[0].shareLink}`, '_blank')}
                className="bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ outlineColor: primaryColor }}
              >
                <Heart className="mb-8 h-7 w-7" style={{ color: primaryColor }} />
                <span className="text-sm tracking-[0.12em]">Wishlists</span>
              </button>
            )}
            {showWellWishes && (
              <button
                onClick={() => window.open(`/gift/${shareLink}#wishes`, '_blank')}
                className="bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ outlineColor: primaryColor }}
              >
                <MessageSquareHeart className="mb-8 h-7 w-7" style={{ color: primaryColor }} />
                <span className="text-sm tracking-[0.12em]">Well Wishes</span>
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
