import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useToast } from '../hooks/use-toast';
import { Copy, Users, TrendingUp, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const InviteFriends = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    referralCode: '',
    referralLink: '',
    referralsCount: 0,
    totalEarnings: 0,
    referrals: [],
    transactions: []
  });

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/referrals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Referral data fetched:', res.data);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching referral data:', err);
      toast({
        title: "Error",
        description: "Failed to load referral data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(data.referralLink);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard.",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invite Friends</h2>
          <p className="text-gray-600 mt-1">
            Refer friends and earn rewards
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-[#2E235C] shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.referralsCount}</div>
            <p className="text-xs text-muted-foreground">Friends joined</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#2E235C] shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{Number(data.totalEarnings || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Available in wallet</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#2E235C] shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reward Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">₦100 per Asoebi Order</div>
            <div className="text-sm font-medium">Up to 1% Cash Gifts</div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>Share this link with your friends to start earning.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input value={data.referralLink} readOnly className="font-mono bg-muted" />
            <Button onClick={copyToClipboard} className="bg-[#2E235C] hover:bg-[#1a1438]">
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle>Referred Friends</CardTitle>
          <CardDescription>People who signed up using your link.</CardDescription>
        </CardHeader>
        <CardContent>
          {(!data.referrals || data.referrals.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              No referrals yet. Share your link to get started!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Date Joined</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.referrals?.map((ref: any) => (
                  <TableRow key={ref.id}>
                    <TableCell className="font-medium">{ref.name}</TableCell>
                    <TableCell>{ref.email}</TableCell>
                    <TableCell>{new Date(ref.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${ref.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {ref.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
       {/* Earnings History */}
       {data.transactions?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Earning History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions?.map((tx: any) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">+₦{Number(tx.amount).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
       )}
    </div>
  );
};

export default InviteFriends;
