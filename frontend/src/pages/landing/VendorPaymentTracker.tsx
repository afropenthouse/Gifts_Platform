import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const VendorPaymentTracker = () => {
  const { openSignupModal } = useAuth();

  useEffect(() => {
    document.title = "Wedding Vendor Payment Tracker - BeThere Weddings";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <section className="py-12 px-4 md:py-16 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8 md:mb-10">
            <h1 className="font-serif text-3xl md:text-5xl font-semibold text-foreground mb-4">
              Wedding Vendor Payment Tracker
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Track all your wedding vendor payments in one place.
            </p>
          </div>

          <div className="prose prose-lg mx-auto text-center mb-8">
            <p className="text-muted-foreground leading-relaxed mb-6">
              Managing wedding vendors often means juggling payments, balances, and due dates across different conversations and spreadsheets.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Be There Weddings gives couples and event planners a simple way to track vendor costs and payments in one dashboard.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              With the Vendor Payment Tracker, you can:
            </p>
            <ul className="list-disc list-inside text-muted-foreground leading-relaxed mb-6 text-left max-w-2xl mx-auto">
              <li>Add vendors by category (planner, photographer, decorator, etc.)</li>
              <li>Record total vendor charges</li>
              <li>Track how much has been paid</li>
              <li>See outstanding balances</li>
              <li>Monitor due dates at a glance</li>
              <li>Automatically calculate total wedding spend</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-8">
              No more confusion. No more forgotten balances. Just clear visibility into your wedding expenses.
            </p>
          </div>

          <div className="text-center">
            <Button
              variant="hero"
              size="lg"
              className="px-8 py-6 text-primary text-base md:text-lg"
              style={{ backgroundColor: '#ffff' }}
              onClick={openSignupModal}
            >
              Track Vendor Payments
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 md:px-6 bg-card border-t border-border/50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Brand Section */}
            <div>
              <img src="/logo2.png" alt="BeThere" className="h-10 w-auto mb-3 md:mb-4" />
              <p className="text-sm text-muted-foreground">
                One trusted link to RSVP and receive all your cash gifts in one place.
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
                  <a href="/wedding-rsvp" className="text-muted-foreground hover:text-foreground transition-colors">
                    Wedding RSVP
                  </a>
                </li>
                <li>
                  <a href="/collect-cash-gifts" className="text-muted-foreground hover:text-foreground transition-colors">
                    Collect Cash Gifts
                  </a>
                </li>
                <li>
                  <a href="/wedding-qr-code" className="text-muted-foreground hover:text-foreground transition-colors">
                    Wedding QR Code
                  </a>
                </li>
                <li>
                  <a href="/vendor-payment-tracker" className="text-muted-foreground hover:text-foreground transition-colors">
                    Vendor Payment Tracker
                  </a>
                </li>
                <li>
                  <a href="/schedule-vendor-payments" className="text-muted-foreground hover:text-foreground transition-colors">
                    Schedule Vendor Payments
                  </a>
                </li>
                <li>
                  <button onClick={() => window.location.href = '/'} className="text-muted-foreground hover:text-foreground transition-colors">
                    Login
                  </button>
                </li>
                <li>
                  <button onClick={openSignupModal} className="text-muted-foreground hover:text-foreground transition-colors">
                    Sign Up
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-medium text-foreground mb-3 md:mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="mailto:teambethere@gmail.com"
                    className="text-muted-foreground hover:text-foreground transition-colors break-words"
                  >
                    teambethere@gmail.com
                  </a>
                </li>
                <li className="text-muted-foreground">
                  <a href="tel:+2348056679806" className="hover:text-foreground transition-colors">
                    +234 805 667 9806
                  </a>
                </li>
                <li className="text-muted-foreground">Chevy- View Estate, Lekki</li>
                <li className="text-muted-foreground">Mon-Fri 9AM-6PM WAT</li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-8 pt-6 md:pt-8 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              © 2026 BeThere Weddings. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VendorPaymentTracker;