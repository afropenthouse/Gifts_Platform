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

export const TemplateRuby = ({
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
  const fontFamily = data?.theme?.fontFamily || 'Cormorant Garamond, Georgia, serif';
  const heroName = data?.eventType === 'wedding' && data?.coupleNames ? data.coupleNames : title;
  const heroSubtitle = data?.heroSubtitle || story || '';

  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const allActions = [
    { label: 'RSVP', icon: Users, enabled: true, url: `/gift/${shareLink}`, color: 'from-rose-700 to-red-600' },
    { label: 'Buy Asoebi', icon: ShoppingBag, enabled: true, url: `/gift/${shareLink}`, color: 'from-stone-800 to-rose-900' },
    { label: 'Cash Gifts', icon: Gift, enabled: true, url: `/gift/${shareLink}`, color: 'from-amber-600 to-yellow-500' },
    { label: 'Photobook', icon: Camera, enabled: true, url: `/qr-gift/${shareLink}`, color: 'from-zinc-800 to-zinc-600' },
    { label: 'Wishlists', icon: Heart, enabled: !!(enableWishlistButton && wishlists?.[0]?.shareLink), url: wishlists?.[0]?.shareLink ? `/${wishlists[0].shareLink}` : `/gift/${shareLink}`, color: 'from-pink-700 to-rose-600' },
    { label: 'Well Wishes', icon: MessageSquareHeart, enabled: !!showWellWishes, url: `/gift/${shareLink}#wishes`, color: 'from-fuchsia-700 to-pink-600' },
  ];

  return (
    <div className="min-h-screen bg-[#180d10] text-[#fff7f2]" style={{ fontFamily }}>
      <section className="relative min-h-[92vh] overflow-hidden">
        {picture ? (
          <img src={picture} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#3a1119] via-[#190d10] to-black" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,13,16,.94),rgba(24,13,16,.55),rgba(24,13,16,.18))]" />

        <div className="relative z-10 flex min-h-[92vh] items-center px-6 py-16 md:px-12">
          <div className="max-w-3xl">
            <h1 className="mb-8 text-5xl font-semibold leading-[0.95] tracking-tight text-white md:text-7xl lg:text-8xl">
              {heroName}
            </h1>
            {heroSubtitle && (
              <p className="max-w-2xl text-xl leading-8 text-[#ffe6dc] md:text-2xl">
                {heroSubtitle}
              </p>
            )}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                className="rounded-none bg-[#e8b4a0] px-10 py-7 text-sm font-bold uppercase tracking-[0.25em] text-[#180d10] hover:bg-[#f3c8b8]"
                onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
              >
                RSVP Now
              </Button>
              {(formattedDate || venue) && (
                <div className="border-l border-[#e8b4a0]/45 pl-5 text-sm uppercase tracking-[0.24em] text-[#f3c8b8]">
                  {formattedDate && <>{formattedDate}<br /></>}
                  {venue}
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
              <div className="border border-[#e8b4a0]/25 bg-white/[0.04] p-8">
                <Calendar className="mb-6 h-8 w-8 text-[#e8b4a0]" />
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.32em] text-[#e8b4a0]">Date</p>
                <p className="text-2xl leading-tight text-white">{formattedDate}</p>
              </div>
            )}
            {venue && (
              <div className="border border-[#e8b4a0]/25 bg-white/[0.04] p-8 md:col-span-2">
                <MapPin className="mb-6 h-8 w-8 text-[#e8b4a0]" />
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.32em] text-[#e8b4a0]">Venue</p>
                <p className="text-2xl leading-tight text-white">{venue}</p>
              </div>
            )}
          </section>
        )}

        {(data?.ceremony || data?.reception) && (
          <section className="mx-auto mt-8 grid max-w-6xl gap-6 md:grid-cols-2">
            {data?.ceremony && (
              <div className="bg-[#fff7f2] p-8 text-[#2a1116]">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#9f3344]">Ceremony</p>
                <p className="text-lg leading-8">{data.ceremony}</p>
              </div>
            )}
            {data?.reception && (
              <div className="bg-[#fff7f2] p-8 text-[#2a1116]">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#9f3344]">Reception</p>
                <p className="text-lg leading-8">{data.reception}</p>
              </div>
            )}
          </section>
        )}

        {story && (
          <section className="mx-auto mt-20 max-w-4xl text-center">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.35em] text-[#e8b4a0]">Our Story</p>
            <p className="text-lg leading-10 text-[#fff7f2] md:text-xl">{story}</p>
          </section>
        )}

        {gallery && gallery.length > 0 && (
          <section className="mx-auto mt-20 max-w-6xl">
            <h2 className="mb-8 text-center text-4xl font-semibold text-white">Moments</h2>
            <GalleryLightbox images={gallery} imageClassName="w-full h-72 object-cover shadow-xl object-top" />
          </section>
        )}

        <section className="mx-auto mt-20 max-w-6xl">
          <div className="mb-12 flex flex-col items-start justify-between gap-6 border-b border-[#e8b4a0]/30 pb-8 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.32em] text-[#e8b4a0]">Ways to love</p>
              <h2 className="text-5xl font-semibold text-white">Celebrate With Us</h2>
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
                  className={`group relative overflow-hidden border p-7 text-left transition-all duration-200 hover:-translate-y-1 ${item.enabled ? 'border-[#e8b4a0]/25 bg-white/[0.04] hover:border-[#e8b4a0]/70 hover:bg-white/[0.08] hover:shadow-2xl' : 'border-white/10 bg-white/[0.02] opacity-60 grayscale hover:bg-white/[0.04]'}`}
                >
                  <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center bg-gradient-to-br ${item.color} transition group-hover:scale-110`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                   <p className="text-base tracking-[0.1em] text-[#fff7f2]">{item.label}</p>
                  <p className="mt-2 text-sm text-[#f3c8b8]/80">
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
