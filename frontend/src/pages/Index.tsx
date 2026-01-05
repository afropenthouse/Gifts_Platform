import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import WeddingGiftCard, { WeddingGiftGallery } from "@/components/WeddingGiftCard";
import { Link, MessageCircle, ChevronRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />

      {/* How It Works Section */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose/10 rounded-full flex items-center justify-center">
                <Link className="w-6 h-6 text-rose" />
              </div>
              <span className="text-lg font-medium text-neutral-700 whitespace-nowrap">Create your gift links</span>
              <ChevronRight className="w-6 h-6 text-muted-foreground hidden md:block" />
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose/10 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-rose" />
              </div>
              <span className="text-lg font-medium text-neutral-900 whitespace-nowrap">Share it on WhatsApp</span>
              <ChevronRight className="w-6 h-6 text-muted-foreground hidden md:block" />
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose/10 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-rose">₦</span>
              </div>
              <span className="text-lg font-medium text-neutral-900 whitespace-nowrap">Receive cash gifts from friends & family globally</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Celebrations Section */}
      <section className="py-16 px-6 bg-champagne/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10 opacity-0 animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Featured Celebrations</span>
              
            </div>
            {/* <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
              Celebrate Their Special Day
            </h2> */}
          </div>

          <WeddingGiftGallery />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-card border-t border-border/50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand Section */}
            <div>
              <h3 className="font-serif text-lg font-semibold text-foreground mb-4">
                GiftLink
              </h3>
              <p className="text-sm text-muted-foreground">
                Making celebrations memorable with thoughtful gifts and contributions.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-medium text-foreground mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a></li>
                <li><a href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Login</a></li>
                <li><a href="/signup" className="text-muted-foreground hover:text-foreground transition-colors">Sign Up</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-medium text-foreground mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:support@giftlink.com" className="text-muted-foreground hover:text-foreground transition-colors">support@giftlink.com</a></li>
                <li><span className="text-muted-foreground">+234 805 667 9806</span></li>
                <li><span className="text-muted-foreground">Chevron Estate, Lekki</span></li>
                <li><span className="text-muted-foreground">Mon-Fri 9AM-6PM WAT</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-8 pt-8 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              © 2026 GiftLink. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
