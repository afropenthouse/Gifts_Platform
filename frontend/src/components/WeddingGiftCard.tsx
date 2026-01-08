import React, { useState, useEffect } from "react";
import { Users, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Utility function to check if image is portrait
const isPortrait = (src: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(img.naturalHeight >= img.naturalWidth);
    };
    img.onerror = () => resolve(true); // Default to show if error loading
    img.src = src;
  });
};


interface WeddingGiftCardProps {
  groomName?: string;
  brideName?: string;
  weddingDate: string;
  giftersCount: number;
  imageUrl: string;
  title?: string;
}

declare global {
  interface Window {
    FlutterwaveCheckout: any;
  }
}

const WeddingGiftCard = ({
  groomName,
  brideName,
  weddingDate,
  giftersCount,
  imageUrl,
  title,
}: WeddingGiftCardProps) => {
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isAmountModalOpen, setIsAmountModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [contributorName, setContributorName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const heading =
    title ||
    (groomName && brideName
      ? `${groomName} & ${brideName}`
      : groomName || brideName || "Special Celebration");

  // Load Flutterwave script
  useEffect(() => {
    if (!window.FlutterwaveCheckout) {
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      document.head.appendChild(script);
    }
  }, []);

  const handleSendGiftClick = (e?: React.MouseEvent) => {
    // Prevent opening the preview card modal when the CTA is clicked.
    e?.stopPropagation();
    setIsCardModalOpen(false);
    setIsAmountModalOpen(true);
  };

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const minAmount = currency === 'NGN' ? 100 : 1;
    if (!amount || parseFloat(amount) < minAmount) {
      const currencySymbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
      alert(`Please enter an amount of at least ${currencySymbol}${minAmount}`);
      return;
    }

    setIsAmountModalOpen(false);
    setIsNameModalOpen(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAnonymous && !contributorName.trim()) {
      alert('Please enter your name or choose to give anonymously');
      return;
    }

    setProcessingPayment(true);

    try {
      const name = isAnonymous ? 'Anonymous' : contributorName;

      const publicKey = import.meta.env.VITE_FLW_PUBLIC_KEY;
      if (!publicKey) {
        alert('Payment is unavailable: missing Flutterwave public key.');
        setProcessingPayment(false);
        return;
      }

      const config = {
        public_key: publicKey,
        tx_ref: `demo-gift-${Date.now()}`,
        amount: parseFloat(amount),
        currency: currency,
        payment_options: 'card,mobilemoney,ussd',
        customer: {
          email: 'traclaapp@gmail.com',
          name: name,
        },
        customizations: {
          title: heading,
          description: `Contribution`,
          logo: '',
        },
        callback: function (data: any) {
          console.log('Payment callback:', data);
          if (data.status === 'successful') {
            const currencySymbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
            alert(`Thank you! Your gift of ${currencySymbol}${amount} to ${heading} was successful.`);
            setIsNameModalOpen(false);
            setAmount('');
            setContributorName('');
            setIsAnonymous(false);
          } else {
            alert('Payment was not completed. Please try again.');
          }
          setProcessingPayment(false);
        },
        onclose: function () {
          console.log('Payment modal closed');
          setProcessingPayment(false);
        },
      };

      // Initialize Flutterwave payment
      if (window.FlutterwaveCheckout) {
        window.FlutterwaveCheckout(config);
      } else {
        alert('Flutterwave is not loaded. Please refresh the page and try again.');
        setProcessingPayment(false);
      }
    } catch (err: any) {
      console.error(err);
      alert('Payment initialization failed');
      setProcessingPayment(false);
    }
  };

  return (
    <>
      <div
        className="relative w-full max-w-md mx-auto opacity-0 animate-fade-in-up delay-200 cursor-pointer"
        style={{ animationFillMode: "" }}
        onClick={() => setIsCardModalOpen(true)}
      >
        <div className="bg-gradient-card rounded-2xl shadow-card overflow-hidden border border-border/50 hover:shadow-lg transition-shadow">
          <div className="relative h-[20rem] w-[22rem] overflow-hidden">
            <img
              src={imageUrl}
              alt={`${heading} image`}
              className="w-full h-[350] object-top"
            />
          </div>

          <div className="p-9 -mt-12">
            <div className="text-center mb-4">
              {title ? (
                <h2 className="font-serif text-3xl font-medium text-foreground tracking-wide py-4">{title}</h2>
              ) : (
                <h2 className="font-serif text-3xl font-medium text-foreground tracking-wide py-4">
                  {groomName} <span className="text-gold">&</span> {brideName}
                </h2>
              )}
              <p className="text-muted-foreground text-sm -mt-1 font-sans">{weddingDate}</p>
            </div>

            <div className="flex justify-center py-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-card/80 backdrop-blur-sm px-4 py-2 shadow-soft border border-border/50">
                <Users className="w-4 h-4 text-rose" />
                <span className="font-semibold text-sm font-sans">{giftersCount}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Gifters</span>
              </div>
            </div>

            <div className="mt-1">
              <Button variant="gold" className="w-full" size="lg" onClick={handleSendGiftClick}>
                <Gift className="w-5 h-5 mr-[0.1rem]" />
                Send cash gift
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Card Modal - Shows the full card for viewing */}
      <Dialog open={isCardModalOpen} onOpenChange={setIsCardModalOpen}>
        <DialogContent className="max-w-md">
          <div className="bg-gradient-card rounded-2xl shadow-card overflow-hidden border border-border/50">
            <div className="relative h-64 overflow-hidden">
              <img
                src={imageUrl}
                alt={`${heading} image`}
                className="w-full h-[350] object-top"
              />
            </div>

            <div className="p-6 -mt-3 relative">
              <div className="text-center mb-4">
                {title ? (
                  <h2 className="font-serif text-3xl font-semibold text-foreground tracking-wide">{title}</h2>
                ) : (
                  <h2 className="font-serif text-3xl font-semibold text-foreground tracking-wide">
                    {groomName} <span className="text-gold">&</span> {brideName}
                  </h2>
                )}
                <p className="text-muted-foreground text-sm mt-1 font-sans">{weddingDate}</p>
              </div>

              <div className="flex justify-center py-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-card/80 backdrop-blur-sm px-4 py-2 shadow-soft border border-border/50">
                  <Users className="w-4 h-4 text-rose" />
                  <span className="font-semibold text-sm font-sans">{giftersCount}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Gifters</span>
                </div>
              </div>

              <div className="mt-5">
                <Button variant="gold" className="w-full" size="lg" onClick={handleSendGiftClick}>
                  <Gift className="w-5 h-5 mr-[0.1rem]" />
                  Send a cash gift
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Amount Modal */}
      <Dialog open={isAmountModalOpen} onOpenChange={setIsAmountModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif text-center">{heading}</DialogTitle>
            <DialogDescription className="text-center">
              Enter the gift amount
            </DialogDescription>
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
                    <SelectItem value="EUR">€ EUR</SelectItem>
                    <SelectItem value="GBP">£ GBP</SelectItem>
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
                Minimum {currency === 'NGN' ? '₦100' : currency === 'USD' ? '$1' : currency === 'EUR' ? '€1' : '£1'}
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
            >
              Send Gift {currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}{amount || '0'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Name/Anonymous Modal */}
      <Dialog open={isNameModalOpen} onOpenChange={setIsNameModalOpen}>
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
                Gift Amount: {currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}{amount}
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
    </>
  );
};

export default WeddingGiftCard;

export const WeddingGiftGallery = () => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedGifts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/gifts/public/featured`);
        if (!response.ok) {
          throw new Error('Failed to fetch gifts');
        }
        const data = await response.json();

        // Filter to only include portrait images
        const filteredGifts = [];
        for (const gift of data) {
          if (gift.picture) {
            const portrait = await isPortrait(gift.picture);
            if (portrait) {
              filteredGifts.push(gift);
            }
          } else {
            // Include gifts without picture (will use fallback)
            filteredGifts.push(gift);
          }
        }

        setGifts(filteredGifts);
      } catch (err) {
        console.error('Error fetching featured gifts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedGifts();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="w-full max-w-md mx-auto opacity-0 animate-fade-in-up delay-200">
            <div className="bg-gradient-card rounded-2xl shadow-card overflow-hidden border border-border/50 h-96">
              <div className="h-64 bg-muted animate-pulse" />
              <div className="p-6">
                <div className="h-6 bg-muted animate-pulse rounded mb-2" />
                <div className="h-4 bg-muted animate-pulse rounded mb-4" />
                <div className="h-10 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Unable to load featured celebrations. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {gifts.filter(gift => gift.picture).map((gift) => {
        // Determine groom/bride names or title based on gift type and details
        let groomName, brideName, title;
        if (gift.type === 'wedding' && gift.details) {
          groomName = gift.details.groomName;
          brideName = gift.details.brideName;
        } else {
          title = gift.title || `${gift.type.charAt(0).toUpperCase() + gift.type.slice(1)} Celebration`;
        }

        return (
          <WeddingGiftCard
            key={gift.id}
            groomName={groomName}
            brideName={brideName}
            title={title}
            weddingDate={gift.date}
            giftersCount={gift.giftersCount}
            imageUrl={gift.picture}
          />
        );
      })}
    </div>
  );
};
