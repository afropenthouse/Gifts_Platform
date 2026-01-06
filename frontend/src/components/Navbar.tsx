import { LogIn, UserPlus, User, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-1 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/mcg.png" alt="MyCashgift" className="h-14 w-24" />
          </Link>

          {/* Desktop middle nav removed */}

          {/* Auth links */}
          <div className="hidden md:flex items-center gap-5">
            <Link to="/how-it-works" className="text-foreground hover:text-[#7a0f2a] transition-colors text-base font-medium">
              How it Works
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
                <Link to="/login" className="text-foreground hover:text-[#7a0f2a] transition-colors text-base font-medium">
                  Sign In
                </Link>
                <Link to="/signup">
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-4"
                  >
                    Sign Up
                  </Button>
                </Link>
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
                      <Link to="/login" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <LogIn className="w-4 h-4 mr-2" />
                          Login
                        </Button>
                      </Link>
                      <Link to="/signup" onClick={() => setIsOpen(false)}>
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Sign Up
                        </Button>
                      </Link>
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
