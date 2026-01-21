import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Zap, Shield, Sparkles, QrCode, Clock, Heart, CheckCircle } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const WeddingQRCode = () => {
  const { openSignupModal } = useAuth();

  useEffect(() => {
    document.title = "Wedding QR Code for Cash Gifts - BeThere Weddings";
  }, []);

  const benefits = [
    {
      icon: <Zap className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Lightning Fast Gifting",
      description: "Guests send cash gifts in seconds with a simple scan"
    },
    {
      icon: <Shield className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "No Bank Details Needed",
      description: "No need to announce account numbers or worry about security"
    },
    {
      icon: <Sparkles className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Elegant Experience",
      description: "Clean, modern gifting that fits your wedding aesthetic"
    },
    {
      icon: <Clock className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Anytime Access",
      description: "Works during the event and for future well-wishers"
    },
  ];

  const howItWorks = [
    "Generate your unique QR code",
    "Display at venue (tables, screens, frames)",
    "Guests scan with their phones",
    "Instant secure payment processing"
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
                Instant Digital Gifting
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ color: '#2E235C' }}>
              Wedding QR Code for Cash Gifts
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Let guests scan and send cash gifts instantly at your wedding.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="prose prose-lg max-w-none">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  At the wedding venue, guests shouldn’t be asking for account numbers or worrying about transfers.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Be There Weddings provides a dedicated QR code that guests can scan to send cash gifts instantly using their phones.
                </p>
              </div>

              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  How It Works
                </h3>
                <div className="space-y-3">
                  {howItWorks.map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold" style={{ color: '#2E235C' }}>{index + 1}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button
                  variant="hero"
                  size="lg"
                  className="px-10 py-4 text-primary text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{ backgroundColor: '#ffff' }}
                  onClick={openSignupModal}
                >
                  Generate Your Wedding QR Code
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
                <div className="text-center mb-6">
                  <div className="w-32 h-32 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <QrCode className="w-16 h-16" style={{ color: '#2E235C' }} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Your Wedding QR Code</h3>
                  <p className="text-sm text-muted-foreground">Scan to send cash gifts instantly</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl">
                    <span className="text-sm font-medium">Display Options</span>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center">
                        <span className="text-xs">📱</span>
                      </div>
                      <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center">
                        <span className="text-xs">🖥️</span>
                      </div>
                      <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center">
                        <span className="text-xs">🖼️</span>
                      </div>
                    </div>
                  </div>
                </div>
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
              Why Choose QR Code Gifting?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Modern, secure, and effortless cash gifting for your special day
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Display Ideas */}
      <section className="py-16 px-4 md:py-24 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Perfect for Your Venue
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Display your QR code beautifully at your wedding reception
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🍽️</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Table Cards</h3>
              <p className="text-sm text-muted-foreground">Place at each guest table for easy access</p>
            </div>
            <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📺</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Digital Screens</h3>
              <p className="text-sm text-muted-foreground">Show on welcome or photo booth screens</p>
            </div>
            <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Custom Frames</h3>
              <p className="text-sm text-muted-foreground">Create beautiful custom QR code frames</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 md:py-24 md:px-6 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready for Effortless Gifting?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Give your guests the modern gifting experience they expect
          </p>
          <Button
            variant="hero"
            size="lg"
            className="px-10 py-4 text-primary text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            style={{ backgroundColor: '#ffff' }}
            onClick={openSignupModal}
          >
            Create Your QR Code
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WeddingQRCode;