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
import confetti from 'canvas-confetti';

declare global {
  interface Window {
    PaystackPop: any;
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
  guestListMode?: string;
}

const ShareGift: React.FC = () => {
  const { link, slug, id } = useParams<{ link?: string; slug?: string; id?: string }>();
  const linkParam = link ?? (slug && id ? `${slug}/${id}` : undefined);
  const [searchParams] = useSearchParams();
  const [gift, setGift] = useState<Gift | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [contributorName, setContributorName] = useState('');
  const [contributorEmail, setContributorEmail] = useState('');
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
    document.title = "BeThere Weddings - Collect RSVPs & Cash Gifts for your Wedding";
  }, []);
  const [showRsvpThanks, setShowRsvpThanks] = useState(false);
  const [rsvpThanksMessage, setRsvpThanksMessage] = useState('');
  const [showCashGiftPrompt, setShowCashGiftPrompt] = useState(false);
  const [guestAllowed, setGuestAllowed] = useState<number | null>(null);
  const [hasGuests, setHasGuests] = useState<boolean | null>(null);
  const [additionalGuests, setAdditionalGuests] = useState<number>(0);
  const [showRsvpErrorModal, setShowRsvpErrorModal] = useState(false);
  const [rsvpErrorMessage, setRsvpErrorMessage] = useState('');

  const heading = gift?.type === 'wedding' && gift?.details?.groomName && gift?.details?.brideName
    ? `${gift.details.brideName} & ${gift.details.groomName}`
    : gift?.title || gift?.user?.name || "Special Celebration";

  // Handle redirect back from Paystack: verify payment
  useEffect(() => {
    const txId = searchParams.get('transaction_id');
    const txRef = searchParams.get('tx_ref');
    const reference = searchParams.get('reference'); // Paystack returns 'reference'
    const status = searchParams.get('status');
    
    // Paystack returns 'reference', but also support tx_ref and transaction_id for other payment providers
    const transactionIdentifier = reference || txRef || txId;
    
    if (!linkParam || !transactionIdentifier) return;

    setShowVerifyModal(true);
    setVerifyStatus('checking');
    setVerifyMessage('Confirming your payment...');

    const verify = async () => {
      try {
        console.log('Verifying payment with:', { transactionIdentifier, status });
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/contributions/${linkParam}/verify-payment`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              transactionId: transactionIdentifier,
              reference: transactionIdentifier,
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
  }, [searchParams, linkParam]);

  useEffect(() => {
    // Load Paystack script
    if (!window.PaystackPop) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const fetchGift = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gifts/${linkParam}`);
        if (!res.ok) throw new Error('Gift not found');
        const data = await res.json();
        setGift(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (linkParam) fetchGift();
  }, [linkParam]);

  // Update meta tags for social previews when gift loads
  useEffect(() => {
    if (!gift) return;

    const setMeta = (selector: {attr: string; name: string}, value: string) => {
      const { attr, name } = selector;
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (el) {
        el.setAttribute('content', value);
      } else {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        el.setAttribute('content', value);
        document.head.appendChild(el);
      }
    };

    const title = heading;
    const baseDescription = gift.description ? String(gift.description).trim() : '';
    const description = baseDescription ? `${title} — ${baseDescription}` : `${title} — Join us and send a cash gift using this RSVP link.`;
    const image = gift.picture || '/logo2.png';

    // Title
    document.title = `${title} — BeThere Weddings`;

    // Standard meta description
    setMeta({ attr: 'name', name: 'description' }, description);

    // Open Graph
    setMeta({ attr: 'property', name: 'og:title' }, title);
    setMeta({ attr: 'property', name: 'og:description' }, description);
    setMeta({ attr: 'property', name: 'og:image' }, image.startsWith('http') ? image : window.location.origin + image);

    // Twitter
    setMeta({ attr: 'name', name: 'twitter:title' }, title);
    setMeta({ attr: 'name', name: 'twitter:description' }, description);
    setMeta({ attr: 'name', name: 'twitter:image' }, image.startsWith('http') ? image : window.location.origin + image);

    return () => {
      // Optionally revert to defaults when navigating away (keep simple: reset title)
      document.title = 'BeThere Weddings - Collect RSVPs & Cash Gifts for your Wedding';
    };
  }, [gift]);

  useEffect(() => {
    if (!loading && gift) {
      const duration = 15 * 1000; // 15 seconds
      const end = Date.now() + duration;

      const interval = setInterval(() => {
        confetti({
          particleCount: 20,
          angle: 90,
          spread: 70,
          origin: { x: Math.random(), y: 0 },
          gravity: 2.5,
          drift: 0,
          decay: 0.96,
          colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894', '#e17055', '#74b9ff', '#a29bfe', '#ffeaa7', '#fab1a0']
        });

        if (Date.now() > end) {
          clearInterval(interval);
        }
      }, 50); // More frequent bursts

      return () => clearInterval(interval);
    }
  }, [loading, gift]);

  const submitRsvp = async (attending: boolean, hasGuestsParam?: boolean, additionalGuestsParam?: number) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/guests/rsvp/${linkParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: rsvpFirstName,
          lastName: rsvpLastName,
          email: rsvpEmail,
          attending,
          hasGuests: hasGuestsParam,
          additionalGuests: additionalGuestsParam,
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
        setGuestAllowed(null);
        setHasGuests(null);
        setAdditionalGuests(0);
        setAdditionalGuests(0);
      } else {
        setRsvpErrorMessage(data.msg || 'Failed to submit RSVP. Please try again.');
        setShowRsvpErrorModal(true);
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting RSVP');
    }
  };

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const minAmount = 100;
    if (!amount || parseFloat(amount) < minAmount) {
      const currencySymbol = '₦';
      alert(`Please enter an amount of at least ${currencySymbol}${minAmount}`);
      return;
    }

    setShowAmountModal(false);
    setShowNameModal(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!linkParam) {
      alert('Invalid gift link. Please reopen the invitation link.');
      return;
    }

    if (!isAnonymous && !contributorName.trim()) {
      alert('Please enter your name or choose to give anonymously');
      return;
    }

    if (!isAnonymous && !contributorEmail.trim()) {
      alert('Please enter your email address');
      return;
    }

    if (!isAnonymous && !contributorEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setProcessingPayment(true);

    try {
      const name = isAnonymous ? 'Anonymous Contributor' : contributorName;
      const email = isAnonymous ? `anonymous-${Date.now()}@giftlink.com` : contributorEmail;

      // Initialize payment
      const initRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/contributions/${linkParam}/initialize-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contributorName: name,
            contributorEmail: email,
            amount: parseFloat(amount),
            currency: currency,
            message: isAnonymous ? 'Anonymous contribution' : `Gifts from ${name}`,
          }),
        }
      );

      const initData = await initRes.json();
      if (!initRes.ok) {
        const msg = initData?.msg || initData?.error?.message || (typeof initData?.error === 'string' ? initData.error : JSON.stringify(initData?.error)) || 'Failed to initialize payment';
        throw new Error(msg);
      }

      // Redirect to Paystack payment
      if (initData.data && initData.data.authorization_url) {
        window.location.href = initData.data.authorization_url;
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
        <div className="w-full max-w-md flex flex-col items-center gap-6">
          <img
            src="/logo2.png"
            alt="BeThere Weddings logo"
            className="h-12 w-auto"
          />

          {/* Gift Card - Same style as home page */}
          <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-border/50 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="relative w-full overflow-hidden">
              {gift.picture && (
                <img
                  src={gift.picture}
                  alt={heading}
                  style={{
                    width: '100%',
                    height: 'auto',
                    objectFit: 'contain', // Fit image within container without stretching
                    imageRendering: 'auto', // Render as uploaded
                    filter: 'none',
                    opacity: 1,
                    transition: 'none',
                    display: 'block',
                  }}
                  draggable={false}
                />
              )}

              <div className="absolute inset-0 flex items-end">
                <div className="w-full p-4 pb-6">
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
            <div className="text-center text-muted-foreground text-sm mt-2 font-playfair">
              Strictly by invitation
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
                  </SelectContent>
                </Select>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100"
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

              <div>
                <Label htmlFor="email" className="text-sm font-medium">Your Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={contributorEmail}
                  onChange={(e) => setContributorEmail(e.target.value)}
                  placeholder="Enter your email"
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
              💳 Powered by Paystack - Secure payment processing
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
           setGuestAllowed(null);
           setHasGuests(null);
           setAdditionalGuests(0);
         }
      }}>
        <DialogContent className="max-w-[19rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-playfair text-center">{heading}</DialogTitle>
            <div className="text-center text-muted-foreground text-sm mt-1 font-playfair">
              Strictly by invitation
            </div>
          </DialogHeader>

          {rsvpStep === 1 && (
            <form onSubmit={async (e) => {
              e.preventDefault();
              setRsvpError('');

              if (!rsvpFirstName.trim() || !rsvpLastName.trim()) {
                setRsvpError('Please enter both first and last name');
                return;
              }

              // For open guest list, skip validation and go to email step
              if (gift?.guestListMode === 'open') {
                setRsvpStep(2);
                return;
              }

              // Check if names are on the guest list (restricted mode)
              try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/guests/check/${linkParam}`, {
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

                // If names are valid, store allowed and proceed to step 2
                if (data.guest) {
                  setGuestAllowed(data.guest.allowed);
                }
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

                
                {/* {gift?.guestListMode === 'open' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700 font-medium">This event allows open RSVPs - anyone can join!</p>
                  </div>
                )} */}
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
                    setGuestAllowed(null);
                    setHasGuests(null);
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
              <h3 className="text-base font-medium text-center mb-6">Will you attend?</h3>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => {
                    setWillAttend(true);
                    if (guestAllowed && guestAllowed > 1) {
                      setRsvpStep(4);
                    } else {
                      // Submit RSVP directly for open or allowed=1
                      submitRsvp(true);
                    }
                  }}
                  className="w-full h-12 bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90"
                >
                  Yes I'm coming
                </Button>
                <Button
                  onClick={() => submitRsvp(false)}
                  variant="outline"
                  className="w-full h-12 border-[#2E235C] text-[#2E235C] hover:bg-[#2E235C] hover:text-white"
                >
                  No I can't make it
                </Button>
              </div>
            </div>
          )}

          {rsvpStep === 4 && (
            <div className="py-6">
              <h3 className="text-base font-medium text-center mb-6">Are you coming with {guestAllowed - 1} other guest{guestAllowed - 1 === 1 ? '' : 's'}?</h3>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => {
                    if (guestAllowed === 2) {
                      submitRsvp(true, true, 1);
                    } else {
                      submitRsvp(true, true);
                    }
                  }}
                  className="w-full h-12 bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90"
                >
                  Yes
                </Button>
                <Button
                  onClick={() => {
                    if (guestAllowed === 2) {
                      submitRsvp(true, false, 0);
                    } else {
                      setRsvpStep(5);
                    }
                  }}
                  variant="outline"
                  className="w-full h-12 border-[#2E235C] text-[#2E235C] hover:bg-[#2E235C] hover:text-white"
                >
                  No
                </Button>
              </div>
            </div>
          )}

          {rsvpStep === 5 && (
            <div className="py-6">
              <h3 className="text-base font-medium text-center mb-6">How many other guests are you coming with?</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="additionalGuests" className="text-sm font-medium text-gray-900 mb-2 block">
                    Number of other guest{guestAllowed - 1 === 1 ? '' : 's'} (0 - {guestAllowed - 1})
                  </Label>
                  <Input
                    id="additionalGuests"
                    type="number"
                    min="0"
                    max={guestAllowed - 1}
                    value={additionalGuests}
                    onChange={(e) => setAdditionalGuests(parseInt(e.target.value) || 0)}
                    className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => setRsvpStep(4)}
                >
                  Back
                </Button>
                <Button
                  onClick={() => submitRsvp(true, false, additionalGuests)}
                  className="flex-1 h-11 bg-gradient-to-r from-[#2E235C] to-[#2E235C]"
                >
                  Continue
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
                  // Pre-populate contributor info with RSVP data
                  if (rsvpFirstName && rsvpLastName) {
                    setContributorName(`${rsvpFirstName} ${rsvpLastName}`);
                  }
                  if (rsvpEmail) {
                    setContributorEmail(rsvpEmail);
                  }
                  setShowCashGiftPrompt(false);
                  setShowAmountModal(true);
                }}
              >
                Yes
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-12 border-[#2E235C] text-[#2E235C] hover:bg-[#2E235C] hover:text-white"
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

      {/* RSVP Error Modal */}
      <Dialog open={showRsvpErrorModal} onOpenChange={setShowRsvpErrorModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-playfair text-center">{heading}</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-base text-red-600">{rsvpErrorMessage}</p>
          </div>
          <div className="pt-2">
            <Button className="w-full" onClick={() => setShowRsvpErrorModal(false)}>Close</Button>
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