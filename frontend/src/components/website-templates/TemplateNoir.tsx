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

export const TemplateNoir = ({
    title: propTitle,
    date: propDate,
    venue: propVenue,
    story: propStory,
    shareLink: propShareLink,
    picture: propPicture,
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
    const fontFamily = data?.theme?.fontFamily || 'Cormorant Garamond, Georgia, serif';
    const heroName = data?.eventType === 'wedding' && data?.coupleNames ? data.coupleNames : title;
    const heroSubtitle = data?.heroSubtitle || story || '';

    const formattedDate = date
        ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : '';

    const allActions = [
        { label: 'RSVP', icon: Users, enabled: true, url: `/gift/${shareLink}`, color: 'from-navy-700 to-navy-900' },
        { label: 'Buy Asoebi', icon: ShoppingBag, enabled: true, url: `/gift/${shareLink}`, color: 'from-gold-600 to-amber-700' },
        { label: 'Cash Gifts', icon: Gift, enabled: true, url: `/gift/${shareLink}`, color: 'from-emerald-600 to-teal-700' },
        { label: 'Photobook', icon: Camera, enabled: true, url: `/qr-gift/${shareLink}`, color: 'from-slate-600 to-slate-800' },
        { label: 'Wishlists', icon: Heart, enabled: !!(enableWishlistButton && wishlists?.[0]?.shareLink), url: wishlists?.[0]?.shareLink ? `/${wishlists[0].shareLink}` : `/gift/${shareLink}`, color: 'from-rose-500 to-pink-600' },
        { label: 'Well Wishes', icon: MessageSquareHeart, enabled: !!showWellWishes, url: `/gift/${shareLink}#wishes`, color: 'from-purple-500 to-violet-600' },
    ];

    return (
        <div className="min-h-screen bg-[#faf8f5] text-[#1a2332]" style={{ fontFamily }}>

            {/* ===== HERO SECTION ===== */}
            <section className="relative min-h-[90vh] overflow-hidden">
                {picture ? (
                    <img src={picture} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a2332] via-[#2a3a52] to-[#0f1620]" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(26,35,50,.88),rgba(26,35,50,.45),rgba(201,169,89,.12))]" />

                {/* Decorative gold line top */}
                <div className="absolute left-1/2 top-8 z-10 h-[2px] w-24 -translate-x-1/2 bg-[#c9a959]/60" />

                <div className="relative z-10 flex min-h-[90vh] flex-col items-center justify-center px-6 py-20 text-center md:px-12">
                    <div className="max-w-4xl">
                        <p className="mb-6 text-xs font-light uppercase tracking-[0.4em] text-[#c9a959]">
                            {data?.eventType === 'wedding' ? 'We are getting married' : 'You are invited'}
                        </p>
                        <h1 className="mb-6 text-5xl font-light leading-[0.95] tracking-tight text-white md:text-7xl lg:text-8xl">
                            {heroName}
                        </h1>
                        <div className="mx-auto mb-8 h-px w-16 bg-[#c9a959]/50" />
                        {heroSubtitle && (
                            <p className="mx-auto max-w-2xl text-lg font-light leading-8 text-[#e8ddd0] md:text-xl">
                                {heroSubtitle}
                            </p>
                        )}
                        {(formattedDate || venue) && (
                            <div className="mt-10 flex flex-col items-center gap-4 text-sm font-light uppercase tracking-[0.2em] text-[#c9a959] sm:flex-row sm:gap-6">
                                {formattedDate && (
                                    <span className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        {formattedDate}
                                    </span>
                                )}
                                {formattedDate && venue && <span className="hidden sm:inline text-[#c9a959]/30">|</span>}
                                {venue && (
                                    <span className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        {venue}
                                    </span>
                                )}
                            </div>
                        )}
                        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                            <Button
                                size="lg"
                                className="rounded-none border border-[#c9a959] bg-transparent px-12 py-7 text-sm font-light uppercase tracking-[0.3em] text-[#c9a959] transition-all duration-300 hover:bg-[#c9a959] hover:text-[#1a2332]"
                                onClick={() => window.open(`/gift/${shareLink}`, '_blank')}
                            >
                                RSVP Now
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Decorative gold line bottom */}
                <div className="absolute bottom-8 left-1/2 z-10 h-[2px] w-24 -translate-x-1/2 bg-[#c9a959]/40" />
            </section>

            {/* ===== MAIN CONTENT ===== */}
            <main className="px-6 py-20 md:px-12 md:py-28">

                {/* ===== DATE & VENUE CARDS ===== */}
                {(formattedDate || venue) && (
                    <section className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
                        {formattedDate && (
                            <div className="bg-white p-10 shadow-[0_4px_40px_rgba(26,35,50,0.06)] transition-shadow hover:shadow-[0_8px_60px_rgba(26,35,50,0.10)]">
                                <Calendar className="mb-5 h-7 w-7 text-[#c9a959]" />
                                <p className="mb-2 text-xs font-light uppercase tracking-[0.35em] text-[#c9a959]">Date</p>
                                <p className="text-xl font-light leading-relaxed text-[#1a2332]">{formattedDate}</p>
                            </div>
                        )}
                        {venue && (
                            <div className={`bg-white p-10 shadow-[0_4px_40px_rgba(26,35,50,0.06)] transition-shadow hover:shadow-[0_8px_60px_rgba(26,35,50,0.10)] ${formattedDate ? 'md:col-span-2' : 'md:col-span-3'}`}>
                                <MapPin className="mb-5 h-7 w-7 text-[#c9a959]" />
                                <p className="mb-2 text-xs font-light uppercase tracking-[0.35em] text-[#c9a959]">Venue</p>
                                <p className="text-xl font-light leading-relaxed text-[#1a2332]">{venue}</p>
                            </div>
                        )}
                    </section>
                )}

                {/* ===== CEREMONY & RECEPTION ===== */}
                {(data?.ceremony || data?.reception) && (
                    <section className="mx-auto mt-8 grid max-w-5xl gap-6 md:grid-cols-2">
                        {data?.ceremony && (
                            <div className="border border-[#1a2332]/10 bg-white p-10">
                                <p className="mb-3 text-xs font-light uppercase tracking-[0.35em] text-[#c9a959]">Ceremony</p>
                                <p className="text-lg font-light leading-8 text-[#1a2332]">{data.ceremony}</p>
                            </div>
                        )}
                        {data?.reception && (
                            <div className="border border-[#1a2332]/10 bg-white p-10">
                                <p className="mb-3 text-xs font-light uppercase tracking-[0.35em] text-[#c9a959]">Reception</p>
                                <p className="text-lg font-light leading-8 text-[#1a2332]">{data.reception}</p>
                            </div>
                        )}
                    </section>
                )}

                {/* ===== STORY ===== */}
                {story && (
                    <section className="mx-auto mt-24 max-w-3xl text-center">
                        <div className="mb-6 flex items-center justify-center gap-4">
                            <div className="h-px w-12 bg-[#c9a959]/40" />
                            <p className="text-xs font-light uppercase tracking-[0.4em] text-[#c9a959]">Our Story</p>
                            <div className="h-px w-12 bg-[#c9a959]/40" />
                        </div>
                        <p className="text-lg font-light leading-[2.2rem] text-[#1a2332]/80 md:text-xl">{story}</p>
                        <div className="mt-6 flex justify-center">
                            <div className="h-px w-8 bg-[#c9a959]/30" />
                        </div>
                    </section>
                )}

                {/* ===== GALLERY ===== */}
                {gallery && gallery.length > 0 && (
                    <section className="mx-auto mt-24 max-w-6xl">
                        <div className="mb-10 flex flex-col items-center">
                            <p className="text-xs font-light uppercase tracking-[0.4em] text-[#c9a959]">Memories</p>
                            <h2 className="mt-2 text-4xl font-light text-[#1a2332]">Moments We Cherish</h2>
                            <div className="mt-3 h-px w-12 bg-[#c9a959]/40" />
                        </div>
                        <GalleryLightbox
                            images={gallery}
                            imageClassName="w-full h-72 object-cover shadow-xl object-top"
                        />
                    </section>
                )}

                {/* ===== ACTION BUTTONS ===== */}
                <section className="mx-auto mt-28 max-w-6xl">
                    <div className="mb-14 flex flex-col items-center text-center">
                        <p className="text-xs font-light uppercase tracking-[0.4em] text-[#c9a959]">Join Us</p>
                        <h2 className="mt-2 text-4xl font-light text-[#1a2332]">Celebrate With Us</h2>
                        <div className="mt-3 h-px w-12 bg-[#c9a959]/40" />
                        <p className="mt-6 max-w-md text-sm font-light text-[#1a2332]/60">
                            Choose how you would like to be part of our special day
                        </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {allActions.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => window.open(item.url, '_blank')}
                                    style={{ fontFamily }}
                                    className={`group relative overflow-hidden bg-white p-8 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_60px_rgba(26,35,50,0.10)] ${item.enabled
                                            ? 'border border-[#1a2332]/10'
                                            : 'border border-[#1a2332]/5 opacity-50 grayscale hover:bg-white'
                                        }`}
                                >
                                    <div
                                        className={`mb-5 inline-flex h-14 w-14 items-center justify-center bg-gradient-to-br ${item.color} transition-transform duration-300 group-hover:scale-110`}
                                    >
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                    <p className="text-base font-light tracking-[0.05em] text-[#1a2332]">
                                        {item.label}
                                    </p>
                                    <p className="mt-1.5 text-sm font-light text-[#1a2332]/50">
                                        {item.label === 'RSVP' && 'Confirm your attendance'}
                                        {item.label === 'Buy Asoebi' && 'Shop our wedding fabric'}
                                        {item.label === 'Cash Gifts' && 'Support with a cash gift'}
                                        {item.label === 'Photobook' && 'Browse our photo memory book'}
                                        {item.label === 'Wishlists' && (item.enabled ? 'Pick a gift from our list' : 'Wishlist coming soon')}
                                        {item.label === 'Well Wishes' && (item.enabled ? 'Leave us a sweet note' : 'Coming soon')}
                                    </p>
                                    <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#c9a959] transition-all duration-300 group-hover:w-full" />
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ===== FOOTER ===== */}
                <footer className="mx-auto mt-28 max-w-6xl border-t border-[#1a2332]/10 pt-12 text-center">
                    <p className="text-sm font-light tracking-[0.2em] text-[#1a2332]/40">
                        With love, <span className="text-[#c9a959]">{heroName}</span>
                    </p>
                    <p className="mt-2 text-xs font-light tracking-[0.15em] text-[#1a2332]/25">
                        {formattedDate || 'Save the date'}
                    </p>
                </footer>
            </main>
        </div>
    );
};
