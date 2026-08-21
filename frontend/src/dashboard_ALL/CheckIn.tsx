import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Users, CheckCircle2, ScanLine, ExternalLink, Crown, Lock } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface CheckInProps {
  gifts: any[];
  guests: any[];
  user: any;
  onNavigateToSubscription?: () => void;
}

interface CheckInStats {
  giftId: number;
  totalInvited: number;
  totalAttending: number;
  totalCheckedIn: number;
  checkInRate: number;
  guests: Array<{
    id: number;
    name: string;
    email?: string;
    attending: string;
    checkedIn: boolean;
    checkedInAt?: string;
  }>;
}

const CheckIn: React.FC<CheckInProps> = ({ gifts, guests, user, onNavigateToSubscription }) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const openCheckInPage = () => {
    if (!selectedEventId) {
      toast({ title: 'Please select an event first', variant: 'destructive' });
      return;
    }
    const url = `${window.location.origin}/checkin-options/${selectedEventId}`;
    window.open(url, '_blank');
  };

  const selectedGift = gifts.find(g => g.id.toString() === selectedEventId);
  // const isVipOrRoyal = selectedGift && (selectedGift.tier === 'vip' || selectedGift.tier === 'royal'); // royal @deprecated
  const isVipOrRoyal = selectedGift && (selectedGift.tier === 'vip' || selectedGift.tier === 'royal'); // renamed semantics; check for both, but UI now promotes only VIP

  const fetchStats = useCallback(async (giftId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/guests/checkin-stats/${giftId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, token]);

  useEffect(() => {
    if (gifts.length > 0 && !selectedEventId) {
      setSelectedEventId(gifts[0].id.toString());
    }
  }, [gifts, selectedEventId]);

  useEffect(() => {
    if (selectedEventId && isVipOrRoyal) {
      fetchStats(parseInt(selectedEventId));
    }
  }, [selectedEventId, fetchStats, isVipOrRoyal]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Event Check-In</h2>
          <p className="text-gray-600 mt-1">Track attendance and check in guests at your event</p>
        </div>
        {isVipOrRoyal && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={openCheckInPage}
              className="bg-[#2E235C] text-white border-[#2E235C] hover:bg-[#2E235C]/90"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Generate Check-In link
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger className="w-full sm:w-64 bg-white border-gray-200">
            <SelectValue placeholder="Choose an event" />
          </SelectTrigger>
          <SelectContent>
            {gifts.map(gift => (
              <SelectItem key={gift.id} value={gift.id.toString()}>{gift.title || `Event ${gift.id}`}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedEventId ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-600">
            Select an event to view check-in details.
          </CardContent>
        </Card>
      ) : !isVipOrRoyal ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Event Check-In is a VIP feature</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {/* Upgrade this event to VIP or Royal to unlock the Event Check-In feature and track attendance at your event. // royal @deprecated */}
              Upgrade this event to VIP to unlock the Event Check-In feature and track attendance at your event.
            </p>
            <Button
              className="bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90 text-white"
              onClick={() => {
                onNavigateToSubscription?.();
              }}
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade
            </Button>
          </CardContent>
        </Card>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Invited</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalInvited}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Checked-In</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCheckedIn}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Check-In Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.checkInRate}%</p>
                </div>
                <ScanLine className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Invited</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalInvited}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Checked-In</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCheckedIn}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Check-In Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.checkInRate}%</p>
                </div>
                <ScanLine className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Users className="w-6 h-6" />
              </div>
              <p className="font-medium text-gray-900">Guest shows QR code</p>
              <p className="text-sm text-gray-600 mt-1">Guest opens their RSVP email and shows the Check-In QR code at the event entrance.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <ScanLine className="w-6 h-6" />
              </div>
              <p className="font-medium text-gray-900">Staff scans QR code</p>
                <p className="text-sm text-gray-600 mt-1">Click <strong>Generate Check-In link</strong> to get the link that will be used by your event planner or ushers to scan guests QR codes at the event entrance.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="font-medium text-gray-900">Guest is confirmed</p>
              <p className="text-sm text-gray-600 mt-1">Once scanned, the guest is automatically Checked-In and their attendance is recorded.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckIn;
