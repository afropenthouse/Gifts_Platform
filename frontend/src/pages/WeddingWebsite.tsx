import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TemplateElegant } from '../components/website-templates/TemplateElegant';
import { TemplateModern } from '../components/website-templates/TemplateModern';
import { TemplateRomantic } from '../components/website-templates/TemplateRomantic';
import { TemplateCleanClassic } from '../components/website-templates/TemplateCleanClassic';
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
import { TemplateAubade } from '../components/website-templates/TemplateAubade';
import { TemplateSolstice } from '../components/website-templates/TemplateSolstice';
import { TemplateGardenia } from '../components/website-templates/TemplateGardenia';
import { TemplateMeridian } from '../components/website-templates/TemplateMeridian';
import { TemplateOpulence } from '../components/website-templates/TemplateOpulence';
import { Loader2 } from 'lucide-react';

interface Website {
  id: number;
  template?: string;
  venue?: string;
  coupleName1?: string;
  coupleName2?: string;
  story?: string;
  date?: string;
  primaryColor?: string;
  secondaryColor?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  fontFamily?: string;
  gallery?: string[];
  showWellWishes?: boolean;
  enableWishlistButton?: boolean;
  ceremony?: string;
  reception?: string;
  hasTemplatePremium?: boolean;
  unlockedTemplates?: string[];
  gift?: {
    id: number;
    type: string;
    title?: string;
    date?: string;
    picture?: string;
    shareLink: string;
    wishlists?: { id: number; shareLink: string; title: string }[];
  };
}

const PREMIUM_TEMPLATE_KEYS = ['emerald', 'sapphire', 'ruby', 'pearl', 'amethyst', 'noir', 'opulence'];

const WeddingWebsite = () => {
  const { template, link, slug, id: shareLinkId } = useParams<{ template?: string; link?: string; slug?: string; id?: string }>();
  let shareLink = slug || link || shareLinkId || '';
  let urlTemplate = template;
  
  // Handle backward compatibility for old routes
  if (!shareLink && template) {
    shareLink = template;
    urlTemplate = 'elegant';
  }
  
  const [website, setWebsite] = useState<Website | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchWebsite = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gifts/website/${shareLink}`);
        if (res.ok) {
          const data = await res.json();
          setWebsite(data);
        }
      } catch (err) {
        console.error('Error fetching website:', err);
      } finally {
        setLoading(false);
      }
    };
    if (shareLink) fetchWebsite();
  }, [shareLink]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-gray-300" />
      </div>
    );
  }

  if (!website) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-light mb-2 text-gray-900">Website not found</h2>
          <p className="text-gray-400 text-sm">The link you followed may be broken.</p>
        </div>
      </div>
    );
  }

  const title = website.coupleName1 && website.coupleName2 
    ? `${website.coupleName1} & ${website.coupleName2}` 
    : website.gift?.title || 'Our Event';

  const giftShareLink = website.gift?.shareLink || '';
  const wishlists = website.gift?.wishlists || [];

  const ceremony = website.ceremony || '';
  const reception = website.reception || '';

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const tempInput = document.createElement('input');
      tempInput.value = currentUrl;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const props = {
    title,
    date: website.date || website.gift?.date,
    venue: website.venue,
    story: website.story,
    shareLink: giftShareLink,
    picture: website.gift?.picture,
    primaryColor: website.primaryColor,
    secondaryColor: website.secondaryColor,
    wishlists,
    gallery: website.gallery || [],
    showWellWishes: website.gift?.enableGuestNotes === true,
    enableWishlistButton: website.enableWishlistButton !== undefined ? website.enableWishlistButton : true,
    data: {
      heroImage: website.gift?.picture,
      ...(website.gift?.type !== 'wedding' ? { heroTitle: website.heroTitle || title } : {}),
      heroSubtitle: website.heroSubtitle,
      eventName: website.gift?.title,
      eventDate: website.date || website.gift?.date,
      eventLocation: website.venue,
      eventType: website.gift?.type,
      coupleNames: `${website.coupleName1 || ''} & ${website.coupleName2 || ''}`.trim(),
      story: website.story,
      ceremony,
      reception,
      theme: {
        primaryColor: website.primaryColor,
        secondaryColor: website.secondaryColor,
        fontFamily: website.fontFamily,
      },
    },
  };

  const isPremiumUnlocked = (templateKey?: string) => {
    if (!templateKey || !PREMIUM_TEMPLATE_KEYS.includes(templateKey)) return true;
    if (website.hasTemplatePremium) return true;
    return (website.unlockedTemplates || []).includes(templateKey);
  };

  const savedTemplate = website?.template || 'elegant';
  const requestedTemplate = urlTemplate || savedTemplate;
  const useTemplate = isPremiumUnlocked(requestedTemplate)
    ? requestedTemplate
    : isPremiumUnlocked(savedTemplate)
      ? savedTemplate
      : 'modern';

  switch (useTemplate) {
    case 'modern':
      return <TemplateModern {...props} />;
    case 'romantic':
      return <TemplateRomantic {...props} />;
    case 'clean-classic':
      return <TemplateCleanClassic {...props} />;
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
    case 'aubade':
      return <TemplateAubade {...props} />;
    case 'solstice':
      return <TemplateSolstice {...props} />;
    case 'gardenia':
      return <TemplateGardenia {...props} />;
    case 'meridian':
      return <TemplateMeridian {...props} />;
    case 'opulence':
      return <TemplateOpulence {...props} />;
    case 'elegant':
    default:
      return <TemplateElegant {...props} />;
  }
};

export default WeddingWebsite;
