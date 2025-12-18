import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import Navbar from '../components/Navbar';
import { Gift, DollarSign, TrendingUp, Users, Copy, Eye, ArrowDownToLine } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

interface Gift {
  id: string;
  type: string;
  title: string;
  shareLink: string;
  createdAt: string;
  contributions?: Contribution[];
}

interface Contribution {
  id: string;
  contributorName: string;
  contributorEmail: string;
  amount: number;
  message: string;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const { user, loading, updateUser } = useAuth();
  const navigate = useNavigate();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [type, setType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [picture, setPicture] = useState('');
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [customType, setCustomType] = useState('');
  const [fileError, setFileError] = useState('');
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawAccountName, setWithdrawAccountName] = useState('');

  useEffect(() => {
    if (withdrawAccount.length === 10 && withdrawBank) {
      handleAccountBlur();
    }
  }, [withdrawAccount, withdrawBank]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      const fetchGifts = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gifts/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setGifts(data);

        // Fetch contributions for each gift
        const allContributions: Contribution[] = [];
        for (const gift of data) {
          if (gift.shareLink) {
            const contribRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/contributions/${gift.shareLink}`);
            const contribData = await contribRes.json();
            allContributions.push(...contribData);
          }
        }
        setContributions(allContributions);
      };
      fetchGifts();
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
            // Reset error
            setFileError('');
      
            // Check file size (5MB = 5 * 1024 * 1024 bytes)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
              const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
              setFileError(`File size (${fileSizeInMB}MB) exceeds the maximum allowed size of 5MB. Please choose a smaller image.`);
              setPictureFile(null);
              setPicture('');
              // Clear the input
              e.target.value = '';
              return;
            }
      
            // Check file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
              setFileError('Please upload a valid image file (JPEG, PNG, or GIF).');
              setPictureFile(null);
              setPicture('');
              e.target.value = '';
              return;
            }
      
      setPictureFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateGift = async (e: React.FormEvent) => {
    e.preventDefault();
    
        // Validate file size before submission
        if (fileError) {
          alert('Please fix the file upload error before submitting.');
          return;
        }
    
    const details = {} as any;
    if (type === 'wedding') {
      details.groomName = groomName;
      details.brideName = brideName;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gifts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          title,
          description,
          date,
          picture,
          details,
          customType: type === 'other' ? customType : undefined,
        }),
      });
      if (res.ok) {
        // Refresh gifts list
        const giftsRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gifts/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const giftsData = await giftsRes.json();
        setGifts(giftsData);

        // Reset form and close modal
        setType('');
        setTitle('');
        setDescription('');
        setDate('');
          setFileError('');
        setPicture('');
        setPictureFile(null);
        setGroomName('');
        setBrideName('');
        setCustomType('');
        setIsCreateModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: withdrawAmount,
          bank_code: withdrawBank,
          account_number: withdrawAccount,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Withdrawal initiated successfully!');
        // Update user data
        const profileRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const updatedUser = await profileRes.json();
          updateUser(updatedUser);
        }
      } else {
        alert(data.msg || 'Withdrawal failed');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    }
    // Reset form
    setWithdrawAmount('');
    setWithdrawBank('');
    setWithdrawAccount('');
    setWithdrawAccountName('');
    setIsWithdrawModalOpen(false);
  };

  const handleAccountBlur = async () => {
    if (withdrawAccount.length === 10 && withdrawBank) {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/resolve-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            bank_code: withdrawBank,
            account_number: withdrawAccount,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setWithdrawAccountName(data.account_name);
        } else {
          setWithdrawAccountName('');
          alert(data.msg);
        }
      } catch (err) {
        console.error(err);
        setWithdrawAccountName('');
        alert('Error resolving account: ' + err.message);
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  const totalContributions = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
  const recentContributions = contributions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-semibold text-foreground mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-muted-foreground">
            Manage your gifts and track contributions from your dashboard.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Gift className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Gifts</p>
                  <p className="text-2xl font-bold">{gifts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Wallet Balance</p>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold">₦{user.wallet}</p>
                    <ArrowDownToLine className="w-5 h-5 ml-2 cursor-pointer text-green-600 hover:text-green-800" onClick={() => setIsWithdrawModalOpen(true)} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Contributions</p>
                  <p className="text-2xl font-bold">₦{totalContributions.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Gifters</p>
                  <p className="text-2xl font-bold">{contributions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
            setIsCreateModalOpen(open);
            if (!open) {
              // Reset form when modal closes
              setType('');
              setTitle('');
              setDescription('');
              setDate('');
              setPicture('');
              setPictureFile(null);
              setFileError('');
              setGroomName('');
              setBrideName('');
              setCustomType('');
            }
          }}>
            <DialogTrigger asChild>
              <Button size="lg" className="mr-4">
                Create New Gift
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Gift</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateGift} className="space-y-4">
                <div>
                  <Label>Event Type</Label>
                  <Select onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wedding">Wedding</SelectItem>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="graduation">Graduation</SelectItem>
                      <SelectItem value="convocation">Convocation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {type === 'other' && (
                  <div>
                    <Label htmlFor="customType">Custom Type</Label>
                    <Input
                      id="customType"
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="picture">Picture</Label>
                  <Input
                    id="picture"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/gif"
                    onChange={handleFileChange}
                                      className={fileError ? 'border-red-500' : ''}
                  />
                  {fileError && (
                    <p className="text-sm text-red-600 mt-2 font-medium">
                      ⚠️ {fileError}
                    </p>
                  )}
                  {pictureFile && !fileError && (
                    <p className="text-sm text-green-600 mt-2 font-medium">
                      ✓ Selected: {pictureFile.name} ({(pictureFile.size / (1024 * 1024)).toFixed(2)}MB)
                    </p>
                  )}
                </div>
                {type === 'wedding' && (
                  <>
                    <div>
                      <Label htmlFor="groomName">Groom Name</Label>
                      <Input
                        id="groomName"
                        value={groomName}
                        onChange={(e) => setGroomName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="brideName">Bride Name</Label>
                      <Input
                        id="brideName"
                        value={brideName}
                        onChange={(e) => setBrideName(e.target.value)}
                      />
                    </div>
                  </>
                )}
                <Button type="submit" className="w-full">Create Gift</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isWithdrawModalOpen} onOpenChange={(open) => {
            setIsWithdrawModalOpen(open);
            if (!open) {
              setWithdrawAmount('');
              setWithdrawBank('');
              setWithdrawAccount('');
              setWithdrawAccountName('');
            }
          }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Withdraw Funds</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount (₦)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <div>
                  <Label>Bank</Label>
                  <Select onValueChange={setWithdrawBank}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="044">Access Bank</SelectItem>
                      <SelectItem value="070">Fidelity Bank</SelectItem>
                      <SelectItem value="011">First Bank</SelectItem>
                      <SelectItem value="058">GTBank</SelectItem>
                      <SelectItem value="057">Zenith Bank</SelectItem>
                      <SelectItem value="033">UBA</SelectItem>
                      <SelectItem value="035">Wema Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="account">Account Number</Label>
                  <Input
                    id="account"
                    value={withdrawAccount}
                    onChange={(e) => setWithdrawAccount(e.target.value)}
                    placeholder="Enter account number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    value={withdrawAccountName}
                    readOnly
                    placeholder="Account name will appear here"
                  />
                </div>
                <Button type="submit" className="w-full">Withdraw</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="gifts">My Gifts</TabsTrigger>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Your Gifts Overview */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Your Gifts</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {gifts.slice(0, 3).map(gift => (
                    <Card key={gift.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{gift.title || gift.type}</h4>
                            <Badge variant="secondary" className="mt-1">{gift.type}</Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">{new Date(gift.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {gifts.length === 0 && (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No gifts created yet.</p>
                      </CardContent>
                    </Card>
                  )}
                  {gifts.length > 3 && (
                    <p className="text-sm text-muted-foreground text-center">And {gifts.length - 3} more...</p>
                  )}
                </div>
              </div>

              {/* Recent Contributions Overview */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Contributions</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {recentContributions.slice(0, 3).map(contribution => (
                    <Card key={contribution.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{contribution.contributorName || 'Anonymous'}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(contribution.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">₦{contribution.amount}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {contributions.length === 0 && (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No contributions yet.</p>
                      </CardContent>
                    </Card>
                  )}
                  {contributions.length > 3 && (
                    <p className="text-sm text-muted-foreground text-center">And {contributions.length - 3} more...</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gifts" className="mt-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {gifts.map(gift => (
                <Card key={gift.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{gift.title || gift.type}</h3>
                        <Badge variant="secondary" className="mt-1">{gift.type}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Created</p>
                        <p className="text-sm">{new Date(gift.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = `${window.location.origin}/gift/${gift.shareLink}`;
                            navigator.clipboard.writeText(link);
                            alert('Link copied to clipboard!');
                          }}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy Link
                        </Button>
                        <a href={`/gift/${gift.shareLink}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {gifts.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No gifts created yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="contributions" className="mt-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentContributions.map(contribution => (
                <Card key={contribution.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{contribution.contributorName || 'Anonymous'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(contribution.createdAt).toLocaleDateString()}
                        </p>
                        {contribution.message && (
                          <p className="text-sm mt-1">"{contribution.message}"</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">₦{contribution.amount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {contributions.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No contributions yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;