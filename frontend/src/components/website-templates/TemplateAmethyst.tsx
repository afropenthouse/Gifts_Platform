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

const ACTION_COPY: Record<string, { desc: string; descDisabled?: string }> = {
  'RSVP': { desc: 'Confirm your attendance' },
  'Buy Asoebi': { desc: 'Shop our wedding fabric' },
  'Cash Gifts': { desc: 'Support with a cash gift' },
  'Photobook': { desc: 'Browse our photo memory book' },
  'Wishlists': { desc: 'Pick a gift from our list', descDisabled: 'Wishlist coming soon' },
  'Well Wishes': { desc: 'Leave us a sweet note', descDisabled: 'Coming soon' },
};

// Paired by purpose, not picked at random: violet = guest interaction,
// orchid = financial support, rose = keepsakes. Two actions per color.
const ACTION_GROUP: Record<string, 'violet' | 'orchid' | 'rose'> = {
  'RSVP': 'violet',
  'Well Wishes': 'violet',
  'Buy Asoebi': 'orchid',
  'Cash Gifts': 'orchid',
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

export const TemplateAmethyst = ({
  title: propTitle,
  date: propDate,
  venue: propVenue,
  story: propStory,
  shareLink: propShareLink,
  picture: propPicture,
  primaryColor: propPrimaryColor = '#4a2a7a',
  secondaryColor: propSecondaryColor = '#e8d9ff',
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
  const fontFamily = data?.theme?.fontFamily || 'Georgia, serif';
  const heroName = data?.eventType === 'wedding' && data?.coupleNames ? data.coupleNames : title;
  const heroSubtitle = data?.heroSubtitle || story || '';

  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const allActions = [
    { label: 'RSVP', icon: Users, enabled: true, url: `/gift/${shareLink}` },
    { label: 'Buy Asoebi', icon: ShoppingBag, enabled: true, url: `/gift/${shareLink}` },
    { label: 'Cash Gifts', icon: Gift, enabled: true, url: `/gift/${shareLink}` },
    { label: 'Photobook', icon: Camera, enabled: true, url: `/qr-gift/${shareLink}` },
    { label: 'Wishlists', icon: Heart, enabled: !!(enableWishlistButton && wishlists?.[0]?.shareLink), url: wishlists?.[0]?.shareLink ? `/${wishlists[0].shareLink}` : `/gift/${shareLink}` },
    { label: 'Well Wishes', icon: MessageSquareHeart, enabled: !!showWellWishes, url: `/gift/${shareLink}#wishes` },
  ];

  const GROUP_HEX: Record<'violet' | 'orchid' | 'rose', string> = {
    violet: primaryColor,
    orchid: '#96428f',
    rose: '#b85c7c',
  };

  const ringStyleFor = (hex: string) => ({
    borderColor: hexToRgba(hex, 0.28),
    backgroundColor: hexToRgba(hex, 0.08),
  });

  const cardRing = ringStyleFor(primaryColor);

  return (
    <div className="min-h-screen bg-[#f8f4ff] text-[#2a1a4a]" style={{ fontFamily }}>
      {/* HERO — a floating glass card over the photo, so the photo actually stays visible */}
      <section className="relative min-h-[92vh] overflow-hidden">
        {picture ? (
          <img src={picture} alt={heroName} className="absolute inset-0 h-full w-full object-cover object-top" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#e8d9ff] via-[#f8f4ff] to-white" />
        )}
        {/* Strong, guaranteed-legible scrim — doesn't depend on how bright the photo is */}
        {picture && <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/85 via-black/45 to-transparent" />}

        <div
          className={`relative z-10 flex min-h-[92vh] px-6 md:px-14 ${
            picture ? 'flex-col justify-end pb-14 pt-32 md:pb-16' : 'items-center justify-center py-20 md:py-24'
          }`}
        >
          <div
            className={
              picture
                ? 'w-full max-w-2xl text-left'
                : 'w-full max-w-3xl border bg-white/90 px-8 py-14 text-center shadow-xl backdrop-blur-md md:px-16 md:py-16'
            }
            style={!picture ? { borderColor: hexToRgba(primaryColor, 0.18) } : undefined}
          >
            {/* Kicker: fixed tone in both modes — never depends on a possibly-light theme color */}
            <p
              className={`mb-5 text-xs font-bold uppercase tracking-[0.36em] ${picture ? 'text-white' : ''}`}
              style={!picture ? { color: primaryColor } : undefined}
            >
              {data?.heroTitle || 'Together with our families'}
            </p>

            {/* Headline: fixed ink / fixed white, never the raw theme color, so it always reads */}
            <h1
              className={`mb-6 text-5xl font-semibold leading-[1.05] tracking-tight drop-shadow-sm md:text-7xl ${
                picture ? 'text-white' : 'text-[#2a1a4a]'
              }`}
            >
              {heroName}
            </h1>
            <span className={`mb-8 block h-px w-16 ${picture ? '' : 'mx-auto'}`} style={{ backgroundColor: secondaryColor }} />

            {heroSubtitle && (
              <p className={`max-w-2xl text-lg leading-8 md:text-xl ${picture ? 'text-white/95' : 'mx-auto text-[#4a2a7a]'}`}>
                {heroSubtitle}
              </p>
            )}

            {(formattedDate || venue) && (
              <div
                className={`mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm uppercase tracking-[0.24em] ${
                  picture ? 'text-white/90' : 'justify-center text-[#4a2a7a]'
                }`}
              >
                {formattedDate && <span>{formattedDate}</span>}
                {formattedDate && venue && <span className="opacity-60">&middot;</span>}
                {venue && <span>{venue}</span>}
              </div>
            )}

            <Button
              size="lg"
              aria-label="RSVP to this event"
              className="group mt-10 inline-flex items-center gap-3 rounded-none px-10 py-7 text-sm font-bold uppercase tracking-[0.25em] text-white transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ backgroundColor: primaryColor, outlineColor: primaryColor }}
              onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
            >
              RSVP Now
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>

      <main className="px-6 py-16 md:px-12 md:py-24">
        {(formattedDate || venue) && (
          <section className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
            {formattedDate && (
              <div className="flex items-start gap-5 border border-purple-100 bg-white p-8 shadow-sm">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border" style={cardRing}>
                  <Calendar className="h-5 w-5" style={{ color: primaryColor }} />
                </span>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-[#9a6aca]">Date</p>
                  <p className="text-2xl leading-tight text-[#2a1a4a]">{formattedDate}</p>
                </div>
              </div>
            )}
            {venue && (
              <div className="flex items-start gap-5 border border-purple-100 bg-white p-8 shadow-sm md:col-span-2">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border" style={cardRing}>
                  <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
                </span>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-[#9a6aca]">Venue</p>
                  <p className="text-2xl leading-tight text-[#2a1a4a]">{venue}</p>
                </div>
              </div>
            )}
          </section>
        )}

        {(data?.ceremony || data?.reception) && (
          <section className="mx-auto mt-6 grid max-w-6xl gap-6 md:grid-cols-2">
            {data?.ceremony && (
              <div className="border-t-2 bg-[#f0e8ff] p-8 text-[#2a1a4a]" style={{ borderColor: GROUP_HEX.violet }}>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: GROUP_HEX.violet }}>Ceremony</p>
                <p className="text-lg leading-8">{data.ceremony}</p>
              </div>
            )}
            {data?.reception && (
              <div className="border-t-2 bg-[#f0e8ff] p-8 text-[#2a1a4a]" style={{ borderColor: GROUP_HEX.rose }}>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: GROUP_HEX.rose }}>Reception</p>
                <p className="text-lg leading-8">{data.reception}</p>
              </div>
            )}
          </section>
        )}

        {story && (
          <section className="mx-auto mt-20 max-w-4xl text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.35em] text-[#9a6aca]">Our Story</p>
            <span className="mx-auto mb-6 block h-px w-16" style={{ backgroundColor: secondaryColor }} />
            <p className="text-lg leading-10 text-[#4a2a7a] md:text-xl">{story}</p>
          </section>
        )}

        {gallery && gallery.length > 0 && (
          <section className="mx-auto mt-20 max-w-6xl">
            <h2 className="mb-8 text-center text-4xl font-semibold" style={{ color: primaryColor }}>Moments</h2>
            <GalleryLightbox images={gallery} imageClassName="w-full h-72 object-cover shadow-lg object-top" />
          </section>
        )}

        {/* ACTIONS — 2-column directory, paired by purpose, one color per pair */}
        <section className="mx-auto mt-20 max-w-6xl">
          <div className="mb-4 flex flex-col items-start justify-between gap-6 border-b border-purple-200 pb-8 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.32em] text-[#9a6aca]">Take part</p>
              <h2 className="text-5xl font-semibold" style={{ color: primaryColor }}>Celebrate With Us</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-14 sm:grid-cols-3 sm:gap-x-10">
            {allActions.map((item) => {
              const Icon = item.icon;
              const copy = ACTION_COPY[item.label] || { desc: '' };
              const accent = GROUP_HEX[ACTION_GROUP[item.label]];
              return (
                <button
                  key={item.label}
                  type="button"
                  aria-label={item.label}
                  disabled={!item.enabled}
                  onClick={() => item.enabled && window.open(item.url, '_blank')}
                  className={`group flex flex-col items-center gap-4 text-center focus-visible:outline-none ${
                    item.enabled ? '' : 'cursor-not-allowed opacity-45'
                  }`}
                >
                  <span
                    className="flex h-20 w-20 items-center justify-center rounded-full border transition-transform duration-300 group-hover:scale-110 group-focus-visible:scale-110"
                    style={ringStyleFor(accent)}
                  >
                    <Icon className="h-8 w-8" style={{ color: accent }} />
                  </span>
                  <span>
                    <span className="block text-lg font-semibold" style={{ color: primaryColor }}>{item.label}</span>
                    <span
                      className="mx-auto mt-1 block h-px w-0 transition-all duration-300 group-hover:w-8 group-focus-visible:w-8"
                      style={{ backgroundColor: accent }}
                    />
                    <span className="mt-2 block text-xs leading-5 text-[#7a5aaa]">
                      {item.enabled ? copy.desc : (copy.descDisabled || copy.desc)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};
