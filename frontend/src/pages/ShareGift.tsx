import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import Navbar from '../components/Navbar';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Users, Gift } from 'lucide-react';

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
  _count?: { contributions: number };
}

const ShareGift: React.FC = () => {
  const { link } = useParams<{ link: string }>();
  const [searchParams] = useSearchParams();
  const [gift, setGift] = useState<Gift | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [contributorName, setContributorName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const heading = gift?.title || (gift?.details?.groomName && gift?.details?.brideName 
    ? `${gift.details.groomName} & ${gift.details.brideName}`
    : gift?.user?.name || "Special Celebration");

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
        alert('Thank you! Your gift was successful.');
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

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const minAmount = currency === 'NGN' ? 100 : 1;
    if (!amount || parseFloat(amount) < minAmount) {
      const currencySymbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'CAD' ? 'C$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'AUD' ? 'A$' : currency === 'ZAR' ? 'R' : currency === 'KES' ? 'KSh' : currency === 'GHS' ? '₵' : currency === 'UGX' ? 'USh' : 'TSh';
      alert(`Please enter an amount of at least ${currencySymbol}${minAmount}`);
      return;
    }

    setShowAmountModal(false);
    setShowNameModal(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAnonymous && !contributorName.trim()) {
      alert('Please enter your name or choose to give anonymously');
      return;
    }

    setProcessingPayment(true);

    try {
      const name = isAnonymous ? 'Anonymous Contributor' : contributorName;
      const email = isAnonymous ? `anonymous-${Date.now()}@giftlink.com` : `contributor-${Date.now()}@giftlink.com`;

      // Initialize payment
      const initRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/contributions/${link}/initialize-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contributorName: name,
            contributorEmail: email,
            amount: parseFloat(amount),
            currency: currency,
            message: isAnonymous ? 'Anonymous contribution' : `Contribution from ${name}`,
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
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Loading gift details...</p>
          </div>
        </div>
      </div>
    );

  if (!gift)
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
              <span className="text-4xl text-muted-foreground">!</span>
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Gift Not Found</h1>
            <p className="text-muted-foreground max-w-md">
              The gift link you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </div>
      </div>
    );

  const giftersCount = gift._count?.contributions || 0;
  const formattedDate = gift.date ? new Date(gift.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <div className="w-full max-w-md">
          {/* Gift Card - Same style as home page */}
          <div className="bg-gradient-card rounded-2xl shadow-card overflow-hidden border border-border/50 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="relative h-[20rem] w-full overflow-hidden">
              {gift.picture && (
                <img
                  src={gift.picture}
                  alt={heading}
                  className="w-full h-full object-cover object-top"
                />
              )}
            </div>

            <div className="p-9 -mt-12">
              <div className="text-center mb-4">
                <h2 className="font-serif text-3xl font-semibold text-foreground tracking-wide py-4">
                  {heading}
                </h2>
                <p className="text-muted-foreground text-sm -mt-1 font-sans">{formattedDate}</p>
              </div>

              <div className="flex justify-center py-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-card/80 backdrop-blur-sm px-4 py-2 shadow-soft border border-border/50">
                  <Users className="w-4 h-4 text-rose" />
                  <span className="font-semibold text-sm font-sans">{giftersCount}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Gifters</span>
                </div>
              </div>

              <div className="mt-1">
                <Button 
                  variant="gold" 
                  className="w-full" 
                  size="lg" 
                  onClick={() => setShowAmountModal(true)}
                >
                  <Gift className="w-5 h-5 mr-[0.1rem]" />
                  Send a cash gift
                </Button>
              </div>
            </div>
          </div>

          {/* Description - shown below card if available */}
          {gift.description && (
            <div className="mt-6 p-4 bg-card rounded-lg border border-border/50">
              <p className="text-muted-foreground text-sm">{gift.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Amount Modal */}
      <Dialog open={showAmountModal} onOpenChange={setShowAmountModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif text-center">{heading}</DialogTitle>
            <div className="text-center text-muted-foreground text-sm mt-1">
              Enter the gift amount
            </div>
          </DialogHeader>

          <form onSubmit={handleAmountSubmit} className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Gift Amount</Label>
              <div className="flex gap-2 mt-2">
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">₦ NGN</SelectItem>
                    <SelectItem value="USD">$ USD</SelectItem>
                    <SelectItem value="CAD">C$ CAD</SelectItem>
                    <SelectItem value="EUR">€ EUR</SelectItem>
                    <SelectItem value="GBP">£ GBP</SelectItem>
                    <SelectItem value="AUD">A$ AUD</SelectItem>
                    <SelectItem value="ZAR">R ZAR</SelectItem>
                    <SelectItem value="KES">KSh KES</SelectItem>
                    <SelectItem value="GHS">₵ GHS</SelectItem>
                    <SelectItem value="UGX">USh UGX</SelectItem>
                    <SelectItem value="TZS">TSh TZS</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min={currency === 'NGN' ? '100' : '1'}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={currency === 'NGN' ? '100' : '1'}
                  className="flex-1 text-lg"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Minimum {currency === 'NGN' ? '₦100' : currency === 'USD' ? '$1' : currency === 'CAD' ? 'C$1' : currency === 'EUR' ? '€1' : currency === 'GBP' ? '£1' : currency === 'AUD' ? 'A$1' : currency === 'ZAR' ? 'R1' : currency === 'KES' ? 'KSh1' : currency === 'GHS' ? '₵1' : currency === 'UGX' ? 'USh1' : 'TSh1'}
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
            >
              Send Gift {currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'CAD' ? 'C$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'AUD' ? 'A$' : currency === 'ZAR' ? 'R' : currency === 'KES' ? 'KSh' : currency === 'GHS' ? '₵' : currency === 'UGX' ? 'USh' : 'TSh'}{amount || '0'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Name/Anonymous Modal */}
      <Dialog open={showNameModal} onOpenChange={setShowNameModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-serif text-center">How would you like to appear?</DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePayment} className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Your Name</Label>
                <Input
                  id="name"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={isAnonymous}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="anonymous" className="text-sm">Give anonymously</Label>
              </div>
            </div>

            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Gift Amount: {currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'CAD' ? 'C$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'AUD' ? 'A$' : currency === 'ZAR' ? 'R' : currency === 'KES' ? 'KSh' : currency === 'GHS' ? '₵' : currency === 'UGX' ? 'USh' : 'TSh'}{amount}
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={processingPayment}
            >
              {processingPayment ? 'Processing...' : 'Complete Gift'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              💳 Powered by Flutterwave - Secure payment processing
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShareGift;