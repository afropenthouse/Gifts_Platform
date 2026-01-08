import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import { WeddingGiftGallery } from "@/components/WeddingGiftCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    document.title = "MyCashGift - Collect RSVPs & Cash Gifts for your Wedding";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />

      {/* Steps Section */}
      <section className="py-12 px-4 md:py-16 md:px-6 bg-champagne/20">
        <div className="container mx-auto max-w-[90vw] sm:max-w-6xl">
          <div className="text-center mb-8 md:mb-10">
            <span className="text-xs md:text-sm font-medium uppercase tracking-wider" style={{ color: '#2E235C' }}>
              How It Works
            </span>
            <h2 className="font-serif text-2xl md:text-4xl font-semibold text-foreground mt-2">
              6 simple steps to start
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                step: 'Step 1',
                title: 'Create Your Gift Link',
                body: 'Sign up and create a personalized gift link for your celebration in minutes.',
              },
              {
                step: 'Step 2',
                title: 'Add Guest List',
                body: 'Import or type your guest names and assigned numbers so you stay organized.',
              },
              {
                step: 'Step 3',
                title: 'Share with Loved Ones',
                body: 'Send your unique link to family and friends via WhatsApp, email, or social media.',
              },
              {
                step: 'Step 4',
                title: 'Get RSVPs',
                body: 'Guests confirm attendance and include their assigned number so you know who is coming.',
              },
              {
                step: 'Step 5',
                title: 'Receive Cash Gifts',
                body: 'Friends contribute securely through the link, and you receive every gift in one place.',
              },
              {
                step: 'Step 6',
                title: 'Track',
                body: 'Monitor RSVPs, guest details, and incoming gifts from your dashboard in real time.',
              },
            ].map((item) => (
              <div 
                key={item.step} 
                className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-border/50 p-6 md:p-8 text-center hover:shadow-md transition-shadow duration-300"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full font-semibold mb-3 md:mb-4" style={{ backgroundColor: '#2E235C1A', color: '#2E235C' }}>
                  {item.step.split(' ')[1]}
                </div>
                <h3 className="font-serif text-xl md:text-2xl font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Celebrations Section */}
      {/* <section className="py-12 px-4 md:py-16 md:px-6 bg-champagne/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 md:mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Featured Celebrations
              </span>
            </div>
          </div>
          <WeddingGiftGallery />
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-12 px-4 md:py-16 md:px-6 bg-white">
        <div className="container mx-auto max-w-3xl text-center">
          
          <Link to="/create-gift">
            <Button variant="hero" size="lg" className="px-8 py-6 text-base md:text-lg" style={{ backgroundColor: '#2E235C' }}>
              Create Your Gift Link
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 md:px-6 bg-card border-t border-border/50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Brand Section */}
            <div>
              <h3 className="font-serif text-lg font-semibold text-foreground mb-3 md:mb-4">
                GiftLink
              </h3>
              <p className="text-sm text-muted-foreground">
                Making celebrations memorable with thoughtful gifts and contributions.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-medium text-foreground mb-3 md:mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    Login
                  </a>
                </li>
                <li>
                  <a href="/signup" className="text-muted-foreground hover:text-foreground transition-colors">
                    Sign Up
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-medium text-foreground mb-3 md:mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a 
                    href="mailto:support@giftlink.com" 
                    className="text-muted-foreground hover:text-foreground transition-colors break-words"
                  >
                    support@giftlink.com
                  </a>
                </li>
                <li className="text-muted-foreground">
                  <a href="tel:+2348056679806" className="hover:text-foreground transition-colors">
                    +234 805 667 9806
                  </a>
                </li>
                <li className="text-muted-foreground">Chevron Estate, Lekki</li>
                <li className="text-muted-foreground">Mon-Fri 9AM-6PM WAT</li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-8 pt-6 md:pt-8 border-t border-border/50 text-center">
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


