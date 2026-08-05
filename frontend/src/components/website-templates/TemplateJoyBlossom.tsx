import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import {
  CalendarDays, Heart, Gift, MapPin, Clock, Hotel,
  ChevronDown, MessageCircleQuestion, Flower2, Users,
  Package, BookOpen, Camera, MessageSquareHeart,
  Sparkles, Church, Coffee, Music, UtensilsCrossed
} from 'lucide-react';

interface ScheduleItem {
  time: string;
  title: string;
  place?: string;
  description?: string;
  icon?: React.ReactNode;
}
interface FaqItem { q: string; a: string; }

interface JoyTemplateProps {
  title?: string;
  date?: string;
  venue?: string;
  story?: string;
  picture?: string;
  shareLink?: string;
  wishlists?: { shareLink: string }[];
  coupleName1?: string;
  coupleName2?: string;
  showCountdown?: boolean;
  schedule?: ScheduleItem[];
  faq?: FaqItem[];
  showRSVP?: boolean;
  showAsoebi?: boolean;
  showCashGift?: boolean;
  showWishlist?: boolean;
  showGuestbook?: boolean;
  guestbookNote?: string;
  theme?: { primaryColor?: string; secondaryColor?: string; accentColor?: string; fontFamily?: string; };
  onRSVP?: () => void;
  data?: {
    coupleNames?: string;
    theme?: { primaryColor?: string; secondaryColor?: string; accentColor?: string; fontFamily?: string; };
    [key: string]: any;
  };
}

const fmt = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

// ── Countdown with circular progress ──
const CountdownRing = ({ date, accent }: { date?: string; accent: string }) => {
  const target = date ? new Date(date).getTime() : 0;
  const compute = () => {
    const diff = target - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, done: true };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      done: false,
    };
  };
  const [t, setT] = useState(compute());
  useEffect(() => {
    const id = setInterval(() => setT(compute()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (t.done) return null;

  const items = [
    { label: 'Days', value: t.d },
    { label: 'Hours', value: t.h },
    { label: 'Mins', value: t.m },
    { label: 'Secs', value: t.s },
  ];

  return (
    <div className="flex items-center justify-center gap-6 md:gap-10">
      {items.map((item) => {
        const radius = 32;
        const circumference = 2 * Math.PI * radius;
        // Each unit represents 1 second/minute/hour/day – we just show a static ring for style
        // We'll use a simple stroke dash for a "progress" effect (optional)
        return (
          <div key={item.label} className="relative flex flex-col items-center">
            <svg className="w-20 h-20 md:w-24 md:h-24 -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                fill="none"
                stroke="#f0e6ed"
                strokeWidth="4"
              />
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                fill="none"
                stroke={accent}
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * 0.3} // decorative offset
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.3s' }}
              />
            </svg>
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl md:text-3xl font-bold" style={{ color: accent }}>
              {String(item.value).padStart(2, '0')}
            </span>
            <span className="mt-2 text-[10px] tracking-[0.2em] uppercase text-gray-400">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ── Scroll reveal hook ──
const useScrollReveal = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
};

// ── Main Component ──
export const TemplateJoyBlossom = ({
  title: propTitle,
  date: propDate,
  venue: propVenue,
  story: propStory,
  picture: propPicture,
  shareLink = '',
  wishlists,
  coupleName1,
  coupleName2,
  showCountdown = true,
  schedule = [],
  faq = [],
  theme = {},
  data,
  onRSVP,
  showRSVP = true,
  showAsoebi = false,
  showCashGift = true,
  showWishlist = false,
  showGuestbook = true,
  guestbookNote,
}: JoyTemplateProps) => {
  useScrollReveal();

  const resolvedTheme = theme || data?.theme || {};
  const primary = resolvedTheme.primaryColor || '#831843';
  const secondary = resolvedTheme.secondaryColor || '#db2777';
  const accent = resolvedTheme.accentColor || '#f59e0b';
  const fontFamily = resolvedTheme.fontFamily || "'Cormorant Garamond', serif";

  let resolvedCoupleName1 = coupleName1;
  let resolvedCoupleName2 = coupleName2;
  if (!resolvedCoupleName1 && !resolvedCoupleName2 && data?.coupleNames) {
    const parts = data.coupleNames.split(' & ');
    resolvedCoupleName1 = parts[0] || '';
    resolvedCoupleName2 = parts[1] || '';
  }
  const names =
    resolvedCoupleName1 && resolvedCoupleName2
      ? `${resolvedCoupleName1} & ${resolvedCoupleName2}`
      : propTitle || 'Our Celebration';

  const picture = propPicture;

  const glance = [
    propDate && { icon: <CalendarDays className="w-5 h-5" />, label: 'Date', value: fmt(propDate) },
    propVenue && { icon: <MapPin className="w-5 h-5" />, label: 'Venue', value: propVenue },
    schedule[0]?.time && {
      icon: <Clock className="w-5 h-5" />,
      label: 'Time',
      value: schedule[0].time,
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  const actions = [
    { icon: <Users className="w-5 h-5" />, label: 'RSVP', onClick: onRSVP },
    {
      icon: <Package className="w-5 h-5" />,
      label: 'Asoebi',
      onClick: () => window.open(`/gift/${shareLink}`, '_blank'),
    },
    {
      icon: <Gift className="w-5 h-5" />,
      label: 'Cash Gifts',
      onClick: () => window.open(`/gift/${shareLink}`, '_blank'),
    },
    {
      icon: <Camera className="w-5 h-5" />,
      label: 'Photobook',
      onClick: () => window.open(`/qr-gift/${shareLink}`, '_blank'),
    },
    {
      icon: <Heart className="w-5 h-5" />,
      label: 'Wishlists',
      onClick: wishlists?.[0]?.shareLink
        ? () => window.open(`/${wishlists[0].shareLink}`, '_blank')
        : () => window.open(`/gift/${shareLink}`, '_blank'),
    },
    {
      icon: <MessageSquareHeart className="w-5 h-5" />,
      label: 'Well Wishes',
      onClick: () => window.open(`/gift/${shareLink}#wishes`, '_blank'),
    },
  ];

  // Only show actions that are enabled
  const visibleActions = actions.filter((_, i) => {
    if (i === 0) return showRSVP;
    if (i === 1) return showAsoebi;
    if (i === 2) return showCashGift;
    if (i === 3) return true; // Photobook always visible
    if (i === 4) return showWishlist;
    if (i === 5) return showGuestbook;
    return true;
  });

  return (
    <div className="min-h-screen" style={{ fontFamily, color: primary, background: '#fffbf8' }}>
      {/* Global styles for reveal animations */}
      <style>{`
        .reveal { opacity: 0; transform: translateY(28px); transition: all 0.8s cubic-bezier(0.2, 0.9, 0.3, 1); }
        .reveal.delay-1 { transition-delay: 0.1s; }
        .reveal.delay-2 { transition-delay: 0.2s; }
        .reveal.delay-3 { transition-delay: 0.3s; }
        .reveal.delay-4 { transition-delay: 0.4s; }
        .floral-bg { background-image: radial-gradient(circle at 10% 20%, rgba(255,255,255,0.1) 0%, transparent 30%), radial-gradient(circle at 90% 80%, rgba(255,255,255,0.08) 0%, transparent 40%); }
        .shadow-soft { box-shadow: 0 8px 32px rgba(0,0,0,0.05); }
        .shadow-elevated { box-shadow: 0 20px 60px rgba(0,0,0,0.08); }
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
      `}</style>

      {/* ─── Cover ─── */}
      <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          {picture ? (
            <>
               <img src={picture} alt="" className="w-full h-full object-cover object-top" />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(180deg, ${primary}30 0%, ${primary}80 100%)`,
                }}
              />
            </>
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `radial-gradient(ellipse at 30% 20%, ${secondary}20, transparent 60%),
                             radial-gradient(ellipse at 70% 80%, ${accent}20, transparent 60%),
                             #fce4ec`,
              }}
            />
          )}
          {/* Decorative floating elements */}
          <div className="absolute top-10 left-10 text-white/20">
            <Flower2 className="w-20 h-20" />
          </div>
          <div className="absolute bottom-20 right-10 text-white/15 rotate-45">
            <Flower2 className="w-16 h-16" />
          </div>
        </div>

        <div className="relative z-10 text-center px-6 py-24 max-w-4xl mx-auto text-white">
          <div className="reveal delay-1">
            <Sparkles className="w-8 h-8 mx-auto mb-6 text-accent" style={{ color: accent }} />
          </div>
          <p className="reveal delay-1 text-[10px] md:text-xs tracking-[0.4em] uppercase mb-8 opacity-80">
            Together with their families
          </p>
          <h1 className="reveal delay-2 text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.1]">
            {resolvedCoupleName1 && <span>{resolvedCoupleName1}</span>}
            <span className="block text-4xl md:text-6xl font-light my-3" style={{ color: accent }}>
              &amp;
            </span>
            {resolvedCoupleName2 && <span>{resolvedCoupleName2}</span>}
            {!resolvedCoupleName1 && !resolvedCoupleName2 && names}
          </h1>
          {propDate && (
            <p className="reveal delay-3 text-lg md:text-2xl font-light tracking-wide mt-10">
              {fmt(propDate)}
            </p>
          )}
          {propVenue && (
            <p className="reveal delay-3 flex items-center justify-center gap-2 text-sm md:text-base opacity-80 mt-2">
              <MapPin className="w-4 h-4" /> {propVenue}
            </p>
          )}
          <div className="reveal delay-4 mt-12 flex justify-center">
            <Button
              size="lg"
              className="rounded-full px-10 py-6 text-sm tracking-[0.2em] uppercase shadow-lg hover:shadow-xl transition-all duration-300"
              style={{ backgroundColor: accent, color: '#fff' }}
              onClick={onRSVP}
            >
              RSVP Now
            </Button>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce opacity-60">
          <ChevronDown className="w-6 h-6 text-white" />
        </div>
      </section>

      {/* ─── Countdown ─── */}
      {showCountdown && propDate && (
        <section className="relative py-12 px-6 overflow-hidden">
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, #fffbf8 0%, ${secondary}08 100%)` }} />
          <div className="relative max-w-4xl mx-auto text-center">
            <Flower2 className="w-8 h-8 mx-auto mb-4" style={{ color: secondary }} />
            <CountdownRing date={propDate} accent={secondary} />
          </div>
        </section>
      )}

      {/* ─── At a Glance ─── */}
      {glance.length > 0 && (
        <section className="py-8 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
            {glance.map((g, i) => (
              <div
                key={i}
                className="reveal delay-1 text-center p-6 rounded-3xl bg-white shadow-soft hover:shadow-elevated transition-shadow duration-300"
                style={{ borderTop: `4px solid ${accent}` }}
              >
                <div className="flex justify-center mb-4" style={{ color: secondary }}>
                  {g.icon}
                </div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-1">
                  {g.label}
                </p>
                <p className="text-base font-medium leading-snug">{g.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {schedule.length > 0 && (
        <section id="details" className="py-12 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              {schedule.map((item, i) => {
                const Icon = item.icon || (() => {
                  if (item.title.toLowerCase().includes('ceremony')) return Church;
                  if (item.title.toLowerCase().includes('cocktail')) return Coffee;
                  if (item.title.toLowerCase().includes('reception')) return Music;
                  if (item.title.toLowerCase().includes('dinner')) return UtensilsCrossed;
                  return Clock;
                })();
                return (
                  <div key={i} className="relative pl-10 reveal">
                    <div
                      className="absolute left-0 top-2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${accent}20`, color: accent }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {i < schedule.length - 1 && (
                      <div
                        className="absolute left-[15px] top-10 bottom-[-1.5rem] w-0.5"
                        style={{ backgroundColor: `${secondary}20` }}
                      />
                    )}
                    <p className="text-sm font-bold tracking-wide" style={{ color: secondary }}>
                      {item.time}
                    </p>
                    <h4 className="text-2xl font-semibold mt-1">{item.title}</h4>
                    {item.place && (
                      <p className="text-sm flex items-center gap-1.5 mt-2 opacity-70">
                        <MapPin className="w-3.5 h-3.5" />
                        {item.place}
                      </p>
                    )}
                    {item.description && (
                      <p className="text-sm mt-2 leading-relaxed opacity-70">{item.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── Story ─── */}
      {propStory && (
        <section
          id="story"
          className="py-12 px-6 text-center relative overflow-hidden"
          style={{ background: `${secondary}08` }}
        >
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-4 left-4 text-8xl opacity-10" style={{ color: secondary }}>
              &ldquo;
            </div>
            <div className="absolute bottom-4 right-4 text-8xl opacity-10" style={{ color: secondary }}>
              &rdquo;
            </div>
          </div>
          <div className="max-w-2xl mx-auto relative z-10">
            <Flower2 className="w-7 h-7 mx-auto mb-4" style={{ color: accent }} />
            <p className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: secondary }}>
              Our Story
            </p>
            <h3 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              A Love Written in Time
            </h3>
            <p className="text-lg md:text-2xl leading-relaxed font-light" style={{ opacity: 0.85 }}>
              {propStory}
            </p>
          </div>
        </section>
      )}

      {/* ─── Well Wishes ─── */}
      {showGuestbook && (
        <section id="wishes" className="py-12 px-6">
          <div className="max-w-2xl mx-auto text-center bg-white/60 backdrop-blur-sm rounded-4xl shadow-soft p-8 md:p-10 border border-white/50">
            <div className="relative inline-block mx-auto mb-6">
              <BookOpen className="w-10 h-10" style={{ color: accent }} />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent/20 animate-pulse" />
            </div>
            <p className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: secondary }}>
              Well Wishes
            </p>
            <h3 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Leave Us a Note</h3>
            <p className="mb-6 opacity-75 max-w-sm mx-auto">
              {guestbookNote ||
                'We would love to hear from you. Send us your warmest wishes!'}
            </p>
            <Button
              size="lg"
              className="rounded-full px-8 py-5 text-sm tracking-[0.2em] uppercase shadow-md hover:shadow-lg transition-all"
              style={{ backgroundColor: accent, color: '#fff' }}
              onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
            >
              <Heart className="w-4 h-4 mr-2" /> Write a Wish
            </Button>
          </div>
        </section>
      )}

      {/* ─── Actions ─── */}
      {visibleActions.length > 0 && (
        <section
          className="py-12 px-6 text-center relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${primary}, ${primary}dd)`, color: '#fff' }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 text-white">
              <Flower2 className="w-32 h-32" />
            </div>
            <div className="absolute bottom-10 right-10 text-white rotate-12">
              <Flower2 className="w-24 h-24" />
            </div>
          </div>
          <div className="max-w-5xl mx-auto relative z-10">
            <h3 className="text-4xl md:text-5xl font-bold mb-4">Join the Celebration</h3>
            <p className="font-light opacity-80 mb-8 max-w-xl mx-auto">
              We can't wait to celebrate with you. Choose how you'd like to take part.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {visibleActions.map((a, i) => (
                <button
                  key={i}
                  onClick={a.onClick}
                  className="group flex flex-col items-center gap-3 py-8 px-4 rounded-3xl bg-white/15 backdrop-blur-md border border-white/20 hover:bg-white/25 hover:border-white/40 transition-all duration-500 hover:scale-105 hover:-translate-y-1"
                >
                  <span className="text-white group-hover:scale-110 transition-transform duration-300">
                    {a.icon}
                  </span>
                  <span className="text-sm tracking-[0.15em] font-bold uppercase">
                    {a.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── FAQ ─── */}
      {faq.length > 0 && (
        <section className="py-12 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <Flower2 className="w-6 h-6 mx-auto mb-4" style={{ color: accent }} />
              <p className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: secondary }}>
                Good to know
              </p>
              <h3 className="text-4xl md:text-5xl font-bold tracking-tight">
                Frequently Asked
              </h3>
            </div>
            <div className="space-y-4">
              {faq.map((f, i) => (
                <details
                  key={i}
                  className="group bg-white rounded-2xl shadow-soft overflow-hidden transition-all duration-300 hover:shadow-elevated"
                >
                  <summary className="flex items-center justify-between cursor-pointer p-6 font-semibold">
                    <span className="flex items-center gap-3">
                      <MessageCircleQuestion className="w-4 h-4 flex-shrink-0" style={{ color: secondary }} />
                      {f.q}
                    </span>
                    <ChevronDown
                      className="w-4 h-4 transition-transform duration-300 group-open:rotate-180"
                      style={{ color: secondary }}
                    />
                  </summary>
                  <div className="px-6 pb-6 pt-0 text-sm leading-relaxed opacity-80 border-t border-gray-100/50">
                    {f.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
       )}
     </div>
   );
 };