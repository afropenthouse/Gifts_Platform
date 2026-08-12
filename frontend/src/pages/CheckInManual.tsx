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
  email?: string;
  allowed: number;
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

const PRIMARY = '#2E235C';

const CheckInManual = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [gift, setGift] = useState<Gift | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

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
    const guest = guests.find(g => g.id === guestId);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(
        token
          ? `${backendUrl}/api/guests/checkin-manual/${guestId}`
          : `${backendUrl}/api/guests/checkin/${guestId}`,
        {
          method: 'POST',
          headers,
        }
      );
      const data = await res.json();
      if (res.ok) {
        if (data.alreadyCheckedIn) {
          toast({ title: 'Guest already Checked-In' });
        } else {
          setGuests(prev =>
            prev.map(g =>
              g.id === guestId
                ? { ...g, checkedIn: true, checkedInAt: new Date().toISOString() }
                : g
            )
          );
          const partySize = (guest?.allowed || 1) - 1;
          if (partySize > 0) {
            toast({
              title: `Checked-In ${guest?.firstName} ${guest?.lastName} + ${partySize} other${partySize > 1 ? 's' : ''}`,
            });
          } else {
            toast({ title: 'Checked-In successfully' });
          }
        }
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
        g.lastName.toLowerCase().includes(q) ||
        g.email?.toLowerCase().includes(q)
    );
  }, [guests, searchQuery]);

  const checkedInCount = guests.filter(g => g.checkedIn).length;
  const totalCount = guests.length;

  const heading = gift?.type === 'wedding' && gift?.details?.groomName && gift?.details?.brideName
    ? `${gift.details.groomName} & ${gift.details.brideName}`
    : gift?.title || 'Event Check-In';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: PRIMARY }}>{heading}</h1>
          {gift?.date && (
            <p className="text-gray-600">
              {new Date(gift.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
          <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
            <Badge variant="outline" className="px-4 py-2 text-sm border-gray-300">
              <Users className="w-4 h-4 mr-2" />
              {totalCount} total guest{totalCount !== 1 ? 's' : ''}
            </Badge>
            <Badge className="px-4 py-2 text-sm text-white" style={{ backgroundColor: PRIMARY }}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {checkedInCount} Checked-In
            </Badge>
            {totalCount > 0 && (
              <Badge variant="secondary" className="px-4 py-2 text-sm bg-gray-100 text-gray-800">
                {Math.round((checkedInCount / totalCount) * 100)}% complete
              </Badge>
            )}
          </div>
        </div>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: PRIMARY }}>
              <Users className="w-5 h-5" />
              Manual Check-In
            </CardTitle>
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-gray-300 focus:ring-offset-0 focus:ring-2"
                  style={{ '--tw-ring-color': PRIMARY, borderColor: undefined } as any}
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
              <div className="overflow-x-auto">
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
                          <div style={{ color: PRIMARY }}>
                            {guest.firstName} {guest.lastName}
                          </div>
                          {guest.email && (
                            <div className="text-xs text-gray-500 font-normal">{guest.email}</div>
                          )}
                          {guest.allowed > 1 && (
                            <div className="text-xs font-normal mt-0.5" style={{ color: PRIMARY }}>
                              +{guest.allowed - 1} guest{guest.allowed - 1 > 1 ? 's' : ''}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {guest.checkedIn ? (
                            <div className="flex flex-col">
                              <span className="inline-flex items-center text-green-700">
                                <CheckCircle2 className="w-4 h-4 mr-1" /> Checked-In
                              </span>
                              {guest.checkedInAt && (
                                <span className="text-xs text-gray-500 mt-0.5">
                                  {new Date(guest.checkedInAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center text-gray-500">
                              <XCircle className="w-4 h-4 mr-1" /> Not Checked-In
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!guest.checkedIn && (
                            <Button
                              size="sm"
                              onClick={() => handleCheckIn(guest.id)}
                              className="text-white hover:opacity-90"
                              style={{ backgroundColor: PRIMARY }}
                            >
                              Check In
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckInManual;
