import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MessageSquare } from 'lucide-react';

interface Contribution {
  id: number;
  contributorName: string;
  message: string;
  amount: number;
  createdAt: string;
}

const Wishes: React.FC = () => {
  const params = useParams();
  const linkParam = params.linkParam || (params.slug && params.id ? `${params.slug}/${params.id}` : undefined);
  const navigate = useNavigate();
  const [wishes, setWishes] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState('');

  useEffect(() => {
    if (!linkParam) return;

    const fetchWishes = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/contributions/${linkParam}`);
        const data = await res.json();
        
        if (res.ok) {
          // Filter only notes (amount 0)
          const notes = data.filter((c: Contribution) => c.amount === 0);
          setWishes(notes);
        }
      } catch (err) {
        console.error('Error fetching wishes:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchGiftDetails = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gifts/${linkParam}`);
        const data = await res.json();
        if (res.ok) {
          setEventTitle(data.title);
        }
      } catch (err) {
        console.error('Error fetching gift details:', err);
      }
    };

    fetchWishes();
    fetchGiftDetails();

    // Trigger confetti - same as ShareGift.tsx
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
  }, [linkParam]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <div className="w-8 h-8 border-4 border-[#2E235C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-12">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/logo1.png" alt="Logo" className="h-12 w-auto" />
          </div>
          <h1 className="text-4xl font-playfair font-bold text-[#2E235C] mb-2">Wishes & Notes</h1>
          <p className="text-gray-600">Heartfelt messages for {eventTitle}</p>
        </div>

        {wishes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 px-6">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">No wishes sent yet.</p>
            <p className="text-[#2E235C] font-medium max-w-sm mx-auto leading-relaxed">
              Share your event link with friends and family so they can send you well wishes
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {wishes.map((wish) => (
              <Card key={wish.id} className="border-none shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <p className="text-[#2E235C] font-bold text-lg">{wish.contributorName || 'Anonymous'}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(wish.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <p className="text-gray-700 leading-relaxed italic text-lg">
                      "{wish.message}"
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishes;
