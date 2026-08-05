import { Button } from '../ui/button';
import { Camera, Flower2, Gift, Heart, MapPin, MessageSquareHeart, ShoppingBag, Users } from 'lucide-react';
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

export const TemplateGardenia = ({
  title: propTitle,
  date: propDate,
  venue: propVenue,
  story: propStory,
  shareLink: propShareLink,
  picture: propPicture,
  primaryColor: propPrimaryColor = '#4f7f52',
  secondaryColor: propSecondaryColor = '#d48b8b',
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
  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Date to be announced';

  const actions = [
    { label: 'RSVP', icon: Users, url: `/gift/${shareLink}` },
    { label: 'Asoebi', icon: ShoppingBag, url: `/gift/${shareLink}` },
    { label: 'Cash Gifts', icon: Gift, url: `/gift/${shareLink}` },
    { label: 'Photobook', icon: Camera, url: `/qr-gift/${shareLink}` },
  ];

  return (
    <div className="min-h-screen bg-[#fbf8f2] text-[#263127]" style={{ fontFamily }}>
      <section className="mx-auto grid max-w-7xl gap-0 px-4 py-4 md:grid-cols-[.85fr_1.15fr] md:px-8 md:py-8">
        <div className="relative z-10 flex min-h-[72vh] flex-col justify-center border border-[#d8cfc0] bg-[#fbf8f2] p-8 md:p-12">
          <Flower2 className="mb-8 h-10 w-10" style={{ color: secondaryColor }} />
          <p className="mb-5 text-xs uppercase tracking-[0.34em]" style={{ color: primaryColor }}>{data?.heroSubtitle || 'A garden celebration'}</p>
          <h1 className="text-5xl font-semibold leading-none md:text-7xl">{heroName}</h1>
          <div className="my-10 h-px w-24" style={{ backgroundColor: secondaryColor }} />
          <p className="text-lg leading-8 text-[#6b625a]">{formattedDate}</p>
          <p className="mt-3 flex items-start gap-2 text-base leading-7 text-[#6b625a]"><MapPin className="mt-1 h-4 w-4 shrink-0" />{venue || 'Venue to be announced'}</p>
          <Button className="mt-10 w-fit rounded-full px-10 py-6 text-sm uppercase tracking-[0.18em] text-white" style={{ backgroundColor: primaryColor }} onClick={() => window.open(`/gift/${shareLink}`, '_blank')}>
            RSVP
          </Button>
        </div>
        <div className="relative min-h-[72vh] overflow-hidden">
          {picture ? <img src={picture} alt="" className="h-full w-full object-cover object-top" /> : <div className="h-full w-full bg-gradient-to-br from-[#dfe9d6] via-[#fbf8f2] to-[#f4d7d7]" />}
          <div className="absolute inset-6 border border-white/70" />
        </div>
      </section>
      <main className="mx-auto max-w-5xl px-5 py-14">
        {(data?.ceremony || data?.reception) && (
          <section className="grid gap-4 md:grid-cols-2">
            {data?.ceremony && <div className="border border-[#d8cfc0] bg-white/60 p-7"><p className="mb-3 text-xs uppercase tracking-[0.25em]" style={{ color: primaryColor }}>Ceremony</p><p className="whitespace-pre-line leading-8 text-[#6b625a]">{data.ceremony}</p></div>}
            {data?.reception && <div className="border border-[#d8cfc0] bg-white/60 p-7"><p className="mb-3 text-xs uppercase tracking-[0.25em]" style={{ color: secondaryColor }}>Reception</p><p className="whitespace-pre-line leading-8 text-[#6b625a]">{data.reception}</p></div>}
          </section>
        )}
        {story && (
          <section className="py-16 text-center">
            <p className="mb-5 text-xs uppercase tracking-[0.3em]" style={{ color: secondaryColor }}>Our Story</p>
            <p className="mx-auto max-w-3xl text-2xl leading-10 text-[#4f463f]">{story}</p>
          </section>
        )}
        {gallery.length > 0 && <section className="pb-14"><GalleryLightbox images={gallery} imageClassName="h-72 w-full object-cover object-top" /></section>}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((item) => {
            const Icon = item.icon;
            return <button key={item.label} onClick={() => window.open(item.url, '_blank')} className="border border-[#d8cfc0] bg-white/70 p-6 text-center transition hover:bg-white"><Icon className="mx-auto mb-5 h-6 w-6" style={{ color: primaryColor }} /><span className="text-xs uppercase tracking-[0.18em]">{item.label}</span></button>;
          })}
          {enableWishlistButton && wishlists?.[0]?.shareLink && <button onClick={() => window.open(`/${wishlists[0].shareLink}`, '_blank')} className="border border-[#d8cfc0] bg-white/70 p-6 text-center transition hover:bg-white"><Heart className="mx-auto mb-5 h-6 w-6" style={{ color: secondaryColor }} /><span className="text-xs uppercase tracking-[0.18em]">Wishlists</span></button>}
          {showWellWishes && <button onClick={() => window.open(`/gift/${shareLink}#wishes`, '_blank')} className="border border-[#d8cfc0] bg-white/70 p-6 text-center transition hover:bg-white"><MessageSquareHeart className="mx-auto mb-5 h-6 w-6" style={{ color: secondaryColor }} /><span className="text-xs uppercase tracking-[0.18em]">Well Wishes</span></button>}
        </section>
      </main>
    </div>
  );
};
