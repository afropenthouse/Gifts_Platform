import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Download, Save,
  Type, Palette, ArrowLeft, Crown 
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { useToast } from '../hooks/use-toast';
import {
  BotanicalSprig,
  GardenOval,
  LuxuryMinimal,
  WatercolorFloral,
  ArtDecoGreenery,
  ModernGeometric,
  RomanticRose,
  ClassicInvitation,
} from './invitation-templates';

interface Template {
  id: string;
  name: string;
  description: string;
  tier: 'free' | 'premium';
  previewColor: string;
  accentColor: string;
}

interface DesignData {
  template?: string;
  title: string;
  date: string;
  venue: string;
  story: string;
  coupleName1: string;
  coupleName2: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

interface DesignEditorProps {
  templates: Template[];
  initialData?: Partial<DesignData>;
  onSave?: (data: DesignData) => void;
  giftId?: number;
  isPremium?: boolean;
  initialTemplateId?: string;
}

const PRESET_THEMES = [
  { name: 'Indigo', primary: '#312e81', secondary: '#a78bfa' },
  { name: 'Rose', primary: '#881337', secondary: '#fda4af' },
  { name: 'Emerald', primary: '#064e3b', secondary: '#6ee7b7' },
  { name: 'Slate', primary: '#0f172a', secondary: '#94a3b8' },
  { name: 'Amber', primary: '#78350f', secondary: '#fbbf24' },
  { name: 'Noir', primary: '#0a0a0a', secondary: '#c9a96e' },
];

const FONT_OPTIONS = [
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'system-ui, sans-serif', label: 'System' },
  { value: 'Playfair Display, serif', label: 'Playfair Display' },
  { value: 'Lato, sans-serif', label: 'Lato' },
  { value: 'Cormorant Garamond, serif', label: 'Cormorant' },
];

const formatDisplayDate = (value?: string) => {
  if (!value) return 'Monday, March 22, 2027';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

const LeafSprig = ({ className = '', color = '#7b9a78' }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 170 520" width="100%" height="100%" className={className} aria-hidden="true">
    <path d="M128 18 C74 112 156 212 88 314 C54 366 77 438 30 504" fill="none" stroke={color} strokeWidth="2" opacity="0.5" />
    {[60, 118, 185, 255, 328, 402, 462].map((y, index) => (
      <g key={y} transform={`translate(${index % 2 ? 80 : 112} ${y}) rotate(${index % 2 ? -34 : 28})`}>
        <ellipse cx="0" cy="0" rx="18" ry="44" fill={color} opacity={index % 3 === 0 ? 0.78 : 0.42} />
        <path d="M0 -36 L0 36" stroke="#ffffff" strokeWidth="1" opacity="0.55" />
      </g>
    ))}
    {[146, 288, 372, 438].map((y) => (
      <circle key={y} cx="70" cy={y} r="3" fill="#c69a52" opacity="0.75" />
    ))}
  </svg>
);

const GardenPattern = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 320 420" width="100%" height="100%" className={className} aria-hidden="true">
    <g fill="none" stroke="#6f9a75" strokeWidth="1.2" opacity="0.72">
      {Array.from({ length: 18 }).map((_, index) => {
        const x = 18 + (index % 6) * 54;
        const y = 24 + Math.floor(index / 6) * 118;
        return (
          <g key={index} transform={`translate(${x} ${y}) rotate(${index * 23})`}>
            <path d="M0 44 C20 22 34 10 48 0" />
            <ellipse cx="10" cy="34" rx="7" ry="18" transform="rotate(-38 10 34)" />
            <ellipse cx="28" cy="18" rx="6" ry="17" transform="rotate(36 28 18)" />
            <circle cx="44" cy="2" r="9" />
            <path d="M38 -4 C48 -14 62 -8 58 6 C49 4 43 2 38 -4 Z" />
          </g>
        );
      })}
    </g>
  </svg>
);

const OrnateBorder = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 320 460" className={className} aria-hidden="true">
    <rect x="20" y="20" width="280" height="420" rx="2" fill="none" stroke="#111" strokeWidth="2" />
    <rect x="34" y="34" width="252" height="392" rx="2" fill="none" stroke="#111" strokeWidth="1" strokeDasharray="2 7" />
    {[
      [52, 52, 0],
      [268, 52, 90],
      [268, 408, 180],
      [52, 408, 270],
    ].map(([x, y, rotate]) => (
      <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${rotate})`} fill="none" stroke="#111" strokeWidth="2">
        <path d="M0 0 C34 0 42 18 52 42" />
        <path d="M0 0 C0 34 18 42 42 52" />
        <path d="M14 18 C28 0 52 10 42 30 C32 50 8 38 14 18 Z" />
        <path d="M54 16 C72 16 80 28 74 42" />
      </g>
    ))}
  </svg>
);

const OrnateFrame = ({ className = '', color = '#1a1a1a' }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 400 520" width="100%" height="100%" className={className} aria-hidden="true">
    <rect x="14" y="14" width="372" height="492" fill="none" stroke={color} strokeWidth="2.5" />
    <rect x="26" y="26" width="348" height="468" fill="none" stroke={color} strokeWidth="1" strokeDasharray="1.5 6" />
    <g fill="none" stroke={color} strokeWidth="2">
      {[[26, 26, 0], [374, 26, 90], [374, 494, 180], [26, 494, 270]].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <path d="M0 0 C26 0 34 14 42 34" />
          <path d="M0 0 C0 26 14 34 34 42" />
          <path d="M12 14 C26 0 42 8 34 24 C26 40 6 30 12 14 Z" />
        </g>
      ))}
    </g>
  </svg>
);

const LuxuryBorder = ({ className = '', color = '#c9a96e' }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 400 520" width="100%" height="100%" className={className} aria-hidden="true">
    <rect x="18" y="18" width="364" height="484" fill="none" stroke={color} strokeWidth="1.2" />
    <rect x="26" y="26" width="348" height="468" fill="none" stroke={color} strokeWidth="0.6" opacity="0.6" />
    {[
      [30, 30, 0],
      [370, 30, 90],
      [370, 490, 180],
      [30, 490, 270]
    ].map(([cx, cy, r], i) => (
      <g key={i} transform={`translate(${cx} ${cy}) rotate(${r})`} fill="none" stroke={color} strokeWidth="1.4">
        <path d="M0 0 C10 0 16 6 22 12" />
        <circle cx="26" cy="16" r="2.2" fill={color} />
      </g>
    ))}
  </svg>
);

const WatercolorBloom = ({ className = '', color = '#e8a0a0' }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 320 420" width="100%" height="100%" className={className} aria-hidden="true">
    <defs>
      <radialGradient id="wc-grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={color} stopOpacity="0.35" />
        <stop offset="55%" stopColor={color} stopOpacity="0.18" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </radialGradient>
    </defs>
    {[
      [80, 90, 110], [200, 140, 130], [120, 260, 140], [240, 300, 120],
      [60, 340, 100], [180, 360, 110], [260, 200, 100]
    ].map(([cx, cy, r], i) => (
      <circle key={i} cx={cx} cy={cy} r={r} fill="url(#wc-grad)" opacity="0.85" />
    ))}
    <g fill="none" stroke="#6b8f71" strokeWidth="1.1" opacity="0.45">
      {[[60, 80, 28], [180, 120, -22], [100, 240, 15], [220, 280, -18], [140, 360, 25]].map(([x, y, rot], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
          <ellipse cx="0" cy="0" rx="14" ry="34" />
          <ellipse cx="14" cy="10" rx="10" ry="26" transform="rotate(30 14 10)" />
          <path d="M0 -30 L0 30" />
        </g>
      ))}
    </g>
  </svg>
);

const GeometricFrame = ({ className = '', color = '#1e3a5f' }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 400 520" width="100%" height="100%" className={className} aria-hidden="true">
    <g fill="none" stroke={color} strokeWidth="1.6">
      <path d="M30 30 L370 30 L370 370 L30 370 Z" />
      <path d="M44 44 L356 44 L356 356 L44 356 Z" opacity="0.5" />
      <path d="M30 30 L50 50 M370 30 L350 50 M370 490 L350 470 M30 490 L50 470" />
      <path d="M30 30 L60 30 M30 30 L30 60 M370 30 L340 30 M370 30 L370 60" />
      <path d="M370 490 L370 460 M30 490 L30 460 M30 30 L30 60 M370 30 L370 60" opacity="0.6" />
      <line x1="200" y1="44" x2="200" y2="80" opacity="0.4" />
      <line x1="44" y1="200" x2="80" y2="200" opacity="0.4" />
      <line x1="356" y1="200" x2="320" y2="200" opacity="0.4" />
      <line x1="200" y1="356" x2="200" y2="320" opacity="0.4" />
    </g>
  </svg>
);

const ARTWORK_FAMILY: Record<string, 'botanical' | 'garden' | 'luxury' | 'watercolor' | 'geometric' | 'rose' | 'artdeco' | 'classic'> = {
  'botanical-sprig': 'botanical',
  classic: 'botanical',
  elegant: 'botanical',
  floral: 'botanical',
  blush: 'botanical',
  'premium-floral': 'botanical',
  'garden-oval': 'garden',
  minimal: 'garden',
  rustic: 'garden',
  royal: 'garden',
  'premium-royal': 'garden',
  'gold-luxury': 'garden',
  sapphire: 'garden',
  'luxury-minimal': 'luxury',
  'watercolor-floral': 'watercolor',
  'modern-geometric': 'geometric',
  'romantic-rose': 'rose',
  'art-deco-greenery': 'artdeco',
  'classic-invitation': 'classic',
};

const TemplateMap: Record<string, React.FC<any>> = {
  botanical: BotanicalSprig,
  garden: GardenOval,
  luxury: LuxuryMinimal,
  watercolor: WatercolorFloral,
  geometric: ModernGeometric,
  rose: RomanticRose,
  artdeco: ArtDecoGreenery,
  classic: ClassicInvitation,
};

const InvitationCardArtwork = ({
  templateId,
  coupleNames,
  date,
  venue,
  note,
  primaryColor,
  accentColor,
  compact = false,
}: {
  templateId?: string | null;
  coupleNames: string;
  date?: string;
  venue?: string;
  note?: string;
  primaryColor: string;
  accentColor: string;
  compact?: boolean;
}) => {
  const activeTemplate = templateId || 'botanical-sprig';
  const family = ARTWORK_FAMILY[activeTemplate] || 'botanical';
  const TemplateComponent = TemplateMap[family] || BotanicalSprig;

  return (
    <TemplateComponent
      coupleNames={coupleNames}
      date={date}
      venue={venue}
      note={note}
      primaryColor={primaryColor}
      accentColor={accentColor}
      compact={compact}
    />
  );
};

export const DesignEditor = ({ 
  templates, 
  initialData, 
  onSave, 
  giftId,
  isPremium = false,
  initialTemplateId,
}: DesignEditorProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(initialTemplateId || null);
  const [view, setView] = useState<'grid' | 'edit'>('grid');
  const [designData, setDesignData] = useState<DesignData>({
    title: initialData?.title || '',
    date: initialData?.date || '',
    venue: initialData?.venue || '',
    story: initialData?.story || '',
    coupleName1: initialData?.coupleName1 || '',
    coupleName2: initialData?.coupleName2 || '',
    primaryColor: initialData?.primaryColor || '#4a2c2a',
    secondaryColor: initialData?.secondaryColor || '#d4a574',
    fontFamily: initialData?.fontFamily || 'Georgia, serif',
  });
  const [activeTab, setActiveTab] = useState<'text' | 'style'>('text');
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleTemplateClick = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      if (template.tier === 'premium' && !isPremium) {
        toast({ 
          title: 'Premium Template', 
          description: 'This template requires a premium subscription.', 
          variant: 'destructive' 
        });
        return;
      }
      setSelectedTemplate(templateId);
      setDesignData(prev => ({
        ...prev,
        primaryColor: template.previewColor,
        secondaryColor: template.accentColor,
      }));
      setView('edit');
    }
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;
    
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `invitation-${designData.title || 'design'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({ title: 'Downloaded!', description: 'Your invitation has been downloaded.' });
    } catch (error) {
      console.error('Download failed:', error);
      toast({ title: 'Download failed', description: 'Could not download the invitation.', variant: 'destructive' });
    }
  };

  const handleSave = () => {
    if (onSave) {
      const chosenTemplate = selectedTemplate || initialTemplateId || 'botanical-sprig';
      const templateIsAvailable = templates.some(template => template.id === chosenTemplate);
      onSave({ ...designData, template: templateIsAvailable ? chosenTemplate : 'botanical-sprig' });
    }
    toast({ title: 'Saved!', description: 'Your design has been saved.' });
  };

  const renderMiniPreview = (template: Template) => {
    return (
      <InvitationCardArtwork
        templateId={template.id}
        coupleNames="Groom & Bride"
        date="2027-03-22"
        venue="Seattle, Washington"
        note={template.description}
        primaryColor={template.previewColor}
        accentColor={template.accentColor}
        compact
      />
    );
  };

  const renderPreview = () => {
    const coupleNames = designData.coupleName1 && designData.coupleName2 
      ? `${designData.coupleName1} & ${designData.coupleName2}` 
      : designData.title;
    const chosenTemplate = selectedTemplate || initialTemplateId || 'botanical-sprig';
    const activeTemplate = templates.some(template => template.id === chosenTemplate) ? chosenTemplate : 'botanical-sprig';
    const templateMeta = templates.find(template => template.id === activeTemplate);
    const primaryColor = designData.primaryColor || templateMeta?.previewColor || '#1f2933';
    const accentColor = designData.secondaryColor || templateMeta?.accentColor || '#7b9a78';

    return (
      <div ref={previewRef} className="w-full max-w-[520px] mx-auto min-h-[640px]">
        <InvitationCardArtwork
          templateId={activeTemplate}
          coupleNames={coupleNames}
          date={designData.date}
          venue={designData.venue || designData.ceremonyVenue}
          note={designData.story}
          primaryColor={primaryColor}
          accentColor={accentColor}
        />
      </div>
    );
  };

  if (view === 'grid') {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Choose a Template</h2>
          <p className="text-gray-500">Select a design to start customizing your invitation</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {templates.map(template => (
            <div 
              key={template.id}
              className="group cursor-pointer"
              onClick={() => handleTemplateClick(template.id)}
            >
              <div className="relative rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 aspect-[3/4]">
                {renderMiniPreview(template)}
                
                 {/* Overlay with template info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                  <h3 className="text-white font-bold text-lg mb-1">{template.name}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full ring-2 ring-white shadow-sm"
                        style={{ backgroundColor: template.previewColor }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full ring-2 ring-white shadow-sm"
                        style={{ backgroundColor: template.accentColor }}
                      />
                    </div>
                    <div className="text-white text-xs font-medium flex items-center gap-1">
                      Use Template <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </div>

                {/* Premium badge */}
                {template.tier === 'premium' && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg z-10 flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Premium
                  </div>
                )}

                {/* Template name always visible at bottom */}
                <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-3 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">{template.name}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Preview Panel */}
      <div className="flex-1 bg-gray-100 rounded-lg p-6 overflow-auto flex items-center justify-center">
        <div className="w-full max-w-2xl">
          {renderPreview()}
        </div>
      </div>

      {/* Editor Panel */}
      <div className="w-96 bg-white rounded-lg shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('grid')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === 'text' ? 'bg-gray-50 border-b-2 border-[#2E235C] text-[#2E235C]' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('text')}
          >
            <Type className="w-4 h-4" />
            Text
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === 'style' ? 'bg-gray-50 border-b-2 border-[#2E235C] text-[#2E235C]' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('style')}
          >
            <Palette className="w-4 h-4" />
            Style
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'text' && (
            <>
              <div>
                <Label className="text-sm font-medium mb-2 block">Groom and Bride Names</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Groom"
                    value={designData.coupleName1}
                    onChange={(e) => setDesignData(prev => ({ ...prev, coupleName1: e.target.value }))}
                  />
                  <span className="text-gray-400 self-center">&</span>
                  <Input
                    placeholder="Bride"
                    value={designData.coupleName2}
                    onChange={(e) => setDesignData(prev => ({ ...prev, coupleName2: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Date</Label>
                <Input
                  type="date"
                  value={designData.date}
                  onChange={(e) => setDesignData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Venue</Label>
                <Input
                  placeholder="Grand Ballroom, Hotel XYZ"
                  value={designData.venue}
                  onChange={(e) => setDesignData(prev => ({ ...prev, venue: e.target.value }))}
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Invitation Note</Label>
                <Textarea
                  placeholder="Formal invitation to follow"
                  value={designData.story}
                  onChange={(e) => setDesignData(prev => ({ ...prev, story: e.target.value }))}
                  rows={3}
                />
              </div>
            </>
          )}

          {activeTab === 'style' && (
            <>
              <div>
                <Label className="text-sm font-medium mb-2 block">Color Theme</Label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_THEMES.map(theme => (
                    <button
                      key={theme.name}
                      onClick={() => setDesignData(prev => ({
                        ...prev,
                        primaryColor: theme.primary,
                        secondaryColor: theme.secondary,
                      }))}
                      className={`p-2 rounded-lg border transition-all ${
                        designData.primaryColor === theme.primary
                          ? 'border-[#2E235C] ring-1 ring-[#2E235C]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex gap-1 mb-1">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.primary }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.secondary }} />
                      </div>
                      <span className="text-[10px] text-gray-500">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Custom Colors</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-400 mb-1 block">Primary</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={designData.primaryColor}
                        onChange={(e) => setDesignData(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                      />
                      <Input
                        value={designData.primaryColor}
                        onChange={(e) => setDesignData(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="h-8 text-xs flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400 mb-1 block">Accent</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={designData.secondaryColor}
                        onChange={(e) => setDesignData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                      />
                      <Input
                        value={designData.secondaryColor}
                        onChange={(e) => setDesignData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="h-8 text-xs flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Font Family</Label>
                <Select
                  value={designData.fontFamily}
                  onValueChange={(v) => setDesignData(prev => ({ ...prev, fontFamily: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
