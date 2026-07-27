import { Button } from '../ui/button';
import { Camera, Gift, Heart, MessageSquareHeart, ShoppingBag, Sparkles, Users } from 'lucide-react';
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

  const actionLinks = [
    { label: 'RSVP', icon: Users, url: `/gift/${shareLink}` },
    { label: 'Asoebi', icon: ShoppingBag, url: `/gift/${shareLink}` },
    { label: 'Cash Gifts', icon: Gift, url: `/gift/${shareLink}` },
    { label: 'Photobook', icon: Camera, url: `/qr-gift/${shareLink}` },
  ];

  return (
    <div className="min-h-screen bg-[#fff8f5] text-[#35131c]" style={{ fontFamily }}>
      <section className="px-5 py-6 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1.12fr_.88fr]">
          <div className="relative min-h-[78vh] overflow-hidden bg-[#f8d8d3]">
            {picture ? (
              <img src={picture} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#f8d8d3] via-[#fff8f5] to-[#f1a6a1]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#35131c]/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 max-w-3xl p-7 text-white md:p-10">
              <p className="mb-4 text-xs font-bold tracking-[0.34em] text-[#ffd7b0]">{data?.heroSubtitle || 'A love celebration'}</p>
              <h1 className="text-5xl font-semibold leading-none md:text-7xl lg:text-8xl">{heroName}</h1>
            </div>
          </div>

          <aside className="grid gap-5">
            <div className="flex min-h-[220px] flex-col justify-between bg-white p-7 shadow-sm">
              <Sparkles className="h-8 w-8" style={{ color: secondaryColor }} />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: primaryColor }}>Date</p>
                <p className="mt-3 text-3xl leading-tight">{formattedDate}</p>
              </div>
            </div>
            <div className="flex min-h-[220px] flex-col justify-between p-7 text-white" style={{ backgroundColor: primaryColor }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/65">Venue</p>
                <p className="mt-3 text-3xl leading-tight">{venue || 'Venue coming soon'}</p>
              </div>
            </div>
            <Button
              size="lg"
              className="rounded-none py-8 text-sm font-bold uppercase tracking-[0.25em] text-white hover:opacity-90"
              style={{ backgroundColor: secondaryColor }}
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
            {data?.ceremony && <div className="border-t-4 bg-white p-8 shadow-sm" style={{ borderColor: secondaryColor }}><p className="mb-3 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: primaryColor }}>Ceremony</p><p className="text-lg leading-8 text-[#68414a]">{data.ceremony}</p></div>}
            {data?.reception && <div className="border-t-4 bg-white p-8 shadow-sm" style={{ borderColor: primaryColor }}><p className="mb-3 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: primaryColor }}>Reception</p><p className="text-lg leading-8 text-[#68414a]">{data.reception}</p></div>}
          </section>
        )}

        {story && (
          <section className="mx-auto mt-20 max-w-5xl text-center">
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
              return (
                <button key={item.label} onClick={() => window.open(item.url, '_blank')} className={`p-7 text-left text-white transition hover:-translate-y-1 ${index === 0 ? 'md:col-span-2' : ''}`} style={{ backgroundColor: index % 2 === 0 ? primaryColor : secondaryColor }}>
                  <Icon className="mb-8 h-7 w-7" />
                   <span className="text-sm tracking-[0.12em]">{item.label}</span>
                </button>
              );
            })}
            {enableWishlistButton && wishlists?.[0]?.shareLink && (
              <button onClick={() => window.open(`/${wishlists[0].shareLink}`, '_blank')} className="bg-white p-7 text-left shadow-sm transition hover:-translate-y-1">
                <Heart className="mb-8 h-7 w-7" style={{ color: primaryColor }} />
                <span className="text-sm tracking-[0.12em]">Wishlists</span>
              </button>
            )}
            {showWellWishes && (
              <button onClick={() => window.open(`/gift/${shareLink}#wishes`, '_blank')} className="bg-white p-7 text-left shadow-sm transition hover:-translate-y-1">
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
