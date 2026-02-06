import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Share2, BarChart3, ShieldCheck, CheckCircle, Users, Link as LinkIcon, AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const AsoebiLanding = () => {
  const { openSignupModal } = useAuth();

  useEffect(() => {
    document.title = "Sell & Manage Asoebi - BeThere Weddings";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-champagne/10">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 px-4 md:py-32 md:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20"></div>
        <div className="container mx-auto max-w-6xl relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-primary/10 rounded-full">
                <span className="text-sm font-medium" style={{ color: '#2E235C' }}>
                  Sell & Manage Asoebi — Without Stress
                </span>
              </div>
              <h1 className="font-serif text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ color: '#2E235C' }}>
                Organise Asoebi payments the easy way, all in one place.
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto lg:mx-0 leading-relaxed">
                Asoebi should bring excitement — not confusion. BeThere Weddings helps couples sell, track, and manage Asoebi payments without chasing people on WhatsApp or juggling spreadsheets.
              </p>
              <div className="mt-8">
                <Button
                  variant="hero"
                  size="lg"
                  className="px-10 py-4 text-primary text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{ backgroundColor: '#ffff' }}
                  onClick={openSignupModal}
                >
                  Create your wedding link
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="/asoebi.JPG" 
                  alt="Asoebi traditional attire" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 md:px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-16" style={{ color: '#2E235C' }}>
            How Asoebi Works on BeThere
          </h2>

          <div className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-secondary/30 p-8 rounded-2xl w-full">
              <ShoppingBag className="w-12 h-12 mb-6 text-primary" />
              <h3 className="text-2xl font-bold mb-4" style={{ color: '#2E235C' }}>Set your Asoebi options</h3>
              <p className="text-lg text-muted-foreground mb-4">
                Create Asoebi for:
              </p>
              <ul className="space-y-2 mb-4 text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Bride’s family</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Groom’s family</li>
              </ul>
              <p className="text-lg text-muted-foreground">
                Set your price, available quantity, and close sales when you’re ready.
              </p>
            </div>
            <div className="bg-secondary/30 p-8 rounded-2xl w-full">
              <LinkIcon className="w-12 h-12 mb-6 text-primary" />
              <h3 className="text-2xl font-bold mb-4" style={{ color: '#2E235C' }}>Share one simple link</h3>
              <p className="text-lg text-muted-foreground mb-4">
                Guests click your wedding link to:
              </p>
              <ul className="space-y-2 mb-4 text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Choose whose Asoebi they want</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Select quantity</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Pay instantly and securely</li>
              </ul>
              <p className="text-lg text-muted-foreground">
                No back-and-forth. No manual confirmations.
              </p>
            </div>
          </div>

          <div className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-secondary/30 p-8 rounded-2xl w-full">
              <BarChart3 className="w-12 h-12 mb-6 text-primary" />
              <h3 className="text-2xl font-bold mb-4" style={{ color: '#2E235C' }}>Track orders automatically</h3>
              <p className="text-lg text-muted-foreground mb-4">
                See everything clearly on your dashboard:
              </p>
              <ul className="space-y-2 mb-4 text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Who bought Asoebi</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> How many they ordered</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Payment status</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Total amount collected</li>
              </ul>
              <p className="text-lg text-muted-foreground">
                Everything updates in real time.
              </p>
            </div>
            <div className="bg-secondary/30 p-8 rounded-2xl w-full">
              <AlertCircle className="w-12 h-12 mb-6 text-primary" />
              <h3 className="text-2xl font-bold mb-4" style={{ color: '#2E235C' }}>Avoid over-selling & confusion</h3>
              <p className="text-lg text-muted-foreground mb-4">
                Once your Asoebi is sold out, guests see it immediately. No more:
              </p>
              <ul className="space-y-2 mb-4 text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-red-500" /> “Please is it still available?”</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-red-500" /> Accidental over-selling</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-red-500" /> Manual cut-offs</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Couples Love This */}
      <section className="py-20 px-4 md:px-6 bg-secondary/10">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-12" style={{ color: '#2E235C' }}>
            Why Couples Love This
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 text-left">
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-lg font-medium">No chasing payments</span>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-lg font-medium">No WhatsApp confusion</span>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-lg font-medium">No manual records</span>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-lg font-medium">Clear list of buyers</span>
                </div>
            </div>
             <div className="bg-white p-6 rounded-xl shadow-sm md:col-span-2">
                <div className="flex items-center gap-3 justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-lg font-medium">One trusted source of truth</span>
                </div>
            </div>
          </div>
          <p className="text-2xl font-serif italic text-primary">
            "Asoebi finally feels organized and controlled."
          </p>
        </div>
      </section>

      {/* Built for Nigerian Weddings */}
      <section className="py-20 px-4 md:px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12" style={{ color: '#2E235C' }}>
                Built for Nigerian Weddings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="text-center p-6">
                    <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <h3 className="font-bold mb-2">High Volume</h3>
                    <p className="text-muted-foreground">Designed for high-volume Asoebi sales</p>
                </div>
                <div className="text-center p-6">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <h3 className="font-bold mb-2">Flexible</h3>
                    <p className="text-muted-foreground">Works for traditional & white weddings</p>
                </div>
                <div className="text-center p-6">
                    <Share2 className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <h3 className="font-bold mb-2">Family Sides</h3>
                    <p className="text-muted-foreground">Handles family-side separation cleanly</p>
                </div>
                <div className="text-center p-6">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <h3 className="font-bold mb-2">Secure</h3>
                    <p className="text-muted-foreground">Secure payments via trusted providers</p>
                </div>
            </div>
        </div>
      </section>

      {/* Integrated Section */}
      <section className="py-20 px-4 md:px-6 bg-primary text-white">
        <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-8">
                Part of Your Wedding, Not a Separate Tool
            </h2>
            <p className="text-xl mb-12 opacity-90">
                Asoebi works seamlessly with:
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-12">
                {['RSVPs', 'Cash Gifts', 'Guest Management', 'Vendor Payments', 'Wedding Expense Tracking'].map((item) => (
                    <span key={item} className="px-6 py-3 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                        {item}
                    </span>
                ))}
            </div>
            <p className="text-2xl font-serif italic opacity-90">
                All in one dashboard.
            </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-6 bg-secondary/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6" style={{ color: '#2E235C' }}>
            Start Selling Asoebi the Smart Way
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create your wedding link and start collecting Asoebi payments in minutes.
          </p>
          <Button
            size="lg"
            className="px-10 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            onClick={openSignupModal}
          >
            Create your wedding link
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AsoebiLanding;
