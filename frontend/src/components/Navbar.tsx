import { LogIn, UserPlus, User, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const Navbar = () => {
  const { user, logout, openLoginModal, openSignupModal } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-1 py-1">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 pl-8">
          {/* <img src="/logo3.png" alt="MyCashgift" className="h-28 w-auto" /> */}
            <img src="/logo2.png" alt="BeThere Weddings" className="h-10 w-auto" />
            {/* <span className="text-lg font-bold text-foreground hidden sm:block">mycashgift</span> */}
          </Link>

          {/* Desktop middle nav removed */}

          {/* Auth links */}
          <div className="hidden md:flex items-center gap-5">
            <Link to="/how-it-works" className="text-foreground hover:text-[#7a0f2a] transition-colors text-base font-medium">
              How it Works
            </Link>
            <Link to="/wedding-rsvp" className="text-foreground hover:text-[#7a0f2a] transition-colors text-base font-medium">
              RSVP
            </Link>
            <Link to="/collect-cash-gifts" className="text-foreground hover:text-[#7a0f2a] transition-colors text-base font-medium">
              Cash Gifts
            </Link>
            {/* <Link to="/wedding-qr-code" className="text-foreground hover:text-[#7a0f2a] transition-colors text-base font-medium">
              QR Code
            </Link>
            <Link to="/vendor-payment-tracker" className="text-foreground hover:text-[#7a0f2a] transition-colors text-base font-medium">
              Payment Tracker
            </Link> */}
            <Link to="/schedule-vendor-payments" className="text-foreground hover:text-[#7a0f2a] transition-colors text-base font-medium">
              Vendor Payments
            </Link>
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="hidden sm:flex text-base">
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-base">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <button onClick={openLoginModal} className="text-foreground hover:text-[#7a0f2a] transition-colors text-base font-medium">
                  Sign In
                </button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={openSignupModal}
                  className="text-base px-4"
                  style={{ backgroundColor: '#2E235C' }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-4 mt-8">
                  <Link to="/how-it-works" className="text-foreground hover:text-[#7a0f2a] transition-colors" onClick={() => setIsOpen(false)}>
                    How it Works
                  </Link>
                  <Link to="/wedding-rsvp" className="text-foreground hover:text-[#7a0f2a] transition-colors" onClick={() => setIsOpen(false)}>
                    RSVP
                  </Link>
                  <Link to="/collect-cash-gifts" className="text-foreground hover:text-[#7a0f2a] transition-colors" onClick={() => setIsOpen(false)}>
                    Cash Gifts
                  </Link>
                  {/* <Link to="/wedding-qr-code" className="text-foreground hover:text-[#7a0f2a] transition-colors" onClick={() => setIsOpen(false)}>
                    Wedding QR Code
                  </Link>
                  <Link to="/vendor-payment-tracker" className="text-foreground hover:text-[#7a0f2a] transition-colors" onClick={() => setIsOpen(false)}>
                    Wedding Expense Manager
                  </Link> */}
                  <Link to="/schedule-vendor-payments" className="text-foreground hover:text-[#7a0f2a] transition-colors" onClick={() => setIsOpen(false)}>
                    Vendor Payments
                  </Link>
                  {user ? (
                    <>
                      <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <User className="w-4 h-4 mr-2" />
                          Dashboard
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => { handleLogout(); setIsOpen(false); }} className="w-full justify-start">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => { openLoginModal(); setIsOpen(false); }} className="w-full justify-start">
                        <LogIn className="w-4 h-4 mr-2" />
                        Login
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => { openSignupModal(); setIsOpen(false); }}
                        className="w-full justify-start"
                        style={{ backgroundColor: '#2E235C' }}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Sign Up
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
