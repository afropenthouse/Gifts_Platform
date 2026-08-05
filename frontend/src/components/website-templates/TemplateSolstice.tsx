import { Button } from '../ui/button';
import { Calendar, Camera, Gift, Heart, MapPin, MessageSquareHeart, ShoppingBag, Sparkles, Users } from 'lucide-react';
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

export const TemplateSolstice = ({
  title: propTitle,
  date: propDate,
  venue: propVenue,
  story: propStory,
  shareLink: propShareLink,
  picture: propPicture,
  primaryColor: propPrimaryColor = '#be6d3b',
  secondaryColor: propSecondaryColor = '#1f6f78',
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
  const fontFamily = data?.theme?.fontFamily || 'Lato, system-ui, sans-serif';
  const heroName = data?.eventType === 'wedding' && data?.coupleNames ? data.coupleNames : title;
  const eventLabel = data?.eventType && data.eventType !== 'wedding' ? data.eventType : 'wedding';
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : 'Date to be announced';

  const actionItems = [
    { label: 'RSVP', icon: Users, url: `/gift/${shareLink}` },
    { label: 'Asoebi', icon: ShoppingBag, url: `/gift/${shareLink}` },
    { label: 'Cash Gifts', icon: Gift, url: `/gift/${shareLink}` },
    { label: 'Photobook', icon: Camera, url: `/qr-gift/${shareLink}` },
  ];

  return (
    <div className="min-h-screen bg-[#fff7ed] text-[#213033]" style={{ fontFamily }}>
      <section className="relative overflow-hidden px-5 py-6 md:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(251,146,60,.28),transparent_28%),radial-gradient(circle_at_90%_15%,rgba(20,184,166,.18),transparent_24%)]" />
        <div className="relative mx-auto grid min-h-[82vh] max-w-7xl items-stretch gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <div className="flex flex-col justify-between rounded-[2rem] bg-white/70 p-7 shadow-sm backdrop-blur md:p-12">
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.28em]" style={{ color: secondaryColor }}>
              <Sparkles className="h-4 w-4" />
              {data?.heroSubtitle || `A bright ${eventLabel} celebration`}
            </div>
            <div className="py-14">
              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em]" style={{ color: primaryColor }}>{formattedDate}</p>
              <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-normal md:text-7xl">{heroName}</h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-[#526064]">Golden-hour warmth, color, and everyone we love in one place.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="rounded-2xl border border-[#213033]/10 bg-white px-5 py-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5" style={{ color: secondaryColor }} />
                  <p className="text-sm leading-6 text-[#526064]">{venue || 'Venue to be announced'}</p>
                </div>
              </div>
              <Button className="h-full rounded-2xl px-8 text-sm font-bold uppercase tracking-[0.14em] text-white" style={{ backgroundColor: primaryColor }} onClick={() => window.open(`/gift/${shareLink}`, '_blank')}>
                RSVP
              </Button>
            </div>
          </div>
          <div className="relative min-h-[520px] overflow-hidden rounded-[2rem]">
            {picture ? <img src={picture} alt="" className="h-full w-full object-cover object-top" /> : <div className="h-full w-full bg-gradient-to-br from-orange-200 via-white to-teal-200" />}
            <div className="absolute inset-x-6 bottom-6 rounded-3xl bg-white/90 p-5 shadow-lg backdrop-blur">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <p><span className="font-bold" style={{ color: primaryColor }}>Ceremony</span><br />{data?.ceremony || 'Details coming soon'}</p>
                <p><span className="font-bold" style={{ color: secondaryColor }}>Reception</span><br />{data?.reception || 'Celebrate after the vows'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 py-16">
        {story && (
          <section className="grid gap-6 md:grid-cols-[.7fr_1.3fr]">
            <h2 className="text-4xl font-black">Our Story</h2>
            <p className="text-lg leading-9 text-[#526064]">{story}</p>
          </section>
        )}
        {gallery.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-3xl font-black">Moments</h2>
            <GalleryLightbox images={gallery} imageClassName="h-64 w-full rounded-2xl object-cover object-top" />
          </section>
        )}
        <section className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {actionItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.label} onClick={() => window.open(item.url, '_blank')} className="rounded-2xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <Icon className="mb-8 h-7 w-7" style={{ color: secondaryColor }} />
                <span className="text-sm font-bold uppercase tracking-[0.12em]">{item.label}</span>
              </button>
            );
          })}
          {enableWishlistButton && wishlists?.[0]?.shareLink && <button onClick={() => window.open(`/${wishlists[0].shareLink}`, '_blank')} className="rounded-2xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"><Heart className="mb-8 h-7 w-7" style={{ color: primaryColor }} /><span className="text-sm font-bold uppercase tracking-[0.12em]">Wishlists</span></button>}
          {showWellWishes && <button onClick={() => window.open(`/gift/${shareLink}#wishes`, '_blank')} className="rounded-2xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"><MessageSquareHeart className="mb-8 h-7 w-7" style={{ color: primaryColor }} /><span className="text-sm font-bold uppercase tracking-[0.12em]">Well Wishes</span></button>}
        </section>
      </main>
    </div>
  );
};
