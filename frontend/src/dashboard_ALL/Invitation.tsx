import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { DesignEditor } from '../components/DesignEditor';
import { useToast } from '../hooks/use-toast';
import { Crown, CreditCard, CheckCircle } from 'lucide-react';

interface Gift {
  id: number;
  type: string;
  title?: string;
  date?: string;
  picture?: string;
  shareLink: string;
  enableGuestNotes?: boolean;
  wishlists?: { shareLink: string }[];
  tier?: 'free' | 'vip' | 'royal';
}

interface InvitationData {
  id?: number;
  template?: string;
  tier?: 'free' | 'vip' | 'royal';
  published?: boolean;
  venue?: string;
  coupleName1?: string;
  coupleName2?: string;
  story?: string;
  primaryColor?: string;
  secondaryColor?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  fontFamily?: string;
  shareLink?: string;
  slug?: string;
  giftId?: number;
  gallery?: string[];
  showWellWishes?: boolean;
  enableWishlistButton?: boolean;
  tier?: 'free' | 'vip' | 'royal';
}

interface Template {
  id: string;
  name: string;
  description: string;
  tier: 'free' | 'vip' | 'royal';
  previewColor: string;
  accentColor: string;
}

const Invitation = () => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { toast } = useToast();

  const isRoyal = selectedGift?.tier === 'royal' || invitation?.tier === 'royal';
  const isVip = selectedGift?.tier === 'vip' || invitation?.tier === 'vip';
  const hasPremiumAccess = isRoyal;



  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/invitations/templates`);
        if (res.ok) {
          const data = await res.json();
          setTemplates(data);
        }
      } catch (err) {
        console.error('Error fetching templates:', err);
      }
    };
    fetchTemplates();
  }, []);

  const loadGifts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gifts/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const giftsData = Array.isArray(data) ? data : [];
        setGifts(giftsData);
        if (giftsData.length > 0 && !selectedGift) {
          selectGift(giftsData[0]);
        } else if (selectedGift) {
          const refreshed = giftsData.find(g => g.id === selectedGift.id) || selectedGift;
          setSelectedGift(refreshed);
        }
        return giftsData;
      }
    } catch (err) {
      console.error('Error fetching gifts:', err);
    }
    return null;
  };

  useEffect(() => {
    loadGifts();
  }, []);

  // Verify premium payment when redirected back from Paystack
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference');
    const giftId = params.get('giftId');
    const type = params.get('type');
    const tier = params.get('tier');

    if (reference && giftId && (type === 'event' || type === 'template')) {
      const verifyPayment = async () => {
        try {
          const token = localStorage.getItem('token');
          let verifyUrl = `${import.meta.env.VITE_BACKEND_URL}/api/gifts/${giftId}/premium/verify?reference=${encodeURIComponent(reference)}&type=${type}`;
          const templateParam = params.get('template');
          if (templateParam) verifyUrl += `&template=${encodeURIComponent(templateParam)}`;
          if (tier) verifyUrl += `&tier=${encodeURIComponent(tier)}`;

          const res = await fetch(verifyUrl, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();

          // Clear URL params regardless of outcome
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);

          if (res.ok) {
            toast({ title: 'Success!', description: data.msg });
            await loadGifts();
          } else {
            toast({ title: 'Error', description: data.msg || 'Payment verification failed', variant: 'destructive' });
            await loadGifts();
          }
        } catch (err) {
          console.error('Payment verification error:', err);
          toast({ title: 'Error', description: 'Failed to verify payment', variant: 'destructive' });
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };
      verifyPayment();
    }
  }, []);

  const fetchInvitation = async (giftId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/invitations/gift/${giftId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Invitation data loaded:', data);
        setInvitation(data);
      } else {
        console.error('Failed to fetch invitation, status:', res.status);
      }
    } catch (err) {
      console.error('Error fetching invitation:', err);
    }
  };

  const selectGift = (gift: Gift) => {
    setSelectedGift(gift);
    fetchInvitation(gift.id);
  };

   const handleUpgradeToPremium = async (tier: 'vip' | 'royal' = 'vip') => {
     if (!selectedGift) return;
     setIsProcessingPayment(true);
     try {
       const token = localStorage.getItem('token');
       const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gifts/${selectedGift.id}/premium/initialize`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify({ type: 'event', tier }),
       });
       const data = await res.json();
       if (res.ok && data.authorization_url) {
         window.location.href = data.authorization_url;
       } else {
         toast({
           title: 'Error',
           description: data.msg || 'Failed to initialize payment',
           variant: 'destructive',
         });
         setIsProcessingPayment(false);
       }
     } catch (err) {
       console.error('Premium upgrade error:', err);
       toast({
         title: 'Error',
         description: 'Failed to initialize payment',
         variant: 'destructive',
       });
       setIsProcessingPayment(false);
     }
   };

  const saveInvitationSettings = async (designData: any) => {
    if (!selectedGift) {
      toast({ title: 'No event selected', description: 'Please select an event first.', variant: 'destructive' });
      return;
    }
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({ title: 'Authentication error', description: 'Please log in again.', variant: 'destructive' });
        return;
      }

       const hasPremiumAccess = isRoyal;
       const coupleNames = [designData.coupleName1, designData.coupleName2].filter(Boolean).join(' & ');
       
       const body: any = {
         template: designData.template || invitation?.template || 'botanical-sprig',
         published: invitation?.published || false,
         tier: isRoyal ? 'royal' : isVip ? 'vip' : 'free',
        primaryColor: designData.primaryColor,
        secondaryColor: designData.secondaryColor,
        theme: {
          primaryColor: designData.primaryColor,
          secondaryColor: designData.secondaryColor,
          fontFamily: designData.fontFamily,
        },
        coupleName1: designData.coupleName1,
        coupleName2: designData.coupleName2,
        venue: designData.venue,
        story: designData.story,
        heroTitle: coupleNames || selectedGift.title,
        heroSubtitle: 'We invite you to celebrate our special day',
        fontFamily: designData.fontFamily,
        content: {
          coupleNames,
          eventLocation: designData.venue,
          story: designData.story,
          gallery: [],
          showWellWishes: !!selectedGift?.enableGuestNotes,
          enableWishlistButton: true,
        },
      };
      
      const method = invitation?.id ? 'PUT' : 'POST';
      const url = invitation?.id 
        ? `${import.meta.env.VITE_BACKEND_URL}/api/invitations/${invitation.id}`
        : `${import.meta.env.VITE_BACKEND_URL}/api/invitations`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...body,
          giftId: selectedGift.id,
          title: selectedGift.title,
        }),
      });
      
      if (res.ok) {
        const updatedInvitation = await res.json();
        setInvitation(updatedInvitation);
        toast({ 
          title: 'Saved!', 
          description: 'Your invitation settings have been saved.' 
        });
      } else {
        const errorData = await res.json().catch(() => ({ msg: 'Unknown error' }));
        toast({ 
          title: 'Error', 
          description: errorData.msg || 'Failed to save settings.', 
          variant: 'destructive' 
        });
      }
    } catch (err) {
      console.error('Error saving invitation settings:', err);
      toast({ 
        title: 'Error', 
        description: 'An unexpected error occurred. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };



  const getInitialData = () => {
    if (!invitation) return undefined;
    return {
      title: invitation.heroTitle || selectedGift?.title || '',
      date: selectedGift?.date ? selectedGift.date.split('T')[0] : '',
      venue: invitation.venue || '',
      story: invitation.story || '',
      coupleName1: invitation.coupleName1 || '',
      coupleName2: invitation.coupleName2 || '',
      primaryColor: invitation.primaryColor || '#4a2c2a',
      secondaryColor: invitation.secondaryColor || '#d4a574',
      fontFamily: invitation.fontFamily || 'Georgia, serif',
    };
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Invitation Designer</h2>
          <p className="text-sm text-gray-500">Create beautiful invitations like Canva</p>
        </div>
        {selectedGift && (
          isRoyal ? (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md">
              <CheckCircle className="w-3.5 h-3.5" />
              Royal access
            </div>
          ) : isVip ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-md">
                <CheckCircle className="w-3.5 h-3.5" />
                VIP active
              </div>
              <Button
                size="sm"
                className="text-xs h-9 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold shadow-md"
                onClick={() => handleUpgradeToPremium('royal')}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" />
                    Upgrade to Royal
                  </div>
                )}
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="text-xs h-9 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-yellow-900 font-bold shadow-md"
              onClick={() => handleUpgradeToPremium('vip')}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-yellow-900 border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                   <Crown className="w-3.5 h-3.5" />
                   Upgrade Event to VIP
                </div>
              )}
            </Button>
          )
        )}
      </div>

      {/* Event Selector */}
      <Card className="border-gray-200/80 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Select Event:</label>
            <Select 
              value={selectedGift?.id.toString() || ''} 
              onValueChange={(val) => {
                const gift = gifts.find(g => g.id.toString() === val);
                if (gift) selectGift(gift);
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Choose an event" />
              </SelectTrigger>
              <SelectContent>
                {gifts.map(gift => (
                  <SelectItem key={gift.id} value={gift.id.toString()}>
                    {gift.title || gift.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Design Editor */}
      {selectedGift ? (
        <DesignEditor
          templates={templates}
          initialData={getInitialData()}
          onSave={(data) => saveInvitationSettings(data)}
          giftId={selectedGift.id}
          isPremium={isRoyal}
          initialTemplateId={invitation?.template || 'botanical-sprig'}
          onPremiumUpgrade={handleUpgradeToPremium}
          giftTier={selectedGift?.tier}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">Select an event to start designing your invitation</p>
        </div>
      )}
    </div>
  );
};

export default Invitation;
