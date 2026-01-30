import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, DollarSign, Calendar, BarChart3, CheckCircle, TrendingUp, Plus, Eye } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const VendorPaymentTracker = () => {
  const { openSignupModal } = useAuth();

  useEffect(() => {
    document.title = "Wedding Expense Manager - BeThere Weddings";
  }, []);

  const features = [
    {
      icon: <Plus className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Add vendors by category",
      description: "Organize planners, photographers, decorators, and more"
    },
    {
      icon: <DollarSign className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Record total vendor charges",
      description: "Keep track of all agreed costs and fees"
    },
    {
      icon: <BarChart3 className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Track payment progress",
      description: "See exactly how much has been paid vs. owed"
    },
    {
      icon: <Calendar className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Monitor due dates",
      description: "Never miss important payment deadlines"
    },
    {
      icon: <Eye className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "View outstanding balances",
      description: "Clear visibility into remaining payments"
    },
    {
      icon: <TrendingUp className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Calculate total wedding spend",
      description: "Automatic budget tracking and summaries"
    },
  ];

  const benefits = [
    "No more confusion with spreadsheets",
    "Never forget payment deadlines",
    "Clear communication with vendors",
    "Better budget management",
    "Professional payment tracking",
    "Peace of mind throughout planning"
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
                Smart Budget Management
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ color: '#2E235C' }}>
              Wedding Expense Manager
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Track all your wedding vendor payments in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="prose prose-lg max-w-none">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Managing wedding vendors often means juggling payments, balances, and due dates across different conversations and spreadsheets.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Be There Weddings gives couples and event planners a simple way to track vendor costs and payments in one organized dashboard.
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
                  Track Wedding Expense
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-6 h-6" style={{ color: '#2E235C' }} />
                  <h3 className="text-xl font-semibold text-foreground">Complete Visibility</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/70 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold" style={{ color: '#2E235C' }}>100%</div>
                      <div className="text-sm text-muted-foreground">Payment Tracking</div>
                    </div>
                    <div className="bg-white/70 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold" style={{ color: '#2E235C' }}>0</div>
                      <div className="text-sm text-muted-foreground">Missed Deadlines</div>
                    </div>
                  </div>
                  <div className="bg-white/70 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Budget Overview</span>
                      <span className="text-sm text-muted-foreground">85% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                </div>
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
              Everything You Can Track
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive vendor payment management at your fingertips
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 md:py-24 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Track Payments?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional payment tracking brings peace of mind to your wedding planning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
                <CheckCircle className="w-6 h-6 flex-shrink-0" style={{ color: '#2E235C' }} />
                <span className="text-foreground font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 md:py-24 md:px-6 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Organize Your Vendor Payments?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Take control of your wedding budget with professional payment tracking
          </p>
          <Button
            variant="hero"
            size="lg"
            className="px-10 py-4 text-primary text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            style={{ backgroundColor: '#ffff' }}
            onClick={openSignupModal}
          >
            Start Tracking Today
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VendorPaymentTracker;