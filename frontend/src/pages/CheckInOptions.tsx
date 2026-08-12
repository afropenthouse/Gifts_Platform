import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ScanLine, Users, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useToast } from '../hooks/use-toast';

interface Gift {
  id: number;
  title: string;
  type: string;
  date?: string;
  details?: any;
}

const PRIMARY = '#2E235C';
const PRIMARY_LIGHT = 'rgba(46, 35, 92, 0.08)';

const CheckInOptions = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [gift, setGift] = useState<Gift | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;
      setLoading(true);
      try {
        const res = await fetch(`${backendUrl}/api/guests/checkin-event/${eventId}`);
        if (res.ok) {
          const data = await res.json();
          setGift(data.gift);
        } else {
          toast({ title: 'Event not found', variant: 'destructive' });
        }
      } catch (err) {
        console.error(err);
        toast({ title: 'Failed to load event', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, backendUrl, toast]);

  const heading = gift?.type === 'wedding' && gift?.details?.groomName && gift?.details?.brideName
    ? `${gift.details.groomName} & ${gift.details.brideName}`
    : gift?.title || 'Event Check-In';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: PRIMARY }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: PRIMARY }}>{heading}</h1>
          {gift?.date && (
            <p className="text-gray-600 text-lg">
              {new Date(gift.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
          <p className="text-gray-500 mt-6 text-base">Choose your check-in method</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            className="hover:shadow-lg transition-all cursor-pointer group border-gray-200 shadow-sm hover:-translate-y-0.5"
            onClick={() => navigate(`/checkin-scan/${eventId}`)}
          >
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mb-6 group-hover:scale-105 transition-transform"
                style={{ backgroundColor: PRIMARY_LIGHT, color: PRIMARY }}
              >
                <ScanLine className="w-11 h-11" />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: PRIMARY }}>Scan QR Check-In</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-7">
                Use your device camera to scan guest QR codes for fast, contactless check-in at the entrance.
              </p>
              <Button
                className="w-full text-white hover:opacity-90 shadow-md"
                style={{ backgroundColor: PRIMARY }}
              >
                <ScanLine className="w-4 h-4 mr-2" />
                Start Scanner
              </Button>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-all cursor-pointer group border-gray-200 shadow-sm hover:-translate-y-0.5"
            onClick={() => navigate(`/checkin-manual/${eventId}`)}
          >
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mb-6 group-hover:scale-105 transition-transform"
                style={{ backgroundColor: PRIMARY_LIGHT, color: PRIMARY }}
              >
                <Users className="w-11 h-11" />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: PRIMARY }}>Manual Check-In</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-7">
                Search the guest list by name and manually check guests in. Perfect for guests without QR codes.
              </p>
              <Button
                className="w-full text-white hover:opacity-90 shadow-md"
                style={{ backgroundColor: PRIMARY }}
              >
                <Users className="w-4 h-4 mr-2" />
                Open Guest List
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckInOptions;
