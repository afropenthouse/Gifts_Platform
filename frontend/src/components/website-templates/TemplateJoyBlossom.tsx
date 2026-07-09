import React from 'react';
import { Button } from '../ui/button';
import {
  CalendarDays, Heart, Gift, MapPin, Clock, Hotel,
  ChevronDown, MessageCircleQuestion, Flower2, Users, Package, BookOpen
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
  showRsvp?: boolean;
  showAsoebi?: boolean;
  showCashGift?: boolean;
  showWishlist?: boolean;
  showGuestbook?: boolean;
  guestbookNote?: string;
  theme?: { primaryColor?: string; secondaryColor?: string; accentColor?: string; fontFamily?: string; };
  onRsvp?: () => void;
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
          <div className="w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center text-xl md:text-3xl font-bold tabular-nums shadow-md"
            style={{ backgroundColor: '#fff', color: accent, border: `2px solid ${accent}40` }}>
            {b.v}
          </div>
          <span className="block mt-2 text-[10px] tracking-[0.3em] uppercase text-gray-400">{b.label}</span>
        </div>
      ))}
    </div>
  );
};

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

export const TemplateJoyBlossom = ({
  title: propTitle, date: propDate, venue: propVenue, story: propStory,
  picture: propPicture, shareLink = '', wishlists,
  coupleName1, coupleName2, showCountdown = true,
  schedule = [], faq = [], theme = {}, onRsvp,
  showRsvp = true, showAsoebi = false, showCashGift = true, showWishlist = false,
  showGuestbook = true, guestbookNote
}: JoyTemplateProps) => {
  const primary = theme.primaryColor || '#831843';
  const secondary = theme.secondaryColor || '#db2777';
  const accent = theme.accentColor || '#f59e0b';
  const fontFamily = theme.fontFamily || 'Cormorant Garamond, serif';
  const names = (coupleName1 && coupleName2) ? `${coupleName1} & ${coupleName2}` : (propTitle || 'Our Celebration');
  const picture = propPicture;

  const glance = [
    propDate && { icon: <CalendarDays className="w-5 h-5" />, label: 'Date', value: fmt(propDate) },
    propVenue && { icon: <MapPin className="w-5 h-5" />, label: 'Venue', value: propVenue },
    schedule[0]?.time && { icon: <Clock className="w-5 h-5" />, label: schedule[0].title || 'Time', value: schedule[0].time },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  const actions = [
    showRsvp && { icon: <Users className="w-5 h-5" />, label: 'RSVP', onClick: onRsvp },
    showAsoebi && { icon: <Package className="w-5 h-5" />, label: 'Asoebi', onClick: () => window.open(`/gift/${shareLink}`, '_blank') },
    showCashGift && { icon: <Gift className="w-5 h-5" />, label: 'Cash Gift', onClick: () => window.open(`/gift/${shareLink}`, '_blank') },
    showWishlist && wishlists && wishlists.length > 0 && wishlists[0].shareLink &&
      { icon: <Heart className="w-5 h-5" />, label: 'Wishlist', onClick: () => window.open(`/${wishlists[0].shareLink}`, '_blank') },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; onClick?: () => void }[];

  return (
    <div className="min-h-screen" style={{ fontFamily, color: primary, background: '#fff7fb' }}>
      <style>{`@keyframes blossomUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}@keyframes blossomFade{from{opacity:0}to{opacity:1}}
        .bl-up{animation:blossomUp 1s cubic-bezier(.2,.7,.2,1) both}.bl-up2{animation:blossomUp 1.1s .2s cubic-bezier(.2,.7,.2,1) both}.bl-fade{animation:blossomFade 1.3s both}`}</style>

      {/* Cover */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ background: `radial-gradient(60% 50% at 20% 15%, ${accent}26, transparent 60%), radial-gradient(60% 50% at 85% 80%, ${secondary}26, transparent 60%)` }} />
        {picture && (
          <div className="absolute inset-0">
            <img src={picture} alt="" className="w-full h-full object-cover opacity-95" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${primary}38, ${primary}b3)` }} />
          </div>
        )}
        <div className="relative z-10 text-center px-6 py-28 max-w-4xl mx-auto" style={{ color: picture ? '#fff' : primary }}>
          <Flower2 className="bl-fade w-9 h-9 mx-auto mb-7" style={{ color: accent }} />
          <p className="bl-fade text-[11px] md:text-xs tracking-[0.45em] uppercase mb-8 opacity-85">Together with their families</p>
          <h1 className="bl-up text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.08]">
            {coupleName1 && <span className="block">{coupleName1}</span>}
            <span className="text-3xl md:text-5xl font-light my-3 block" style={{ color: accent }}>&amp;</span>
            {coupleName2 && <span className="block">{coupleName2}</span>}
            {!coupleName1 && !coupleName2 && names}
          </h1>
          {propDate && <p className="bl-up2 text-lg md:text-2xl font-light tracking-wide mt-10 mb-3">{fmt(propDate)}</p>}
          {propVenue && <p className="bl-up2 flex items-center justify-center gap-2 text-sm md:text-base opacity-85"><MapPin className="w-4 h-4" /> {propVenue}</p>}
          <div className="mt-12 flex justify-center">
            <Button size="lg" className="rounded-full px-10 py-6 text-sm tracking-[0.2em] uppercase" style={{ backgroundColor: accent, color: '#fff' }} onClick={onRsvp}>RSVP Now</Button>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-60"><ChevronDown className="w-6 h-6" style={{ color: picture ? '#fff' : primary }} /></div>
      </section>

      {/* Countdown */}
      {showCountdown && (
        <section className="py-16 px-6" style={{ background: `${secondary}0d` }}>
          <p className="text-center text-xs tracking-[0.3em] uppercase mb-8" style={{ color: secondary }}>Until we say "I do"</p>
          <Countdown date={propDate} accent={secondary} />
        </section>
      )}

      {/* At a Glance */}
      {glance.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5">
            {glance.map((g, i) => (
              <div key={i} className="text-center p-7 rounded-3xl bg-white shadow-sm">
                <div className="flex justify-center mb-3" style={{ color: secondary }}>{g.icon}</div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-1">{g.label}</p>
                <p className="text-base font-medium leading-snug">{g.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Schedule */}
      <section id="details" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <Flower2 className="w-7 h-7 mx-auto mb-4" style={{ color: accent }} />
            <p className="text-[11px] tracking-[0.3em] uppercase mb-3" style={{ color: secondary }}>The Celebration</p>
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight">Schedule of Events</h3>
          </div>
          {schedule.length > 0 ? (
            <div className="space-y-8">
              {schedule.map((item, i) => (
                <div key={i} className="relative pl-12">
                  <span className="absolute left-0 top-1.5 w-6 h-6 rounded-full" style={{ backgroundColor: accent }} />
                  {i < schedule.length - 1 && <span className="absolute left-[11px] top-8 bottom-[-2rem] w-0.5" style={{ backgroundColor: `${secondary}33` }} />}
                  <p className="text-sm font-bold tracking-wide" style={{ color: secondary }}>{item.time}</p>
                  <h4 className="text-2xl font-semibold mt-1">{item.title}</h4>
                  {item.place && <p className="text-sm flex items-center gap-1.5 mt-2" style={{ color: primary, opacity: 0.7 }}><MapPin className="w-3.5 h-3.5" />{item.place}</p>}
                  {item.description && <p className="text-sm mt-2 leading-relaxed" style={{ color: primary, opacity: 0.7 }}>{item.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-sm" style={{ color: primary, opacity: 0.5 }}>Add events in the Schedule tab to display them here.</div>
          )}
        </div>
      </section>

      {/* Story */}
      {propStory && (
        <section id="story" className="py-24 px-6 text-center" style={{ background: `${secondary}0d` }}>
          <div className="max-w-2xl mx-auto">
            <Flower2 className="w-7 h-7 mx-auto mb-5" style={{ color: accent }} />
            <p className="text-[11px] tracking-[0.3em] uppercase mb-3" style={{ color: secondary }}>Our Story</p>
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-10">A Love Written in Time</h3>
            <p className="text-lg md:text-2xl leading-relaxed font-light" style={{ color: primary, opacity: 0.85 }}>{propStory}</p>
          </div>
        </section>
      )}

      {/* Well Wishes */}
      {showGuestbook && (
        <section id="wishes" className="py-24 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-5" style={{ color: accent }} />
            <p className="text-[11px] tracking-[0.3em] uppercase mb-3" style={{ color: secondary }}>Well Wishes</p>
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Leave Us a Note</h3>
            <p className="mb-10" style={{ color: primary, opacity: 0.75 }}>{guestbookNote || 'We would love to hear from you. Send us your warmest wishes!'}</p>
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
            <h3 className="text-3xl md:text-5xl font-bold mb-4">Join the Celebration</h3>
            <p className="font-light opacity-80 mb-12">We can't wait to celebrate with you. Choose how you'd like to take part.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {actions.map((a, i) => (
                <button key={i} onClick={a.onClick} className="flex flex-col items-center gap-3 py-10 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <span style={{ color: accent }}>{a.icon}</span>
                  <span className="text-xs tracking-[0.2em] uppercase font-bold">{a.label}</span>
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
              <Flower2 className="w-6 h-6 mx-auto mb-4" style={{ color: accent }} />
              <p className="text-[11px] tracking-[0.3em] uppercase mb-3" style={{ color: secondary }}>Good to know</p>
              <h3 className="text-3xl md:text-5xl font-bold tracking-tight">Frequently Asked</h3>
            </div>
            <div className="space-y-4">
              {faq.map((f, i) => (
                <details key={i} className="group bg-white rounded-3xl shadow-sm p-6">
                  <summary className="flex items-center justify-between cursor-pointer list-none font-semibold">
                    <span className="flex items-center gap-3"><MessageCircleQuestion className="w-4 h-4" style={{ color: secondary }} />{f.q}</span>
                    <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: primary, opacity: 0.75 }}>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="py-14 text-center" style={{ background: `${secondary}0d` }}>
        <Flower2 className="w-6 h-6 mx-auto mb-3" style={{ color: accent }} />
        <p className="text-xs tracking-[0.3em] uppercase" style={{ color: primary, opacity: 0.5 }}>{names} · {propDate ? new Date(propDate).getFullYear() : ''}</p>
      </footer>
    </div>
  );
};
