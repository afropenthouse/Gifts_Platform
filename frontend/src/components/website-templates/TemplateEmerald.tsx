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

export const TemplateEmerald = ({
  title: propTitle,
  date: propDate,
  venue: propVenue,
  story: propStory,
  shareLink: propShareLink,
  picture: propPicture,
  primaryColor: propPrimaryColor = '#064e3b',
  secondaryColor: propSecondaryColor = '#d6b76a',
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
  const fontFamily = data?.theme?.fontFamily || 'Cormorant Garamond, Georgia, serif';
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
    <div className="min-h-screen bg-[#071f1a] text-[#f7f1df]" style={{ fontFamily }}>
      <section className="relative min-h-screen overflow-hidden px-5 py-5 md:px-8 md:py-8">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(214,183,106,.18),transparent_35%,rgba(255,255,255,.05))]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-7xl gap-3 lg:grid-cols-[.9fr_1.1fr]">
          <div className="flex flex-col justify-between border border-[#d6b76a]/30 p-7 md:p-10">
            <div className="flex items-center justify-center text-xs font-bold uppercase tracking-[0.32em]" style={{ color: secondaryColor }}>
            </div>
            <div className="py-16">
              <p className="mb-6 text-sm tracking-[0.35em] text-[#d6b76a]">{data?.heroSubtitle || 'A refined celebration'}</p>
              <h1 className="text-5xl font-semibold leading-[0.9] md:text-7xl lg:text-8xl">{heroName}</h1>
              <div className="mt-10 grid gap-4 text-sm uppercase tracking-[0.22em] text-[#d6b76a] md:grid-cols-1">
                <p>{venue || 'Venue to be announced'}</p>
              </div>
            </div>
            <Button
              size="lg"
              className="rounded-none py-7 text-sm font-bold uppercase tracking-[0.25em] text-[#071f1a] hover:opacity-90"
              style={{ backgroundColor: secondaryColor }}
              onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
            >
              RSVP now
            </Button>
          </div>
          <div className="relative min-h-[560px] overflow-hidden">
            {picture ? (
              <img src={picture} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#123c32] via-[#0b2b25] to-[#d6b76a]" />
            )}
            <div className="absolute inset-0 border border-[#d6b76a]/30" />
            <div className="absolute bottom-6 left-6 right-6 bg-[#071f1a]/90 p-6 backdrop-blur border border-[#d6b76a]/20 md:left-auto md:w-[360px]">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#f7f1df]">{formattedDate}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="px-6 py-16 md:px-10 md:py-24">
        <section className="mx-auto grid max-w-7xl gap-5 md:grid-cols-4">
          {[{ label: 'Date', value: formattedDate, icon: Calendar }, { label: 'Venue', value: venue || 'Venue to be announced', icon: MapPin }, { label: 'Ceremony', value: data?.ceremony, icon: Heart }, { label: 'Reception', value: data?.reception, icon: Heart }]
            .filter((item) => item.value)
            .map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="border border-[#d6b76a]/25 bg-white/[0.04] p-7">
                  <Icon className="mb-6 h-7 w-7" style={{ color: secondaryColor }} />
                   <p className="mb-3 text-xs tracking-[0.14em]" style={{ color: secondaryColor }}>{item.label}</p>
                  <p className="text-xl leading-8 text-[#f7f1df]/85">{item.value}</p>
                </div>
              );
            })}
        </section>

        {story && (
          <section className="mx-auto mt-24 grid max-w-7xl gap-10 md:grid-cols-[.8fr_1.2fr]">
            <h2 className="text-[2.4rem] font-semibold leading-none md:text-[3rem]">Our Story</h2>
            <p className="text-lg leading-8 text-[#f7f1df]/72">{story}</p>
          </section>
        )}

        {gallery.length > 0 && (
          <section className="mx-auto mt-24 max-w-7xl">
            <h2 className="mb-8 text-5xl font-semibold">Moments</h2>
            <GalleryLightbox images={gallery} imageClassName="h-80 w-full object-cover object-top" />
          </section>
        )}

        <section className="mx-auto mt-24 max-w-7xl border-t border-[#d6b76a]/25 pt-12">
          <div className="grid gap-3 md:grid-cols-3">
            {actions.map((item, index) => {
              const Icon = item.icon;
              return (
                <button key={item.label} onClick={() => window.open(item.url, '_blank')} className={`border border-[#d6b76a]/25 bg-white/[0.04] p-8 text-left transition hover:-translate-y-1 hover:bg-white/[0.08] ${index === 0 ? 'md:col-span-2' : ''}`}>
                  <Icon className="mb-10 h-8 w-8" style={{ color: secondaryColor }} />
                    <span className="text-sm tracking-[0.12em]">{item.label}</span>
                </button>
              );
            })}
            {enableWishlistButton && wishlists?.[0]?.shareLink && <button onClick={() => window.open(`/${wishlists[0].shareLink}`, '_blank')} className="border border-[#d6b76a]/25 bg-white/[0.04] p-8 text-left transition hover:-translate-y-1 hover:bg-white/[0.08]"><Heart className="mb-10 h-8 w-8" style={{ color: secondaryColor }} /><span className="text-sm tracking-[0.12em]">Wishlists</span></button>}
            {showWellWishes && <button onClick={() => window.open(`/gift/${shareLink}#wishes`, '_blank')} className="border border-[#d6b76a]/25 bg-white/[0.04] p-8 text-left transition hover:-translate-y-1 hover:bg-white/[0.08]"><MessageSquareHeart className="mb-10 h-8 w-8" style={{ color: secondaryColor }} /><span className="text-sm tracking-[0.12em]">Well Wishes</span></button>}
          </div>
        </section>
      </main>
    </div>
  );
};
