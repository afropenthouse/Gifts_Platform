import { Button } from '../ui/button';
import { CalendarDays, Camera, Gift, Heart, MapPin, MessageSquareHeart, ShoppingBag, Users } from 'lucide-react';
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

export const TemplateMeridian = ({
  title: propTitle,
  date: propDate,
  venue: propVenue,
  story: propStory,
  shareLink: propShareLink,
  picture: propPicture,
  primaryColor: propPrimaryColor = '#264653',
  secondaryColor: propSecondaryColor = '#e9c46a',
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
  const fontFamily = data?.theme?.fontFamily || 'Inter, system-ui, sans-serif';
  const heroName = data?.eventType === 'wedding' && data?.coupleNames ? data.coupleNames : title;
  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Date to be announced';

  const actions = [
    { label: 'RSVP', icon: Users, url: `/gift/${shareLink}` },
    { label: 'Asoebi', icon: ShoppingBag, url: `/gift/${shareLink}` },
    { label: 'Cash Gifts', icon: Gift, url: `/gift/${shareLink}` },
    { label: 'Photobook', icon: Camera, url: `/qr-gift/${shareLink}` },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7f6] text-[#182326]" style={{ fontFamily }}>
      <section className="grid min-h-screen lg:grid-cols-[420px_1fr]">
        <aside className="flex flex-col justify-between bg-[#182326] p-7 text-white md:p-10">
          <p className="text-xs uppercase tracking-[0.32em]" style={{ color: secondaryColor }}>{data?.heroSubtitle || 'A modern invitation'}</p>
          <div>
            <h1 className="text-5xl font-black leading-[0.95] md:text-6xl">{heroName}</h1>
            <div className="mt-9 space-y-5 text-sm leading-7 text-white/75">
              <p className="flex gap-3"><CalendarDays className="mt-1 h-5 w-5" style={{ color: secondaryColor }} />{formattedDate}</p>
              <p className="flex gap-3"><MapPin className="mt-1 h-5 w-5" style={{ color: secondaryColor }} />{venue || 'Venue to be announced'}</p>
            </div>
          </div>
          <Button className="rounded-none py-7 text-sm font-bold uppercase tracking-[0.2em]" style={{ backgroundColor: secondaryColor, color: primaryColor }} onClick={() => window.open(`/gift/${shareLink}`, '_blank')}>
            RSVP
          </Button>
        </aside>
        <div className="relative min-h-[70vh]">
          {picture ? <img src={picture} alt="" className="absolute inset-0 h-full w-full object-cover object-top" /> : <div className="absolute inset-0 bg-gradient-to-br from-[#264653] via-[#2a9d8f] to-[#e9c46a]" />}
          <div className="absolute inset-0 bg-gradient-to-t from-[#182326]/75 via-transparent to-transparent" />
          <div className="absolute bottom-8 left-6 right-6 grid gap-3 md:grid-cols-2">
            {data?.ceremony && <div className="bg-white/90 p-5 backdrop-blur"><p className="mb-2 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: primaryColor }}>Ceremony</p><p className="whitespace-pre-line text-sm leading-6 text-[#506064]">{data.ceremony}</p></div>}
            {data?.reception && <div className="bg-white/90 p-5 backdrop-blur"><p className="mb-2 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: primaryColor }}>Reception</p><p className="whitespace-pre-line text-sm leading-6 text-[#506064]">{data.reception}</p></div>}
          </div>
        </div>
      </section>
      <main className="mx-auto max-w-6xl px-5 py-16">
        {story && <section className="border-l-4 pl-7" style={{ borderColor: secondaryColor }}><h2 className="mb-5 text-3xl font-black">Our Story</h2><p className="max-w-4xl text-lg leading-9 text-[#506064]">{story}</p></section>}
        {gallery.length > 0 && <section className="mt-16"><h2 className="mb-6 text-3xl font-black">Gallery</h2><GalleryLightbox images={gallery} imageClassName="h-72 w-full object-cover object-top" /></section>}
        <section className="mt-16 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((item) => {
            const Icon = item.icon;
            return <button key={item.label} onClick={() => window.open(item.url, '_blank')} className="bg-white p-6 text-left transition hover:bg-[#182326] hover:text-white"><Icon className="mb-8 h-7 w-7" style={{ color: secondaryColor }} /><span className="text-sm font-black uppercase tracking-[0.16em]">{item.label}</span></button>;
          })}
          {enableWishlistButton && wishlists?.[0]?.shareLink && <button onClick={() => window.open(`/${wishlists[0].shareLink}`, '_blank')} className="bg-white p-6 text-left transition hover:bg-[#182326] hover:text-white"><Heart className="mb-8 h-7 w-7" style={{ color: secondaryColor }} /><span className="text-sm font-black uppercase tracking-[0.16em]">Wishlists</span></button>}
          {showWellWishes && <button onClick={() => window.open(`/gift/${shareLink}#wishes`, '_blank')} className="bg-white p-6 text-left transition hover:bg-[#182326] hover:text-white"><MessageSquareHeart className="mb-8 h-7 w-7" style={{ color: secondaryColor }} /><span className="text-sm font-black uppercase tracking-[0.16em]">Well Wishes</span></button>}
        </section>
      </main>
    </div>
  );
};
