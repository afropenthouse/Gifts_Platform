import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { CheckCircle2, XCircle, Search, Users } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useToast } from '../hooks/use-toast';

interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  checkedIn: boolean;
  checkedInAt?: string;
}

interface Gift {
  id: number;
  title: string;
  type: string;
  date?: string;
  details?: any;
}

const PublicCheckIn = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [gift, setGift] = useState<Gift | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      if (!eventId) return;
      setLoading(true);
      try {
        const res = await fetch(`${backendUrl}/api/guests/checkin-event/${eventId}`);
        if (res.ok) {
          const data = await res.json();
          setGift(data.gift);
          setGuests(data.guests || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, backendUrl]);

  const handleCheckIn = async (guestId: number) => {
    try {
      const res = await fetch(`${backendUrl}/api/guests/checkin/${guestId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        if (data.alreadyCheckedIn) {
          toast({ title: 'Guest already Checked-In' });
        } else {
          toast({ title: 'Checked-In successfully' });
        }
        setGuests(prev =>
          prev.map(g =>
            g.id === guestId
              ? { ...g, checkedIn: true, checkedInAt: new Date().toISOString() }
              : g
          )
        );
      } else {
        toast({ title: data.msg || 'Check-In failed', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Check-In failed', variant: 'destructive' });
    }
  };

  const filteredGuests = useMemo(() => {
    if (!searchQuery.trim()) return guests;
    const q = searchQuery.toLowerCase();
    return guests.filter(
      g =>
        g.firstName.toLowerCase().includes(q) ||
        g.lastName.toLowerCase().includes(q)
    );
  }, [guests, searchQuery]);

  const heading = gift?.type === 'wedding' && gift?.details?.groomName && gift?.details?.brideName
    ? `${gift.details.groomName} & ${gift.details.brideName}`
    : gift?.title || 'Event Check-In';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{heading}</h1>
          {gift?.date && (
            <p className="text-gray-600 mt-2">
              {new Date(gift.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Guest Check-In
            </CardTitle>
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by first or last name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-gray-600 py-8">Loading...</p>
            ) : filteredGuests.length === 0 ? (
              <p className="text-center text-gray-600 py-8">No guests found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGuests.map(guest => (
                    <TableRow key={guest.id}>
                      <TableCell className="font-medium">
                        {guest.firstName} {guest.lastName}
                      </TableCell>
                      <TableCell>
                        {guest.checkedIn ? (
                          <span className="inline-flex items-center text-green-700">
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Checked-In
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-gray-500">
                            <XCircle className="w-4 h-4 mr-1" /> Not Checked-In
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!guest.checkedIn && (
                          <Button size="sm" onClick={() => handleCheckIn(guest.id)}>
                            Check-In
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicCheckIn;
