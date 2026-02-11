import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Eye, EyeOff } from 'lucide-react';
import { Checkbox } from '../components/ui/checkbox';

const SignupModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { switchToLogin } = useAuth();
  const navigate = useNavigate();

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

    try {
      // Check for referral code in localStorage or URL
      const storedRefCode = localStorage.getItem('referralCode');
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = storedRefCode || urlParams.get('ref');

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, referralCode, agreedToTerms }),
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
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
              <div className="flex items-center space-x-2">
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
              {error && <p className="text-red-500">{error}</p>}
              <Button type="submit" className="w-full" style={{ backgroundColor: '#2E235C' }}>Sign Up</Button>
            </form>
            <div className="mt-4 text-center">
              <p>Already have an account? <button onClick={switchToLogin} className="text-blue-500">Login</button></p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SignupModal;
