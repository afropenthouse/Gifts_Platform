import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="min-h-[60vh] flex items-center bg-gradient-hero">
      {/* Content */}
      <div className="flex-1 text-left px-6 py-16 max-w-3xl">
        {/* Main heading */}
        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-semibold text-foreground mb-6 leading-tight opacity-0 animate-fade-in-up delay-100" style={{ animationFillMode: 'forwards' }}>
          Share Your {" "}
          <span className="text-rose font-medium">Celebration</span>
          <span className="block text-gold font-medium">Receive Cash Gifts</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-black max-w-xl mb-8 font-sans opacity-0 animate-fade-in-up delay-200 font-medium" style={{ animationFillMode: 'forwards' }}>
          One trusted link to share your celebration and receive all your cash gifts in one place.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-start gap-4 opacity-0 animate-fade-in-up delay-300" style={{ animationFillMode: 'forwards' }}>
          <Link to="/create-gift">
            <Button variant="hero" size="lg">
              Create Your Gift Link
            </Button>
          </Link>
        </div>
      </div>

      {/* Images */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4">
        <img src="/conv.jpg" alt="" className="w-full h-48 object-cover rounded-lg" />
        <img src="/Bode.jpg" alt="" className="w-full h-48 object-cover rounded-lg" />
        <img src="/wedd.jpg" alt="" className="w-full h-48 object-cover rounded-lg" />
        <img src="/grad.jpg" alt="" className="w-full h-48 object-cover rounded-lg" />
      </div>
    </section>
  );
};

export default HeroSection;
