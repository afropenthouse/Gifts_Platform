import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface Invitation {
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
  shareLink?: string;
  slug?: string;
  isPublished?: boolean;
  // Wedding-specific fields
  parentGroomName1?: string;
  parentGroomName2?: string;
  parentBrideName1?: string;
  parentBrideName2?: string;
  weddingTime?: string;
  ceremonyVenue?: string;
  ceremonyTime?: string;
  receptionVenue?: string;
  receptionTime?: string;
  bestMan?: string;
  maidOfHonor?: string;
  dressCode?: string;
  hashtag?: string;
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

const PublicInvitation = () => {
  const { link } = useParams<{ link: string }>();
  const shareLink = link;
  
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/invitations/public/${shareLink}`);
        if (res.ok) {
          const data = await res.json();
          setInvitation(data);
        }
      } catch (err) {
        console.error('Error fetching invitation:', err);
      } finally {
        setLoading(false);
      }
    };
    if (shareLink) fetchInvitation();
  }, [shareLink]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-gray-300" />
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-light mb-2 text-gray-900">Invitation not found</h2>
          <p className="text-gray-400 text-sm">The link you followed may be broken or the invitation may not be published yet.</p>
        </div>
      </div>
    );
  }

  if (!invitation.isPublished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-light mb-2 text-gray-900">Invitation not published</h2>
          <p className="text-gray-400 text-sm">This invitation has not been published yet.</p>
        </div>
      </div>
    );
  }

  const coupleNames = invitation.coupleName1 && invitation.coupleName2
    ? `${invitation.coupleName1} & ${invitation.coupleName2}`
    : '';

  const title = coupleNames
    ? coupleNames
    : invitation.gift?.title || 'Our Event';

  const giftShareLink = invitation.gift?.shareLink || '';
  const wishlists = invitation.gift?.wishlists || [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-light mb-2 text-gray-900">Invitation not available</h2>
        <p className="text-gray-400 text-sm">This invitation template is no longer available.</p>
      </div>
    </div>
  );
};

export default PublicInvitation;
