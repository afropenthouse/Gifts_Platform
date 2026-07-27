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
      fontFamily?: string;
    };
  };
}

export const TemplatePearl = ({
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
    <div className="min-h-screen bg-[#f6f1e9] text-[#1e1a17]" style={{ fontFamily }}>
      <section className="px-5 py-5 md:px-8 md:py-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="relative min-h-[76vh] overflow-hidden bg-[#ddd0c0]">
            {picture ? (
              <img src={picture} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#fffaf2] via-[#d8c7b2] to-[#8b735d]" />
            )}
            <div className="absolute inset-5 border border-white/70" />
          </div>

          <div className="flex min-h-[76vh] flex-col justify-between bg-white px-7 py-8 shadow-sm md:px-10">
            <div className="flex items-center justify-center text-xs font-bold uppercase tracking-[0.32em] text-[#8b735d]">
            </div>
            <div className="py-14">
              <p className="mb-7 text-xs font-bold tracking-[0.35em] text-[#8b735d]">{data?.heroSubtitle || 'An intimate celebration'}</p>
              <h1 className="text-5xl font-semibold leading-[0.92] md:text-7xl lg:text-8xl">{heroName}</h1>
              <div className="mt-10 grid gap-px bg-[#d8c7b2] sm:grid-cols-2">
                <div className="bg-white p-5">
                  <Calendar className="mb-4 h-6 w-6 text-[#8b735d]" />
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8b735d]">Date</p>
                  <p className="mt-2 text-lg leading-7">{formattedDate}</p>
                </div>
                <div className="bg-white p-5">
                  <MapPin className="mb-4 h-6 w-6 text-[#8b735d]" />
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8b735d]">Venue</p>
                  <p className="mt-2 text-lg leading-7">{venue || 'Venue to be announced'}</p>
                </div>
              </div>
            </div>
            <Button
              size="lg"
              className="rounded-none bg-[#1e1a17] py-7 text-sm font-bold uppercase tracking-[0.25em] text-white hover:bg-[#3a3029]"
              onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
            >
              RSVP Now
            </Button>
          </div>
        </div>
      </section>

      <main className="px-6 py-16 md:px-10 md:py-24">
        {(data?.ceremony || data?.reception) && (
          <section className="mx-auto max-w-7xl">
            <div className="grid gap-px bg-[#d8c7b2] md:grid-cols-2">
              {data?.ceremony && (
                <div className="bg-[#1e1a17] p-8 text-white">
                  <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-[#d8c7b2]">Ceremony</p>
                  <p className="text-xl leading-9">{data.ceremony}</p>
                </div>
              )}
              {data?.reception && (
                <div className="bg-white p-8">
                  <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-[#8b735d]">Reception</p>
                  <p className="text-xl leading-9 text-[#5c5148]">{data.reception}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {story && (
          <section className="mx-auto mt-24 max-w-5xl text-center">
            <p className="mb-6 text-xs font-bold uppercase tracking-[0.35em] text-[#8b735d]">Our Story</p>
            <p className="text-lg leading-[1.45] text-[#312923] md:text-xl">{story}</p>
          </section>
        )}

        {gallery.length > 0 && (
          <section className="mx-auto mt-24 max-w-7xl">
            <div className="mb-8 grid items-end gap-4 md:grid-cols-[.45fr_1fr]">
              <h2 className="text-5xl font-semibold">Moments</h2>
              <p className="text-right text-xs font-bold uppercase tracking-[0.3em] text-[#8b735d]">A curated gallery</p>
            </div>
            <GalleryLightbox images={gallery} imageClassName="h-80 w-full object-cover object-top" />
          </section>
        )}

        <section className="mx-auto mt-24 max-w-7xl">
          <div className="mb-12 flex items-end justify-between gap-6 border-b border-[#d8c7b2] pb-8">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.32em] text-[#8b735d]">Guest Desk</p>
              <h2 className="text-5xl font-semibold text-[#1e1a17]">Celebrate With Us</h2>
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
              const colors = iconColors[item.label] || { bg: '#f3f4f6', text: '#8b735d' };
              return (
                <button
                  key={item.label}
                  onClick={() => window.open(item.url, '_blank')}
                  style={{ fontFamily }}
                  className={`group relative overflow-hidden border bg-white p-8 text-left transition-all duration-200 hover:-translate-y-1 ${item.enabled ? 'border-[#d8c7b2] hover:border-[#8b735d] hover:shadow-lg' : 'border-[#e9dcc9] opacity-60 grayscale hover:border-[#d8c7b2] hover:bg-[#fbf8f3]'}`}
                >
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center transition group-hover:scale-110" style={{ backgroundColor: colors.bg }}>
                    <Icon className="h-7 w-7" style={{ color: colors.text }} />
                  </div>
                   <p className="text-base tracking-[0.1em] text-[#1e1a17]">{item.label}</p>
                  <p className="mt-2 text-sm text-[#5c5148]">
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
