import { Heart, Users, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

// Fallback image (lightweight inline SVG) used when no imageUrl is provided
const fallbackImage =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 400'>
      <defs>
        <linearGradient id='g' x1='0' x2='0' y1='0' y2='1'>
          <stop offset='0%' stop-color='#fde68a'/>
          <stop offset='100%' stop-color='#fbcfe8'/>
        </linearGradient>
      </defs>
      <rect width='800' height='400' fill='url(#g)'/>
      <g fill='#1f2937' font-family='serif' text-anchor='middle'>
        <text x='400' y='200' font-size='36'>Special Celebration</text>
      </g>
    </svg>`
  );

interface WeddingGiftCardProps {
  groomName?: string;
  brideName?: string;
  weddingDate: string;
  giftersCount: number;
  imageUrl?: string;
  title?: string;
}

const WeddingGiftCard = ({
  groomName,
  brideName,
  weddingDate,
  giftersCount,
  imageUrl,
  title,
}: WeddingGiftCardProps) => {
  const heading =
    title ||
    (groomName && brideName
      ? `${groomName} & ${brideName}`
      : groomName || brideName || "Special Celebration");
  return (
    <div className="relative w-full max-w-md mx-auto opacity-0 animate-fade-in-up delay-200" style={{ animationFillMode: "forwards" }}>
      <div className="bg-gradient-card rounded-2xl shadow-card overflow-hidden border border-border/50">
        <div className="relative h-64 overflow-hidden">
          <img
            src={imageUrl || fallbackImage}
            alt={`${heading} image`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
          <div className="absolute top-4 right-4 bg-card/80 backdrop-blur-sm rounded-full p-2.5 shadow-soft">
            <Heart className="w-5 h-5 text-rose fill-rose" />
          </div>
        </div>

        <div className="p-6 -mt-8 relative">
          <div className="text-center mb-4">
            {title ? (
              <h2 className="font-serif text-3xl font-semibold text-foreground tracking-wide">{title}</h2>
            ) : (
              <h2 className="font-serif text-3xl font-semibold text-foreground tracking-wide">
                {groomName} <span className="text-gold">&</span> {brideName}
              </h2>
            )}
            <p className="text-muted-foreground text-sm mt-1 font-sans">{weddingDate}</p>
          </div>

          <div className="flex justify-center py-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-card/80 backdrop-blur-sm px-4 py-2 shadow-soft border border-border/50">
              <Users className="w-4 h-4 text-rose" />
              <span className="font-semibold text-sm font-sans">{giftersCount}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Gifters</span>
            </div>
          </div>

          <div className="mt-5">
            <Button variant="gold" className="w-full" size="lg">
              <Gift className="w-5 h-5 mr-2" />
              Send a Gift
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeddingGiftCard;

export const WeddingGiftGallery = () => {
  const events = [
    {
      title: "Aisha's Birthday",
      date: "March 5, 2026",
      gifters: 12,
      imageUrl: "/Aishas_Birthday.jpg",
    },
    {
      groomName: "James",
      brideName: "Sade",
      date: "December 28, 2025",
      gifters: 4,
      imageUrl: "/James.jpg",
    },
    {
      groomName: "Tunde",
      brideName: "Chioma",
      date: "January 15, 2026",
      gifters: 8,
      imageUrl: "/Tunde.jpg",
    },
    {
      title: "Bode's Graduation",
      date: "July 22, 2026",
      gifters: 6,
      imageUrl: "/Bode.jpg",
    },
    {
      title: "Chika's MSc Graduation",
      date: "August 18, 2026",
      gifters: 7,
      imageUrl: "/chika.jpg",
    },
    {
      groomName: "Emeka",
      brideName: "Ade",
      date: "November 2, 2026",
      gifters: 15,
      imageUrl: "/Emeka.jpg",
    },
    {
      groomName: "Monday",
      brideName: "Kemi",
      date: "February 14, 2026",
      gifters: 5,
      imageUrl: "/Monday.webp",
    },
    {
      title: "Tope's Birthday",
      date: "December 12, 2026",
      gifters: 10,
      imageUrl: "/Tope.png",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {events.map((e, i) => (
        <WeddingGiftCard
          key={i}
          groomName={e.groomName}
          brideName={e.brideName}
          title={e.title}
          weddingDate={e.date}
          giftersCount={e.gifters}
          imageUrl={e.imageUrl}
        />
      ))}
    </div>
  );
};
