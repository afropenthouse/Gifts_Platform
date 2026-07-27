
import { Button } from '../ui/button';
import { Calendar, Camera, Gift, Heart, MapPin, MessageSquareHeart, ShoppingBag, Users } from 'lucide-react';
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

export const TemplateAmethyst = ({
  title: propTitle,
  date: propDate,
  venue: propVenue,
  story: propStory,
  shareLink: propShareLink,
  picture: propPicture,
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
  const fontFamily = data?.theme?.fontFamily || 'Georgia, serif';
  const heroName = data?.eventType === 'wedding' && data?.coupleNames ? data.coupleNames : title;
  const heroSubtitle = data?.heroSubtitle || story || '';

  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const allActions = [
    { label: 'RSVP', icon: Users, enabled: true, url: `/gift/${shareLink}`, color: 'from-purple-700 to-violet-600' },
    { label: 'Buy Asoebi', icon: ShoppingBag, enabled: true, url: `/gift/${shareLink}`, color: 'from-fuchsia-700 to-purple-700' },
    { label: 'Cash Gifts', icon: Gift, enabled: true, url: `/gift/${shareLink}`, color: 'from-violet-600 to-purple-700' },
    { label: 'Photobook', icon: Camera, enabled: true, url: `/qr-gift/${shareLink}`, color: 'from-violet-800 to-purple-900' },
    { label: 'Wishlists', icon: Heart, enabled: !!(enableWishlistButton && wishlists?.[0]?.shareLink), url: wishlists?.[0]?.shareLink ? `/${wishlists[0].shareLink}` : `/gift/${shareLink}`, color: 'from-pink-700 to-rose-600' },
    { label: 'Well Wishes', icon: MessageSquareHeart, enabled: !!showWellWishes, url: `/gift/${shareLink}#wishes`, color: 'from-fuchsia-700 to-pink-600' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f4ff] text-[#2a1a4a]" style={{ fontFamily }}>
      <section className="relative min-h-[92vh] overflow-hidden">
        {picture ? (
          <img src={picture} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#e8d9ff] via-[#f8f4ff] to-white" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(248,244,255,.88),rgba(248,244,255,.75))]" />

        <div className="relative z-10 flex min-h-[92vh] items-center justify-center px-6 py-16 md:px-12">
          <div className="max-w-4xl text-center">
            <h1 className="mb-8 text-5xl font-semibold leading-[1.05] tracking-tight text-[#4a2a7a] md:text-7xl lg:text-8xl">
              {heroName}
            </h1>
            {heroSubtitle && (
              <p className="max-w-2xl mx-auto text-xl leading-8 text-[#6a4a9a] md:text-2xl">
                {heroSubtitle}
              </p>
            )}
            <div className="mt-12 flex flex-col gap-5 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="rounded-none bg-[#7a4aaa] px-10 py-7 text-sm font-bold uppercase tracking-[0.25em] text-white hover:bg-[#9a6aca]"
                onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
              >
                RSVP Now
              </Button>
              {(formattedDate || venue) && (
                <div className="flex items-center gap-6 text-sm uppercase tracking-[0.24em] text-[#7a5aaa]">
                  {formattedDate && <span>{formattedDate}</span>}
                  {formattedDate && venue && <span className="text-purple-400">•</span>}
                  {venue && <span>{venue}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="px-6 py-16 md:px-12 md:py-24">
        {(formattedDate || venue) && (
          <section className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
            {formattedDate && (
              <div className="border border-purple-200 bg-white p-8 shadow-sm">
                <Calendar className="mb-6 h-8 w-8 text-[#7a4aaa]" />
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.32em] text-[#9a6aca]">Date</p>
                <p className="text-2xl leading-tight text-[#2a1a4a]">{formattedDate}</p>
              </div>
            )}
            {venue && (
              <div className="border border-purple-200 bg-white p-8 md:col-span-2 shadow-sm">
                <MapPin className="mb-6 h-8 w-8 text-[#7a4aaa]" />
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.32em] text-[#9a6aca]">Venue</p>
                <p className="text-2xl leading-tight text-[#2a1a4a]">{venue}</p>
              </div>
            )}
          </section>
        )}

        {(data?.ceremony || data?.reception) && (
          <section className="mx-auto mt-10 grid max-w-6xl gap-6 md:grid-cols-2">
            {data?.ceremony && (
              <div className="bg-[#f0e8ff] p-8 text-[#2a1a4a]">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#7a4aaa]">Ceremony</p>
                <p className="text-lg leading-8">{data.ceremony}</p>
              </div>
            )}
            {data?.reception && (
              <div className="bg-[#f0e8ff] p-8 text-[#2a1a4a]">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#7a4aaa]">Reception</p>
                <p className="text-lg leading-8">{data.reception}</p>
              </div>
            )}
          </section>
        )}

        {story && (
          <section className="mx-auto mt-20 max-w-4xl text-center">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.35em] text-[#9a6aca]">Our Story</p>
            <p className="text-lg leading-10 text-[#4a2a7a] md:text-xl">{story}</p>
          </section>
        )}

        {gallery && gallery.length > 0 && (
          <section className="mx-auto mt-20 max-w-6xl">
            <h2 className="mb-8 text-center text-4xl font-semibold text-[#4a2a7a]">Moments</h2>
            <GalleryLightbox images={gallery} imageClassName="w-full h-72 object-cover shadow-lg object-top" />
          </section>
        )}

        <section className="mx-auto mt-20 max-w-6xl">
          <div className="mb-12 flex flex-col items-start justify-between gap-6 border-b border-purple-200 pb-8 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.32em] text-[#9a6aca]">Take part</p>
              <h2 className="text-5xl font-semibold text-[#4a2a7a]">Celebrate With Us</h2>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {allActions.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => window.open(item.url, '_blank')}
                  style={{ fontFamily }}
                  className={`group relative overflow-hidden border p-7 text-left transition-all duration-200 hover:-translate-y-1 ${item.enabled ? 'border-purple-200 bg-white hover:border-purple-400 hover:bg-[#faf5ff] hover:shadow-2xl' : 'border-purple-100 bg-white/70 opacity-60 grayscale hover:bg-white'}`}
                >
                  <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center bg-gradient-to-br ${item.color} transition group-hover:scale-110`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                   <p className="text-base tracking-[0.1em] text-[#4a2a7a]">{item.label}</p>
                  <p className="mt-2 text-sm text-[#7a5aaa]">
                    {item.label === 'RSVP' && 'Confirm your attendance'}
                    {item.label === 'Buy Asoebi' && 'Shop our wedding fabric'}
                    {item.label === 'Cash Gifts' && 'Support with a cash gift'}
                    {item.label === 'Photobook' && 'Browse our photo memory book'}
                    {item.label === 'Wishlists' && (item.enabled ? 'Pick a gift from our list' : 'Wishlist coming soon')}
                    {item.label === 'Well Wishes' && (item.enabled ? 'Leave us a sweet note' : 'Coming soon')}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};
