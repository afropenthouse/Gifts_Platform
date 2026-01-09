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
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [rsvpStep, setRsvpStep] = useState(1);
  const [willAttend, setWillAttend] = useState<boolean | null>(null);
  const [rsvpFirstName, setRsvpFirstName] = useState('');
  const [rsvpLastName, setRsvpLastName] = useState('');
  const [rsvpEmail, setRsvpEmail] = useState('');
  const [rsvpError, setRsvpError] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'checking' | 'success' | 'error' | null>(null);
  const [verifyMessage, setVerifyMessage] = useState('');

  useEffect(() => {
    document.title = "MyCashGift - Collect RSVPs & Cash Gifts for your Wedding";
  }, []);
  const [showRsvpThanks, setShowRsvpThanks] = useState(false);
  const [rsvpThanksMessage, setRsvpThanksMessage] = useState('');
  const [showCashGiftPrompt, setShowCashGiftPrompt] = useState(false);

  const heading = gift?.type === 'wedding' && gift?.details?.groomName && gift?.details?.brideName
    ? `${gift.details.groomName} & ${gift.details.brideName}`
    : gift?.title || gift?.user?.name || "Special Celebration";

  // Handle redirect back from Flutterwave: verify payment
  useEffect(() => {
    const txId = searchParams.get('transaction_id');
    const txRef = searchParams.get('tx_ref');
    const status = searchParams.get('status');
    
    // Use tx_ref if available, otherwise transaction_id
    const transactionIdentifier = txRef || txId;
    
    if (!link || !transactionIdentifier) return;

    setShowVerifyModal(true);
    setVerifyStatus('checking');
    setVerifyMessage('Confirming your payment...');

    const verify = async () => {
      try {
        console.log('Verifying payment with:', { transactionIdentifier, status });
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/contributions/${link}/verify-payment`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              transactionId: transactionIdentifier,
              txRef: txRef,
              status: status 
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) {
          setVerifyStatus('error');
          setVerifyMessage(data?.msg || 'Payment verification failed');
          return;
        }
        setVerifyStatus('success');
        setVerifyMessage('Thank you! Your gift was successful.');
      } catch (err) {
        console.error(err);
        setVerifyStatus('error');
        setVerifyMessage('Could not verify payment.');
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
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <div className="w-full max-w-md">
          {/* Gift Card - Same style as home page */}
          <div className="bg-gradient-card rounded-2xl shadow-card overflow-hidden border border-border/50 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="relative w-full overflow-hidden bg-black/5">
              {gift.picture && (
                <img
                  src={gift.picture}
                  alt={heading}
                  className="w-full h-auto object-contain"
                />
              )}

              <div className="absolute inset-0 flex items-end">
                <div className="w-full p-4 pb-6 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                  <div className="space-y-3">
                    <Button
                      className="w-full bg-black text-white border border-black hover:bg-white hover:text-black transition-colors"
                      size="lg"
                      onClick={() => {
                        setShowRsvpModal(true);
                        setRsvpStep(1);
                        setWillAttend(null);
                        setRsvpFirstName('');
                        setRsvpLastName('');
                      }}
                    >
                      <span className='font-thin'>RSVP</span>
                    </Button>

                    <Button
                      className="w-full text-white"
                      size="lg"
                      onClick={() => setShowAmountModal(true)}
                      style={{ backgroundColor: '#2E235C' }}
                    >
                      <Gift className="w-5 h-5 mr-[0.00007rem]" />
                      <span className='font-thin'>Send a Cash Gift</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description - shown below card if available */}
          {/* {gift.description && (
            <div className="mt-6 p-4 bg-card rounded-lg border border-border/50">
              <p className="text-muted-foreground text-sm">{gift.description}</p>
            </div>
          )} */}
        </div>
      </div>

      {/* Amount Modal */}
      <Dialog open={showAmountModal} onOpenChange={setShowAmountModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-playfair text-center">{heading}</DialogTitle>
            <div className="text-center text-muted-foreground text-sm mt-1 font-playfair">
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
              Proceed
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Name/Anonymous Modal */}
      <Dialog open={showNameModal} onOpenChange={setShowNameModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-playfair text-center">How would you like to appear?</DialogTitle>
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

            <div>
              
            </div>

            {/* <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Gift Amount: {currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'CAD' ? 'C$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'AUD' ? 'A$' : currency === 'ZAR' ? 'R' : currency === 'KES' ? 'KSh' : currency === 'GHS' ? '₵' : currency === 'UGX' ? 'USh' : 'TSh'}{amount}
              </p>
            </div> */}

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

      {/* RSVP Modal */}
      <Dialog open={showRsvpModal} onOpenChange={(open) => {
        setShowRsvpModal(open);
        if (!open) {
          setRsvpStep(1);
          setWillAttend(null);
          setRsvpFirstName('');
          setRsvpLastName('');
          setRsvpEmail('');
          setRsvpError('');
        }
      }}>
        <DialogContent className="max-w-[19rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-playfair text-center">{heading}</DialogTitle>
          </DialogHeader>

          {rsvpStep === 1 && (
            <form onSubmit={async (e) => {
              e.preventDefault();
              setRsvpError('');
              
              if (!rsvpFirstName.trim() || !rsvpLastName.trim()) {
                setRsvpError('Please enter both first and last name');
                return;
              }
              
              // Check if names are on the guest list
              try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/guests/check/${link}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    firstName: rsvpFirstName,
                    lastName: rsvpLastName,
                  }),
                });
                const data = await res.json();
                
                if (!res.ok) {
                  setRsvpError(data.msg || 'Failed to verify guest. Please try again.');
                  return;
                }
                
                // If names are valid, proceed to step 2
                setRsvpStep(2);
              } catch (err) {
                console.error(err);
                setRsvpError('Error verifying guest. Please try again.');
              }
            }} className="py-6">
              <div className="space-y-4">
                {rsvpError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700 font-medium">{rsvpError}</p>
                  </div>
                )}
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-900 mb-2 block">
                    First name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={rsvpFirstName}
                    onChange={(e) => setRsvpFirstName(e.target.value)}
                    className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-900 mb-2 block">
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={rsvpLastName}
                    onChange={(e) => setRsvpLastName(e.target.value)}
                    className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                    placeholder="Enter your last name"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => {
                    setShowRsvpModal(false);
                    setRsvpFirstName('');
                    setRsvpLastName('');
                    setRsvpEmail('');
                  }}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-gradient-to-r from-[#2E235C] to-[#2E235C]"
                >
                  Continue
                </Button>
              </div>
            </form>
          )}

        
          {rsvpStep === 2 && (
            <form onSubmit={(e) => {
              e.preventDefault();
              setRsvpStep(3);
            }} className="py-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-900 mb-2 block">
                    Enter your email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={rsvpEmail}
                    onChange={(e) => setRsvpEmail(e.target.value)}
                    className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => setRsvpStep(1)}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-gradient-to-r from-[#2E235C] to-[#2E235C]"
                >
                  Continue
                </Button>
              </div>
            </form>
          )}

          {rsvpStep === 3 && (
            <div className="py-6">
              <h3 className="text-sm font-medium text-center mb-6">Will you attend?</h3>
              <div className="flex gap-4">
                <Button
                  onClick={async () => {
                    setWillAttend(true);
                    // Submit RSVP to backend
                    try {
                      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/guests/rsvp/${link}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          firstName: rsvpFirstName,
                          lastName: rsvpLastName,
                          email: rsvpEmail,
                          attending: true,
                        }),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        setShowRsvpModal(false);
                        setShowCashGiftPrompt(true);
                        setRsvpStep(1);
                        setRsvpFirstName('');
                        setRsvpLastName('');
                        setRsvpEmail('');
                      } else {
                        alert(data.msg || 'Failed to submit RSVP. Please try again.');
                      }
                    } catch (err) {
                      console.error(err);
                      alert('Error submitting RSVP');
                    }
                  }}
                  className="flex-1 h-12 bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90"
                >
                  Yes
                </Button>
                <Button
                  onClick={async () => {
                    setWillAttend(false);
                    // Submit RSVP to backend
                    try {
                      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/guests/rsvp/${link}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          firstName: rsvpFirstName,
                          lastName: rsvpLastName,
                          email: rsvpEmail,
                          attending: false,
                        }),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        setShowRsvpModal(false);
                        setShowCashGiftPrompt(true);
                        setRsvpStep(1);
                        setRsvpFirstName('');
                        setRsvpLastName('');
                        setRsvpEmail('');
                      } else {
                        alert(data.msg || 'Failed to submit RSVP. Please try again.');
                      }
                    } catch (err) {
                      console.error(err);
                      alert('Error submitting RSVP');
                    }
                  }}
                  variant="outline"
                  className="flex-1 h-12 border-gray-300 hover:bg-gray-100"
                >
                  No
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cash Gift Prompt Modal */}
      <Dialog open={showCashGiftPrompt} onOpenChange={setShowCashGiftPrompt}>
        <DialogContent className="max-w-[19rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-playfair text-center">{heading}</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <h3 className="text-sm font-medium text-center mb-6">Will you like to send a cash gift?</h3>
            <div className="flex gap-4">
              <Button
                className="flex-1 h-12 bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90"
                onClick={() => {
                  setShowCashGiftPrompt(false);
                  setShowAmountModal(true);
                }}
              >
                Yes
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-12 border-gray-300 hover:bg-gray-100"
                onClick={() => {
                  setShowCashGiftPrompt(false);
                  setRsvpThanksMessage('Thank you for responding');
                  setShowRsvpThanks(true);
                }}
              >
                No
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* RSVP Thanks Modal */}
      <Dialog open={showRsvpThanks} onOpenChange={(open) => setShowRsvpThanks(open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-playfair text-center">{heading}</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-base text-muted-foreground">{rsvpThanksMessage}</p>
          </div>
          <div className="pt-2">
            <Button className="w-full" onClick={() => setShowRsvpThanks(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment verification modal */}
      <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {verifyStatus === 'checking' && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span>{verifyMessage || 'Confirming your payment...'}</span>
              </div>
            )}

            {verifyStatus === 'success' && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
                {verifyMessage || 'Payment verified successfully.'}
              </div>
            )}

            {verifyStatus === 'error' && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
                {verifyMessage || 'Payment verification failed.'}
              </div>
            )}

            {verifyStatus === 'success' && (
              <Button className="w-full" onClick={() => setShowVerifyModal(false)}>
                Continue
              </Button>
            )}

            {verifyStatus === 'error' && (
              <div className="space-y-2">
                <Button variant="outline" className="w-full" onClick={() => setShowVerifyModal(false)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShareGift;