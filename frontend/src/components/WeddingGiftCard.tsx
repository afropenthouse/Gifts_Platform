import React, { useState, useEffect } from "react";
import { Users, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Fallback image (lightweight inline SVG) used when no imageUrl is provided
const fallbackImage =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 400'>
      <defs>
        <linearGradient id='g' x1='0' x2='0' y1='0' y2='1'>
          <stop offset='0%' stop-color='#fde68a'/>
          <stop offset='100%' stop-color='#fbcfe8'/>
        </linearGradient>
      </defs>
      <rect width='800' height='400' fill='url(#g)'/>
      <g fill='#1f2937' font-family='serif' text-anchor='middle'>
        <text x='400' y='200' font-size='36'>Special Celebration</text>
      </g>
    </svg>`
  );

interface WeddingGiftCardProps {
  groomName?: string;
  brideName?: string;
  weddingDate: string;
  giftersCount: number;
  imageUrl?: string;
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

  const handleSendGiftClick = () => {
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

      // Flutterwave test configuration
      const config = {
        public_key: 'FLWPUBK_TEST-b7168749519a53630ecbe8070b06ef4e-X', // Test public key
        tx_ref: `demo-gift-${Date.now()}`,
        amount: parseFloat(amount),
        currency: currency,
        payment_options: 'card,mobilemoney,ussd',
        customer: {
          email: 'demo@example.com',
          name: name,
        },
        customizations: {
          title: `Gift for ${heading}`,
          description: `Contributing to ${heading}`,
          logo: 'https://example.com/logo.png',
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
        style={{ animationFillMode: "forwards" }}
        onClick={() => setIsCardModalOpen(true)}
      >
        <div className="bg-gradient-card rounded-2xl shadow-card overflow-hidden border border-border/50 hover:shadow-lg transition-shadow">
          <div className="relative h-64 overflow-hidden">
            <img
              src={imageUrl || fallbackImage}
              alt={`${heading} image`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
          </div>

          <div className="p-6 -mt-8 relative">
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
      </div>

      {/* Card Modal - Shows the full card for viewing */}
      <Dialog open={isCardModalOpen} onOpenChange={setIsCardModalOpen}>
        <DialogContent className="max-w-md">
          <div className="bg-gradient-card rounded-2xl shadow-card overflow-hidden border border-border/50">
            <div className="relative h-64 overflow-hidden">
              <img
                src={imageUrl || fallbackImage}
                alt={`${heading} image`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
            </div>

            <div className="p-6 -mt-8 relative">
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
  const events = [
    {
      title: "Aisha's Birthday",
      date: "March 5, 2026",
      gifters: 12,
      imageUrl: "/Aishas_Birthday.jpg",
    },
    {
      groomName: "James",
      brideName: "Sade",
      date: "December 28, 2025",
      gifters: 4,
      imageUrl: "/James.jpg",
    },
    {
      groomName: "Tunde",
      brideName: "Chioma",
      date: "January 15, 2026",
      gifters: 8,
      imageUrl: "/Tunde.jpg",
    },
    {
      title: "Bode's Graduation",
      date: "July 22, 2026",
      gifters: 6,
      imageUrl: "/Bode.jpg",
    },
    {
      title: "Chika's MSc Graduation",
      date: "August 18, 2026",
      gifters: 7,
      imageUrl: "/chika.jpg",
    },
    {
      groomName: "Emeka",
      brideName: "Ade",
      date: "November 2, 2026",
      gifters: 15,
      imageUrl: "/Emeka.jpg",
    },
    {
      groomName: "Monday",
      brideName: "Kemi",
      date: "February 14, 2026",
      gifters: 5,
      imageUrl: "/Monday.webp",
    },
    {
      title: "Tope's Birthday",
      date: "December 12, 2026",
      gifters: 10,
      imageUrl: "/Tope.png",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {events.map((e, i) => (
        <WeddingGiftCard
          key={i}
          groomName={e.groomName}
          brideName={e.brideName}
          title={e.title}
          weddingDate={e.date}
          giftersCount={e.gifters}
          imageUrl={e.imageUrl}
        />
      ))}
    </div>
  );
};
