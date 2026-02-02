import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Shield, Users, Clock, CheckCircle, Heart, ArrowRight, Lock } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const ScheduleVendorPayments = () => {
  const { openSignupModal } = useAuth();

  useEffect(() => {
    document.title = "Manage Wedding Expenses & Schedule Vendor Payments - BeThere Weddings";
  }, []);

  const howItWorks = [
    {
      step: "1",
      icon: <Calendar className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Add & Track Expenses",
      description: "List all your wedding expenses and vendors in one place."
    },
    {
      step: "2",
      icon: <Shield className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Schedule Payments",
      description: "Set payment dates and amounts for each vendor or expense."
    },
    {
      step: "3",
      icon: <Clock className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Automatic & Secure",
      description: "Payments are released automatically and securely on due dates."
    },
    {
      step: "4",
      icon: <CheckCircle className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Full Visibility",
      description: "Monitor all expenses, payment statuses, and vendor balances in real time."
    },
    {
      step: "5",
      icon: <Heart className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "Peace of Mind",
      description: "Enjoy your day knowing all finances are organized and protected."
    },
  ];

  const benefits = [
    {
      icon: <Users className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "For Couples",
      items: ["No upfront payment pressure", "Clear payment schedules", "Full visibility and control"]
    },
    {
      icon: <Heart className="w-8 h-8" style={{ color: '#2E235C' }} />,
      title: "For Vendors",
      items: ["Guaranteed payment", "Clear timelines", "Increased trust and professionalism"]
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
                Manage Expenses & Vendor Payments
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ color: '#2E235C' }}>
              Track & Schedule All Wedding Expenses
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Organize, track, and pay all your wedding expenses and vendors in one secure dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="prose prose-lg max-w-none">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Managing wedding expenses can be overwhelming. With BeThere, you can add every vendor, set payment schedules, and see all your costs in one place.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  No more spreadsheets or payment confusion—just clarity, control, and peace of mind for your big day.
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
                  Start Managing Expenses
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <Lock className="w-6 h-6" style={{ color: '#2E235C' }} />
                  <h3 className="text-xl font-semibold text-foreground">Total Control</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-white/70 rounded-xl">
                    <Shield className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: '#2E235C' }} />
                    <div>
                      <p className="text-foreground font-medium">Expense Tracking</p>
                      <p className="text-sm text-muted-foreground">See all your wedding costs, due dates, and payment statuses at a glance.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-white/70 rounded-xl">
                    <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: '#2E235C' }} />
                    <div>
                      <p className="text-foreground font-medium">Secure Payments</p>
                      <p className="text-sm text-muted-foreground">Pay vendors on time, every time, with automatic and protected payments.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 md:py-24 md:px-6 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              How to Manage Wedding Expenses
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A simple step-by-step process to keep your wedding finances organized and stress-free
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative">
                  <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                          {step.icon}
                        </div>
                        <div>
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-sm font-bold" style={{ color: '#2E235C' }}>{step.step}</span>
                          </div>
                          <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {index < howItWorks.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                      <ArrowRight className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 md:py-24 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Benefits for Everyone
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Scheduled payments create win-win situations for couples and vendors
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      {benefit.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{benefit.title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {benefit.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#2E235C' }} />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
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
            Ready to Schedule Secure Payments?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Build trust with your vendors and eliminate payment stress from your wedding planning
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

export default ScheduleVendorPayments;