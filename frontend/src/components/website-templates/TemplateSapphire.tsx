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

export const TemplateSapphire = ({
  title: propTitle,
  date: propDate,
  venue: propVenue,
  story: propStory,
  shareLink: propShareLink,
  picture: propPicture,
  primaryColor: propPrimaryColor = '#172554',
  secondaryColor: propSecondaryColor = '#bfdbfe',
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
  const fontFamily = data?.theme?.fontFamily || 'Playfair Display, Georgia, serif';
  const heroName = data?.eventType === 'wedding' && data?.coupleNames ? data.coupleNames : title;
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'Date to be announced';

  const allActions = [
    { label: 'RSVP', icon: Users, enabled: true, url: `/gift/${shareLink}` },
    { label: 'Buy Asoebi', icon: ShoppingBag, enabled: true, url: `/gift/${shareLink}` },
    { label: 'Cash Gifts', icon: Gift, enabled: true, url: `/gift/${shareLink}` },
    { label: 'Photobook', icon: Camera, enabled: true, url: `/qr-gift/${shareLink}` },
    { label: 'Wishlists', icon: Heart, enabled: !!(enableWishlistButton && wishlists?.[0]?.shareLink), url: wishlists?.[0]?.shareLink ? `/${wishlists[0].shareLink}` : `/gift/${shareLink}` },
    { label: 'Well Wishes', icon: MessageSquareHeart, enabled: !!showWellWishes, url: `/gift/${shareLink}#wishes` },
  ];

  return (
    <div className="min-h-screen bg-[#eef3f9] text-[#0f1f3d]" style={{ fontFamily }}>
      <section className="px-6 py-12 md:px-10 md:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_.82fr]">
          <div>
            <p className="mb-6 text-xs font-bold tracking-[0.36em]" style={{ color: primaryColor }}>{data?.heroSubtitle || 'An editorial invitation'}</p>
            <h1 className="max-w-5xl text-6xl font-semibold leading-[0.9] md:text-8xl lg:text-9xl" style={{ color: primaryColor }}>{heroName}</h1>
          </div>
          <div className="flex flex-col justify-start lg:pt-12">
            <Button
              size="lg"
              className="mt-8 w-full rounded-none py-7 text-sm font-bold uppercase tracking-[0.25em] text-white hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
              onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
            >
              RSVP Now
            </Button>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[.72fr_1.28fr]">
          <div className="grid gap-5">
            <div className="bg-white p-7 shadow-sm">
              <Calendar className="mb-6 h-7 w-7" style={{ color: primaryColor }} />
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-[#52627b]">Date</p>
              <p className="text-2xl leading-tight">{formattedDate}</p>
            </div>
            <div className="bg-white p-7 shadow-sm">
              <MapPin className="mb-6 h-7 w-7" style={{ color: primaryColor }} />
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-[#52627b]">Venue</p>
              <p className="text-2xl leading-tight">{venue || 'Venue to be announced'}</p>
            </div>
          </div>
          <div className="relative min-h-[560px] overflow-hidden">
            {picture ? (
              <img src={picture} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#172554] via-[#365486] to-[#bfdbfe]" />
            )}
            <div className="absolute inset-0 ring-1 ring-inset ring-[#b9c7dc]" />
          </div>
        </div>
      </section>

      <main className="px-6 py-20 md:px-10 md:py-24">
        {(data?.ceremony || data?.reception) && (
          <section className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2">
            {data?.ceremony && <div className="bg-[#0f1f3d] p-8 text-white"><p className="mb-3 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: secondaryColor }}>Ceremony</p><p className="text-xl leading-8">{data.ceremony}</p></div>}
            {data?.reception && <div className="bg-white p-8"><p className="mb-3 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: primaryColor }}>Reception</p><p className="text-xl leading-8 text-[#52627b]">{data.reception}</p></div>}
          </section>
        )}

        {story && (
          <section className="mx-auto mt-24 max-w-7xl">
            <div className="grid gap-8 border-y border-[#b9c7dc] py-14 md:grid-cols-[.6fr_1.4fr]">
              <h2 className="text-5xl font-semibold" style={{ color: primaryColor }}>Feature Story</h2>
              <p className="text-lg leading-10 text-[#52627b]">{story}</p>
            </div>
          </section>
        )}

        {gallery.length > 0 && (
          <section className="mx-auto mt-24 max-w-7xl">
            <h2 className="mb-8 text-5xl font-semibold" style={{ color: primaryColor }}>Gallery</h2>
            <GalleryLightbox images={gallery} imageClassName="h-80 w-full object-cover object-top" />
          </section>
        )}

        <section className="mx-auto mt-24 max-w-7xl">
          <div className="mb-12 flex items-end justify-between gap-6 border-b border-[#b9c7dc] pb-8">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-[#52627b]">Take part</p>
              <h2 className="text-5xl font-semibold" style={{ color: primaryColor }}>Celebrate With Us</h2>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {allActions.map((item) => {
                const Icon = item.icon;
                const iconColors: Record<string, { bg: string; text: string }> = {
                  'RSVP': { bg: '#dbeafe', text: '#2563eb' },
                  'Buy Asoebi': { bg: '#ede9fe', text: '#7c3aed' },
                  'Cash Gifts': { bg: '#fef3c7', text: '#d97706' },
                  'Photobook': { bg: '#cffafe', text: '#0891b2' },
                  'Wishlists': { bg: '#ffe4e6', text: '#e11d48' },
                  'Well Wishes': { bg: '#d1fae5', text: '#059669' },
                };
                const colors = iconColors[item.label] || { bg: '#f3f4f6', text: primaryColor };
                return (
                  <button
                    key={item.label}
                    onClick={() => window.open(item.url, '_blank')}
                    style={{ fontFamily }}
                    className={`group relative overflow-hidden border bg-white p-8 text-left transition-all duration-200 hover:-translate-y-1 ${item.enabled ? 'border-[#b9c7dc] hover:bg-[#e2eaf4] hover:shadow-lg' : 'border-gray-200 opacity-60 grayscale hover:bg-gray-50'}`}
                  >
                    <div className="mb-6 inline-flex h-14 w-14 items-center justify-center transition group-hover:scale-110" style={{ backgroundColor: colors.bg }}>
                      <Icon className="h-7 w-7" style={{ color: colors.text }} />
                    </div>
                     <p className="text-base tracking-[0.1em]" style={{ color: primaryColor }}>{item.label}</p>
                    <p className="mt-2 text-sm text-[#52627b]">
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
