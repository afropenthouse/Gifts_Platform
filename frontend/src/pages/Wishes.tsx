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

    // Trigger confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

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
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No wishes sent yet. Be the first!</p>
            <Button 
              onClick={() => navigate(`/gift/${linkParam}`)}
              className="mt-6 bg-[#2E235C] text-white"
            >
              Leave a Note
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {wishes.map((wish) => (
              <Card key={wish.id} className="border-none shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-500">
                      {new Date(wish.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
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
