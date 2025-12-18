import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

declare global {
  interface Window {
    FlutterwaveCheckout: any;
  }
}

interface Gift {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  picture: string;
  details: any;
  customType?: string;
  user: { name: string; profilePicture: string };
}

const ShareGift: React.FC = () => {
  const { link } = useParams<{ link: string }>();
  const [searchParams] = useSearchParams();
  const [gift, setGift] = useState<Gift | null>(null);
  const [loading, setLoading] = useState(true);
  const [contributorName, setContributorName] = useState('');
  const [contributorEmail, setContributorEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Handle redirect back from Flutterwave: verify payment
  useEffect(() => {
    const txId = searchParams.get('transaction_id');
    const status = searchParams.get('status');
    if (!link || !txId) return;

    const verify = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/contributions/${link}/verify-payment`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionId: txId }),
          }
        );
        const data = await res.json();
        if (!res.ok) {
          alert(data?.msg || 'Payment verification failed');
          return;
        }
        alert('Thank you! Your contribution was successful.');
      } catch (err) {
        console.error(err);
        alert('Could not verify payment.');
      }
    };

    verify();
  }, [searchParams, link]);

  useEffect(() => {
    // Load Flutterwave script
    if (!window.FlutterwaveCheckout) {
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const fetchGift = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gifts/${link}`);
        if (!res.ok) throw new Error('Gift not found');
        const data = await res.json();
        setGift(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (link) fetchGift();
  }, [link]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contributorName || !contributorEmail || !amount) {
      alert('Please fill in all fields');
      return;
    }

    setProcessingPayment(true);

    try {
      // Initialize payment
      const initRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/contributions/${link}/initialize-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contributorName,
            contributorEmail,
            amount: parseFloat(amount),
            message,
          }),
        }
      );

      const initData = await initRes.json();
      if (!initRes.ok) {
        const msg = initData?.msg || initData?.error?.message || (typeof initData?.error === 'string' ? initData.error : JSON.stringify(initData?.error)) || 'Failed to initialize payment';
        throw new Error(msg);
      }

      // Redirect to Flutterwave payment
      if (initData.data && initData.data.link) {
        window.location.href = initData.data.link;
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Payment initialization failed');
      setProcessingPayment(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p>Loading...</p>
        </div>
      </div>
    );

  if (!gift)
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-lg">Gift not found</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Gift Display Section */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                {gift.user.profilePicture && (
                  <img
                    src={gift.user.profilePicture}
                    alt={gift.user.name}
                    className="w-24 h-24 rounded-full mx-auto border-4 border-primary"
                  />
                )}
                <div>
                  <h1 className="text-3xl font-serif font-semibold mb-2">
                    {gift.user.name}'s {gift.type === 'other' ? gift.customType : gift.type}
                  </h1>
                  <Badge className="mb-4">
                    {gift.type === 'other' ? gift.customType : gift.type}
                  </Badge>
                </div>

                {gift.picture && (
                  <img
                    src={gift.picture}
                    alt="Event"
                    className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                  />
                )}

                {gift.title && (
                  <div>
                    <h2 className="text-2xl font-semibold">{gift.title}</h2>
                  </div>
                )}

                {gift.description && (
                  <p className="text-lg text-muted-foreground">{gift.description}</p>
                )}

                {gift.date && (
                  <p className="text-sm">
                    <strong>Date:</strong> {new Date(gift.date).toLocaleDateString()}
                  </p>
                )}

                {gift.type === 'wedding' && gift.details && (
                  <p className="text-lg font-semibold">
                    💍 {gift.details.groomName} & {gift.details.brideName}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contribution Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Make a Contribution</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Help make their special day even more memorable
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePayment} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Your Name *</Label>
                    <Input
                      id="name"
                      value={contributorName}
                      onChange={(e) => setContributorName(e.target.value)}
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Your Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contributorEmail}
                      onChange={(e) => setContributorEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="amount">Amount to Contribute (₦) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Minimum ₦100"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum contribution: ₦100
                  </p>
                </div>

                <div>
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a message (optional)"
                    rows={4}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={processingPayment}
                >
                  {processingPayment ? 'Processing...' : `Contribute ₦${amount || '0'}`}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  💳 Powered by Flutterwave - Secure payment processing
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShareGift;