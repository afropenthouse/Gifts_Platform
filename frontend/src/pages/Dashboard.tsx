import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import Navbar from '../components/Navbar';
import { Gift, DollarSign, TrendingUp, Users, Copy, Eye, ArrowDownToLine, Calendar, Image as ImageIcon, X, Edit } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { QRCodeSVG } from 'qrcode.react';

interface Gift {
  id: string;
  type: string;
  title: string;
  description?: string;
  date?: string;
  picture?: string;
  details?: any;
  customType?: string;
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
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
  const [banks, setBanks] = useState([]);
  const [isShareLinkModalOpen, setIsShareLinkModalOpen] = useState(false);
  const [createdGiftLink, setCreatedGiftLink] = useState('');

  useEffect(() => {
    if (withdrawAccount.length === 10 && withdrawBank) {
      handleAccountBlur();
    }
  }, [withdrawAccount, withdrawBank]);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/banks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setBanks(data.banks || []);
        }
      } catch (err) {
        console.error('Error fetching banks:', err);
      }
    };

    if (user) {
      fetchBanks();
    }
  }, [user]);

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

  const handleEditGift = (gift: Gift) => {
    setEditingGift(gift);
    setType(gift.type);
    setTitle(gift.title);
    setDescription(gift.description || '');
    setDate(gift.date || '');
    setPicture(gift.picture || '');
    setPictureFile(null);
    setFileError('');
    // Assuming details are stored in gift.details or similar
    if (gift.details) {
      setGroomName(gift.details.groomName || '');
      setBrideName(gift.details.brideName || '');
      setCustomType(gift.customType || '');
    } else {
      setGroomName('');
      setBrideName('');
      setCustomType('');
    }
    setIsEditModalOpen(true);
  };

  const handleCreateGift = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate file size before submission
    if (fileError) {
      alert('Please fix the file upload error before submitting.');
      return;
    }

    const formData = new FormData();
    formData.append('type', type);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('date', date);

    // Add picture file if selected
    if (pictureFile) {
      formData.append('picture', pictureFile);
    }

    const details = {} as any;
    if (type === 'wedding') {
      details.groomName = groomName;
      details.brideName = brideName;
    }
    formData.append('details', JSON.stringify(details));

    if (type === 'other') {
      formData.append('customType', customType);
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gifts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (res.ok) {
        const createdGift = await res.json();
        
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

        // Show share link modal
        const shareLink = `${window.location.origin}/gift/${createdGift.shareLink}`;
        setCreatedGiftLink(shareLink);
        setIsShareLinkModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateGift = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingGift) return;

    // Validate file size before submission
    if (fileError) {
      alert('Please fix the file upload error before submitting.');
      return;
    }

    const formData = new FormData();
    formData.append('type', type);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('date', date);

    // Add picture file if a new one is selected
    if (pictureFile) {
      formData.append('picture', pictureFile);
    }

    const details = {} as any;
    if (type === 'wedding') {
      details.groomName = groomName;
      details.brideName = brideName;
    }
    formData.append('details', JSON.stringify(details));

    if (type === 'other') {
      formData.append('customType', customType);
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gifts/${editingGift.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
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
        setEditingGift(null);
        setIsEditModalOpen(false);
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
            Manage your gifts and track gifts received from your dashboard.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Gift className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Gift Links</p>
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
                  <p className="text-2xl font-bold">₦{user.wallet}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Total Gift Amount</p>
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
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ArrowDownToLine className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Withdraw</p>
                  <Button variant="destructive" size="sm" onClick={() => setIsWithdrawModalOpen(true)} className="mt-1">
                    <ArrowDownToLine className="w-4 h-4 mr-1" />
                    Withdraw
                  </Button>
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
                Create a Gift Link
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] p-0 border-0 shadow-2xl rounded-2xl bg-background overflow-auto max-h-[80vh]">
              <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
                <DialogTitle className="text-xl font-semibold text-foreground">Create a Cash Gift</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Share your special moment and receive gifts</p>
              </DialogHeader>
              <form onSubmit={handleCreateGift} className="px-6 pb-6">
                <div className="space-y-5 mt-4">
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      Event Type
                    </Label>
                    <Select onValueChange={setType} value={type}>
                      <SelectTrigger className="w-full h-11 border-input bg-background hover:bg-accent/50 transition-colors">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent className="border-0 shadow-lg">
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
                      <Label htmlFor="customType" className="text-sm font-medium text-foreground mb-2 block">
                        Custom Type
                      </Label>
                      <Input
                        id="customType"
                        value={customType}
                        onChange={(e) => setCustomType(e.target.value)}
                        className="h-11 border-input focus-visible:ring-2 focus-visible:ring-primary"
                        placeholder="Enter custom event type"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="title" className="text-sm font-medium text-foreground mb-2 block">
                      Gift Title
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-11 border-input focus-visible:ring-2 focus-visible:ring-primary"
                      placeholder="e.g., John & Jane's Wedding"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-medium text-foreground mb-2 block">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[100px] border-input focus-visible:ring-2 focus-visible:ring-primary"
                      placeholder="Tell your story or share details about this special moment..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="date" className="text-sm font-medium text-foreground mb-2 block">
                      <Calendar className="inline w-4 h-4 mr-2" />
                      Event Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-11 border-input focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>

                  <div>
                    <Label htmlFor="picture" className="text-sm font-medium text-foreground mb-2 block">
                      <ImageIcon className="inline w-4 h-4 mr-2" />
                      Event Picture
                    </Label>
                    <div className="mt-2">
                      {picture ? (
                        <div className="relative mb-4">
                          <img 
                            src={picture} 
                            alt="Preview" 
                            className="w-full h-48 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPicture('');
                              setPictureFile(null);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-input rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                          <Input
                            id="picture"
                            type="file"
                            accept="image/jpeg,image/png,image/jpg,image/gif"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <label htmlFor="picture" className="cursor-pointer">
                            <div className="flex flex-col items-center justify-center">
                              <ImageIcon className="w-12 h-12 text-muted-foreground mb-3" />
                              <p className="text-sm font-medium text-foreground mb-1">Click to upload image</p>
                              <p className="text-xs text-muted-foreground">JPEG, PNG or GIF (Max 5MB)</p>
                            </div>
                          </label>
                        </div>
                      )}
                      {fileError && (
                        <p className="text-sm text-red-600 mt-2 font-medium">
                          ⚠️ {fileError}
                        </p>
                      )}
                      {pictureFile && !fileError && (
                        <p className="text-sm text-green-600 mt-2 font-medium flex items-center">
                          ✓ <span className="ml-1">Selected: {pictureFile.name} ({(pictureFile.size / (1024 * 1024)).toFixed(2)}MB)</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {type === 'wedding' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="groomName" className="text-sm font-medium text-foreground mb-2 block">
                            Groom's Name
                          </Label>
                          <Input
                            id="groomName"
                            value={groomName}
                            onChange={(e) => setGroomName(e.target.value)}
                            className="h-11 border-input focus-visible:ring-2 focus-visible:ring-primary"
                            placeholder="Enter groom's name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="brideName" className="text-sm font-medium text-foreground mb-2 block">
                            Bride's Name
                          </Label>
                          <Input
                            id="brideName"
                            value={brideName}
                            onChange={(e) => setBrideName(e.target.value)}
                            className="h-11 border-input focus-visible:ring-2 focus-visible:ring-primary"
                            placeholder="Enter bride's name"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11 bg-primary hover:bg-primary/90"
                  >
                    Create Gift
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditModalOpen} onOpenChange={(open) => {
            setIsEditModalOpen(open);
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
              setEditingGift(null);
            }
          }}>
            <DialogContent className="sm:max-w-[500px] p-0 border-0 shadow-2xl rounded-2xl bg-background overflow-auto max-h-[80vh]">
              {picture && (
                <div className="relative w-full h-64 overflow-hidden rounded-t-2xl">
                  <img
                    src={picture}
                    alt="Gift Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPicture('');
                      setPictureFile(null);
                    }}
                    className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
              <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
                <DialogTitle className="text-xl font-semibold text-foreground">Edit Gift</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Update your gift details</p>
              </DialogHeader>
              <form onSubmit={handleUpdateGift} className="px-6 pb-6">
                <div className="space-y-5 mt-4">
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      Event Type
                    </Label>
                    <Select onValueChange={setType} value={type}>
                      <SelectTrigger className="w-full h-11 border-input bg-background hover:bg-accent/50 transition-colors">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent className="border-0 shadow-lg">
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
                      <Label htmlFor="customType" className="text-sm font-medium text-foreground mb-2 block">
                        Custom Type
                      </Label>
                      <Input
                        id="customType"
                        value={customType}
                        onChange={(e) => setCustomType(e.target.value)}
                        className="h-11 border-input focus-visible:ring-2 focus-visible:ring-primary"
                        placeholder="Enter custom event type"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="title" className="text-sm font-medium text-foreground mb-2 block">
                      Gift Title
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-11 border-input focus-visible:ring-2 focus-visible:ring-primary"
                      placeholder="e.g., John & Jane's Wedding"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-medium text-foreground mb-2 block">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[100px] border-input focus-visible:ring-2 focus-visible:ring-primary"
                      placeholder="Tell your story or share details about this special moment..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="date" className="text-sm font-medium text-foreground mb-2 block">
                      <Calendar className="inline w-4 h-4 mr-2" />
                      Event Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-11 border-input focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-foreground mb-3 block">
                      <ImageIcon className="inline w-4 h-4 mr-2" />
                      Change Picture
                    </Label>
                    <div className="border-2 border-dashed border-input rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Input
                        id="picture"
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/gif"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="picture" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
                          <p className="text-sm font-medium text-foreground mb-1">Click to upload new image</p>
                          <p className="text-xs text-muted-foreground">JPEG, PNG or GIF (Max 5MB)</p>
                        </div>
                      </label>
                    </div>
                    {fileError && (
                      <p className="text-sm text-red-600 mt-2 font-medium">
                        ⚠️ {fileError}
                      </p>
                    )}
                    {pictureFile && !fileError && (
                      <p className="text-sm text-green-600 mt-2 font-medium flex items-center">
                        ✓ <span className="ml-1">Selected: {pictureFile.name}</span>
                      </p>
                    )}
                  </div>

                  {type === 'wedding' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="groomName" className="text-sm font-medium text-foreground mb-2 block">
                            Groom's Name
                          </Label>
                          <Input
                            id="groomName"
                            value={groomName}
                            onChange={(e) => setGroomName(e.target.value)}
                            className="h-11 border-input focus-visible:ring-2 focus-visible:ring-primary"
                            placeholder="Enter groom's name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="brideName" className="text-sm font-medium text-foreground mb-2 block">
                            Bride's Name
                          </Label>
                          <Input
                            id="brideName"
                            value={brideName}
                            onChange={(e) => setBrideName(e.target.value)}
                            className="h-11 border-input focus-visible:ring-2 focus-visible:ring-primary"
                            placeholder="Enter bride's name"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11 bg-primary hover:bg-primary/90"
                  >
                    Update Gift
                  </Button>
                </div>
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
            <DialogContent className="sm:max-w-[500px] p-0 border-0 shadow-2xl rounded-2xl bg-background overflow-auto max-h-[80vh]">
              <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
                <DialogTitle className="text-xl font-semibold text-foreground">Withdraw Funds</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Transfer money to your bank account</p>
              </DialogHeader>
              <form onSubmit={handleWithdraw} className="px-6 pb-6">
                <div className="space-y-5 mt-4">
                  <div>
                    <Label htmlFor="amount" className="text-sm font-medium text-foreground mb-2 block">
                      Amount (₦)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="h-11 border-input focus-visible:ring-2 focus-visible:ring-primary"
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      Bank
                    </Label>
                    <Select onValueChange={setWithdrawBank} value={withdrawBank}>
                      <SelectTrigger className="w-full h-11 border-input bg-background hover:bg-accent/50 transition-colors">
                        <SelectValue placeholder="Select your bank" />
                      </SelectTrigger>
                      <SelectContent className="border-0 shadow-lg">
                        {banks.map((bank: any) => (
                          <SelectItem key={bank.code} value={bank.code}>
                            {bank.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="account" className="text-sm font-medium text-foreground mb-2 block">
                      Account Number
                    </Label>
                    <Input
                      id="account"
                      value={withdrawAccount}
                      onChange={(e) => setWithdrawAccount(e.target.value)}
                      className="h-11 border-input focus-visible:ring-2 focus-visible:ring-primary"
                      placeholder="Enter account number"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountName" className="text-sm font-medium text-foreground mb-2 block">
                      Account Name
                    </Label>
                    <Input
                      id="accountName"
                      value={withdrawAccountName}
                      readOnly
                      className="h-11 bg-muted/50 border-input"
                      placeholder="Account name will appear here"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={() => setIsWithdrawModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11 bg-green-600 hover:bg-green-700"
                  >
                    Withdraw Funds
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Share Link Modal */}
          <Dialog open={isShareLinkModalOpen} onOpenChange={setIsShareLinkModalOpen}>
            <DialogContent className="sm:max-w-lg rounded-2xl border-0 shadow-2xl p-0 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-foreground">
                    Link Created!
                  </DialogTitle>
                  <p className="text-muted-foreground text-sm mt-2">
                    Share your gift link with friends and family
                  </p>
                </DialogHeader>
              </div>

              <div className="p-6 space-y-4">
                {/* QR Code Display */}
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg border-2 border-border">
                    <QRCodeSVG 
                      value={createdGiftLink}
                      size={180}
                      level="H"
                      includeMargin={true}
                      fgColor="#000000"
                      bgColor="#ffffff"
                    />
                  </div>
                </div>

                {/* Link Display */}
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Your Gift Link</p>
                  <p className="text-sm font-mono text-foreground break-all">{createdGiftLink}</p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(createdGiftLink);
                      alert('Link copied to clipboard!');
                    }}
                    size="lg"
                    className="w-full"
                  >
                    <Copy className="w-5 h-5 mr-2" />
                    Copy Link
                  </Button>

                  <Button
                    onClick={() => {
                      const svg = document.querySelector('svg');
                      if (svg) {
                        const svgData = new XMLSerializer().serializeToString(svg);
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const img = new Image();
                        
                        img.onload = () => {
                          canvas.width = img.width;
                          canvas.height = img.height;
                          ctx?.drawImage(img, 0, 0);
                          
                          canvas.toBlob((blob) => {
                            if (blob) {
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'gift-qr-code.png';
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }
                          });
                        };
                        
                        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                      }
                    }}
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    Download QR
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rest of the component remains the same */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="gifts">My Gifts</TabsTrigger>
            <TabsTrigger value="contributions">Gifts Received</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Your Gifts Overview */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Your Gifts</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {gifts.map(gift => (
                    <Card key={gift.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{gift.title || gift.type}</h4>
                            <Badge variant="secondary" className="mt-1">{gift.type}</Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">{new Date(gift.createdAt).toLocaleDateString()}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditGift(gift)}
                              className="mt-2"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
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
              </div>

              {/* Recent Gifts Overview */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Gifts</h3>
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
                        <p className="text-muted-foreground">No gifts yet.</p>
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
                    <div className="flex gap-4">
                      {/* Gift Image */}
                      {gift.picture && (
                        <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={gift.picture}
                            alt={gift.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Gift Details */}
                      <div className="flex-1">
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
                              onClick={() => handleEditGift(gift)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
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
                    <p className="text-muted-foreground">No gifts yet.</p>
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