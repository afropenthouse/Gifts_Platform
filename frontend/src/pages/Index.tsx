import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import WeddingGiftCard, { WeddingGiftGallery } from "@/components/WeddingGiftCard";
import { Heart } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      
      {/* Featured Celebrations Section */}
      <section className="py-16 px-6 bg-champagne/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10 opacity-0 animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
            <div className="inline-flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-rose fill-rose/30" />
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Featured Celebrations</span>
              <Heart className="w-5 h-5 text-rose fill-rose/30" />
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
              Celebrate Their Special Day
            </h2>
          </div>

          <WeddingGiftGallery />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-card border-t border-border/50">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 GiftLink. Made with{" "}
            <Heart className="w-3.5 h-3.5 inline text-rose fill-rose" />{" "}
            for celebrating love.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
