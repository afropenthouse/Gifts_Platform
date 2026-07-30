import { Button } from '../ui/button';
import { ArrowRight, Calendar, Camera, Gift, Heart, MapPin, MessageSquareHeart, ShoppingBag, Users } from 'lucide-react';
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

const ACTION_COPY: Record<string, { desc: string; descDisabled?: string }> = {
  'RSVP': { desc: 'Confirm your attendance' },
  'Buy Asoebi': { desc: 'Shop our wedding fabric' },
  'Cash Gifts': { desc: 'Support with a cash gift' },
  'Photobook': { desc: 'Browse our photo memory book' },
  'Wishlists': { desc: 'Pick a gift from our list', descDisabled: 'Wishlist coming soon' },
  'Well Wishes': { desc: 'Leave us a sweet note', descDisabled: 'Coming soon' },
};

// Actions are grouped in pairs by what they're for, each pair sharing one accent.
// Navy = guest interaction, gold = financial support, rose = keepsakes.
const ACTION_GROUP: Record<string, 'navy' | 'gold' | 'rose'> = {
  'RSVP': 'navy',
  'Well Wishes': 'navy',
  'Buy Asoebi': 'gold',
  'Cash Gifts': 'gold',
  'Photobook': 'rose',
  'Wishlists': 'rose',
};

const hexToRgba = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

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
  const heroKicker = data?.eventType === 'wedding' ? 'The Wedding Of' : 'You Are Invited To';

  const allActions = [
    { label: 'RSVP', icon: Users, enabled: true, url: `/gift/${shareLink}` },
    { label: 'Buy Asoebi', icon: ShoppingBag, enabled: true, url: `/gift/${shareLink}` },
    { label: 'Cash Gifts', icon: Gift, enabled: true, url: `/gift/${shareLink}` },
    { label: 'Photobook', icon: Camera, enabled: true, url: `/qr-gift/${shareLink}` },
    { label: 'Wishlists', icon: Heart, enabled: !!(enableWishlistButton && wishlists?.[0]?.shareLink), url: wishlists?.[0]?.shareLink ? `/${wishlists[0].shareLink}` : `/gift/${shareLink}` },
    { label: 'Well Wishes', icon: MessageSquareHeart, enabled: !!showWellWishes, url: `/gift/${shareLink}#wishes` },
  ];

  const ringStyle = {
    borderColor: hexToRgba(primaryColor, 0.22),
    backgroundColor: hexToRgba(primaryColor, 0.06),
  };

  const GROUP_HEX: Record<'navy' | 'gold' | 'rose', string> = {
    navy: primaryColor,
    gold: '#b3894f',
    rose: '#a56b63',
  };

  const ringStyleFor = (hex: string) => ({
    borderColor: hexToRgba(hex, 0.28),
    backgroundColor: hexToRgba(hex, 0.08),
  });

  return (
    <div className="min-h-screen bg-[#eef3f9] text-[#0f1f3d]" style={{ fontFamily }}>
      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-14 md:px-10 md:py-20">
        <div
          className="pointer-events-none absolute -right-52 -top-52 h-[560px] w-[560px] rounded-full opacity-[0.12] blur-3xl"
          style={{ backgroundColor: primaryColor }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1" style={{ backgroundColor: primaryColor }} />

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.6fr] lg:gap-14">
          <div className="flex flex-col justify-center">
            <p className="mb-6 text-xs font-bold tracking-[0.36em]" style={{ color: primaryColor }}>
              {data?.heroSubtitle || 'An editorial invitation'}
            </p>
            <h1 className="max-w-5xl text-6xl font-semibold leading-[0.88] md:text-8xl lg:text-9xl" style={{ color: primaryColor }}>
              {heroName}
            </h1>
            <div className="mt-10 flex flex-wrap items-center gap-4 text-sm font-medium text-[#52627b]">
              <span className="h-px w-12 shrink-0" style={{ backgroundColor: primaryColor }} />
              <span>{formattedDate}</span>
              <span className="opacity-40">&middot;</span>
              <span>{venue || 'Venue to be announced'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="relative aspect-[4/5] w-full overflow-hidden shadow-lg">
              {picture ? (
                <img src={picture} alt={heroName} className="h-full w-full object-cover object-top" />
              ) : (
                <div
                  className="flex h-full w-full flex-col items-center justify-center gap-5 px-8 text-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="text-xs font-bold uppercase tracking-[0.32em]" style={{ color: secondaryColor }}>
                    {heroKicker}
                  </span>
                  <span className="text-3xl font-semibold leading-tight text-white">{heroName}</span>
                  <span className="h-px w-10" style={{ backgroundColor: secondaryColor }} />
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">
                    {formattedDate}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/45 to-transparent" />
            </div>

            <Button
              size="lg"
              aria-label="RSVP to this event"
              className="group flex w-full items-center justify-between rounded-none py-7 pl-8 pr-6 text-sm font-bold uppercase tracking-[0.25em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ backgroundColor: primaryColor, outlineColor: primaryColor }}
              onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
            >
              RSVP Now
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* DETAILS */}
      <section className="px-6 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-2">
          <div className="group flex items-start gap-5 bg-white p-8 shadow-sm transition-shadow duration-200 hover:shadow-md">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-transform duration-200 group-hover:scale-105"
              style={ringStyle}
            >
              <Calendar className="h-5 w-5" style={{ color: primaryColor }} />
            </span>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-[#52627b]">Date</p>
              <p className="text-2xl leading-tight">{formattedDate}</p>
            </div>
          </div>
          <div className="group flex items-start gap-5 bg-white p-8 shadow-sm transition-shadow duration-200 hover:shadow-md">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-transform duration-200 group-hover:scale-105"
              style={ringStyle}
            >
              <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
            </span>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-[#52627b]">Venue</p>
              <p className="text-2xl leading-tight">{venue || 'Venue to be announced'}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="px-6 py-20 md:px-10 md:py-24">
        {(data?.ceremony || data?.reception) && (
          <section className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2">
            {data?.ceremony && (
              <div className="bg-[#0f1f3d] p-8 text-white">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: secondaryColor }}>Ceremony</p>
                <p className="text-xl leading-8">{data.ceremony}</p>
              </div>
            )}
            {data?.reception && (
              <div className="bg-white p-8">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: primaryColor }}>Reception</p>
                <p className="text-xl leading-8 text-[#52627b]">{data.reception}</p>
              </div>
            )}
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

        {/* ACTIONS — editorial directory, not an icon grid */}
        <section className="mx-auto mt-24 max-w-7xl">
          <div className="mb-4 flex items-end justify-between gap-6 border-b border-[#b9c7dc] pb-8">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-[#52627b]">Take part</p>
              <h2 className="text-5xl font-semibold" style={{ color: primaryColor }}>Celebrate With Us</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 border-t border-[#b9c7dc] sm:grid-cols-2">
            {allActions.map((item, i) => {
              const Icon = item.icon;
              const copy = ACTION_COPY[item.label] || { desc: '' };
              const accent = GROUP_HEX[ACTION_GROUP[item.label]];
              const isLeftCol = i % 2 === 0;
              const isLastRow = i >= allActions.length - 2;
              return (
                <button
                  key={item.label}
                  type="button"
                  aria-label={item.label}
                  disabled={!item.enabled}
                  onClick={() => item.enabled && window.open(item.url, '_blank')}
                  className={`group flex items-center gap-5 border-[#b9c7dc] py-7 text-left transition-colors duration-200 sm:py-8 ${
                    isLastRow ? '' : 'border-b'
                  } ${isLeftCol ? 'sm:border-r sm:pr-8' : 'sm:pl-8'} ${
                    item.enabled ? 'hover:bg-white focus-visible:bg-white' : 'cursor-not-allowed opacity-50'
                  } focus-visible:outline-none`}
                >
                  <span
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border transition-transform duration-200 group-hover:scale-105"
                    style={ringStyleFor(accent)}
                  >
                    <Icon className="h-6 w-6" style={{ color: accent }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-2xl font-semibold" style={{ color: primaryColor }}>{item.label}</span>
                    <span className="mt-1 block text-sm text-[#52627b]">
                      {item.enabled ? copy.desc : (copy.descDisabled || copy.desc)}
                    </span>
                  </span>
                  {item.enabled && (
                    <ArrowRight
                      className="h-5 w-5 shrink-0 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                      style={{ color: accent }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};
