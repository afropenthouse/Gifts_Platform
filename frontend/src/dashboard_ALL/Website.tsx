import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Globe, Calendar, Users, Copy, Eye, Save, 
  Wand2, Type, MapPin, BookOpen
} from 'lucide-react';
import { TemplateModern } from '../components/website-templates/TemplateModern';
import { useToast } from '../hooks/use-toast';

interface Gift {
  id: number;
  type: string;
  title?: string;
  date?: string;
  picture?: string;
  shareLink: string;
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

const Website = () => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [website, setWebsite] = useState<WebsiteData | null>(null);
  const { toast } = useToast();
  const [activeControlTab, setActiveControlTab] = useState('content');

  const [websiteData, setWebsiteData] = useState({
    heroTitle: '',
    heroSubtitle: 'We invite you to celebrate our special day',
    coupleName1: '',
    coupleName2: '',
    date: '',
    venue: '',
    story: '',
    primaryColor: '#312e81',
    secondaryColor: '#a78bfa',
    fontFamily: 'Georgia, serif',
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
        setSelectedTemplate('modern');
        setIsPublished(data.published || false);
        setWebsiteData({
          heroTitle: data.heroTitle || '',
          heroSubtitle: data.heroSubtitle || 'We invite you to celebrate our special day',
          coupleName1: data.coupleName1 || '',
          coupleName2: data.coupleName2 || '',
          date: selectedGift?.date ? selectedGift.date.split('T')[0] : '',
          venue: data.venue || '',
          story: data.story || '',
          primaryColor: data.primaryColor || '#312e81',
          secondaryColor: data.secondaryColor || '#a78bfa',
          fontFamily: data.fontFamily || 'Georgia, serif',
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

  const copyShareLink = async () => {
    try {
      if (website && website.shareLink) {
        const link = `${window.location.origin}/wedding-website/${selectedTemplate}/${website.shareLink}`;
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

  const saveWebsiteSettings = async (publishOnly = false) => {
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

  const renderPreview = () => {
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
        theme: {
          primaryColor: websiteData.primaryColor,
          secondaryColor: websiteData.secondaryColor,
          fontFamily: websiteData.fontFamily,
        },
      },
    };

    return <TemplateModern {...props} />;
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-5">
      {/* Controls Panel */}
      <div className="w-full md:w-[380px] lg:w-[400px] flex-shrink-0 overflow-y-auto pr-1 space-y-4">
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
                  {website.shareLink 
                    ? `${window.location.origin}/wedding-website/${selectedTemplate}/${website.shareLink}`
                    : 'Loading link...'}
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
                      if (website.shareLink) {
                        window.open(`${window.location.origin}/wedding-website/${selectedTemplate}/${website.shareLink}`, '_blank');
                      }
                    }}
                    disabled={!website.shareLink}
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
              <CardContent className="p-4 space-y-3">
                <button
                  onClick={() => setSelectedTemplate('modern')}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    selectedTemplate === 'modern' 
                      ? 'border-[#2E235C] bg-[#2E235C]/[0.03]' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ backgroundColor: '#c9a96e20' }}>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#c9a96e' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Noir</p>
                      <p className="text-xs text-gray-500">Bold and modern</p>
                    </div>
                  </div>
                </button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="style" className="space-y-3 mt-3">
            <Card className="border-gray-200/80 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label className="text-xs font-medium text-gray-500 mb-2.5 block">Color Theme</Label>
                  <div className="grid grid-cols-3 gap-2">
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview Area */}
      <div className="hidden md:flex flex-1 min-w-0">
        <div className="w-full max-w-5xl mx-auto rounded-xl border border-gray-200/80 shadow-sm overflow-hidden bg-white">
          {selectedGift ? (
            <div className="h-full overflow-auto">
              {renderPreview()}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50/50">
              <div className="text-center p-8">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-400">Select an event to preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Website;
