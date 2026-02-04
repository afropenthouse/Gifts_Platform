import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import Navbar from '../components/Navbar';
import confetti from 'canvas-confetti';
import { useToast } from '../hooks/use-toast';
//Testing
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
  date: string; g
  picture: string;
  details: any;
  customType?: string;
  user: { name: string; profilePicture: string };
  _count?: { contributions: number };
  guestListMode?: string;
  enableCashGifts?: boolean;
}

const QRGift: React.FC = () => {
  const { link, slug, id } = useParams<{ link?: string; slug?: string; id?: string }>();
  const [searchParams] = useSearchParams();
  const linkParam = link ?? (slug && id ? `${slug}/${id}` : undefined);
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
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'checking' | 'success' | 'error' | null>(null);
  const [verifyMessage, setVerifyMessage] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [eventType, setEventType] = useState('');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Send a Cash Gift";
  }, []);

  useEffect(() => {
    // Load Paystack script
    if (!window.PaystackPop) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      document.head.appendChild(script);
    }
  }, []);

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
      const email = contributorEmail;

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

  const handleMomentUpload = (files: FileList, giftId: string | number) => {
    setSelectedFiles(files);
    setShowUploadModal(true);
  };

  const uploadMoments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiles || !gift) return;

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const formData = new FormData();
      formData.append('picture', file);
      formData.append('giftId', gift.id.toString());
      formData.append('event', gift.title);

      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/moments`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        console.error('Error uploading moment:', err);
        errorCount++;
      }
    }

    setUploading(false);
    setShowUploadModal(false);
    setSelectedFiles(null);

    if (successCount > 0) {
      toast({
        title: "Upload successful",
        description: `${successCount} moment${successCount > 1 ? 's' : ''} uploaded successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}.`,
      });
    } else {
      toast({
        title: "Upload failed",
        description: "Failed to upload moments. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Loading...</p>
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

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {gift.title}
            </h1>
            <p className="text-gray-600">Celebrate with them by sharing your moments at their event and sending cash gifts!</p>
          </div>

          <div className="space-y-3">
            {(gift?.enableCashGifts !== false) && (
              <Button
                className="w-full bg-[#2E235C] hover:bg-[#2E235C]/90 text-white"
                size="lg"
                onClick={() => setShowAmountModal(true)}
              >
                Send a Cash Gift
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full border-[#2E235C] text-[#2E235C] hover:bg-[#2E235C] hover:text-white"
              size="lg"
              onClick={() => {
                const uploadInput = document.createElement('input');
                uploadInput.type = 'file';
                uploadInput.accept = 'image/*';
                uploadInput.multiple = true;
                // Append to body to ensure iOS compatibility
                uploadInput.style.display = 'none';
                document.body.appendChild(uploadInput);

                uploadInput.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files && files.length > 0) {
                    handleMomentUpload(files, gift.id);
                  }
                  document.body.removeChild(uploadInput);
                };
                uploadInput.click();
              }}
            >
              📸 Upload Pictures
            </Button>
          </div>
        </div>
      </div>

      {/* Amount Modal */}
      <Dialog open={showAmountModal} onOpenChange={setShowAmountModal}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => { e.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-playfair text-center">{gift.title}</DialogTitle>
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
        <DialogContent className="max-w-md" onInteractOutside={(e) => { e.preventDefault(); }}>
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
                  placeholder="Enter your email (for your receipt)"
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

      {/* Payment verification modal */}
      <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { e.preventDefault(); }}>
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

      {/* Upload Pictures Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => { e.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle>Upload Pictures</DialogTitle>
            <p className="text-sm text-gray-600">Share moments from {gift?.title}</p>
          </DialogHeader>

          <form onSubmit={uploadMoments} className="space-y-4">
            <div>
              <Label>Event</Label>
              <Select value={gift?.title || ''} disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={gift?.title || ''}>{gift?.title}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedFiles && (
              <div className="text-sm text-gray-600">
                {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QRGift;
