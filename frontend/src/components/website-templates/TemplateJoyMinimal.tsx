import React from 'react';
import { Button } from '../ui/button';
import {
  CalendarDays, Heart, Gift, MapPin, Clock, Plane, Hotel,
  ChevronDown, MessageCircleQuestion, Sparkles, ArrowRight, Camera,
  Users, Package, BookOpen
} from 'lucide-react';

interface ScheduleItem { time: string; title: string; place?: string; description?: string; }
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
  // Conditional actions (only shown if enabled on the event)
  showRSVP?: boolean;
  showAsoebi?: boolean;
  showCashGift?: boolean;
  showWishlist?: boolean;
  showGuestbook?: boolean;
  guestbookNote?: string;
  theme?: { primaryColor?: string; secondaryColor?: string; accentColor?: string; fontFamily?: string; };
  onRSVP?: () => void;
}

const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';

const Countdown = ({ date, accent }: { date?: string; accent: string }) => {
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
  const [t, setT] = React.useState(compute());
  React.useEffect(() => { const id = setInterval(() => setT(compute()), 1000); return () => clearInterval(id); }, [target]);
  if (t.done) return null;
  const boxes = [{ label: 'Days', v: t.d }, { label: 'Hours', v: t.h }, { label: 'Mins', v: t.m }, { label: 'Secs', v: t.s }];
  return (
    <div className="flex items-center justify-center gap-3 md:gap-5">
      {boxes.map(b => (
        <div key={b.label} className="text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-bold tabular-nums"
            style={{ backgroundColor: accent, color: '#fff', boxShadow: `0 10px 30px ${accent}40` }}>
            {b.v}
          </div>
          <span className="block mt-2 text-[10px] tracking-[0.3em] uppercase text-gray-400">{b.label}</span>
        </div>
      ))}
    </div>
  );
};

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

export const TemplateJoyMinimal = ({
  title: propTitle, date: propDate, venue: propVenue, story: propStory,
  picture: propPicture, shareLink = '', wishlists,
  coupleName1, coupleName2, showCountdown = true,
  schedule = [], faq = [], theme = {}, onRSVP,
  showRSVP = true, showAsoebi = false, showCashGift = true, showWishlist = false,
  showGuestbook = true, guestbookNote
}: JoyTemplateProps) => {
  const primary = theme.primaryColor || '#1c1917';
  const secondary = theme.secondaryColor || '#0d9488';
  const accent = theme.accentColor || '#ea580c';
  const fontFamily = theme.fontFamily || 'Georgia, serif';
  const names = (coupleName1 && coupleName2) ? `${coupleName1} & ${coupleName2}` : (propTitle || 'Our Celebration');
  const picture = propPicture;
  const firstEvent = schedule[0];

  const glance = [
    propDate && { icon: <CalendarDays className="w-5 h-5" />, label: 'Date', value: fmt(propDate) },
    propVenue && { icon: <MapPin className="w-5 h-5" />, label: 'Venue', value: propVenue },
    firstEvent?.time && { icon: <Clock className="w-5 h-5" />, label: firstEvent.title || 'Time', value: firstEvent.time },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  const actions = [
    showRSVP && { icon: <Users className="w-5 h-5" />, label: 'RSVP', onClick: onRSVP },
    showAsoebi && { icon: <Package className="w-5 h-5" />, label: 'Asoebi', onClick: () => window.open(`/gift/${shareLink}`, '_blank') },
    showCashGift && { icon: <Gift className="w-5 h-5" />, label: 'Cash Gifts', onClick: () => window.open(`/gift/${shareLink}`, '_blank') },
    showWishlist && wishlists && wishlists.length > 0 && wishlists[0].shareLink &&
      { icon: <Heart className="w-5 h-5" />, label: 'Wishlists', onClick: () => window.open(`/${wishlists[0].shareLink}`, '_blank') },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; onClick?: () => void }[];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily, color: primary }}>
      <style>{`@keyframes joyUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}@keyframes joyFade{from{opacity:0}to{opacity:1}}
        .joy-anim{animation:joyUp .9s cubic-bezier(.2,.7,.2,1) both}.joy-anim2{animation:joyUp 1s .15s cubic-bezier(.2,.7,.2,1) both}.joy-fade{animation:joyFade 1.2s both}`}</style>

      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-semibold text-sm tracking-[0.25em] uppercase" style={{ color: secondary }}>{names}</span>
          <nav className="hidden md:flex gap-8 text-xs tracking-[0.18em] uppercase text-gray-500">
            <button onClick={() => scrollTo('details')} className="hover:text-primary transition-colors">Details</button>
            <button onClick={() => scrollTo('story')} className="hover:text-primary transition-colors">Story</button>
            <button onClick={() => scrollTo('wishes')} className="hover:text-primary transition-colors">Wishes</button>
          </nav>
          {showRSVP && <Button size="sm" className="rounded-full px-6 text-xs tracking-[0.18em] uppercase" style={{ backgroundColor: secondary, color: '#fff' }} onClick={onRSVP}>RSVP</Button>}
        </div>
      </header>

      {/* Cover */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
        {picture ? (
          <>
            <img src={picture} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${primary}55 0%, ${primary}d9 100%)` }} />
          </>
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${secondary}1f, ${accent}1f)` }} />
        )}
        <div className="relative z-10 text-center px-6 py-28 max-w-4xl mx-auto" style={{ color: picture ? '#fff' : primary }}>
          <p className="joy-fade text-[11px] md:text-xs tracking-[0.45em] uppercase mb-8 opacity-85">You're invited to celebrate</p>
          <h1 className="joy-anim text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.05]">{names}</h1>
          <div className="joy-anim2 flex items-center justify-center gap-4 mb-10">
            <span className="h-px w-14" style={{ backgroundColor: accent }} />
            <Sparkles className="w-4 h-4" style={{ color: accent }} />
            <span className="h-px w-14" style={{ backgroundColor: accent }} />
          </div>
          {propDate && <p className="text-lg md:text-2xl font-light tracking-wide mb-3">{fmt(propDate)}</p>}
          {propVenue && <p className="flex items-center justify-center gap-2 text-sm md:text-base opacity-85"><MapPin className="w-4 h-4" /> {propVenue}</p>}
          <div className="mt-12 flex justify-center">
            <Button size="lg" className="rounded-full px-10 py-6 text-sm tracking-[0.2em] uppercase" style={{ backgroundColor: accent, color: '#fff' }} onClick={onRSVP}>RSVP Now</Button>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-60"><ChevronDown className="w-6 h-6" style={{ color: picture ? '#fff' : primary }} /></div>
      </section>

      {/* Countdown */}
      {showCountdown && (
        <section className="py-16 px-6 bg-stone-50">
          <p className="text-center text-xs tracking-[0.3em] uppercase mb-8 text-gray-400">Counting down to the big day</p>
          <Countdown date={propDate} accent={secondary} />
        </section>
      )}

      {/* At a Glance */}
      {glance.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5">
            {glance.map((g, i) => (
              <div key={i} className="text-center p-7 rounded-3xl border border-stone-100 hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-3" style={{ color: secondary }}>{g.icon}</div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-1">{g.label}</p>
                <p className="text-base font-medium leading-snug">{g.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Details / Schedule */}
      <section id="details" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] tracking-[0.3em] uppercase mb-3" style={{ color: secondary }}>Schedule</p>
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight">The Day's Events</h3>
          </div>
          {schedule.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-5">
              {schedule.map((item, i) => (
                <div key={i} className="group p-7 rounded-3xl border border-stone-100 hover:border-stone-200 hover:shadow-xl transition-all duration-300 bg-white">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${secondary}15`, color: secondary }}>{item.time}</span>
                    {item.place && <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{item.place}</span>}
                  </div>
                  <h4 className="text-xl md:text-2xl font-semibold">{item.title}</h4>
                  {item.description && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{item.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 text-sm">Add events in the Schedule tab to display them here.</div>
          )}
        </div>
      </section>

      {/* Story */}
      {propStory && (
        <section id="story" className="py-24 px-6 bg-stone-50">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[11px] tracking-[0.3em] uppercase mb-3" style={{ color: secondary }}>Our Story</p>
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-10">How We Met</h3>
            <p className="text-lg md:text-2xl leading-relaxed font-light text-gray-700">{propStory}</p>
          </div>
        </section>
      )}

      {/* Well Wishes / Guestbook */}
      {showGuestbook && (
        <section id="wishes" className="py-24 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-5" style={{ color: accent }} />
            <p className="text-[11px] tracking-[0.3em] uppercase mb-3" style={{ color: secondary }}>Well Wishes</p>
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Leave Us a Note</h3>
            <p className="text-gray-600 mb-10">{guestbookNote || 'We would love to hear from you. Send us your warmest wishes!'}</p>
            <Button size="lg" className="rounded-full px-10 text-sm tracking-[0.2em] uppercase" style={{ backgroundColor: accent, color: '#fff' }} onClick={() => window.open(`/gift/${shareLink}`, '_blank')}>
              <Heart className="w-4 h-4 mr-2" /> Write a Wish
            </Button>
          </div>
        </section>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <section className="py-24 px-6 text-center" style={{ background: primary, color: '#fff' }}>
          <div className="max-w-2xl mx-auto">
            <h3 className="text-3xl md:text-5xl font-bold mb-4">Celebrate With Us</h3>
            <p className="opacity-70 mb-12 font-light text-lg">Your presence is the greatest gift. Here are a few ways to join in the joy.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {actions.map((a, i) => (
                <button key={i} onClick={a.onClick} className="flex flex-col items-center gap-3 py-10 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <span style={{ color: accent }}>{a.icon}</span>
                   <span className="text-xs tracking-[0.1em] font-bold">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faq.length > 0 && (
        <section className="py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-[11px] tracking-[0.3em] uppercase mb-3" style={{ color: secondary }}>Good to know</p>
              <h3 className="text-3xl md:text-5xl font-bold tracking-tight">FAQ</h3>
            </div>
            <div className="space-y-4">
              {faq.map((f, i) => (
                <details key={i} className="group bg-white rounded-2xl border border-stone-100 p-6">
                  <summary className="flex items-center justify-between cursor-pointer list-none font-semibold">
                    <span className="flex items-center gap-3"><MessageCircleQuestion className="w-4 h-4" style={{ color: secondary }} />{f.q}</span>
                    <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="py-14 text-center border-t border-stone-100">
        <p className="text-xs tracking-[0.3em] uppercase text-gray-400">{names} · {propDate ? new Date(propDate).getFullYear() : ''}</p>
      </footer>
    </div>
  );
};
