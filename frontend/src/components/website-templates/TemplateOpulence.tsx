import { Button } from '../ui/button';
import { Camera, Crown, Gem, Gift, Heart, MapPin, MessageSquareHeart, ShoppingBag, Users } from 'lucide-react';
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

export const TemplateOpulence = ({
  title: propTitle,
  date: propDate,
  venue: propVenue,
  story: propStory,
  shareLink: propShareLink,
  picture: propPicture,
  primaryColor: propPrimaryColor = '#201018',
  secondaryColor: propSecondaryColor = '#d7b46a',
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
  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Date to be announced';

  const actions = [
    { label: 'RSVP', icon: Users, url: `/gift/${shareLink}` },
    { label: 'Asoebi', icon: ShoppingBag, url: `/gift/${shareLink}` },
    { label: 'Cash Gifts', icon: Gift, url: `/gift/${shareLink}` },
    { label: 'Photobook', icon: Camera, url: `/qr-gift/${shareLink}` },
  ];

  return (
    <div className="min-h-screen bg-[#120c10] text-[#fff7e6]" style={{ fontFamily }}>
      <section className="relative min-h-screen overflow-hidden p-4 md:p-8">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(215,180,106,.22),transparent_32%,rgba(127,29,29,.28)),radial-gradient(circle_at_80%_20%,rgba(255,255,255,.12),transparent_24%)]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden border border-[#d7b46a]/35 lg:grid-cols-[1fr_.9fr]">
          <div className="flex flex-col justify-between p-8 md:p-14">

            <div className="py-12">
              <p className="mb-6 text-sm uppercase tracking-[0.28em]" style={{ color: secondaryColor }}>{data?.heroSubtitle || 'A black tie celebration'}</p>
              <h1 className="text-5xl font-semibold leading-none md:text-7xl lg:text-8xl">{heroName}</h1>
              <div className="mt-10 grid gap-4 text-base leading-7 text-[#fff7e6]/75">
                <p>{formattedDate}</p>
                <p className="flex gap-3"><MapPin className="mt-1 h-5 w-5 shrink-0" style={{ color: secondaryColor }} />{venue || 'Venue to be announced'}</p>
              </div>
            </div>
            <Button className="w-fit rounded-none border border-[#d7b46a] bg-transparent px-12 py-7 text-sm uppercase tracking-[0.22em] text-[#fff7e6] hover:bg-[#d7b46a] hover:text-[#120c10]" onClick={() => window.open(`/gift/${shareLink}`, '_blank')}>
              RSVP
            </Button>
          </div>
          <div className="relative min-h-[560px]">
            {picture ? <img src={picture} alt="" className="absolute inset-0 h-full w-full object-cover object-top" /> : <div className="absolute inset-0 bg-gradient-to-br from-[#3a1725] via-[#120c10] to-[#d7b46a]" />}
            <div className="absolute inset-0 bg-gradient-to-t from-[#120c10]/80 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 border border-[#d7b46a]/35 bg-[#120c10]/85 p-6 backdrop-blur">
              <Gem className="mb-5 h-8 w-8" style={{ color: secondaryColor }} />
              <div className="grid gap-5 text-sm leading-6 md:grid-cols-2">
                <p><span className="block text-xs uppercase tracking-[0.22em]" style={{ color: secondaryColor }}>Ceremony</span>{data?.ceremony || 'Details coming soon'}</p>
                <p><span className="block text-xs uppercase tracking-[0.22em]" style={{ color: secondaryColor }}>Reception</span>{data?.reception || 'An elegant evening follows'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <main className="mx-auto max-w-7xl px-5 py-20">
        {story && <section className="grid gap-8 md:grid-cols-[.6fr_1.4fr]"><h2 className="text-4xl font-semibold">Our Story</h2><p className="text-xl leading-10 text-[#fff7e6]/70">{story}</p></section>}
        {gallery.length > 0 && <section className="mt-20"><h2 className="mb-8 text-4xl font-semibold">Gallery</h2><GalleryLightbox images={gallery} imageClassName="h-80 w-full object-cover object-top" /></section>}
        <section className="mt-20 grid gap-px bg-[#d7b46a]/25 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((item) => {
            const Icon = item.icon;
            return <button key={item.label} onClick={() => window.open(item.url, '_blank')} className="bg-[#120c10] p-8 text-left transition hover:bg-[#1f151b]"><Icon className="mb-10 h-8 w-8" style={{ color: secondaryColor }} /><span className="text-sm uppercase tracking-[0.18em]">{item.label}</span></button>;
          })}
          {enableWishlistButton && wishlists?.[0]?.shareLink && <button onClick={() => window.open(`/${wishlists[0].shareLink}`, '_blank')} className="bg-[#120c10] p-8 text-left transition hover:bg-[#1f151b]"><Heart className="mb-10 h-8 w-8" style={{ color: secondaryColor }} /><span className="text-sm uppercase tracking-[0.18em]">Wishlists</span></button>}
          {showWellWishes && <button onClick={() => window.open(`/gift/${shareLink}#wishes`, '_blank')} className="bg-[#120c10] p-8 text-left transition hover:bg-[#1f151b]"><MessageSquareHeart className="mb-10 h-8 w-8" style={{ color: secondaryColor }} /><span className="text-sm uppercase tracking-[0.18em]">Well Wishes</span></button>}
        </section>
      </main>
    </div>
  );
};
