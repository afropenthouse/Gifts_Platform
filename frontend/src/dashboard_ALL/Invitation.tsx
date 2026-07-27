import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { DesignEditor } from '../components/DesignEditor';
import { useToast } from '../hooks/use-toast';

interface Gift {
  id: number;
  type: string;
  title?: string;
  date?: string;
  picture?: string;
  shareLink: string;
  enableGuestNotes?: boolean;
  wishlists?: { shareLink: string }[];
  isPremium?: boolean;
}

interface InvitationData {
  id?: number;
  template?: string;
  tier?: 'free' | 'premium';
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
  isPremium?: boolean;
}

interface Template {
  id: string;
  name: string;
  description: string;
  tier: 'free' | 'premium';
  previewColor: string;
  accentColor: string;
}

const Invitation = () => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const { toast } = useToast();



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

  useEffect(() => {
    const fetchGifts = async () => {
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
          }
        }
      } catch (err) {
        console.error('Error fetching gifts:', err);
      }
    };
    fetchGifts();
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

      const hasPremiumAccess = selectedGift?.isPremium || invitation?.isPremium;
      const coupleNames = [designData.coupleName1, designData.coupleName2].filter(Boolean).join(' & ');
      
      const body: any = {
        template: designData.template || invitation?.template || 'botanical-sprig',
        published: invitation?.published || false,
        isPremium: hasPremiumAccess,
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
          isPremium={selectedGift.isPremium || invitation?.isPremium}
          initialTemplateId={invitation?.template || 'botanical-sprig'}
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
