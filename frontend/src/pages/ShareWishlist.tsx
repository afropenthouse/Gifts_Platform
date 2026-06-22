
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import Navbar from '../components/Navbar';
import { Heart, ShoppingBag, ExternalLink, CheckCircle, Gift, ChevronLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WishlistItem {
  id: number;
  name: string;
  productUrl?: string;
  price?: number;
  quantity: number;
  purchased: number;
  imageUrl?: string;
  description?: string;
  isCashGiftAllowed: boolean;
}

interface Wishlist {
  id: number;
  title: string;
  description?: string;
  address?: string;
  shareLink: string;
  items: WishlistItem[];
  user: { name: string; profilePicture?: string };
  gift: { shareLink: string; id: number; title?: string; type?: string };
}

type CurrencyOption = {
  code: string;
  country: string;
};

const currencyOptions: CurrencyOption[] = [
  { code: "NGN", country: "Nigeria" },
  { code: "USD", country: "United States" },
  { code: "GBP", country: "United Kingdom" },
  { code: "EUR", country: "Eurozone" },
  { code: "CAD", country: "Canada" },
  { code: "AUD", country: "Australia" },
  { code: "ZAR", country: "South Africa" },
  { code: "KES", country: "Kenya" },
  { code: "GHS", country: "Ghana" },
  { code: "UGX", country: "Uganda" },
  { code: "TZS", country: "Tanzania" },
  { code: "RWF", country: "Rwanda" },
  { code: "XOF", country: "West African CFA" },
  { code: "XAF", country: "Central African CFA" },
  { code: "MWK", country: "Malawi" },
  { code: "BWP", country: "Botswana" },
  { code: "AED", country: "United Arab Emirates" },
  { code: "SAR", country: "Saudi Arabia" },
  { code: "QAR", country: "Qatar" },
  { code: "INR", country: "India" },
  { code: "SGD", country: "Singapore" },
  { code: "NZD", country: "New Zealand" },
  { code: "CHF", country: "Switzerland" },
  { code: "JPY", country: "Japan" },
  { code: "CNY", country: "China" },
];

const ShareWishlist: React.FC = () => {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const linkParam = slug && id ? `${slug}/${id}` : undefined;
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Cash gift state
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [currencySearch, setCurrencySearch] = useState('');
  const [isCurrencyPopoverOpen, setIsCurrencyPopoverOpen] = useState(false);
  const [contributorName, setContributorName] = useState('');
  const [contributorEmail, setContributorEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'checking' | 'success' | 'error' | null>(null);
  const [verifyMessage, setVerifyMessage] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);

  // Handle redirect back from payment providers: verify payment
  useEffect(() => {
    const txId = searchParams.get('transaction_id');
    const txRef = searchParams.get('tx_ref');
    const reference = searchParams.get('reference');
    const status = searchParams.get('status');
    
    if (!wishlist?.gift?.shareLink || (!txId && !txRef && !reference)) return;

    setShowVerifyModal(true);
    setVerifyStatus('checking');
    setVerifyMessage('Confirming your payment...');

    const verify = async () => {
      try {
        const transactionIdentifier = reference || txRef || txId;
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/contributions/${wishlist.gift.shareLink}/verify-payment`,
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
        setVerifyMessage('Thank you! Your payment was successful.');
      } catch (err) {
        console.error(err);
        setVerifyStatus('error');
        setVerifyMessage('Could not verify payment.');
      }
    };

    verify();
  }, [searchParams, wishlist]);

  // Confetti effect
  useEffect(() => {
    if (!loading && wishlist) {
      const duration = 15 * 1000;
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
      }, 50);

      return () => clearInterval(interval);
    }
  }, [loading, wishlist]);

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const minAmount = currency === 'NGN' ? 1000 : 10;
    if (!amount || parseFloat(amount) < minAmount) {
      alert(`Please enter an amount of at least ${currency} ${minAmount}`);
      return;
    }

    setShowAmountModal(false);
    setShowNameModal(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wishlist?.gift?.shareLink) {
      alert('Invalid wishlist. Please try again.');
      return;
    }

    if (!isAnonymous && !contributorName.trim()) {
      alert('Please enter your name or choose to give anonymously');
      return;
    }

    if (!contributorEmail.trim()) {
      alert('Please enter your email address');
      return;
    }

    if (!contributorEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setProcessingPayment(true);

    try {
      const name = isAnonymous ? 'Anonymous Contributor' : contributorName;
      const message = selectedItem 
        ? `Cash gift for wishlist item: ${selectedItem.name}` 
        : 'Cash gift for wishlist';

      // Initialize payment
      const initRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/contributions/${wishlist.gift.shareLink}/initialize-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contributorName: name,
            contributorEmail: contributorEmail,
            amount: parseFloat(amount),
            currency: currency,
            message: message,
            wishlistItemId: selectedItem?.id,
            wishlistShareLink: wishlist.shareLink
          }),
        }
      );

      const initData = await initRes.json();
      if (!initRes.ok) {
        const msg = initData?.msg || initData?.error?.message || (typeof initData?.error === 'string' ? initData.error : JSON.stringify(initData?.error)) || 'Failed to initialize payment';
        throw new Error(msg);
      }

      const authorizationUrl =
        initData?.data?.authorization_url || initData?.data?.link || initData?.data?.checkout_url;
      if (authorizationUrl) {
        window.location.href = authorizationUrl;
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Payment initialization failed');
      setProcessingPayment(false);
    }
  };

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!linkParam) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/wishlists/public/${linkParam}`);
        if (!res.ok) throw new Error('Wishlist not found');
        const data = await res.json();
        setWishlist(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (linkParam) fetchWishlist();
  }, [linkParam]);

  if (loading)
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="text-gray-500">Loading wishlist...</p>
          </div>
        </div>
      </div>
    );

  if (!wishlist)
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-4xl text-gray-500">!</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Wishlist Not Found</h1>
            <p className="text-gray-500 max-w-md">
              The wishlist link you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Heart className="w-12 h-12 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {wishlist.gift.title ? `${wishlist.gift.title}'s Wishlist` : wishlist.title}
          </h1>
          {wishlist.description && <p className="text-gray-500 mt-4">{wishlist.description}</p>}
          {wishlist.address && (
            <p className="text-gray-500 mt-2 flex items-center justify-center gap-1">
              <span>📍</span> Delivery address: {wishlist.address}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.items.map((item) => {
            const remaining = item.quantity - item.purchased;
            const isFullyPurchased = remaining <= 0;
            
            return (
              <Card key={item.id} className={`overflow-hidden ${isFullyPurchased ? 'opacity-60' : ''}`}>
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-16 h-16 text-gray-300" />
                  )}
                </div>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
                  {item.price && (
                    <p className="text-purple-600 font-bold mb-2">₦{item.price.toLocaleString()}</p>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    {isFullyPurchased ? (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <CheckCircle className="w-4 h-4" /> Fully purchased
                      </span>
                    ) : (
                      <span className="text-gray-600">{item.purchased} of {item.quantity} purchased</span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-500 mb-4">{item.description}</p>
                  )}
                  {item.productUrl && !isFullyPurchased && (
                    <Button
                      className="w-full mt-4 bg-[#2E235C] text-white hover:bg-[#2E235C]/90"
                      onClick={() => {
                        window.open(item.productUrl, '_blank');
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Order
                    </Button>
                  )}
                  {!isFullyPurchased && (
                    <Button
                      className="w-full mt-4 bg-[#2E235C] text-white hover:bg-[#2E235C]/90"
                      onClick={() => {
                        setSelectedItem(item);
                        setAmount(item.price?.toString() || '');
                        setShowAmountModal(true);
                      }}
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Send Cash Instead
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Amount Modal */}
        <Dialog open={showAmountModal} onOpenChange={setShowAmountModal}>
          <DialogContent className="max-w-sm" onInteractOutside={(e) => { e.preventDefault(); }}>
            <DialogHeader>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 top-4"
                onClick={() => setShowAmountModal(false)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <DialogTitle className="text-xl font-playfair text-center text-[#2E235C]">Send a Cash Gift</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleAmountSubmit} className="space-y-4">
              <div className="flex items-center gap-2">
                <Popover open={isCurrencyPopoverOpen} onOpenChange={setIsCurrencyPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[140px] justify-start">
                      {currency}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search currency..."
                        value={currencySearch}
                        onValueChange={setCurrencySearch}
                      />
                      <CommandEmpty>No currency found.</CommandEmpty>
                      <CommandGroup className="max-h-[300px] overflow-y-auto">
                        {currencyOptions
                          .filter((option) =>
                            option.country.toLowerCase().includes(currencySearch.toLowerCase()) ||
                            option.code.toLowerCase().includes(currencySearch.toLowerCase())
                          )
                          .map((option) => (
                            <CommandItem
                              key={option.code}
                              value={option.code}
                              onSelect={(value) => {
                                setCurrency(value);
                                setIsCurrencyPopoverOpen(false);
                              }}
                            >
                              {option.code} - {option.country}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="text-center text-sm text-gray-500">
                {currency === 'NGN' ? 'Minimum amount: ₦1,000' : `Minimum amount: ${currency} 10`}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-[#2E235C] text-white hover:bg-[#2E235C]/90"
              >
                Continue
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Name/Email Modal */}
        <Dialog open={showNameModal} onOpenChange={setShowNameModal}>
          <DialogContent className="max-w-sm" onInteractOutside={(e) => { e.preventDefault(); }}>
            <DialogHeader>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 top-4"
                onClick={() => setShowNameModal(false)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <DialogTitle className="text-xl font-playfair text-center text-[#2E235C]">Your Details</DialogTitle>
            </DialogHeader>

            <form onSubmit={handlePayment} className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                <Label htmlFor="anonymous" className="text-sm">Give anonymously</Label>
              </div>

              {!isAnonymous && (
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">Your Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={contributorName}
                    onChange={(e) => setContributorName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="email" className="text-sm font-medium">Your Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={contributorEmail}
                  onChange={(e) => setContributorEmail(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-[#2E235C] text-white hover:bg-[#2E235C]/90"
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  'Send Gift'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Verify Modal */}
        <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
          <DialogContent className="max-w-sm text-center py-8" onInteractOutside={(e) => { e.preventDefault(); }}>
            <div className="flex flex-col items-center gap-4">
              <DialogHeader>
                <DialogTitle className="text-2xl font-playfair text-[#2E235C]">
                  {verifyStatus === 'checking' ? 'Verifying Payment...' : 
                   verifyStatus === 'success' ? 'Thank You!' : 'Payment Failed'}
                </DialogTitle>
              </DialogHeader>

              {verifyStatus === 'checking' && (
                <div className="w-16 h-16 mx-auto border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
              )}

              {verifyStatus === 'success' && (
                <CheckCircle className="w-16 h-16 text-green-500" />
              )}

              {verifyStatus === 'error' && (
                <div className="w-16 h-16 mx-auto text-red-500 flex items-center justify-center text-4xl">!</div>
              )}

              <p className="text-gray-600 px-4">{verifyMessage}</p>

              <Button
                className="w-full bg-[#2E235C] text-white hover:bg-[#2E235C]/90"
                onClick={() => {
                  setShowVerifyModal(false);
                  // Reset form
                  setSelectedItem(null);
                  setAmount('');
                  setContributorName('');
                  setContributorEmail('');
                  setIsAnonymous(false);
                }}
              >
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ShareWishlist;
