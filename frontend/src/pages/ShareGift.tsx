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
import { Users, Gift, Plus, Minus, ChevronLeft } from 'lucide-react';
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
  deadline?: string;
  picture: string;
  details: any;
  customType?: string;
  user: { name: string; profilePicture: string };
  _count?: { contributions: number };
  guestListMode?: string;
  enableCashGifts?: boolean;
  isSellingAsoebi?: boolean;
  asoebiPrice?: string | number;
  asoebiPriceMen?: string | number;
  asoebiPriceWomen?: string | number;
  asoebiBrideMenPrice?: string | number;
  asoebiBrideWomenPrice?: string | number;
  asoebiGroomMenPrice?: string | number;
  asoebiGroomWomenPrice?: string | number;
  asoebiBrideDescription?: string;
  asoebiGroomDescription?: string;
  asoebiBrideMenDescription?: string;
  asoebiBrideWomenDescription?: string;
  asoebiGroomMenDescription?: string;
  asoebiGroomWomenDescription?: string;
  asoebiQuantity?: number;
  asoebiQtyMen?: number;
  asoebiQtyWomen?: number;
  asoebiBrideMenQty?: number;
  asoebiBrideWomenQty?: number;
  asoebiGroomMenQty?: number;
  asoebiGroomWomenQty?: number;
  soldAsoebiQuantity?: number;
  soldAsoebiQtyMen?: number;
  soldAsoebiQtyWomen?: number;
  soldAsoebiBrideMenQty?: number;
  soldAsoebiBrideWomenQty?: number;
  soldAsoebiGroomMenQty?: number;
  soldAsoebiGroomWomenQty?: number;
  asoebiItems?: AsoebiItem[];
}

interface AsoebiItem {
  id: number;
  name: string;
  price: number | string;
  stock: number;
  sold?: number;
  category?: string;
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
  const [lastRsvpData, setLastRsvpData] = useState<{firstName: string, lastName: string, email: string} | null>(null);
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
  const [rsvpGuestId, setRsvpGuestId] = useState<number | null>(null);
  const [showAsoebiConfirm, setShowAsoebiConfirm] = useState(false);
  const [asoebiQuantity, setAsoebiQuantity] = useState(1);
  const [pendingAsoebi, setPendingAsoebi] = useState(false);
  const [showAsoebiDirectModal, setShowAsoebiDirectModal] = useState(false);
  const [asoebiStep, setAsoebiStep] = useState(1);
  const [asoebiFamily, setAsoebiFamily] = useState<'bride' | 'groom' | null>(null);
  const [menQuantity, setMenQuantity] = useState(0);
  const [womenQuantity, setWomenQuantity] = useState(0);
  const [asoebiType, setAsoebiType] = useState<'men' | 'women' | null>(null);
  const [itemQuantities, setItemQuantities] = useState<Record<number, number>>({});

  const heading = gift?.type === 'wedding' && gift?.details?.groomName && gift?.details?.brideName
    ? `${gift.details.brideName} & ${gift.details.groomName}`
    : gift?.title || gift?.user?.name || "Special Celebration";

  const isDeadlinePassed = gift?.deadline && new Date() > new Date(gift.deadline);

  const getStock = (total?: number, sold?: number) => {
    if (total === undefined || total === null) return Infinity;
    return Math.max(0, total - (sold || 0));
  };

  const stock = {
    men: getStock(gift?.asoebiQtyMen, gift?.soldAsoebiQtyMen),
    women: getStock(gift?.asoebiQtyWomen, gift?.soldAsoebiQtyWomen),
    brideMen: getStock(gift?.asoebiBrideMenQty, gift?.soldAsoebiBrideMenQty),
    brideWomen: getStock(gift?.asoebiBrideWomenQty, gift?.soldAsoebiBrideWomenQty),
    groomMen: getStock(gift?.asoebiGroomMenQty, gift?.soldAsoebiGroomMenQty),
    groomWomen: getStock(gift?.asoebiGroomWomenQty, gift?.soldAsoebiGroomWomenQty),
    generic: getStock(gift?.asoebiQuantity, gift?.soldAsoebiQuantity),
  };

  const isOutOfStock = () => {
      if (!gift?.isSellingAsoebi) return false;
      
      const hasBrideGroom = (gift.asoebiBrideMenPrice || gift.asoebiBrideWomenPrice || gift.asoebiGroomMenPrice || gift.asoebiGroomWomenPrice);
      
      if (hasBrideGroom) {
          const isConfigured = (price: any) => Number(price) > 0;
          
          const anyAvailable = 
              (isConfigured(gift.asoebiBrideMenPrice) && stock.brideMen > 0) ||
              (isConfigured(gift.asoebiBrideWomenPrice) && stock.brideWomen > 0) ||
              (isConfigured(gift.asoebiGroomMenPrice) && stock.groomMen > 0) ||
              (isConfigured(gift.asoebiGroomWomenPrice) && stock.groomWomen > 0);
              
          return !anyAvailable;
      } else {
          if (Number(gift?.asoebiPriceMen) > 0 || Number(gift?.asoebiPriceWomen) > 0) {
              const menAvailable = (Number(gift.asoebiPriceMen) > 0) ? stock.men > 0 : false;
              const womenAvailable = (Number(gift.asoebiPriceWomen) > 0) ? stock.women > 0 : false;
              return !(menAvailable || womenAvailable);
          } else {
              return stock.generic === 0;
          }
      }
  };

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
        setVerifyMessage('Thank you! Your payment was successful.');
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
    const image = gift.picture || (gift.type === 'wedding' ? '/logo2.png' : '/logo1.png');

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

  // Auto-mark asoebi interest when the modal opens
  useEffect(() => {
    if (showAsoebiConfirm && rsvpGuestId && linkParam) {
      const markInterest = async () => {
        try {
          // Just mark as interested (true) without quantity for now
          // This ensures "Yes" appears in the guest table as soon as they reach the modal
          await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/guests/asoebi-update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shareLink: linkParam,
              guestId: rsvpGuestId,
              asoebi: true,
            }),
          });
        } catch (err) {
          console.error("Failed to mark asoebi interest", err);
        }
      };
      markInterest();
    }
  }, [showAsoebiConfirm, rsvpGuestId, linkParam]);

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
        if (data.guest && data.guest.id) {
          setRsvpGuestId(data.guest.id);
          setLastRsvpData({
            firstName: rsvpFirstName,
            lastName: rsvpLastName,
            email: rsvpEmail
          });
        }
        setShowRsvpModal(false);

        if (pendingAsoebi) {
          setPendingAsoebi(false);
          setAsoebiQuantity(1);
          setAsoebiType(gift?.asoebiPriceWomen ? 'women' : gift?.asoebiPriceMen ? 'men' : null);
          setShowRsvpThanks(true);
          setShowAsoebiConfirm(true);
        } else {
          setShowCashGiftPrompt(true);
        }

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

  const handleAsoebi = async () => {
    if (!rsvpGuestId || !linkParam) return;

    let totalAmount = 0;
    let mPrice = 0;
    let wPrice = 0;
    let selectionDescription = '';
    let typeDescription = '';
    let itemsDetails: Array<{ asoebiItemId: number; name: string; unitPrice: number; quantity: number; subtotal: number }> = [];
    
    const hasBrideGroomPrices = (gift?.asoebiBrideMenPrice || gift?.asoebiBrideWomenPrice || gift?.asoebiGroomMenPrice || gift?.asoebiGroomWomenPrice);
    const genericPrice = Number(gift?.asoebiPrice || 0);

    if (gift?.asoebiItems && gift.asoebiItems.length > 0) {
      itemsDetails = gift.asoebiItems.map(it => {
        const qty = itemQuantities[it.id] || 0;
        const unit = Number(it.price || 0);
        return {
          asoebiItemId: it.id,
          name: it.name,
          unitPrice: unit,
          quantity: qty,
          subtotal: unit * qty
        };
      }).filter(d => d.quantity > 0);
      totalAmount = itemsDetails.reduce((sum, d) => sum + d.subtotal, 0);
      const totalQty = itemsDetails.reduce((sum, d) => sum + d.quantity, 0);
      selectionDescription = itemsDetails.map(d => `${d.name} x${d.quantity}`).join(', ');
      if (gift?.isSellingAsoebi && totalAmount > 0) {
        setProcessingPayment(true);
        try {
          const name = lastRsvpData ? `${lastRsvpData.firstName} ${lastRsvpData.lastName}` : 'Guest';
          const email = lastRsvpData?.email;
          if (!email) {
            alert("We need your email for the receipt. Please RSVP again with a valid email.");
            setProcessingPayment(false);
            return;
          }
          const initRes = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/contributions/${linkParam}/initialize-payment`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contributorName: name,
                contributorEmail: email,
                amount: totalAmount,
                currency: 'NGN',
                message: `Asoebi Payment: ${selectionDescription}`,
                isAsoebi: true,
                guestId: rsvpGuestId,
                asoebiQuantity: totalQty,
                asoebiType: 'items',
                asoebiSelection: selectionDescription,
                asoebiItemsDetails: itemsDetails
              }),
            }
          );
          const initData = await initRes.json();
          if (!initRes.ok) {
            throw new Error(initData?.msg || 'Failed to initialize payment');
          }
          if (initData.data && initData.data.authorization_url) {
            window.location.href = initData.data.authorization_url;
          }
        } catch (err: any) {
          console.error(err);
          alert(err?.message || 'Payment initialization failed');
          setProcessingPayment(false);
        }
        return;
      } else {
        try {
          const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/guests/asoebi-update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shareLink: linkParam,
              guestId: rsvpGuestId,
              asoebi: true,
              asoebiQuantity: totalQty,
              asoebiSelection: selectionDescription
            }),
          });
          if (res.ok) {
            setRsvpThanksMessage("Asoebi request received! We'll be in touch.");
            setRsvpGuestId(null);
          } else {
            const data = await res.json();
            alert(`Failed to update asoebi request: ${data.msg || data.error || 'Unknown error'}`);
          }
        } catch (err) {
          console.error(err);
          alert("Error updating asoebi request");
        }
        return;
      }
    }
    if (hasBrideGroomPrices) {
        if (!asoebiFamily) {
             alert("Please select Bride or Groom family");
             return;
        }
        
        if (asoebiFamily === 'bride') {
             mPrice = Number(gift?.asoebiBrideMenPrice || 0);
             wPrice = Number(gift?.asoebiBrideWomenPrice || 0);
        } else if (asoebiFamily === 'groom') {
             mPrice = Number(gift?.asoebiGroomMenPrice || 0);
             wPrice = Number(gift?.asoebiGroomWomenPrice || 0);
        }
    } else {
        mPrice = Number(gift?.asoebiPriceMen || 0);
        wPrice = Number(gift?.asoebiPriceWomen || 0);
    }

    // Calculate Total
    if (mPrice > 0) totalAmount += mPrice * menQuantity;
    if (wPrice > 0) totalAmount += wPrice * womenQuantity;

    // Fallback for simple single-price Asoebi
    if (totalAmount === 0 && genericPrice > 0 && asoebiQuantity > 0 && menQuantity === 0 && womenQuantity === 0) {
        totalAmount = genericPrice * asoebiQuantity;
        selectionDescription = `Qty: ${asoebiQuantity}`;
        typeDescription = 'standard';
    } else {
        const parts = [];
        if (menQuantity > 0) parts.push(`Men x${menQuantity}`);
        if (womenQuantity > 0) parts.push(`Women x${womenQuantity}`);
        selectionDescription = parts.join(', ');
        
        if (menQuantity > 0 && womenQuantity > 0) typeDescription = 'mixed';
        else if (menQuantity > 0) typeDescription = 'men';
        else if (womenQuantity > 0) typeDescription = 'women';
    }

    // If Asoebi is being sold with a price, initiate payment
    if (gift?.isSellingAsoebi && totalAmount > 0) {
      if (!selectionDescription) {
          alert("Please select at least one item");
          return;
      }

      setProcessingPayment(true);
      try {
        const name = lastRsvpData ? `${lastRsvpData.firstName} ${lastRsvpData.lastName}` : 'Guest';
        const email = lastRsvpData?.email;

        if (!email) {
          alert("We need your email for the receipt. Please RSVP again with a valid email.");
          setProcessingPayment(false);
          return;
        }

        const familyStr = asoebiFamily ? (asoebiFamily === 'bride' ? "Bride's Family" : "Groom's Family") : '';
        const fullSelection = `${familyStr ? familyStr + ' - ' : ''}${selectionDescription}`;

        // Calculate quantity breakdown
        let qtyMen = 0, qtyWomen = 0, brideMenQty = 0, brideWomenQty = 0, groomMenQty = 0, groomWomenQty = 0;

        if (asoebiFamily === 'bride') {
            brideMenQty = menQuantity;
            brideWomenQty = womenQuantity;
        } else if (asoebiFamily === 'groom') {
            groomMenQty = menQuantity;
            groomWomenQty = womenQuantity;
        } else {
             qtyMen = menQuantity;
             qtyWomen = womenQuantity;
        }

        const initRes = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/contributions/${linkParam}/initialize-payment`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contributorName: name,
              contributorEmail: email,
              amount: totalAmount,
              currency: 'NGN',
              message: `Asoebi Payment: ${fullSelection}`,
              isAsoebi: true,
              guestId: rsvpGuestId,
              asoebiQuantity: menQuantity + womenQuantity || asoebiQuantity,
              asoebiType: typeDescription,
              asoebiSelection: fullSelection,
              asoebiQtyMen: qtyMen,
              asoebiQtyWomen: qtyWomen,
              asoebiBrideMenQty: brideMenQty,
              asoebiBrideWomenQty: brideWomenQty,
              asoebiGroomMenQty: groomMenQty,
              asoebiGroomWomenQty: groomWomenQty
            }),
          }
        );

        const initData = await initRes.json();
        if (!initRes.ok) {
          throw new Error(initData?.msg || 'Failed to initialize payment');
        }

        if (initData.data && initData.data.authorization_url) {
          window.location.href = initData.data.authorization_url;
        }
      } catch (err: any) {
        console.error(err);
        alert(err?.message || 'Payment initialization failed');
        setProcessingPayment(false);
      }
      return;
    }

    // Default: Just mark as interested (if no price set)
    try {
      const familyStr = asoebiFamily ? (asoebiFamily === 'bride' ? "Bride's Family" : "Groom's Family") : '';
      const fullSelection = `${familyStr ? familyStr + ' - ' : ''}${selectionDescription || 'Interested'}`;

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/guests/asoebi-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareLink: linkParam,
          guestId: rsvpGuestId,
          asoebi: true,
          asoebiQuantity: menQuantity + womenQuantity || asoebiQuantity,
          asoebiSelection: fullSelection
        }),
      });

      if (res.ok) {
        setRsvpThanksMessage("Asoebi request received! We'll be in touch.");
        setRsvpGuestId(null); // Hide the button
      } else {
        const data = await res.json();
        alert(`Failed to update asoebi request: ${data.msg || data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error updating asoebi request");
    }
  };

  const handleAsoebiDirectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contributorName.trim() || !contributorEmail.trim()) {
      alert('Please provide your name and email');
      return;
    }

    let totalAmount = 0;
    let mPrice = 0;
    let wPrice = 0;
    let selectionDescription = '';
    let typeDescription = '';
    let itemsDetails: Array<{ asoebiItemId: number; name: string; unitPrice: number; quantity: number; subtotal: number }> = [];

    const hasBrideGroomPrices = (gift?.asoebiBrideMenPrice || gift?.asoebiBrideWomenPrice || gift?.asoebiGroomMenPrice || gift?.asoebiGroomWomenPrice);
    const genericPrice = Number(gift?.asoebiPrice || 0);

    if (gift?.asoebiItems && gift.asoebiItems.length > 0) {
      itemsDetails = gift.asoebiItems.map(it => {
        const qty = itemQuantities[it.id] || 0;
        const unit = Number(it.price || 0);
        return {
          asoebiItemId: it.id,
          name: it.name,
          unitPrice: unit,
          quantity: qty,
          subtotal: unit * qty
        };
      }).filter(d => d.quantity > 0);
      totalAmount = itemsDetails.reduce((sum, d) => sum + d.subtotal, 0);
      const totalQty = itemsDetails.reduce((sum, d) => sum + d.quantity, 0);
      selectionDescription = itemsDetails.map(d => `${d.name} x${d.quantity}`).join(', ');
      if (totalAmount <= 0) {
        alert('Please select at least one item');
        return;
      }
      try {
        setProcessingPayment(true);
        const initRes = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/contributions/${linkParam}/initialize-payment`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contributorName,
              contributorEmail,
              amount: totalAmount,
              currency: 'NGN',
              message: `Asoebi Payment: ${selectionDescription}`,
              isAsoebi: true,
              asoebiQuantity: totalQty,
              asoebiType: 'items',
              asoebiSelection: selectionDescription,
              asoebiItemsDetails: itemsDetails
            }),
          }
        );
        const initData = await initRes.json();
        if (!initRes.ok) {
          throw new Error(initData?.msg || 'Failed to initialize payment');
        }
        if (initData.data && initData.data.authorization_url) {
          window.location.href = initData.data.authorization_url;
        }
      } catch (err: any) {
        console.error(err);
        alert(err?.message || 'Payment initialization failed');
        setProcessingPayment(false);
      }
      return;
    }
    if (hasBrideGroomPrices) {
        if (!asoebiFamily) {
             alert("Please select Bride or Groom family");
             return;
        }
        
        if (asoebiFamily === 'bride') {
             mPrice = Number(gift?.asoebiBrideMenPrice || 0);
             wPrice = Number(gift?.asoebiBrideWomenPrice || 0);
        } else if (asoebiFamily === 'groom') {
             mPrice = Number(gift?.asoebiGroomMenPrice || 0);
             wPrice = Number(gift?.asoebiGroomWomenPrice || 0);
        }
    } else {
        mPrice = Number(gift?.asoebiPriceMen || 0);
        wPrice = Number(gift?.asoebiPriceWomen || 0);
    }

    // Calculate Total based on asoebiType and asoebiQuantity
    if (asoebiType === 'men') {
         totalAmount = mPrice * asoebiQuantity;
         selectionDescription = `Men x${asoebiQuantity}`;
         typeDescription = 'men';
    } else if (asoebiType === 'women') {
         totalAmount = wPrice * asoebiQuantity;
         selectionDescription = `Women x${asoebiQuantity}`;
         typeDescription = 'women';
    } else if (genericPrice > 0) {
         totalAmount = genericPrice * asoebiQuantity;
         selectionDescription = `Qty: ${asoebiQuantity}`;
         typeDescription = 'standard';
    }

    if (!selectionDescription) {
        alert("Please select at least one item");
        return;
    }

    // Calculate quantity breakdown
    let qtyMen = 0, qtyWomen = 0, brideMenQty = 0, brideWomenQty = 0, groomMenQty = 0, groomWomenQty = 0;

    if (asoebiFamily === 'bride') {
        if (asoebiType === 'men') brideMenQty = asoebiQuantity;
        if (asoebiType === 'women') brideWomenQty = asoebiQuantity;
    } else if (asoebiFamily === 'groom') {
        if (asoebiType === 'men') groomMenQty = asoebiQuantity;
        if (asoebiType === 'women') groomWomenQty = asoebiQuantity;
    } else {
         if (asoebiType === 'men') qtyMen = asoebiQuantity;
         if (asoebiType === 'women') qtyWomen = asoebiQuantity;
    }

    setProcessingPayment(true);
    try {
        const familyStr = asoebiFamily ? (asoebiFamily === 'bride' ? "Bride's Family" : "Groom's Family") : '';
        const fullSelection = `${familyStr ? familyStr + ' - ' : ''}${selectionDescription}`;

        const initRes = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/contributions/${linkParam}/initialize-payment`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contributorName: contributorName,
              contributorEmail: contributorEmail,
              amount: totalAmount,
              currency: 'NGN',
              message: `Asoebi Payment: ${fullSelection}`,
              isAsoebi: true,
              asoebiQuantity: asoebiQuantity,
              asoebiType: typeDescription,
              asoebiSelection: fullSelection,
              asoebiQtyMen: qtyMen,
              asoebiQtyWomen: qtyWomen,
              asoebiBrideMenQty: brideMenQty,
              asoebiBrideWomenQty: brideWomenQty,
              asoebiGroomMenQty: groomMenQty,
              asoebiGroomWomenQty: groomWomenQty
            }),
          }
        );

        const initData = await initRes.json();
        if (!initRes.ok) {
          throw new Error(initData?.msg || 'Failed to initialize payment');
        }

        if (initData.data && initData.data.authorization_url) {
          window.location.href = initData.data.authorization_url;
        }
    } catch (err: any) {
        console.error(err);
        alert(err?.message || 'Payment initialization failed');
        setProcessingPayment(false);
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

  if (loading)
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Loading details...</p>
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
      <Navbar logoSrc={gift.type === 'wedding' ? "/logo2.png" : "/logo1.png"} />

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <div className="w-full max-w-md flex flex-col items-center gap-6">
          <img
            src={gift.type === 'wedding' ? "/logo2.png" : "/logo1.png"}
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
                    {isDeadlinePassed ? (
                      <Button
                        className="w-full bg-black text-white cursor-not-allowed border border-black disabled:opacity-100"
                        size="lg"
                        disabled
                      >
                        <span className='font-thin'>RSVP Closed</span>
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-black text-white border border-black hover:bg-black transition-colors"
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
                    )}

                    {gift?.isSellingAsoebi && (
                      isDeadlinePassed ? (
                        <Button
                          className="w-full bg-gold text-white cursor-not-allowed disabled:opacity-100"
                          size="lg"
                          disabled
                        >
                          <span className='font-thin'>Asoebi Sales Closed</span>
                        </Button>
                      ) : isOutOfStock() ? (
                        <Button
                          className="w-full bg-gray-400 text-white cursor-not-allowed disabled:opacity-100"
                          size="lg"
                          disabled
                        >
                          <span className='font-thin'>Asoebi (Sold out)</span>
                        </Button>
                      ) : (
                        <Button
                          className="w-full bg-gold text-white hover:bg-gold/90 transition-colors"
                          size="lg"
                          onClick={() => {
                            if (rsvpGuestId) {
                              setAsoebiQuantity(1);
                              setAsoebiType(null);
                              setShowRsvpThanks(true);
                              setShowAsoebiConfirm(true);
                            } else {
                              // Force RSVP flow for everyone to ensure guest record creation/verification
                              setPendingAsoebi(true);
                              setShowRsvpModal(true);
                              setRsvpStep(1);
                              setWillAttend(null);
                              setRsvpFirstName('');
                              setRsvpLastName('');
                            }
                          }}
                        >
                          <span className='font-thin'>Buy Asoebi</span>
                        </Button>
                      )
                    )}

                    {(gift?.enableCashGifts !== false) && (
                    <Button
                      className="w-full text-white hover:bg-[#2E235C]/90"
                      style={{ backgroundColor: '#2E235C' }}
                      size="lg"
                      onClick={() => setShowAmountModal(true)}
                    >
                      <Gift className="w-5 h-5 mr-[0.00007rem]" />
                      <span className='font-thin'>Send a Cash Gift</span>
                    </Button>
                    )}
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
        <DialogContent className="max-w-md" onInteractOutside={(e) => { e.preventDefault(); }}>
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
        <DialogContent className="max-w-[19rem]" onInteractOutside={(e) => { e.preventDefault(); }}>
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
        <DialogContent className="max-w-[19rem]" onInteractOutside={(e) => { e.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-playfair text-center">{heading}</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="flex flex-col gap-4">
              {gift?.isSellingAsoebi && (
                isOutOfStock() ? (
                    <Button
                      className="w-full h-12 bg-gray-400 text-white cursor-not-allowed disabled:opacity-100"
                      disabled
                    >
                      Asoebi (Sold out)
                    </Button>
                ) : (
                    <Button
                      className="w-full h-12 bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90 text-white"
                      onClick={() => {
                        setShowCashGiftPrompt(false);
                        setShowRsvpThanks(true);
                        setShowAsoebiConfirm(true);
                        setAsoebiQuantity(1);
                        setAsoebiType(gift?.asoebiPriceWomen ? 'women' : gift?.asoebiPriceMen ? 'men' : null);
                      }}
                    >
                      Buy Asoebi
                    </Button>
                )
              )}

              <Button
                className="w-full h-12 bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90"
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
                Send the Couple a Cash Gift
              </Button>

              <p
                className="text-center text-sm text-gray-600 hover:text-[#2E235C] cursor-pointer"
                onClick={() => {
                  setShowCashGiftPrompt(false);
                  setRsvpThanksMessage('Thank you for responding, we will send you a confirmation email');
                  setShowRsvpThanks(true);
                }}
              >
                No thanks
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* RSVP Thanks Modal */}
      <Dialog open={showRsvpThanks} onOpenChange={(open) => {
        setShowRsvpThanks(open);
        if (!open) setShowAsoebiConfirm(false);
      }}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => { e.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle className="text-lg font-playfair text-center">{heading}</DialogTitle>
          </DialogHeader>

          {!showAsoebiConfirm ? (
            <>
              <div className="py-4 text-center">
                <p className="text-base text-muted-foreground">{rsvpThanksMessage}</p>
              </div>
              <div className="pt-2 flex flex-col gap-3">
                {rsvpGuestId && gift?.isSellingAsoebi && !isDeadlinePassed && (
                  isOutOfStock() ? (
                      <Button 
                        className="w-full bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed" 
                        disabled
                      >
                        Out of Stock
                      </Button>
                  ) : (
                      <Button 
                        className="w-full bg-white text-black border border-gray-200 hover:bg-gray-50 transition-colors" 
                        onClick={() => {
                            setAsoebiQuantity(1); // Reset quantity when opening
                            setAsoebiType(gift?.asoebiPriceWomen ? 'women' : gift?.asoebiPriceMen ? 'men' : null);
                            setShowAsoebiConfirm(true);
                        }}
                      >
                        Buy Asoebi
                      </Button>
                  )
                )}
                <Button className="w-full bg-[#2E235C] text-white hover:bg-[#2E235C]/90" onClick={() => setShowRsvpThanks(false)}>Close</Button>
              </div>
            </>
          ) : (
            <>
              <div className="py-4 text-center space-y-4">
                {gift?.asoebiItems && gift.asoebiItems.length > 0 ? (
                  <div className="space-y-4">
                    {gift?.type === 'wedding' && !asoebiFamily && (
                      <div className="mb-4 space-y-2">
                        <p className="text-base text-black font-medium text-center">
                          Whose Asoebi do you want?
                        </p>
                        <div className="flex gap-4 justify-center items-center">
                          <div 
                            className="cursor-pointer border rounded-lg p-3 text-center transition-all min-w-[100px] border-gray-200 hover:bg-[#2E235C] hover:text-white flex items-center justify-center"
                            onClick={() => setAsoebiFamily('bride')}
                          >
                            <div className="font-medium">Bride's Asoebi</div>
                          </div>
                          
                          <span className="text-gray-500 font-medium">or</span>

                          <div 
                            className="cursor-pointer border rounded-lg p-3 text-center transition-all min-w-[100px] border-gray-200 hover:bg-[#2E235C] hover:text-white flex items-center justify-center"
                            onClick={() => setAsoebiFamily('groom')}
                          >
                            <div className="font-medium">Groom's Asoebi</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {gift?.type === 'wedding' && asoebiFamily && (
                      <Button variant="ghost" size="sm" className="text-muted-foreground -ml-2 h-8 mb-2" onClick={() => setAsoebiFamily(null)}>
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Selection
                      </Button>
                    )}

                    {(!gift?.type || gift.type !== 'wedding' || asoebiFamily) && (
                      <>
                        <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1">
                          {gift.asoebiItems
                            .filter(it => !gift?.type || gift.type !== 'wedding' || it.category === asoebiFamily)
                            .map((it) => {
                            const available = Math.max(0, (it.stock || 0) - (it.sold || 0));
                            const qty = itemQuantities[it.id] || 0;
                            return (
                              <div key={it.id} className={`flex justify-between items-center border rounded-lg p-3 ${qty > 0 ? 'border-[#2E235C] bg-[#2E235C]/5' : 'border-gray-200'} ${available === 0 ? 'opacity-60' : ''}`}>
                                <div>
                                  <div className="font-medium text-[#2E235C]">{it.name}</div>
                                  <div className="text-sm text-gray-600">
                                    ₦{Number(it.price || 0).toLocaleString()}
                                    {available < Infinity && (
                                      available === 0 ? (
                                        <>
                                          <br />
                                          <span className="text-xs text-red-500 font-bold">(Out of Stock)</span>
                                        </>
                                      ) : (
                                        <span className="ml-2 text-xs text-green-600">({`${available} available`})</span>
                                      )
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Button 
                                    variant="outline" size="icon" className="h-8 w-8 rounded-full"
                                    onClick={() => {
                                      const next = { ...itemQuantities };
                                      next[it.id] = Math.max(0, (next[it.id] || 0) - 1);
                                      setItemQuantities(next);
                                    }}
                                    disabled={qty === 0}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <Input
                                    type="number"
                                    min="0"
                                    max={available}
                                    value={qty}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      const next = { ...itemQuantities };
                                      next[it.id] = Math.min(available, Math.max(0, val));
                                      setItemQuantities(next);
                                    }}
                                    disabled={available === 0}
                                    className="w-14 h-8 text-center p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-gray-300 disabled:bg-gray-100"
                                  />
                                  <Button 
                                    variant="outline" size="icon" className="h-8 w-8 rounded-full"
                                    onClick={() => {
                                      const next = { ...itemQuantities };
                                      const nextVal = (next[it.id] || 0) + 1;
                                      next[it.id] = Math.min(available, nextVal);
                                      setItemQuantities(next);
                                    }}
                                    disabled={available <= qty}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg text-center mt-2">
                          <p className="text-lg font-semibold text-[#2E235C]">
                            Total: ₦{(gift.asoebiItems.reduce((sum, it) => {
                              const qty = itemQuantities[it.id] || 0;
                              return sum + (Number(it.price || 0) * qty);
                            }, 0)).toLocaleString()}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                  {gift?.type === 'wedding' && (Number(gift?.asoebiBrideMenPrice || 0) > 0 || Number(gift?.asoebiBrideWomenPrice || 0) > 0 || Number(gift?.asoebiGroomMenPrice || 0) > 0 || Number(gift?.asoebiGroomWomenPrice || 0) > 0) && !asoebiFamily && (
                    <div className="mb-4 space-y-2">
                        <p className="text-base text-black font-medium text-center">
                          Whose Asoebi do you want?
                        </p>
                        <div className="flex gap-4 justify-center items-center">
                             <div 
                                className={`cursor-pointer border rounded-lg p-3 text-center transition-all min-w-[100px] border-gray-200 hover:bg-[#2E235C] hover:text-white flex items-center justify-center`}
                                onClick={() => { setAsoebiFamily('bride'); setMenQuantity(0); setWomenQuantity(0); }}
                            >
                                <div className="font-medium">Bride's Asoebi</div>
                            </div>
                            
                            <span className="text-gray-500 font-medium">or</span>

                            <div 
                                className={`cursor-pointer border rounded-lg p-3 text-center transition-all min-w-[100px] border-gray-200 hover:bg-[#2E235C] hover:text-white flex items-center justify-center`}
                                onClick={() => { setAsoebiFamily('groom'); setMenQuantity(0); setWomenQuantity(0); }}
                            >
                                <div className="font-medium">Groom's Asoebi</div>
                            </div>
                        </div>
                    </div>
                )}

                {((gift?.type !== 'wedding' && (Number(gift?.asoebiPriceMen || 0) > 0 || Number(gift?.asoebiPriceWomen || 0) > 0)) || 
                  (asoebiFamily)) && (
                    <div className="space-y-4">
                        {gift?.type === 'wedding' && (Number(gift?.asoebiBrideMenPrice || 0) > 0 || Number(gift?.asoebiBrideWomenPrice || 0) > 0 || Number(gift?.asoebiGroomMenPrice || 0) > 0 || Number(gift?.asoebiGroomWomenPrice || 0) > 0) && (
                                 <Button variant="ghost" size="sm" className="text-muted-foreground -ml-2 h-8" onClick={() => setAsoebiFamily(null)}>
                                     <ChevronLeft className="w-4 h-4 mr-1" /> Back
                                </Button>
                        )}

                        {((!asoebiFamily && gift?.asoebiPriceMen && Number(gift.asoebiPriceMen) > 0) || 
                          (asoebiFamily === 'bride' && gift?.asoebiBrideMenPrice && Number(gift.asoebiBrideMenPrice) > 0) ||
                          (asoebiFamily === 'groom' && gift?.asoebiGroomMenPrice && Number(gift.asoebiGroomMenPrice) > 0)) && (
                            <div className={`flex justify-between items-center border rounded-lg p-3 ${menQuantity > 0 ? 'border-[#2E235C] bg-[#2E235C]/5' : 'border-gray-200'} ${(asoebiFamily === 'bride' ? stock.brideMen : asoebiFamily === 'groom' ? stock.groomMen : stock.men) === 0 ? 'opacity-60' : ''}`}>
                                <div>
                                    <div className="font-medium text-[#2E235C]">Men</div>
                                    <div className="text-sm text-gray-600">
                                        ₦{Number(asoebiFamily === 'bride' ? gift?.asoebiBrideMenPrice : asoebiFamily === 'groom' ? gift?.asoebiGroomMenPrice : gift?.asoebiPriceMen).toLocaleString()}
                                        {(asoebiFamily === 'bride' ? stock.brideMen : asoebiFamily === 'groom' ? stock.groomMen : stock.men) < Infinity && (
                                            <span className={`ml-2 text-xs ${(asoebiFamily === 'bride' ? stock.brideMen : asoebiFamily === 'groom' ? stock.groomMen : stock.men) === 0 ? 'text-red-500 font-bold' : 'text-green-600'}`}>
                                                ({(asoebiFamily === 'bride' ? stock.brideMen : asoebiFamily === 'groom' ? stock.groomMen : stock.men) === 0 ? 'Out of Stock' : `${(asoebiFamily === 'bride' ? stock.brideMen : asoebiFamily === 'groom' ? stock.groomMen : stock.men)} available`} )
                                            </span>
                                        )}
                                    </div>
                                    {(asoebiFamily === 'bride' ? gift?.asoebiBrideMenDescription : asoebiFamily === 'groom' ? gift?.asoebiGroomMenDescription : null) && (
                                        <div className="text-xs text-gray-500 mt-1 italic">
                                            {asoebiFamily === 'bride' ? gift?.asoebiBrideMenDescription : gift?.asoebiGroomMenDescription}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button 
                                        variant="outline" size="icon" className="h-8 w-8 rounded-full"
                                        onClick={() => setMenQuantity(Math.max(0, menQuantity - 1))}
                                        disabled={menQuantity === 0}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <Input
                                        type="number"
                                        min="0"
                                        max={(asoebiFamily === 'bride' ? stock.brideMen : asoebiFamily === 'groom' ? stock.groomMen : stock.men)}
                                        value={menQuantity}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 0;
                                            const limit = (asoebiFamily === 'bride' ? stock.brideMen : asoebiFamily === 'groom' ? stock.groomMen : stock.men);
                                            setMenQuantity(Math.min(limit, Math.max(0, val)));
                                        }}
                                        disabled={(asoebiFamily === 'bride' ? stock.brideMen : asoebiFamily === 'groom' ? stock.groomMen : stock.men) === 0}
                                        className="w-14 h-8 text-center p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-gray-300 disabled:bg-gray-100"
                                    />
                                    <Button 
                                        variant="outline" size="icon" className="h-8 w-8 rounded-full"
                                        onClick={() => setMenQuantity(menQuantity + 1)}
                                        disabled={(asoebiFamily === 'bride' ? stock.brideMen : asoebiFamily === 'groom' ? stock.groomMen : stock.men) <= menQuantity}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {((!asoebiFamily && gift?.asoebiPriceWomen && Number(gift.asoebiPriceWomen) > 0) || 
                          (asoebiFamily === 'bride' && gift?.asoebiBrideWomenPrice && Number(gift.asoebiBrideWomenPrice) > 0) ||
                          (asoebiFamily === 'groom' && gift?.asoebiGroomWomenPrice && Number(gift.asoebiGroomWomenPrice) > 0)) && (
                            <div className={`flex justify-between items-center border rounded-lg p-3 ${womenQuantity > 0 ? 'border-[#2E235C] bg-[#2E235C]/5' : 'border-gray-200'} ${(asoebiFamily === 'bride' ? stock.brideWomen : asoebiFamily === 'groom' ? stock.groomWomen : stock.women) === 0 ? 'opacity-60' : ''}`}>
                                <div>
                                    <div className="font-medium text-[#2E235C]">Women</div>
                                    <div className="text-sm text-gray-600">
                                        ₦{Number(asoebiFamily === 'bride' ? gift?.asoebiBrideWomenPrice : asoebiFamily === 'groom' ? gift?.asoebiGroomWomenPrice : gift?.asoebiPriceWomen).toLocaleString()}
                                        {(asoebiFamily === 'bride' ? stock.brideWomen : asoebiFamily === 'groom' ? stock.groomWomen : stock.women) < Infinity && (
                                            <span className={`ml-2 text-xs ${(asoebiFamily === 'bride' ? stock.brideWomen : asoebiFamily === 'groom' ? stock.groomWomen : stock.women) === 0 ? 'text-red-500 font-bold' : 'text-green-600'}`}>
                                                ({(asoebiFamily === 'bride' ? stock.brideWomen : asoebiFamily === 'groom' ? stock.groomWomen : stock.women) === 0 ? 'Out of Stock' : `${(asoebiFamily === 'bride' ? stock.brideWomen : asoebiFamily === 'groom' ? stock.groomWomen : stock.women)} available`} )
                                            </span>
                                        )}
                                    </div>
                                    {(asoebiFamily === 'bride' ? gift?.asoebiBrideWomenDescription : asoebiFamily === 'groom' ? gift?.asoebiGroomWomenDescription : null) && (
                                        <div className="text-xs text-gray-500 mt-1 italic">
                                            {asoebiFamily === 'bride' ? gift?.asoebiBrideWomenDescription : gift?.asoebiGroomWomenDescription}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button 
                                        variant="outline" size="icon" className="h-8 w-8 rounded-full"
                                        onClick={() => setWomenQuantity(Math.max(0, womenQuantity - 1))}
                                        disabled={womenQuantity === 0}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <Input
                                        type="number"
                                        min="0"
                                        max={(asoebiFamily === 'bride' ? stock.brideWomen : asoebiFamily === 'groom' ? stock.groomWomen : stock.women)}
                                        value={womenQuantity}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 0;
                                            const limit = (asoebiFamily === 'bride' ? stock.brideWomen : asoebiFamily === 'groom' ? stock.groomWomen : stock.women);
                                            setWomenQuantity(Math.min(limit, Math.max(0, val)));
                                        }}
                                        disabled={(asoebiFamily === 'bride' ? stock.brideWomen : asoebiFamily === 'groom' ? stock.groomWomen : stock.women) === 0}
                                        className="w-14 h-8 text-center p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-gray-300 disabled:bg-gray-100"
                                    />
                                    <Button 
                                        variant="outline" size="icon" className="h-8 w-8 rounded-full"
                                        onClick={() => setWomenQuantity(womenQuantity + 1)}
                                        disabled={(asoebiFamily === 'bride' ? stock.brideWomen : asoebiFamily === 'groom' ? stock.groomWomen : stock.women) <= womenQuantity}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        )}
                        
                        {(menQuantity > 0 || womenQuantity > 0) && (
                            <div className="bg-muted/50 p-3 rounded-lg text-center mt-2">
                                <p className="text-lg font-semibold text-[#2E235C]">
                                    Total: ₦{((menQuantity * Number(asoebiFamily === 'bride' ? gift?.asoebiBrideMenPrice : asoebiFamily === 'groom' ? gift?.asoebiGroomMenPrice : gift?.asoebiPriceMen || 0)) + 
                                              (womenQuantity * Number(asoebiFamily === 'bride' ? gift?.asoebiBrideWomenPrice : asoebiFamily === 'groom' ? gift?.asoebiGroomWomenPrice : gift?.asoebiPriceWomen || 0))).toLocaleString()}
                                </p>
                            </div>
                        )}

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            {gift?.asoebiBrideDescription && (
                                <div className="p-3 bg-gray-50 border rounded-lg text-sm text-gray-700">
                                    <p className="font-medium mb-1">Bride:</p>
                                    <p className="whitespace-pre-wrap">{gift.asoebiBrideDescription}</p>
                                </div>
                            )}
                            {gift?.asoebiGroomDescription && (
                                <div className="p-3 bg-gray-50 border rounded-lg text-sm text-gray-700">
                                    <p className="font-medium mb-1">Groom:</p>
                                    <p className="whitespace-pre-wrap">{gift.asoebiGroomDescription}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {(Number(gift?.asoebiPrice || 0) > 0 && !gift?.asoebiPriceMen && !gift?.asoebiPriceWomen && !gift?.asoebiBrideMenPrice) && (
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-3 justify-center">
                             <Label htmlFor="asoebi-qty" className="whitespace-nowrap">Quantity:</Label>
                             <div className="flex flex-col items-center">
                                 <Input 
                                    id="asoebi-qty"
                                    type="number" 
                                    min={1}
                                    max={stock.generic}
                                    value={asoebiQuantity}
                                    onChange={(e) => setAsoebiQuantity(Math.min(stock.generic, Math.max(1, parseInt(e.target.value) || 1)))}
                                    disabled={stock.generic === 0}
                                    className="w-24 text-center h-10 disabled:bg-gray-100"
                                 />
                                 {stock.generic < Infinity && (
                                     <span className={`text-xs mt-1 ${stock.generic === 0 ? 'text-red-500 font-bold' : 'text-green-600'}`}>
                                         ({stock.generic === 0 ? 'Out of Stock' : `${stock.generic} available`})
                                     </span>
                                 )}
                             </div>
                        </div>
                        <p className="text-lg font-semibold text-[#2E235C]">
                            Total: ₦{(Number(gift?.asoebiPrice || 0) * asoebiQuantity).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            Platform fees: ₦500 per item
                        </p>
                    </div>
                )}
                </>
                )}
              </div>
              <div className="pt-2">
                <Button 
                  className="w-full bg-gradient-to-r from-[#2E235C] to-[#2E235C]" 
                  onClick={handleAsoebi}
                  disabled={
                    processingPayment || (
                      gift?.asoebiItems && gift.asoebiItems.length > 0
                        ? Object.values(itemQuantities).reduce((sum, v) => sum + (v || 0), 0) === 0
                        : (asoebiFamily ? (menQuantity === 0 && womenQuantity === 0) : stock.generic === 0)
                    )
                  }
                >
                  {processingPayment ? 'Processing...' : (
                    (
                      gift?.asoebiItems && gift.asoebiItems.length > 0
                        ? gift.asoebiItems.reduce((sum, it) => {
                            const qty = itemQuantities[it.id] || 0;
                            return sum + (Number(it.price || 0) * qty);
                          }, 0) > 0
                        : (Number(gift?.asoebiPrice || 0) > 0 || Number(gift?.asoebiPriceMen || 0) > 0 || Number(gift?.asoebiPriceWomen || 0) > 0)
                    ) ? 'Proceed to Payment' : 'Proceed'
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* RSVP Error Modal */}
      <Dialog open={showRsvpErrorModal} onOpenChange={setShowRsvpErrorModal}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => { e.preventDefault(); }}>
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

      {/* Asoebi Direct Purchase Modal */}
      <Dialog open={showAsoebiDirectModal} onOpenChange={setShowAsoebiDirectModal}>
        <DialogContent className="max-w-[19rem]" onInteractOutside={(e) => { e.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-playfair text-center">{heading}</DialogTitle>
            <div className="text-center text-muted-foreground text-sm mt-1 font-playfair">
              Buy Asoebi
            </div>
          </DialogHeader>

          {asoebiStep === 1 && (
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!contributorName.trim() || !contributorEmail.trim()) {
                 alert('Please provide your name and email');
                 return;
              }
              setAsoebiStep(2);
            }} className="py-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="asoebi-name" className="text-sm font-medium text-gray-900 mb-2 block">
                    Your Name
                  </Label>
                  <Input
                    id="asoebi-name"
                    value={contributorName}
                    onChange={(e) => setContributorName(e.target.value)}
                    placeholder="Enter your name"
                    className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="asoebi-email" className="text-sm font-medium text-gray-900 mb-2 block">
                    Your Email
                  </Label>
                  <Input
                    id="asoebi-email"
                    type="email"
                    value={contributorEmail}
                    onChange={(e) => setContributorEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                    required
                  />
                </div>
              </div>

              <div className="pt-6">
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-[#2E235C] to-[#2E235C]"
                >
                  Continue
                </Button>
              </div>
            </form>
          )}

          {asoebiStep === 2 && (
            <form onSubmit={handleAsoebiDirectPayment} className="py-6">
              <div className="space-y-4">
                <div className="space-y-2">
                   <Label htmlFor="asoebi-direct-qty" className="text-sm font-medium text-gray-900 mb-2 block">Quantity</Label>
                   <Input 
                      id="asoebi-direct-qty"
                      type="number" 
                      min={1}
                      value={asoebiQuantity}
                      onChange={(e) => setAsoebiQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                   />
                </div>

                {(Number(gift?.asoebiBrideMenPrice || 0) > 0 || Number(gift?.asoebiBrideWomenPrice || 0) > 0 || Number(gift?.asoebiGroomMenPrice || 0) > 0 || Number(gift?.asoebiGroomWomenPrice || 0) > 0) && (
                    <div className="mb-4 space-y-2">
                        <div className="flex gap-4 justify-center items-center">
                             <div 
                                className={`cursor-pointer border rounded-lg p-3 text-center transition-all min-w-[100px] ${asoebiFamily === 'bride' ? 'border-[#2E235C] bg-[#2E235C]/5 ring-1 ring-[#2E235C] text-[#2E235C]' : 'border-gray-200 hover:bg-[#2E235C] hover:text-white'} flex items-center justify-center`}
                                onClick={() => { setAsoebiFamily('bride'); setAsoebiType(null); }}
                            >
                                <div className="font-medium">Bride's Asoebi</div>
                            </div>
                            
                            <span className="text-gray-500 font-medium">or</span>

                            <div 
                                className={`cursor-pointer border rounded-lg p-3 text-center transition-all min-w-[100px] ${asoebiFamily === 'groom' ? 'border-[#2E235C] bg-[#2E235C]/5 ring-1 ring-[#2E235C] text-[#2E235C]' : 'border-gray-200 hover:bg-[#2E235C] hover:text-white'} flex items-center justify-center`}
                                onClick={() => { setAsoebiFamily('groom'); setAsoebiType(null); }}
                            >
                                <div className="font-medium">Groom's Asoebi</div>
                            </div>
                        </div>
                    </div>
                )}

                {((!gift?.asoebiBrideMenPrice && !gift?.asoebiGroomMenPrice && !gift?.asoebiBrideWomenPrice && !gift?.asoebiGroomWomenPrice && (gift?.asoebiPriceMen || gift?.asoebiPriceWomen)) || 
                  (asoebiFamily)) && (
                    <div className="flex gap-4 justify-center">
                        {((!asoebiFamily && gift?.asoebiPriceMen && Number(gift.asoebiPriceMen) > 0) || 
                          (asoebiFamily === 'bride' && gift?.asoebiBrideMenPrice && Number(gift.asoebiBrideMenPrice) > 0) ||
                          (asoebiFamily === 'groom' && gift?.asoebiGroomMenPrice && Number(gift.asoebiGroomMenPrice) > 0)) && (
                            <div 
                                className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${asoebiType === 'men' ? 'border-[#2E235C] bg-[#2E235C]/5 ring-1 ring-[#2E235C]' : 'border-gray-200 hover:border-[#2E235C]/50'}`}
                                onClick={() => setAsoebiType('men')}
                            >
                                <div className="font-medium text-[#2E235C]">Men</div>
                                <div className="text-sm text-gray-600">₦{Number(asoebiFamily === 'bride' ? gift?.asoebiBrideMenPrice : asoebiFamily === 'groom' ? gift?.asoebiGroomMenPrice : gift?.asoebiPriceMen).toLocaleString()}</div>
                            </div>
                        )}
                        {((!asoebiFamily && gift?.asoebiPriceWomen && Number(gift.asoebiPriceWomen) > 0) || 
                          (asoebiFamily === 'bride' && gift?.asoebiBrideWomenPrice && Number(gift.asoebiBrideWomenPrice) > 0) ||
                          (asoebiFamily === 'groom' && gift?.asoebiGroomWomenPrice && Number(gift.asoebiGroomWomenPrice) > 0)) && (
                            <div 
                                className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${asoebiType === 'women' ? 'border-[#2E235C] bg-[#2E235C]/5 ring-1 ring-[#2E235C]' : 'border-gray-200 hover:border-[#2E235C]/50'}`}
                                onClick={() => setAsoebiType('women')}
                            >
                                <div className="font-medium text-[#2E235C]">Women</div>
                                <div className="text-sm text-gray-600">₦{Number(asoebiFamily === 'bride' ? gift?.asoebiBrideWomenPrice : asoebiFamily === 'groom' ? gift?.asoebiGroomWomenPrice : gift?.asoebiPriceWomen).toLocaleString()}</div>
                            </div>
                        )}
                    </div>
                )}

                {(Number(gift?.asoebiPrice || 0) > 0 || Number(gift?.asoebiPriceMen || 0) > 0 || Number(gift?.asoebiPriceWomen || 0) > 0) && (
                  <div className="bg-muted/50 p-3 rounded-lg text-center mt-2">
                      <p className="text-sm text-muted-foreground mb-1">Price per item: ₦{(asoebiType === 'men' ? 
                          (asoebiFamily === 'bride' ? Number(gift?.asoebiBrideMenPrice || 0) : asoebiFamily === 'groom' ? Number(gift?.asoebiGroomMenPrice || 0) : Number(gift?.asoebiPriceMen || 0)) 
                          : asoebiType === 'women' ? 
                          (asoebiFamily === 'bride' ? Number(gift?.asoebiBrideWomenPrice || 0) : asoebiFamily === 'groom' ? Number(gift?.asoebiGroomWomenPrice || 0) : Number(gift?.asoebiPriceWomen || 0))
                          : Number(gift?.asoebiPrice || 0)).toLocaleString()}</p>
                      <p className="text-lg font-semibold text-[#2E235C]">
                          Total: ₦{((asoebiType === 'men' ? 
                                (asoebiFamily === 'bride' ? Number(gift?.asoebiBrideMenPrice || 0) : asoebiFamily === 'groom' ? Number(gift?.asoebiGroomMenPrice || 0) : Number(gift?.asoebiPriceMen || 0)) 
                                : asoebiType === 'women' ? 
                                (asoebiFamily === 'bride' ? Number(gift?.asoebiBrideWomenPrice || 0) : asoebiFamily === 'groom' ? Number(gift?.asoebiGroomWomenPrice || 0) : Number(gift?.asoebiPriceWomen || 0))
                                : Number(gift?.asoebiPrice || 0)) * asoebiQuantity).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Platform fees: ₦500 per item</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => setAsoebiStep(1)}
                  disabled={processingPayment}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-gradient-to-r from-[#2E235C] to-[#2E235C]"
                  disabled={processingPayment}
                >
                  {processingPayment ? 'Processing...' : 'Pay Now'}
                </Button>
              </div>
              
              <p className="text-xs text-center text-muted-foreground mt-4">
                💳 Powered by Paystack - Secure payment processing
              </p>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShareGift;
