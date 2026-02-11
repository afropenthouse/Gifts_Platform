import { useAuth } from "@/context/AuthContext";

const Footer = () => {
  const { openLoginModal, openSignupModal } = useAuth();

  return (
    <footer className="py-8 px-4 md:px-6 bg-card border-t border-border/50">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
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
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/payment-policy" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  Payment Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Pages */}
          <div>
            <h4 className="font-medium text-foreground mb-3 md:mb-4">Other Pages</h4>
            <ul className="space-y-2 text-sm">
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
                <a href="/asoebi" className="text-muted-foreground hover:text-foreground transition-colors">
                  Sell Asoebi
                </a>
              </li>
              <li>
                <a href="/wedding-qr-code" className="text-muted-foreground hover:text-foreground transition-colors">
                  Wedding QR Code
                </a>
              </li>
              <li>
                <a href="/schedule-vendor-payments" className="text-muted-foreground hover:text-foreground transition-colors">
                  Manage Expenses
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
  );
};

export default Footer;