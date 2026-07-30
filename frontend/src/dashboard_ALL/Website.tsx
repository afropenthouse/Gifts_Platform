import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Checkbox } from '../components/ui/checkbox';
import { 
  Globe, Calendar, Users, Copy, Eye, Save, 
  Wand2, Type, MapPin, BookOpen, Image, Plus, X, Upload, Lock, Crown, Heart, Check
} from 'lucide-react';
import { TemplateModern } from '../components/website-templates/TemplateModern';
import { TemplateNocturne } from '../components/website-templates/TemplateNocturne';
import { TemplateRosette } from '../components/website-templates/TemplateRosette';
import { TemplateMilk } from '../components/website-templates/TemplateMilk';
import { TemplateEmerald } from '../components/website-templates/TemplateEmerald';
import { TemplateSapphire } from '../components/website-templates/TemplateSapphire';
import { TemplateRuby } from '../components/website-templates/TemplateRuby';
import { TemplatePearl } from '../components/website-templates/TemplatePearl';
import { TemplateNoir } from '../components/website-templates/TemplateNoir';
import { TemplateAmethyst } from '../components/website-templates/TemplateAmethyst';
import { TemplateJoyBlossom } from '../components/website-templates/TemplateJoyBlossom';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../context/AuthContext';

interface Gift {
  id: number;
  type: string;
  title?: string;
  date?: string;
  picture?: string;
  shareLink: string;
  enableGuestNotes?: boolean;
  wishlists?: { shareLink: string }[];
}

interface WebsiteData {
  id?: number;
  template?: string;
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
}

const PRESET_THEMES = [
  { name: 'Indigo', primary: '#312e81', secondary: '#a78bfa', bg: '#fdfbf7' },
  { name: 'Rose', primary: '#881337', secondary: '#fda4af', bg: '#fff5f5' },
  { name: 'Emerald', primary: '#064e3b', secondary: '#6ee7b7', bg: '#f5fbf7' },
  { name: 'Slate', primary: '#0f172a', secondary: '#94a3b8', bg: '#f8fafc' },
  { name: 'Amber', primary: '#78350f', secondary: '#fbbf24', bg: '#fffbf0' },
  { name: 'Noir', primary: '#0a0a0a', secondary: '#c9a96e', bg: '#0a0a0a' },
];

const FONT_OPTIONS = [
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'system-ui, sans-serif', label: 'System' },
  { value: 'Playfair Display, serif', label: 'Playfair Display' },
  { value: 'Lato, sans-serif', label: 'Lato' },
  { value: 'Cormorant Garamond, serif', label: 'Cormorant' },
];

const PREMIUM_TEMPLATE_KEYS = ['emerald', 'sapphire', 'ruby', 'pearl', 'amethyst', 'noir'];

const PREMIUM_TEMPLATE_OPTIONS = [
  { key: 'emerald', name: 'Emerald', desc: 'Photo-led, elegant & vibrant', gradient: 'from-emerald-950 via-emerald-700 to-amber-300', iconBg: 'bg-emerald-900', ring: 'border-emerald-700 bg-emerald-50 shadow-md', hover: 'hover:border-emerald-300', Icon: Heart },
  { key: 'sapphire', name: 'Sapphire', desc: 'Editorial, classic & timeless', gradient: 'from-blue-950 via-blue-700 to-sky-300', iconBg: 'bg-blue-900', ring: 'border-blue-700 bg-blue-50 shadow-md', hover: 'hover:border-blue-300', Icon: Crown },
  { key: 'ruby', name: 'Ruby', desc: 'Sleek reception luxury', gradient: 'from-zinc-950 via-rose-950 to-rose-400', iconBg: 'bg-rose-950', ring: 'border-rose-800 bg-rose-50 shadow-md', hover: 'hover:border-rose-300', Icon: Wand2 },
  { key: 'pearl', name: 'Pearl', desc: 'Minimal editorial elegance', gradient: 'from-stone-950 via-stone-300 to-white', iconBg: 'bg-stone-900', ring: 'border-stone-700 bg-stone-50 shadow-md', hover: 'hover:border-stone-300', Icon: Crown },
];

declare global {
  interface Window {
    PaystackPop: any;
  }
}

const Website = () => {
  const { user } = useAuth();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('nocturne');
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [website, setWebsite] = useState<WebsiteData & { hasTemplatePremium?: boolean; isEventPremium?: boolean; unlockedTemplates?: string[]; pendingTemplatePurchase?: string | null } | null>(null);
  const { toast } = useToast();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeControlTab, setActiveControlTab] = useState('content');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [payingTemplate, setPayingTemplate] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<string>('nocturne');
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [templateToUnlock, setTemplateToUnlock] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/websites/upload-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setWebsiteData(prev => ({ ...prev, gallery: [...prev.gallery, data.url] }));
        toast({ title: 'Image uploaded', description: 'Your image has been added to the gallery.' });
      } else {
        toast({ title: 'Upload failed', description: 'Failed to upload image.', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      toast({ title: 'Upload failed', description: 'An error occurred while uploading.', variant: 'destructive' });
    } finally {
      setUploadingImage(false);
    }
  };

  const [websiteData, setWebsiteData] = useState({
    heroTitle: '',
    heroSubtitle: 'We invite you to celebrate our special day',
    coupleName1: '',
    coupleName2: '',
    date: '',
    venue: '',
    story: '',
    ceremony: '',
    reception: '',
    primaryColor: '#312e81',
    secondaryColor: '#a78bfa',
    fontFamily: 'Georgia, serif',
    gallery: [] as string[],
  });

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

  const fetchWebsite = async (giftId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gifts/${giftId}/website`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Website data loaded:', data);
        setWebsite(data);
        const savedTemplate = data.template || 'nocturne';
        // Always use the saved template for preview, even if it's locked
        setSelectedTemplate(savedTemplate);
        setIsPublished(data.published || false);
        setWebsiteData({
          heroTitle: data.heroTitle || '',
          heroSubtitle: data.heroSubtitle || 'We invite you to celebrate our special day',
          coupleName1: data.coupleName1 || '',
          coupleName2: data.coupleName2 || '',
          date: data.date ? data.date.split('T')[0] : (selectedGift?.date ? selectedGift.date.split('T')[0] : ''),
          venue: data.venue || '',
          story: data.story || '',
          ceremony: data.ceremony || '',
          reception: data.reception || '',
          primaryColor: data.primaryColor || '#312e81',
          secondaryColor: data.secondaryColor || '#a78bfa',
          fontFamily: data.fontFamily || 'Georgia, serif',
          gallery: data.gallery || [],
        });
        if (!data.coupleName1 && !data.coupleName2 && selectedGift?.title) {
          const names = selectedGift.title.split(' & ');
          if (names.length >= 1) {
            setWebsiteData(prev => ({ 
              ...prev, 
              coupleName1: names[0], 
              coupleName2: names[1] || '' 
            }));
          }
        }
      } else {
        console.error('Failed to fetch website, status:', res.status);
      }
    } catch (err) {
      console.error('Error fetching website:', err);
    }
  };

  const selectGift = (gift: Gift) => {
    setSelectedGift(gift);
    setWebsiteData(prev => ({
      ...prev,
      date: gift.date ? gift.date.split('T')[0] : '',
    }));
    fetchWebsite(gift.id);
  };





  const isTemplateUnlocked = (template: string) => {
    if (!website) return false;
    if (website.hasTemplatePremium) return true;
    return (website.unlockedTemplates || []).includes(template);
  };

  const handleUnlockTemplate = async () => {
    if (!selectedGift || !templateToUnlock) return;
    
    setIsProcessingPayment(true);
    setPayingTemplate(templateToUnlock);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gifts/${selectedGift.id}/premium/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'template',
          template: templateToUnlock,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast({
          title: 'Error',
          description: data.msg || 'Failed to initialize payment',
          variant: 'destructive',
        });
        setIsProcessingPayment(false);
        setPayingTemplate(null);
      }
    } catch (err) {
      console.error('Unlock template error:', err);
      toast({
        title: 'Error',
        description: 'Failed to initialize payment',
        variant: 'destructive',
      });
      setIsProcessingPayment(false);
      setPayingTemplate(null);
    }
  };

  const getPublicTemplate = () => {
    if (PREMIUM_TEMPLATE_KEYS.includes(selectedTemplate) && !isTemplateUnlocked(selectedTemplate)) {
      return 'nocturne';
    }
    return selectedTemplate || 'nocturne';
  };

  const getPublicLink = () => {
    if (!website) return '';
    const linkId = website.slug || website.shareLink;
    return `${window.location.origin}/wedding-website/${linkId}`;
  };

  const copyShareLink = async () => {
    try {
      if (website?.shareLink) {
        const link = getPublicLink();
        await navigator.clipboard.writeText(link);
        toast({ title: 'Link copied!', description: 'Your website link is ready to share.' });
      } else {
        toast({ title: 'No link available', description: 'Website link not available yet.', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error copying link:', err);
      toast({ title: 'Failed to copy', description: 'Could not copy link to clipboard.', variant: 'destructive' });
    }
  };

  // Reset payment states on component mount and when website pending is cleared
  useEffect(() => {
    setIsProcessingPayment(false);
    setPayingTemplate(null);
  }, [website?.pendingTemplatePurchase]);

  // Check for payment verification on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference');
    const giftId = params.get('giftId');
    const type = params.get('type');
    const template = params.get('template');

    if (reference && giftId) {
      const verifyPayment = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gifts/${giftId}/premium/verify?reference=${encodeURIComponent(reference)}&type=${type || 'event'}${template ? `&template=${encodeURIComponent(template)}` : ''}`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await response.json();
          if (response.ok) {
            toast({ title: 'Success!', description: data.msg });
            // Clear URL params
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('reference');
            newUrl.searchParams.delete('giftId');
            newUrl.searchParams.delete('type');
            newUrl.searchParams.delete('template');
            window.history.replaceState({}, '', newUrl.toString());
            // If it's a template payment, select that template
            if (type === 'template' && template) {
              setSelectedTemplate(template);
            }
            // Always refresh website data using the giftId from the URL
            fetchWebsite(parseInt(giftId));
            // Also restore selectedGift from the already-loaded gifts list
            const match = gifts.find((g) => g.id === parseInt(giftId));
            if (match) setSelectedGift(match);
          } else {
            toast({ title: 'Error', description: data.msg || 'Payment verification failed', variant: 'destructive' });
          }
        } catch (err) {
          console.error('Payment verification error:', err);
          toast({ title: 'Error', description: 'Failed to verify payment', variant: 'destructive' });
        } finally {
          // Reset payment states regardless of outcome
          setIsProcessingPayment(false);
          setPayingTemplate(null);
        }
      };
      verifyPayment();
    }
  }, [gifts]);

  const saveWebsiteSettings = async (publishOnly = false) => {
    if (!selectedGift) {
      toast({ title: 'No event selected', description: 'Please select an event first.', variant: 'destructive' });
      return;
    }

    if (PREMIUM_TEMPLATE_KEYS.includes(selectedTemplate) && !isTemplateUnlocked(selectedTemplate)) {
      setActiveControlTab('template');
      toast({
        title: 'Premium template locked',
        description: 'Please unlock this premium template before previewing, saving, or publishing it.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({ title: 'Authentication error', description: 'Please log in again.', variant: 'destructive' });
        return;
      }
      
      const body: any = {
        template: selectedTemplate,
        published: publishOnly ? true : isPublished,
        primaryColor: websiteData.primaryColor,
        secondaryColor: websiteData.secondaryColor,
        coupleName1: websiteData.coupleName1,
        coupleName2: websiteData.coupleName2,
        venue: websiteData.venue,
        story: websiteData.story,
        heroTitle: websiteData.heroTitle,
        heroSubtitle: websiteData.heroSubtitle,
        fontFamily: websiteData.fontFamily,
        ceremony: websiteData.ceremony,
        reception: websiteData.reception,
        date: websiteData.date,
        content: {
          gallery: websiteData.gallery,
          showWellWishes: !!selectedGift?.enableGuestNotes,
          enableWishlistButton: true,
        },
      };
      
      console.log('Saving website settings with body:', body);
      
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gifts/${selectedGift.id}/website`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      
      console.log('Save response status:', res.status);
      
      if (res.ok) {
        const updatedWebsite = await res.json();
        console.log('Updated website data:', updatedWebsite);
        setWebsite(updatedWebsite);
        setIsPublished(updatedWebsite.published);
        toast({ 
          title: publishOnly ? 'Published!' : 'Saved!', 
          description: publishOnly ? 'Your website is now live!' : 'Your website settings have been saved.' 
        });
      } else {
        const errorData = await res.json().catch(() => ({ msg: 'Unknown error' }));
        console.error('Save failed with error:', errorData);
        toast({ 
          title: 'Error', 
          description: errorData.msg || 'Failed to save settings.', 
          variant: 'destructive' 
        });
      }
    } catch (err) {
      console.error('Error saving website settings:', err);
      toast({ 
        title: 'Error', 
        description: 'An unexpected error occurred. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openPreview = (key: string) => {
    setPreviewTemplate(key);
    setPreviewModalOpen(true);
  };

  const renderPreview = (templateKey?: string) => {
    if (!selectedGift) return null;
    
    const props = {
      title: selectedGift.title || 'Your Event',
      date: websiteData.date || selectedGift.date,
      venue: websiteData.venue,
      story: websiteData.story,
      shareLink: selectedGift.shareLink,
      picture: selectedGift.picture,
      primaryColor: websiteData.primaryColor,
      secondaryColor: websiteData.secondaryColor,
      wishlists: selectedGift.wishlists,
      gallery: websiteData.gallery,
      showWellWishes: !!selectedGift?.enableGuestNotes,
      enableWishlistButton: true,
      data: {
        heroImage: selectedGift.picture,
        ...(selectedGift.type !== 'wedding' ? { heroTitle: websiteData.heroTitle || (websiteData.coupleName1 && websiteData.coupleName2 ? `${websiteData.coupleName1} & ${websiteData.coupleName2}` : undefined) } : {}),
        heroSubtitle: websiteData.heroSubtitle,
        eventName: selectedGift.title,
        eventDate: websiteData.date || selectedGift.date,
        eventLocation: websiteData.venue,
        eventType: selectedGift.type,
        coupleNames: `${websiteData.coupleName1} & ${websiteData.coupleName2}`.trim(),
        story: websiteData.story,
        ceremony: websiteData.ceremony,
        reception: websiteData.reception,
        theme: {
          primaryColor: websiteData.primaryColor,
          secondaryColor: websiteData.secondaryColor,
          fontFamily: websiteData.fontFamily,
        },
      },
    };

    const useTemplate = templateKey || selectedTemplate || 'nocturne';

    switch (useTemplate) {
              case 'joy-blossom':
                return <TemplateJoyBlossom {...props} />;
              case 'nocturne':
                return <TemplateNocturne {...props} />;
              case 'rosette':
                return <TemplateRosette {...props} />;
              case 'milk':
                return <TemplateMilk {...props} />;
              case 'emerald':
                return <TemplateEmerald {...props} />;
              case 'sapphire':
                return <TemplateSapphire {...props} />;
              case 'ruby':
                return <TemplateRuby {...props} />;
              case 'pearl':
                return <TemplatePearl {...props} />;
              case 'noir':
                return <TemplateNoir {...props} />;
              case 'amethyst':
                return <TemplateAmethyst {...props} />;
              case 'modern':
              default:
                return <TemplateModern {...props} />;
            }
  };

  return (
    <div className="h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-4 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Website Builder</h2>
              <p className="text-sm text-gray-500">Design your website</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => saveWebsiteSettings()} disabled={isSaving} className="h-8">
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save
              </Button>
              <Button size="sm" onClick={() => saveWebsiteSettings(true)} disabled={isSaving} className={`h-8 ${isPublished ? 'bg-green-600 hover:bg-green-700' : 'bg-[#2E235C] hover:bg-[#2E235C]/90'}`}>
                <Globe className="w-3.5 h-3.5 mr-1.5" />
                {isPublished ? 'Published' : 'Publish'}
              </Button>
            </div>
          </div>

          {/* Share Link Card */}
          {website && (
            <Card className={`border-2 shadow-md ${isPublished ? 'border-green-500 bg-green-50' : 'border-amber-400 bg-amber-50'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className={`w-5 h-5 ${isPublished ? 'text-green-700' : 'text-amber-600'}`} />
                  <h3 className={`text-sm font-bold ${isPublished ? 'text-green-800' : 'text-amber-700'}`}>
                    {isPublished ? 'Your website is live' : 'Website link (not published yet)'}
                  </h3>
                </div>
                {!isPublished && (
                  <p className="text-xs text-amber-700 mb-2">Publish your website to make it visible to guests.</p>
                )}
                <code className="block w-full bg-white px-3 py-2.5 rounded-lg border text-xs font-mono overflow-x-auto mb-3 text-gray-700 font-semibold">
                  {getPublicLink() || 'Loading link...'}
                </code>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-9 text-xs font-semibold" 
                    onClick={copyShareLink}
                    disabled={!website.shareLink}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy Link
                  </Button>
                  <Button 
                    size="sm" 
                    className={`flex-1 h-9 text-xs font-bold ${isPublished ? 'bg-green-600 hover:bg-green-700' : 'bg-[#2E235C] hover:bg-[#2E235C]/90'} text-white`} 
                    onClick={() => {
                      const link = getPublicLink();
                      if (link) {
                        window.open(link, '_blank');
                      }
                    }}
                    disabled={!website?.shareLink}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    {isPublished ? 'Open Website' : 'Preview'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Event Selector */}
        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              Select Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedGift?.id.toString() || ''} 
              onValueChange={(val) => {
                const gift = gifts.find(g => g.id.toString() === val);
                if (gift) selectGift(gift);
              }}
            >
              <SelectTrigger className="h-9 text-sm">
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
          </CardContent>
        </Card>

        <Tabs value={activeControlTab} onValueChange={setActiveControlTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-9">
            <TabsTrigger value="template" className="text-xs">Template</TabsTrigger>
            <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>
            <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="space-y-3 mt-3">
            <Card className="border-gray-200/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">All Templates</CardTitle>
                <p className="text-xs text-gray-500">Free templates are ready to use. Premium templates unlock with a one-time ₦10,000 payment each.</p>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
          { key: 'joy-blossom', name: 'Joy Blossom', desc: 'Festive, floral & joyful', gradient: 'from-pink-100 to-rose-100', dotGradient: 'from-pink-500 to-rose-500', premium: false },
          { key: 'nocturne', name: 'Nocturne', desc: 'Dark, moody & refined', gradient: 'from-slate-800 to-stone-800', dotGradient: 'from-orange-400 to-amber-400', premium: false },
          { key: 'rosette', name: 'Rosette', desc: 'Bold, romantic & vibrant', gradient: 'from-rose-100 to-red-100', dotGradient: 'from-rose-500 to-red-500', premium: false },
          { key: 'milk', name: 'Milk', desc: 'Pure, fine & timeless', gradient: 'from-stone-100 to-orange-50', dotGradient: 'from-stone-400 to-orange-300', premium: false },
          { key: 'emerald', name: 'Emerald', desc: 'Photo-led, elegant & vibrant', gradient: 'from-emerald-950 via-emerald-700 to-amber-300', iconBg: 'bg-emerald-900', ring: 'border-emerald-700 bg-emerald-50 shadow-md', hover: 'hover:border-emerald-300', Icon: Heart, premium: true },
          { key: 'sapphire', name: 'Sapphire', desc: 'Editorial, classic & timeless', gradient: 'from-blue-950 via-blue-700 to-sky-300', iconBg: 'bg-blue-900', ring: 'border-blue-700 bg-blue-50 shadow-md', hover: 'hover:border-blue-300', Icon: Crown, premium: true },
          { key: 'ruby', name: 'Ruby', desc: 'Sleek reception luxury', gradient: 'from-zinc-950 via-rose-950 to-rose-400', iconBg: 'bg-rose-950', ring: 'border-rose-800 bg-rose-50 shadow-md', hover: 'hover:border-rose-300', Icon: Wand2, premium: true },
          {key: 'pearl', name: 'Pearl', desc: 'Minimal editorial elegance', gradient: 'from-stone-950 via-stone-300 to-white', iconBg: 'bg-stone-900', ring: 'border-stone-700 bg-stone-50 shadow-md', hover: 'hover:border-stone-300', Icon: Crown, premium: true},
          {key: 'noir', name: 'Noir', desc: 'Navy, gold & refined editorial', gradient: 'from-[#1a2332] via-[#2a3a52] to-[#c9a959]', iconBg: 'bg-[#1a2332]', ring: 'border-[#1a2332] bg-[#faf8f5] shadow-md', hover: 'hover:border-[#c9a959]', Icon: Crown, premium: true},
          {key: 'amethyst', name: 'Amethyst', desc: 'Airy purple & lavender elegance', gradient: 'from-purple-900 via-violet-800 to-fuchsia-700', iconBg: 'bg-purple-900', ring: 'border-purple-700 bg-purple-50 shadow-md', hover: 'hover:border-purple-300', Icon: Crown, premium: true},
        ].map((tpl) => {
          const isPremium = !!tpl.premium;
          const TplIcon = tpl.Icon;
          const isSelected = selectedTemplate === tpl.key;
          const isUnlocked = !isPremium || isTemplateUnlocked(tpl.key);
          return (
            <div
                key={tpl.key}
                onClick={() => {
                  setSelectedTemplate(tpl.key);
                  if (isPremium && !isUnlocked) {
                    setTemplateToUnlock(tpl.key);
                    setUnlockModalOpen(true);
                  }
                }}
                className={`relative p-3 rounded-lg border text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? tpl.ring || 'border-[#2E235C] bg-[#2E235C]/[0.03]'
                    : isPremium
                      ? 'border-gray-200 bg-white hover:border-gray-300'
                      : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {tpl.gradient ? (
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center bg-gradient-to-br ${tpl.gradient} relative`}>
                      {tpl.dotGradient ? (
                        <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${tpl.dotGradient}`} />
                      ) : TplIcon ? (
                        <TplIcon className="w-5 h-5 text-white/80 drop-shadow" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-white/60" />
                      )}
                      {isPremium && !isUnlocked && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center">
                          <Lock className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-md flex items-center justify-center relative bg-gray-100">
                      <div className="w-4 h-4 rounded-full bg-gray-400" />
                    </div>
                  )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{tpl.name}</p>
                    {isPremium && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold uppercase tracking-wider">Premium</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{tpl.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openPreview(tpl.key);
                  }}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="style" className="space-y-3 mt-3">
            <Card className="border-gray-200/80 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-500 mb-2.5 block">Color Theme</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESET_THEMES.map(theme => (
                        <button
                          key={theme.name}
                          onClick={() => setWebsiteData(prev => ({ 
                            ...prev, 
                            primaryColor: theme.primary,
                            secondaryColor: theme.secondary,
                          }))}
                          className={`p-2 rounded-lg border transition-all ${
                            websiteData.primaryColor === theme.primary 
                              ? 'border-[#2E235C] ring-1 ring-[#2E235C]' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex gap-1 mb-1.5">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.primary }} />
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.secondary }} />
                          </div>
                          <span className="text-[10px] text-gray-500">{theme.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-500 mb-2.5 block">Custom Colors</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[10px] text-gray-400 mb-1 block">Primary</Label>
                        <div className="flex gap-1.5">
                          <input 
                            type="color" 
                            value={websiteData.primaryColor} 
                            onChange={(e) => setWebsiteData(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                          />
                          <Input 
                            value={websiteData.primaryColor}
                            onChange={(e) => setWebsiteData(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="h-8 text-xs flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-[10px] text-gray-400 mb-1 block">Accent</Label>
                        <div className="flex gap-1.5">
                          <input 
                            type="color" 
                            value={websiteData.secondaryColor} 
                            onChange={(e) => setWebsiteData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                          />
                          <Input 
                            value={websiteData.secondaryColor}
                            onChange={(e) => setWebsiteData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                            className="h-8 text-xs flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-500 mb-2.5 block">Font Family</Label>
                  <Select value={websiteData.fontFamily} onValueChange={(v) => setWebsiteData(prev => ({ ...prev, fontFamily: v }))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-3 mt-3">
            <Card className="border-gray-200/80 shadow-sm">
              <CardContent className="p-4 space-y-3.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedGift?.type !== 'wedding' && (
                  <div>
                    <Label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5" />
                      Hero Title
                    </Label>
                    <Input 
                      value={websiteData.heroTitle}
                      onChange={(e) => setWebsiteData(prev => ({ ...prev, heroTitle: e.target.value }))}
                      placeholder="Sarah & James"
                      className="h-9 text-sm"
                    />
                  </div>
                  )}
                  <div>
                    <Label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5" />
                      Hero Subtitle
                    </Label>
                    <Input 
                      value={websiteData.heroSubtitle}
                      onChange={(e) => setWebsiteData(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                      placeholder="We invite you to celebrate..."
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Date
                    </Label>
                    <Input 
                      type="date"
                      value={websiteData.date}
                      onChange={(e) => setWebsiteData(prev => ({ ...prev, date: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Venue
                    </Label>
                    <Input 
                      value={websiteData.venue}
                      onChange={(e) => setWebsiteData(prev => ({ ...prev, venue: e.target.value }))}
                      placeholder="Grand Hotel, Lagos"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                {selectedGift?.type === 'wedding' && (
                <div>
                   <Label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
                     <Users className="w-3.5 h-3.5" />
                     Couple Names
                   </Label>
                   <div className="flex items-center gap-2">
                     <Input 
                       value={websiteData.coupleName1}
                       onChange={(e) => setWebsiteData(prev => ({ ...prev, coupleName1: e.target.value }))}
                       placeholder="Groom"
                       className="h-9 text-sm flex-1"
                     />
                     <span className="text-gray-400 font-medium">&</span>
                     <Input 
                       value={websiteData.coupleName2}
                       onChange={(e) => setWebsiteData(prev => ({ ...prev, coupleName2: e.target.value }))}
                       placeholder="Bride"
                       className="h-9 text-sm flex-1"
                     />
                   </div>
                 </div>
                )}
                <div>
                  <Label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Your Story
                  </Label>
                  <Textarea 
                    value={websiteData.story}
                    onChange={(e) => setWebsiteData(prev => ({ ...prev, story: e.target.value }))}
                    placeholder="Tell your love story..."
                    rows={4}
                    className="text-sm resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Ceremony Details
                    </Label>
                    <Textarea 
                      value={websiteData.ceremony}
                      onChange={(e) => setWebsiteData(prev => ({ ...prev, ceremony: e.target.value }))}
                      placeholder="e.g. 3:00 PM, St. Mary's Chapel"
                      rows={2}
                      className="text-sm resize-none"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Reception Details
                    </Label>
                    <Textarea 
                      value={websiteData.reception}
                      onChange={(e) => setWebsiteData(prev => ({ ...prev, reception: e.target.value }))}
                      placeholder="e.g. 6:00 PM, The Grand Hall"
                      rows={2}
                      className="text-sm resize-none"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5" />
                    Gallery Images
                  </Label>
                  <div className="space-y-3">
                    {websiteData.gallery.filter(url => url).length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {websiteData.gallery.map((url, index) => url && (
                          <div key={index} className="relative group aspect-square rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                            <img 
                              src={url} 
                              alt={`Gallery ${index + 1}`} 
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setWebsiteData(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }))}
                              className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-opacity"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {websiteData.gallery.map((url, index) => url === '' && (
                      <div key={`url-${index}`} className="flex gap-2">
                        <Input 
                          value={url}
                          onChange={(e) => {
                            const newGallery = [...websiteData.gallery];
                            newGallery[index] = e.target.value;
                            setWebsiteData(prev => ({ ...prev, gallery: newGallery }));
                          }}
                          placeholder="Paste image URL"
                          className="h-9 text-sm flex-1"
                        />
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setWebsiteData(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }))}
                          className="h-9 px-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setWebsiteData(prev => ({ ...prev, gallery: [...prev.gallery, ''] }))}
                        className="flex-1 h-9 text-sm"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Add URL
                      </Button>
                      <label className="flex-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full h-9 text-sm"
                          disabled={uploadingImage}
                          asChild
                        >
                          <span>
                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                            {uploadingImage ? 'Uploading...' : 'Upload Image'}
                          </span>
                        </Button>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Uploaded images are stored securely and added to your live gallery.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {previewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">Preview Template</h3>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-50">
              {selectedGift && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {renderPreview(previewTemplate)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {unlockModalOpen && templateToUnlock && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">Unlock Premium Template</h3>
              <button
                type="button"
                onClick={() => setUnlockModalOpen(false)}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {templateToUnlock.charAt(0).toUpperCase() + templateToUnlock.slice(1)} Template
                </h4>
                <p className="text-gray-500">
                  Unlock this premium template and use it for your wedding website.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-gray-900">₦10,000</div>
                <div className="text-sm text-gray-500">One-time payment</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  Full access to the template
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  Unlimited customizations
                </div>
              </div>

              <Button
                className="w-full bg-[#2E235C] hover:bg-[#2E235C]/90 text-white"
                onClick={handleUnlockTemplate}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Unlock Now'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Website;
