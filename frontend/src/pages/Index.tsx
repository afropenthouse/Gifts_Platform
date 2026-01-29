import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import { WeddingGiftGallery } from "@/components/WeddingGiftCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { openLoginModal, openSignupModal } = useAuth();
  
  useEffect(() => {
    document.title = "BeThere Weddings - Manage RSVPs, Cash Gifts, Asoebi, and Vendor Payments - in one place";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />

      <section className="py-8 px-4 md:py-12 md:px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            BeThere Weddings helps couples manage guest attendance through RSVPs, coordinate Asoebi sales, collect cash gifts, and track wedding expenses all in one place.
          </p>
        </div>
      </section>

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
                title: 'Create Your Event',
                body: 'Sign up and create a personalized event link for your wedding or celebration in minutes.',
              },
              {
                step: 'Step 2',
                title: 'Add Guest List',
                body: 'Import or type guest names to keep your event organized.',
              },
              {
                step: 'Step 3',
                title: 'Share with Loved Ones',
                body: 'Send your unique link to family and friends via WhatsApp, email, or social media.',
              },
              {
                step: 'Step 4',
                title: 'Manage RSVPs',
                body: 'Guests confirm attendance with a response so you know exactly who is coming.',
              },
              {
                step: 'Step 5',
                title: 'Receive Cash Gifts',
                body: 'Receive cash gifts from friends in multiple currencies',
              },
              {
                step: 'Step 6',
                title: 'Track & Manage',
                body: 'Monitor RSVPs, guest details, and incoming cash gifts from your dashboard in real time',
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
      <section className="py-12 px-4 md:py-16 md:px-6 bg-primary">
        <div className="container mx-auto max-w-3xl text-center">
          
          <Button 
            variant="hero" 
            size="lg" 
            className="px-8 py-6 text-primary text-base md:text-lg" 
            style={{ backgroundColor: '#ffff' }}
            onClick={openSignupModal}
          >
            Create RSVP Link
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;


