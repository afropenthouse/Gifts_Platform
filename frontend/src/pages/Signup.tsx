import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import Navbar from '../components/Navbar';

const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [message, setMessage] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [error, setError] = useState('');
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
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, agreedToTerms }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.msg);
        if (data.verificationUrl) setVerificationUrl(data.verificationUrl);
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] py-8">
        <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Create your account</CardDescription>
        </CardHeader>
        <CardContent>
          {message ? (
            <div className="text-center">
              <p className="text-green-500 font-semibold">{message}</p>
              <p className="text-gray-600 mt-4">
                Please check your email for a verification link to complete your registration.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                The link will expire in 24 hours.
              </p>
            </div>
          ) : (
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
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
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
          )}
          <div className="mt-4 text-center">
            <p>Already have an account? <Link to="/login" className="text-blue-500">Login</Link></p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Signup;