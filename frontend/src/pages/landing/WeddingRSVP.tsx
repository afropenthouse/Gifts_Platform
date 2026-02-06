import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Users, Clock, Smartphone, BarChart3, Download } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const WeddingRSVP = () => {
  const { openSignupModal } = useAuth();

  useEffect(() => {
    document.title = "Wedding RSVP Made Simple - BeThere Weddings";
  }, []);

  const features = [
    {
      icon: <Users className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Share one RSVP link with all your guests",
    },
    {
      icon: <Clock className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Track attendance in real time",
    },
    {
      icon: <CheckCircle className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Categorize guests (family, friends, colleagues, etc.)",
    },
    {
      icon: <Smartphone className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Reduce WhatsApp messages and follow-ups",
    },
    {
      icon: <BarChart3 className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Export or view your guest list anytime",
    },
    {
      icon: <Download className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "No apps to download. No complicated setup.",
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
                Wedding Planning Made Easy
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ color: '#2E235C' }}>
              Wedding RSVP Made Simple
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Collect, manage, and track wedding RSVPs in one simple link — no stress, no spreadsheets.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="prose prose-lg max-w-none">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Planning a wedding is already a lot. Chasing guests for attendance confirmation shouldn’t be part of it.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Be There Weddings helps couples easily collect RSVPs online and see, in real time, who is attending their wedding. Guests simply click a link, respond in seconds, and you stay organized.
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
                  Create Your Wedding RSVP Link
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl max-w-md mx-auto">
                <img 
                  src="/6ty2.JPG" 
                  alt="Wedding RSVP and guest management" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 md:py-24 md:px-6 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need for Perfect RSVPs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple, powerful features that make wedding planning stress-free
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <p className="text-foreground font-medium leading-relaxed">{feature.title}</p>
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
            Ready to Simplify Your Wedding RSVPs?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of couples who trust Be There Weddings for their special day
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

export default WeddingRSVP;