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

export const TemplateModern = ({
  title: propTitle,
  date: propDate,
  venue: propVenue,
  story: propStory,
  shareLink: propShareLink,
  picture: propPicture,
  primaryColor: propPrimaryColor = '#283618',
  secondaryColor: propSecondaryColor = '#bc6c25',
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

  const actions = [
    { label: 'RSVP', icon: Users, url: `/gift/${shareLink}` },
    { label: 'Asoebi', icon: ShoppingBag, url: `/gift/${shareLink}` },
    { label: 'Cash Gifts', icon: Gift, url: `/gift/${shareLink}` },
    { label: 'Photobook', icon: Camera, url: `/qr-gift/${shareLink}` },
  ];

  return (
    <div className="min-h-screen bg-[#fbfaf6] text-[#1f2933]" style={{ fontFamily }}>
      <section className="grid min-h-[92vh] lg:grid-cols-[.86fr_1.14fr]">
        <aside className="flex flex-col justify-between border-b border-[#ded8c8] bg-[#f0eadc] px-6 py-8 md:px-10 lg:border-b-0 lg:border-r">

          <div className="py-16">
            <p className="mb-5 text-xs font-bold tracking-[0.32em]" style={{ color: secondaryColor }}>
              {data?.heroSubtitle || 'The celebration begins'}
            </p>
            <h1 className="text-5xl font-semibold leading-[0.95] md:text-7xl" style={{ color: primaryColor }}>
              {heroName}
            </h1>
          </div>

          <Button
            size="lg"
            className="w-full rounded-none py-7 text-sm font-bold uppercase tracking-[0.22em] text-white hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
            onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
          >
            RSVP now
          </Button>
        </aside>

        <div className="relative min-h-[560px] overflow-hidden">
          {picture ? (
            <img src={picture} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#d9c9a7] via-[#9ca986] to-[#283618]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 grid gap-3 p-5 md:grid-cols-2 md:p-8">
            <div className="bg-black/35 backdrop-blur-md p-5 border border-white/10">
              <Calendar className="mb-4 h-6 w-6" style={{ color: secondaryColor }} />
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/70">Date</p>
              <p className="mt-2 text-xl font-semibold text-white">{formattedDate}</p>
            </div>
            <div className="bg-black/35 backdrop-blur-md p-5 border border-white/10">
              <MapPin className="mb-4 h-6 w-6" style={{ color: secondaryColor }} />
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/70">Venue</p>
              <p className="mt-2 text-xl font-semibold text-white">{venue || 'Venue to be announced'}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="px-6 py-16 md:px-10 md:py-20">
        <section className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[.75fr_1.25fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.32em]" style={{ color: secondaryColor }}>Timeline</p>
            <h2 className="mt-4 text-3xl font-semibold" style={{ color: primaryColor }}>The Day</h2>
          </div>
          <div className="grid gap-4">
            {data?.ceremony && <div className="border-l-4 bg-white p-6 shadow-sm" style={{ borderColor: secondaryColor }}><p className="mb-2 text-xs font-bold uppercase tracking-[0.24em]">Ceremony</p><p className="text-lg leading-8 text-[#596257]">{data.ceremony}</p></div>}
            {data?.reception && <div className="border-l-4 bg-white p-6 shadow-sm" style={{ borderColor: secondaryColor }}><p className="mb-2 text-xs font-bold uppercase tracking-[0.24em]">Reception</p><p className="text-lg leading-8 text-[#596257]">{data.reception}</p></div>}
          </div>
        </section>

        {story && (
          <section className="mx-auto mt-20 max-w-6xl border-y border-[#ded8c8] py-14">
              <div className="grid gap-8 md:grid-cols-[.7fr_1.3fr]">
                <h2 className="text-3xl font-semibold" style={{ color: primaryColor }}>Our Story</h2>
                <p className="text-lg leading-8 text-[#596257]">{story}</p>
              </div>
          </section>
        )}

        {gallery.length > 0 && (
          <section className="mx-auto mt-20 max-w-6xl">
            <h2 className="mb-8 text-3xl font-semibold" style={{ color: primaryColor }}>Moments</h2>
            <GalleryLightbox images={gallery} imageClassName="h-64 w-full object-cover object-top" />
          </section>
        )}

        <section className="mx-auto mt-20 max-w-6xl">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {actions.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.label} onClick={() => window.open(item.url, '_blank')} className="border border-[#ded8c8] bg-white p-7 text-left transition hover:bg-[#f0eadc]">
                  <Icon className="mb-6 h-7 w-7" style={{ color: secondaryColor }} />
                   <span className="text-sm tracking-[0.1em]" style={{ color: primaryColor }}>{item.label}</span>
                </button>
              );
            })}
            {enableWishlistButton && wishlists?.[0]?.shareLink && (
              <button onClick={() => window.open(`/${wishlists[0].shareLink}`, '_blank')} className="border border-[#ded8c8] bg-white p-7 text-left transition hover:bg-[#f0eadc]">
                <Heart className="mb-6 h-7 w-7" style={{ color: secondaryColor }} />
                <span className="text-sm tracking-[0.1em]" style={{ color: primaryColor }}>Wishlists</span>
              </button>
            )}
            {showWellWishes && (
              <button onClick={() => window.open(`/gift/${shareLink}#wishes`, '_blank')} className="border border-[#ded8c8] bg-white p-7 text-left transition hover:bg-[#f0eadc]">
                <MessageSquareHeart className="mb-6 h-7 w-7" style={{ color: secondaryColor }} />
                <span className="text-sm tracking-[0.1em]" style={{ color: primaryColor }}>Well Wishes</span>
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
