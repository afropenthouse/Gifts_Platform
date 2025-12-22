import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
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
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [contributorName, setContributorName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading gift details...</p>
          </div>
        </div>
      </div>
    );

  if (!gift)
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-4xl text-gray-400">!</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-800">Gift Not Found</h1>
            <p className="text-gray-600 max-w-md">
              The gift link you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-champagne/30 via-white to-rose/10">
      <Navbar />

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <div className="w-full max-w-md">
          {/* Gift Card */}
          <Card className="border-0 shadow-card rounded-2xl overflow-hidden bg-white">
            <div className="relative h-80 bg-gradient-to-r from-primary/10 to-primary/5">
              {gift.picture && (
                <img
                  src={gift.picture}
                  alt="Event"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-xl font-bold text-white mb-2">
                  {gift.title || `${gift.user.name}'s ${gift.type === 'other' ? gift.customType : gift.type}`}
                </h1>
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-0">
                  {gift.type === 'other' ? gift.customType : gift.type}
                </Badge>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="space-y-4">
                {gift.description && (
                  <p className="text-gray-700 leading-relaxed">{gift.description}</p>
                )}

                <div className="pt-4 border-t border-gray-100">
                  <div className="space-y-2">
                    {gift.date && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm text-gray-600">
                          {new Date(gift.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    )}

                    {gift.type === 'wedding' && gift.details && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm text-gray-600 font-medium">
                          {gift.details.groomName} & {gift.details.brideName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <form onSubmit={handleAmountSubmit} className="space-y-4 pt-4">
                  <div>
                    <Label className="text-gray-700 font-medium block mb-2">
                      Select Currency
                    </Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="w-full h-11 rounded-lg border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NGN">₦ Nigerian Naira</SelectItem>
                        <SelectItem value="USD">$ US Dollar</SelectItem>
                        <SelectItem value="CAD">C$ Canadian Dollar</SelectItem>
                        <SelectItem value="EUR">€ Euro</SelectItem>
                        <SelectItem value="GBP">£ British Pound</SelectItem>
                        <SelectItem value="AUD">A$ Australian Dollar</SelectItem>
                        <SelectItem value="ZAR">R South African Rand</SelectItem>
                        <SelectItem value="KES">KSh Kenyan Shilling</SelectItem>
                        <SelectItem value="GHS">₵ Ghanaian Cedi</SelectItem>
                        <SelectItem value="UGX">USh Ugandan Shilling</SelectItem>
                        <SelectItem value="TZS">TSh Tanzanian Shilling</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-700 font-medium block mb-2">
                      Gift Amount
                    </Label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-medium">
                        {currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'CAD' ? 'C$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'AUD' ? 'A$' : currency === 'ZAR' ? 'R' : currency === 'KES' ? 'KSh' : currency === 'GHS' ? '₵' : currency === 'UGX' ? 'USh' : 'TSh'}
                      </div>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min={currency === 'NGN' ? '100' : '1'}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="pl-12 h-12 text-lg font-semibold rounded-lg border-gray-200"
                        required
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Minimum: {currency === 'NGN' ? '₦100' : currency === 'USD' ? '$1' : currency === 'CAD' ? 'C$1' : currency === 'EUR' ? '€1' : currency === 'GBP' ? '£1' : currency === 'AUD' ? 'A$1' : currency === 'ZAR' ? 'R1' : currency === 'KES' ? 'KSh1' : currency === 'GHS' ? '₵1' : currency === 'UGX' ? 'USh1' : 'TSh1'}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 text-lg font-semibold rounded-lg"
                  >
                    Send a cash gift
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Name/Anonymous Modal */}
      <Dialog open={showNameModal} onOpenChange={setShowNameModal}>
        <DialogContent className="max-w-md rounded-2xl border-0 shadow-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">
                How would you like to appear?
              </DialogTitle>
              <p className="text-gray-600 text-sm mt-1">
                Choose how your name will be shown to the recipient
              </p>
            </DialogHeader>
          </div>
          
          <form onSubmit={handlePayment} className="p-6 space-y-6">
            {/* Amount Display */}
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-1">Your Gift Amount</p>
              <p className="text-3xl font-bold text-gray-900">
                {currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'CAD' ? 'C$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'AUD' ? 'A$' : currency === 'ZAR' ? 'R' : currency === 'KES' ? 'KSh' : currency === 'GHS' ? '₵' : currency === 'UGX' ? 'USh' : 'TSh'}
                {amount}
              </p>
            </div>

            {/* Gift Amount Summary */}
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Gift Amount: {currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'CAD' ? 'C$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'AUD' ? 'A$' : currency === 'ZAR' ? 'R' : currency === 'KES' ? 'KSh' : currency === 'GHS' ? '₵' : currency === 'UGX' ? 'USh' : 'TSh'}{amount}
              </p>
            </div>

            {/* Name Input */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-medium">
                  Your Name
                </Label>
                <Input
                  id="name"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={isAnonymous}
                  className="h-12 rounded-lg border-gray-200"
                />
              </div>

              {/* Anonymous Option */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <div className="flex-1">
                  <Label htmlFor="anonymous" className="text-gray-700 font-medium">
                    Give anonymously
                  </Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Your name will not be shown to the recipient
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                type="submit"
                size="lg"
                className="w-full h-12 rounded-lg font-semibold"
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <span className="flex items-center justify-center">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Processing...
                  </span>
                ) : (
                  'Complete Your Gift'
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNameModal(false)}
                className="w-full h-12 rounded-lg"
              >
                Back to Edit Amount
              </Button>
            </div>

            {/* Security Note */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                You will be redirected to Flutterwave for secure payment processing
              </p>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShareGift;