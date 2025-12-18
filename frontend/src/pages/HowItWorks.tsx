import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, Link2, Share2, Gift } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: <Link2 className="w-8 h-8 text-rose" />,
      title: "Create Your Gift Link",
      description: "Sign up and create a personalized gift link for your celebration in minutes."
    },
    {
      icon: <Share2 className="w-8 h-8 text-gold" />,
      title: "Share with Loved Ones",
      description: "Send your unique link to family and friends via WhatsApp, email, or social media."
    },
    {
      icon: <Gift className="w-8 h-8 text-rose" />,
      title: "Receive Cash Gifts",
      description: "Friends contribute securely through the link, and you receive all gifts in one place."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-hero">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-foreground mb-6">
            How It <span className="text-rose">Works</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to turn your celebration into a memorable experience with cash gifts from everyone you love.
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center p-6 bg-card rounded-lg shadow-sm border border-border/50">
                <div className="flex justify-center mb-4">
                  {step.icon}
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-champagne/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl font-semibold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of people celebrating with ease.
          </p>
          <Link to="/create-gift">
            <Button variant="hero" size="lg">
              <Heart className="w-5 h-5 mr-2" />
              Create Your Gift Link
            </Button>
          </Link>
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

export default HowItWorks;