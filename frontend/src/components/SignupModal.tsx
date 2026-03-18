import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Eye, EyeOff } from 'lucide-react';
import { Checkbox } from '../components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';

interface CountryData {
  code: string;
  country: string;
  flag: string;
}

const SignupModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+234');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { switchToLogin } = useAuth();
  const navigate = useNavigate();

  const [countries, setCountries] = useState<CountryData[]>([]);
  const [countrySearch, setCountrySearch] = useState('');
  const [isCountryPopoverOpen, setIsCountryPopoverOpen] = useState(false);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/utils/country-codes`);
        const data = await res.json();
        setCountries(data);
      } catch (err) {
        console.error("Failed to fetch country codes", err);
        // Fallback to a minimal list if API fails
        setCountries([
          { code: '+234', country: 'Nigeria', flag: '' },
          { code: '+1', country: 'USA/Canada', flag: '' },
        ]);
      }
    };
    fetchCountries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError("Invalid email: missing '@' symbol");
      return;
    }

    const parts = email.split('@');
    if (parts.length > 1 && !parts[1].includes('.')) {
      setError("Invalid email: domain is missing '.' (e.g. .com)");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a complete and valid email address");
      return;
    }

    if (!agreedToTerms) {
      setError("Please agree to the Terms and Conditions to proceed");
      return;
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;

    try {
      // Check for referral code in localStorage or URL
      const storedRefCode = localStorage.getItem('referralCode');
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = storedRefCode || urlParams.get('ref');

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phoneNumber: fullPhoneNumber, referralCode, agreedToTerms }),
      });
      const data = await res.json();
      
      // Clear referral code after successful signup attempt (optional, but good practice)
      if (res.ok) {
        localStorage.removeItem('referralCode');
        setMessage(data.msg);
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          setError(data.errors.map((err: any) => err.msg).join(', '));
        } else {
          setError(data.msg || 'Signup failed');
        }
      }
    } catch (err) {
      setError('Server error');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign Up</DialogTitle>
        </DialogHeader>
        {message ? (
          <div className="text-center">
            <p className="text-green-500 font-semibold">{message}</p>
            <p className="text-gray-600 mt-4">
              Please check your email for a verification link to complete your registration.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              The link will expire in 24 hours.
            </p>
            <Button onClick={onClose} className="mt-4" style={{ backgroundColor: '#2E235C' }}>Close</Button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-2">
              <div>
                <Label htmlFor="name" className="text-xs font-medium">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber" className="text-xs font-medium">Phone Number</Label>
                <div className="flex gap-2">
                  <div className="w-[140px]">
                    <Popover open={isCountryPopoverOpen} onOpenChange={setIsCountryPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isCountryPopoverOpen}
                          className="w-full justify-between px-2 h-9"
                        >
                          {countryCode ? (
                            <span className="truncate flex items-center gap-2">
                              {(() => {
                                const flagUrl = countries.find((c) => c.code === countryCode)?.flag;
                                return flagUrl ? <img src={flagUrl} alt="" className="w-5 h-auto rounded-sm" /> : null;
                              })()}
                              <span className="text-xs">{countryCode}</span>
                            </span>
                          ) : (
                            "Code"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[250px] p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Search country..." 
                            value={countrySearch}
                            onValueChange={setCountrySearch}
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup>
                              {countries.map((country) => (
                                <CommandItem
                                  key={`${country.country}-${country.code}`}
                                  value={`${country.country} ${country.code}`}
                                  onSelect={() => {
                                    setCountryCode(country.code);
                                    setIsCountryPopoverOpen(false);
                                  }}
                                  className="text-xs"
                                >
                                  <span className="mr-2">{country.flag && <img src={country.flag} alt={country.country} className="w-4 h-3 inline-block" />}</span>
                                  <span>{country.country} ({country.code})</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="8012345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    required
                    className="flex-1 h-9"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10 h-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <Checkbox 
                  id="terms" 
                  checked={agreedToTerms} 
                  onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                />
                <Label 
                  htmlFor="terms" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the{' '}
                  <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    Terms and Conditions
                  </Link>
                </Label>
              </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <Button type="submit" className="w-full !mt-3" style={{ backgroundColor: '#2E235C' }}>Sign Up</Button>
            </form>
            <div className="mt-3 text-center">
              <p className="text-sm">Already have an account? <button onClick={switchToLogin} className="text-blue-500">Login</button></p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SignupModal;
