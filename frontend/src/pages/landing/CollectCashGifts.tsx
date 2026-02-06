import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Gift, Shield, BarChart3, Clock, Heart } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const CollectCashGifts = () => {
  const { openSignupModal } = useAuth();

  useEffect(() => {
    document.title = "Collect Cash Gifts for Your Wedding - BeThere Weddings";
  }, []);

  const timingFeatures = [
    {
      icon: <Calendar className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Before the wedding",
      description: "Receive gifts early to help with preparations"
    },
    {
      icon: <Clock className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "On the wedding day",
      description: "Instant gifting during the celebration"
    },
    {
      icon: <Heart className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "After the wedding",
      description: "Continue receiving well-wishes anytime"
    },
  ];

  const benefits = [
    {
      icon: <Gift className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Share one cash gift link with guests",
    },
    {
      icon: <Shield className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Receive gifts securely",
    },
    {
      icon: <BarChart3 className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Track all gifts in your dashboard",
    },
    {
      icon: <Heart className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Avoid handling physical cash at events",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-champagne/10">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 px-4 md:py-32 md:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20"></div>
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-primary/10 rounded-full">
              <span className="text-sm font-medium" style={{ color: '#2E235C' }}>
                Modern Wedding Gifting
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ color: '#2E235C' }}>
              Collect Cash Gifts for Your Wedding
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Receive wedding cash gifts securely — before, during, or after your event.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="prose prose-lg max-w-none">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Cash gifts are one of the most common wedding gifts today — but collecting them shouldn’t feel awkward or disorganized.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Be There Weddings allows couples to receive cash gifts through a secure, trusted link that guests can access anytime.
                </p>
              </div>

              <div className="pt-4">
                <Button
                  variant="hero"
                  size="lg"
                  className="px-10 py-4 text-primary text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{ backgroundColor: '#ffff' }}
                  onClick={openSignupModal}
                >
                  Start Collecting Cash Gifts
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl max-w-md mx-auto">
                <img 
                  src="/cash.JPG" 
                  alt="Cash gifts and wedding contributions" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-16 px-4 md:py-24 md:px-6 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose Cash Gifts?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple, secure, and perfect for modern weddings
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex-shrink-0">
                      {benefit.icon}
                    </div>
                    <div>
                      <p className="text-foreground font-medium leading-relaxed">{benefit.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 md:py-24 md:px-6 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Receive Cash Gifts Digitally?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Make your wedding gifting experience smooth, secure, and stress-free
          </p>
          <Button
            variant="hero"
            size="lg"
            className="px-10 py-4 text-primary text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            style={{ backgroundColor: '#ffff' }}
            onClick={openSignupModal}
          >
            Get Started Today
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CollectCashGifts;