import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import GiftLinks from '../dashboard_ALL/GiftLinks';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import Navbar from '../components/Navbar';
import {
  Gift, DollarSign, TrendingUp, Users, Copy, Eye,
  ArrowDownToLine, Calendar, Image as ImageIcon, X, Edit,
  Home, Package, CreditCard, Settings, HelpCircle,
  Share2, QrCode, Filter, MoreVertical, Sparkles, Trophy,
  Target, Zap, Heart, Menu, X as CloseIcon, LogOut,
  BarChart3, MessageSquare, Shield, Globe, Download,
  Star, TrendingDown, CheckCircle, AlertCircle, Wallet,
  CreditCard as CreditCardIcon, Smartphone, Globe as GlobeIcon,
  Link as LinkIcon, User, Mail, Phone, MapPin, Clock, FileDown
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { QRCodeSVG } from 'qrcode.react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

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
  const [selectedGiftForTable, setSelectedGiftForTable] = useState<Gift | null>(null);
  const [isGiftTableModalOpen, setIsGiftTableModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);
  const [goalAmount, setGoalAmount] = useState(500000);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [guests, setGuests] = useState<Array<{id: number, firstName: string, lastName: string, email?: string, phone?: string, allowed: number, attending: string, giftId?: number}>>([]);
  const [selectedEventForRSVP, setSelectedEventForRSVP] = useState<number | null>(null);
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<{id: number, firstName: string, lastName: string, allowed: number, attending: string} | null>(null);
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestAllowed, setGuestAllowed] = useState('1');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkNames, setBulkNames] = useState('');

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Home, color: 'text-blue-500', badge: null },
    { id: 'gifts', label: 'My Events', icon: Gift, color: 'text-purple-500', badge: gifts.length },
    { id: 'rsvp', label: 'RSVP', icon: Users, color: 'text-[#2E235C]', badge: guests.length },
    { id: 'withdraw', label: 'Withdraw', icon: CreditCard, color: 'text-[#2E235C]', badge: null },
  ];

  const downloadGuestListPDF = () => {
    // Create a simple HTML table for PDF generation
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    const totalGuests = guests.reduce((sum, guest) => sum + guest.allowed, 0);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Guest List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #2E235C; margin-bottom: 10px; }
            .meta { color: #666; margin-bottom: 30px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #2E235C; color: white; padding: 12px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            tr:hover { background-color: #f5f5f5; }
            .summary { margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
            .summary-item { display: flex; justify-content: space-between; margin: 10px 0; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>Guest List</h1>
          <div class="meta">
            <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 60px;">#</th>
                <th>Guest Name</th>
                <th style="width: 150px;">Number Allowed</th>
              </tr>
            </thead>
            <tbody>
              ${guests.map((guest, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${guest.firstName} ${guest.lastName}</td>
                  <td>${guest.allowed}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="summary">
            <div class="summary-item">
              <strong>Total Guests:</strong>
              <span>${guests.length}</span>
            </div>
            <div class="summary-item">
              <strong>Total People Allowed:</strong>
              <span>${totalGuests}</span>
            </div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Small delay to ensure content is loaded before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

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

    const fetchWithdrawHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/withdrawals`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setWithdrawHistory(data);
        }
      } catch (err) {
        console.error('Error fetching withdrawal history:', err);
      }
    };

    if (user) {
      fetchBanks();
      fetchWithdrawHistory();
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

      const fetchGuests = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/guests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setGuests(data);
      };
      fetchGuests();
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileError('');
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        setFileError(`File size (${fileSizeInMB}MB) exceeds the maximum allowed size of 5MB. Please choose a smaller image.`);
        setPictureFile(null);
        setPicture('');
        e.target.value = '';
        return;
      }

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
    setDate(gift.date || '');
    setPicture(gift.picture || '');
    setPictureFile(null);
    setFileError('');
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

  const handleDeleteGift = async (giftId: string) => {
    try {
      const response = await fetch(`/api/gifts/${giftId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setGifts(gifts.filter(g => g.id !== giftId));
        setContributions(contributions.filter(c => {
          const deletedGift = gifts.find(g => g.id === giftId);
          return !deletedGift || c.message !== deletedGift.shareLink;
        }));
      } else {
        alert('Failed to delete gift');
      }
    } catch (error) {
      console.error('Error deleting gift:', error);
      alert('Error deleting gift');
    }
  };

  const handleCreateGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fileError) {
      alert('Please fix the file upload error before submitting.');
      return;
    }

    const formData = new FormData();
    formData.append('type', type);
    formData.append('title', title);
    formData.append('date', date);

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
        
        const giftsRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gifts/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const giftsData = await giftsRes.json();
        setGifts(giftsData);

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
    if (fileError) {
      alert('Please fix the file upload error before submitting.');
      return;
    }

    const formData = new FormData();
     formData.append('type', type);
     formData.append('title', title);
     formData.append('date', date);

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
        const giftsRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gifts/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const giftsData = await giftsRes.json();
        setGifts(giftsData);

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

  const totalContributions = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
  const recentContributions = contributions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const totalGoalProgress = (totalContributions / goalAmount) * 100;

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#2E235C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    </div>
  );
  
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {sidebarOpen ? <CloseIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <div className="flex">
        {/* Sidebar */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          shadow-xl lg:shadow-none h-screen
        `}>
          <div className="h-full flex flex-col">
            {/* Logo/Brand */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-9">
                <img src="/logo.png" alt="Logo" className="w-10 h-10" />
                <h1 className="text-xl font-semibold text-gray-900">MyCashGift</h1>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mt-3">Welcome, {user.name}</h2>
            </div>

            {/* User Profile Section */}
            <div className="p-6 border-b border-gray-100">
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90
                shadow-lg hover:shadow-xl transition-all duration-300 h-12"
              >
                <Gift className="w-5 h-5 mr-2" />
                Create RSVP Link
              </Button>
            </div>

            {/* Navigation Items */}
            <nav className="p-2 flex-1">
              <div className="space-y-0.5">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (window.innerWidth < 1024) {
                        setSidebarOpen(false);
                      }
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-lg mb-0.5
                      transition-all duration-200 group relative
                      ${activeTab === item.id 
                        ? 'bg-gradient-to-r from-[#2E235C]/10 to-[#2E235C]/5 text-[#2E235C]' 
                        : 'hover:bg-gray-50 text-gray-700'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`
                        p-1.5 rounded-lg transition-colors
                        ${activeTab === item.id 
                          ? 'bg-[#2E235C] text-white' 
                          : 'bg-gray-100 group-hover:bg-gray-200'
                        }
                      `}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className={`text-sm font-medium ${activeTab === item.id ? 'font-semibold' : ''}`}>
                        {item.label}
                      </span>
                    </div>
                    
                    {item.badge !== null && item.badge > 0 && (
                      <span className={`
                        px-1.5 py-0.5 text-xs rounded-full font-bold
                        ${activeTab === item.id 
                          ? 'bg-[#2E235C] text-white' 
                          : 'bg-gray-200 text-gray-700'
                        }
                      `}>
                        {item.badge}
                      </span>
                    )}
                    
                    {activeTab === item.id && (
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-5 bg-[#2E235C] rounded-l-full" />
                    )}
                  </button>
                ))}
              </div>
            </nav>

            {/* Footer/Create Button */}
            <div className="p-4 border-t border-gray-100 mb-16">
              <Button 
                variant="ghost"
                onClick={handleLogout}
                className="w-full mt-3 text-gray-600 hover:text-[#2E235C]"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 min-h-screen overflow-y-auto">
          {/* Navbar */}
          <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-200">
            <div className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {activeTab === 'overview' && 'Dashboard Overview'}
                    {activeTab === 'gifts' && 'My Events'}
                    {activeTab === 'withdraw' && 'Withdraw Funds'}
                    {activeTab === 'rsvp' && 'RSVP'}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {activeTab === 'overview' && 'Welcome back! Here is your dashboard summary'}
                    {activeTab === 'gifts' && 'Manage all your gift links and contributions'}
                    {activeTab === 'withdraw' && 'Withdraw funds to your bank account'}
                    {activeTab === 'rsvp' && 'Manage your event guest list'}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Button variant="outline" size="sm" className="hidden lg:flex">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Help
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-4 lg:p-8">
            {/* Overview Section */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-[#2E235C] via-[#2E235C] to-[#2E235C] rounded-2xl p-6 lg:p-8 text-white shadow-lg overflow-hidden relative">
                  <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
                      <div>
                        <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                          Welcome back, {user.name}!
                        </h1>
                        <p className="text-white/90 max-w-2xl">
                          You've received ₦{totalContributions.toFixed(2)} from {contributions.length} gifters. 
                          Keep sharing your gift links to receive more!
                        </p>
                      </div>
                      <div className="flex items-center space-x-3 mt-4 lg:mt-0">
                        <Button 
                          variant="outline" 
                          className="bg-white/20 hover:bg-white/30 border-white/30 text-white"
                          onClick={() => setIsCreateModalOpen(true)}
                        >
                          <Gift className="w-5 h-5 mr-2" />
                          Create RSVP Link
                        </Button>
                        <Button 
                          variant="secondary"
                          className="bg-white hover:bg-gray-100 text-gray-900"
                          onClick={() => setActiveTab('rsvp')}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Manage RSVP
                        </Button>
                      </div>
                    </div>
                    
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-sm opacity-90">Wallet Balance</p>
                        <p className="text-2xl font-bold">₦{user.wallet}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-sm opacity-90">Total Received</p>
                        <p className="text-2xl font-bold">₦{totalContributions.toFixed(2)}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-sm opacity-90">Active Gifts</p>
                        <p className="text-2xl font-bold">{gifts.length}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-sm opacity-90">Gifters</p>
                        <p className="text-2xl font-bold">{contributions.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -translate-x-24 translate-y-24"></div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Create Gift Card */}
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => setIsCreateModalOpen(true)}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">Create Gift</h3>
                          <p className="text-sm text-gray-600">Start a new gift link</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <p className="text-center text-gray-600 text-sm">
                          Create a personalized gift link for your wedding, birthday, or any special occasion
                        </p>
                      </div>
                      
                      <Button 
                        className="w-full mt-4 bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCreateModalOpen(true);
                        }}
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        Create RSVP Link
                      </Button>
                    </CardContent>
                  </Card>

                  {/* RSVP Card */}
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => setActiveTab('rsvp')}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">RSVP</h3>
                          <p className="text-sm text-gray-600">Create and manage guest list</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900 mb-1">{guests.length}</p>
                          <p className="text-sm text-gray-600">Total Guests</p>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline"
                        className="w-full mt-4 border-[#2E235C] text-[#2E235C] hover:bg-[#2E235C]/5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab('rsvp');
                        }}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Manage Guests
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Withdraw Funds Card */}
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => setIsWithdrawModalOpen(true)}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">Withdraw Funds</h3>
                          <p className="text-sm text-gray-600">Transfer to your bank</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900 mb-1">₦{user.wallet}</p>
                          <p className="text-sm text-gray-600">Available Balance</p>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline"
                        className="w-full mt-4 border-green-600 text-green-600 hover:bg-green-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsWithdrawModalOpen(true);
                        }}
                      >
                        <ArrowDownToLine className="w-4 h-4 mr-2" />
                        Withdraw Now
                      </Button>
                    </CardContent>
                  </Card>
                </div>


              </div>
            )}

            {/* My Gifts Section */}
            {activeTab === 'gifts' && (
              <div>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">My Events</h2>
                    <p className="text-gray-600 mt-1">Create and manage all your gift collection links</p>
                  </div>
                  <div className="flex space-x-3">
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <Button 
                      onClick={() => setIsCreateModalOpen(true)}
                      className="bg-gradient-to-r from-[#2E235C] to-[#2E235C]"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      New Gift
                    </Button>
                  </div>
                </div>

<GiftLinks
                  gifts={gifts}
                  contributions={contributions}
                  onCreateGift={() => setIsCreateModalOpen(true)}
                  onEditGift={handleEditGift}
                  onDeleteGift={handleDeleteGift}
                  onRSVP={() => setActiveTab('rsvp')}
                  onViewDetails={(gift) => {
                    setSelectedGiftForTable(gift);
                    setIsGiftTableModalOpen(true);
                  }}
                />
              </div>
            )}

            {/* Gifts Received Section */}
            {activeTab === 'received' && (
              <div>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Gifts Received</h2>
                    <p className="text-gray-600 mt-1">All contributions received from your gift links</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-4 py-2">
                    Total: ₦{totalContributions.toFixed(2)}
                  </Badge>
                </div>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-semibold">Gifter</TableHead>
                          <TableHead className="font-semibold">Amount</TableHead>
                          <TableHead className="font-semibold">Message</TableHead>
                          <TableHead className="font-semibold">Gift</TableHead>
                          <TableHead className="font-semibold">Date</TableHead>
                          <TableHead className="font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contributions.length > 0 ? (
                          contributions.map((contribution) => {
                            const gift = gifts.find(g => g.shareLink === contribution.id.split('_')[0]);
                            return (
                              <TableRow key={contribution.id} className="hover:bg-gray-50/50">
                                <TableCell>
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#2E235C]/20 to-[#2E235C]/10 flex items-center justify-center">
                                      <span className="text-xs font-bold text-[#2E235C]">
                                        {contribution.contributorName?.charAt(0) || 'A'}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-medium">{contribution.contributorName || 'Anonymous'}</p>
                                      <p className="text-xs text-gray-500">
                                        {contribution.contributorEmail || 'No email'}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="font-bold text-green-600">₦{contribution.amount.toFixed(2)}</span>
                                </TableCell>
                                <TableCell className="max-w-xs">
                                  <p className="truncate">{contribution.message || '-'}</p>
                                </TableCell>
                                <TableCell>
                                  {gift ? (
                                    <Badge variant="outline" className="text-xs">
                                      {gift.title}
                                    </Badge>
                                  ) : (
                                    <span className="text-gray-500">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {new Date(contribution.createdAt).toLocaleDateString()}
                                    <br />
                                    <span className="text-xs text-gray-500">
                                      {new Date(contribution.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12">
                              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                              <p className="text-gray-500">No gifts received yet</p>
                              <p className="text-sm text-gray-400 mt-1">
                                Share your gift links to start receiving contributions
                              </p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Withdraw Section */}
            {activeTab === 'withdraw' && (
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {/* Wallet Balance Card */}
                  <Card className="lg:col-span-2 border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Wallet Balance</h3>
                          <p className="text-sm text-gray-600">Available for withdrawal</p>
                        </div>
                        <Wallet className="w-8 h-8 text-green-600" />
                      </div>
                      
                      <div className="text-center py-8">
                        <p className="text-5xl font-bold text-gray-900 mb-2">₦{user.wallet}</p>
                        <p className="text-gray-600">Total available balance</p>
                      </div>
                      
                      <Button 
                        onClick={() => setIsWithdrawModalOpen(true)}
                        className="w-full bg-gradient-to-r from-[#2E235C] to-[#2E235C] h-12"
                      >
                        <ArrowDownToLine className="w-5 h-5 mr-2" />
                        Withdraw Funds
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Withdrawal Info */}
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdrawal Info</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Processing Time</p>
                          <p className="font-medium">24-48 hours</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Minimum Amount</p>
                          <p className="font-medium">₦1,000</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Transaction Fee</p>
                          <p className="font-medium">₦50 flat fee</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Daily Limit</p>
                          <p className="font-medium">₦1,000,000</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Withdrawals */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-gray-600" />
                      Recent Withdrawals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {withdrawHistory.length > 0 ? (
                      <div className="space-y-4">
                        {withdrawHistory.slice(0, 5).map((withdrawal, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full ${withdrawal.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                                {withdrawal.status === 'completed' ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Clock className="w-5 h-5 text-yellow-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">Withdrawal to {withdrawal.bank_name}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(withdrawal.createdAt).toLocaleDateString()} • {withdrawal.account_number}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">₦{withdrawal.amount}</p>
                              <Badge className={`
                                ${withdrawal.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                  withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-[#2E235C]/10 text-[#2E235C]'}
                              `}>
                                {withdrawal.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CreditCardIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">No withdrawal history yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Analytics Section */}
            {activeTab === 'analytics' && (
              <div className="space-y-8">
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <Card className="border-0 shadow-lg">
                     <CardContent className="p-6">
                       <div className="flex items-center justify-between">
                         <div>
                           <p className="text-sm text-gray-600">Total Gifts</p>
                           <p className="text-2xl font-bold text-gray-900">{gifts.length}</p>
                         </div>
                         <Gift className="w-8 h-8 text-purple-600" />
                       </div>
                     </CardContent>
                   </Card>

                   <Card className="border-0 shadow-lg">
                     <CardContent className="p-6">
                       <div className="flex items-center justify-between">
                         <div>
                           <p className="text-sm text-gray-600">Avg. Gift Amount</p>
                           <p className="text-2xl font-bold text-gray-900">
                             ₦{contributions.length > 0 ? (totalContributions / contributions.length).toFixed(2) : '0.00'}
                           </p>
                         </div>
                         <span className="text-2xl font-bold text-blue-600">₦</span>
                       </div>
                     </CardContent>
                   </Card>

                   <Card className="border-0 shadow-lg">
                     <CardContent className="p-6">
                       <div className="flex items-center justify-between">
                         <div>
                           <p className="text-sm text-gray-600">Total Contributions</p>
                           <p className="text-2xl font-bold text-gray-900">{contributions.length}</p>
                         </div>
                         <Users className="w-8 h-8 text-green-600" />
                       </div>
                     </CardContent>
                   </Card>

                   <Card className="border-0 shadow-lg">
                     <CardContent className="p-6">
                       <div className="flex items-center justify-between">
                         <div>
                           <p className="text-sm text-gray-600">Messages Rate</p>
                           <p className="text-2xl font-bold text-gray-900">
                             {contributions.length > 0 ? ((contributions.filter(c => c.message).length / contributions.length) * 100).toFixed(1) : '0'}%
                           </p>
                         </div>
                         <MessageSquare className="w-8 h-8 text-orange-600" />
                       </div>
                     </CardContent>
                   </Card>
                 </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gift Type Distribution */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle>Gift Type Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {['wedding', 'birthday', 'graduation', 'convocation', 'other'].map((type) => {
                          const typeGifts = gifts.filter(g => g.type === type);
                          const typeContributions = contributions.filter(c => 
                            typeGifts.some(g => g.shareLink === c.id.split('_')[0])
                          );
                          const total = typeContributions.reduce((sum, c) => sum + c.amount, 0);
                          const percentage = totalContributions > 0 ? (total / totalContributions) * 100 : 0;
                          
                          if (typeGifts.length === 0) return null;
                          
                          return (
                            <div key={type} className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-3 h-3 rounded-full ${
                                    type === 'wedding' ? 'bg-[#2E235C]' :
                                    type === 'birthday' ? 'bg-blue-500' :
                                    type === 'graduation' ? 'bg-green-500' :
                                    type === 'convocation' ? 'bg-purple-500' : 'bg-gray-500'
                                  }`} />
                                  <span className="font-medium capitalize">{type}</span>
                                </div>
                                <span className="font-bold">₦{total.toFixed(2)} ({percentage.toFixed(1)}%)</span>
                              </div>
                              <Progress value={percentage} className="h-2">
                                <div className={`h-full rounded-full ${
                                  type === 'wedding' ? 'bg-[#2E235C]' :
                                  type === 'birthday' ? 'bg-blue-500' :
                                  type === 'graduation' ? 'bg-green-500' :
                                  type === 'convocation' ? 'bg-purple-500' : 'bg-gray-500'
                                }`} />
                              </Progress>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Gifters */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle>Top Gifters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {contributions
                          .reduce((acc: any[], contribution) => {
                            const existing = acc.find(c => c.email === contribution.contributorEmail);
                            if (existing) {
                              existing.amount += contribution.amount;
                              existing.count += 1;
                            } else {
                              acc.push({
                                name: contribution.contributorName,
                                email: contribution.contributorEmail,
                                amount: contribution.amount,
                                count: 1
                              });
                            }
                            return acc;
                          }, [])
                          .sort((a, b) => b.amount - a.amount)
                          .slice(0, 5)
                          .map((gifter, index) => (
                            <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                              <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center font-bold
                                ${index === 0 ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800' :
                                  index === 1 ? 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800' :
                                  index === 2 ? 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-800' :
                                  'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800'}
                              `}>
                                {gifter.name?.charAt(0) || 'A'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{gifter.name || 'Anonymous'}</p>
                                <p className="text-xs text-gray-500">{gifter.count} gift{gifter.count > 1 ? 's' : ''}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">₦{gifter.amount.toFixed(2)}</p>
                                <p className="text-xs text-gray-500">Total</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* RSVP Section */}
            {activeTab === 'rsvp' && (
              <div>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Guest List</h2>
                    <p className="text-gray-600 mt-1">Manage your event attendees and track RSVPs</p>
                  </div>
                </div>

                {/* Event Selection and Actions */}
                <div className="flex gap-2 items-center">
                  <Select value={selectedEventForRSVP?.toString()} onValueChange={(value) => setSelectedEventForRSVP(value ? parseInt(value) : null)}>
                    <SelectTrigger className="w-48 bg-white border-gray-200 hover:border-[#2E235C]/30">
                      <SelectValue placeholder="Choose an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {gifts.map((gift) => (
                        <SelectItem key={gift.id} value={gift.id.toString()}>
                          {gift.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedEventForRSVP && guests.filter(g => g.giftId === selectedEventForRSVP).length > 0 && (
                    <Button 
                      onClick={downloadGuestListPDF}
                      variant="outline"
                      className="border-[#2E235C] text-[#2E235C] hover:bg-[#2E235C] hover:text-white"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  )}
                  <Button 
                    onClick={() => setIsAddGuestModalOpen(true)}
                    disabled={!selectedEventForRSVP}
                    className="bg-gradient-to-r from-[#2E235C] to-[#2E235C] disabled:opacity-50"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Add Guest
                  </Button>
                </div>

                <div className="mt-6">
                {selectedEventForRSVP ? (
                  guests.filter(g => g.giftId === selectedEventForRSVP).length > 0 ? (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="font-semibold w-16">#</TableHead>
                            <TableHead className="font-semibold">First Name</TableHead>
                            <TableHead className="font-semibold">Last Name</TableHead>
                            <TableHead className="font-semibold">Will you be attending</TableHead>
                            <TableHead className="font-semibold">Allowed</TableHead>
                            <TableHead className="font-semibold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {guests.filter(g => g.giftId === selectedEventForRSVP).map((guest, index) => (
                            <TableRow key={guest.id} className="hover:bg-gray-50/50">
                              <TableCell className="font-medium text-gray-600">{index + 1}</TableCell>
                              <TableCell>
                                <span className="font-medium">{guest.firstName}</span>
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">{guest.lastName}</span>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={guest.attending || 'yes'}
                                  onValueChange={async (value) => {
                                    const token = localStorage.getItem('token');
                                    try {
                                      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/guests/${guest.id}`, {
                                        method: 'PUT',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          Authorization: `Bearer ${token}`,
                                        },
                                        body: JSON.stringify({
                                          attending: value,
                                        }),
                                      });
                                      if (res.ok) {
                                        const updatedGuest = await res.json();
                                        const updatedGuests = guests.map(g =>
                                          g.id === guest.id ? updatedGuest : g
                                        );
                                        setGuests(updatedGuests);
                                      } else {
                                        alert('Failed to update attendance');
                                      }
                                    } catch (err) {
                                      console.error(err);
                                      alert('Error updating attendance');
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-24 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={guest.allowed}
                                  onChange={async (e) => {
                                    const newAllowed = parseInt(e.target.value) || 1;
                                    const token = localStorage.getItem('token');
                                    try {
                                      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/guests/${guest.id}`, {
                                        method: 'PUT',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          Authorization: `Bearer ${token}`,
                                        },
                                        body: JSON.stringify({
                                          allowed: newAllowed,
                                        }),
                                      });
                                      if (res.ok) {
                                        const updatedGuest = await res.json();
                                        const updatedGuests = guests.map(g =>
                                          g.id === guest.id ? updatedGuest : g
                                        );
                                        setGuests(updatedGuests);
                                      } else {
                                        alert('Failed to update allowed count');
                                      }
                                    } catch (err) {
                                      console.error(err);
                                      alert('Error updating allowed count');
                                    }
                                  }}
                                  className="w-20 h-8 text-center border-0 focus:ring-0 focus:outline-none"
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      setEditingGuest(guest);
                                      setGuestFirstName(guest.firstName);
                                      setGuestLastName(guest.lastName);
                                      setGuestAllowed(guest.allowed.toString());
                                      setIsAddGuestModalOpen(true);
                                    }}
                                    className="text-black hover:text-gray-800 hover:bg-gray-100"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      const token = localStorage.getItem('token');
                                      try {
                                        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/guests/${guest.id}`, {
                                          method: 'DELETE',
                                          headers: {
                                            Authorization: `Bearer ${token}`,
                                          },
                                        });
                                        if (res.ok) {
                                          setGuests(guests.filter(g => g.id !== guest.id));
                                        } else {
                                          alert('Failed to delete guest');
                                        }
                                      } catch (err) {
                                        console.error(err);
                                        alert('Error deleting guest');
                                      }
                                    }}
                                    className="text-[#2E235C] hover:text-[#2E235C] hover:bg-[#2E235C]/5"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 mx-auto mb-6 bg-[#2E235C]/10 rounded-full flex items-center justify-center">
                        <Users className="w-12 h-12 text-[#2E235C]" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No guests for this event</h3>
                      <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Start adding guests to this event and manage RSVPs efficiently
                      </p>
                      <Button 
                        onClick={() => setIsAddGuestModalOpen(true)}
                        className="bg-gradient-to-r from-[#2E235C] to-[#2E235C] px-8"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Add Your First Guest
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-6 bg-[#2E235C]/10 rounded-full flex items-center justify-center">
                      <Users className="w-12 h-12 text-[#2E235C]" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Select an event first</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      Choose an event from the dropdown above to manage guests and RSVPs
                    </p>
                  </div>
                )}
                </div>

            </div>
            )}

          </div>
        </main>
      </div>

      {/* Create Gift Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
        setIsCreateModalOpen(open);
        if (!open) {
           setType('');
           setTitle('');
           setDate('');
           setPicture('');
           setPictureFile(null);
           setFileError('');
           setGroomName('');
           setBrideName('');
           setCustomType('');
         }
      }}>
        <DialogContent className="max-w-[90vw] sm:max-w-[500px] p-0 border-0 shadow-2xl rounded-2xl bg-white overflow-auto max-h-[80vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-white z-10">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-[#2E235C]/10 to-[#2E235C]/10 rounded-lg">
                <Gift className="w-5 h-5 text-[#2E235C]" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">Create RSVP Link</DialogTitle>
                <p className="text-sm text-gray-600 mt-1">Share your special moment and receive gifts</p>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleCreateGift} className="px-6 pb-6">
            <div className="space-y-5 mt-4">
              <div>
                <Label className="text-sm font-medium text-gray-900 mb-2 block">
                  Event Type
                </Label>
                <Select onValueChange={setType} value={type}>
                  <SelectTrigger className="w-full h-11 border-gray-300 bg-white hover:bg-gray-50 transition-colors">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent className="border-0 shadow-lg">
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="graduation">Graduation</SelectItem>
                    <SelectItem value="convocation">Convocation</SelectItem>
                    <SelectItem value="baby-shower">Baby Shower</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {type === 'other' && (
                <div>
                  <Label htmlFor="customType" className="text-sm font-medium text-gray-900 mb-2 block">
                    Custom Type
                  </Label>
                  <Input
                    id="customType"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                    placeholder="Enter custom event type"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="title" className="text-sm font-medium text-gray-900 mb-2 block">
                  Event Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                  placeholder="e.g. James & Jane's Wedding"
                  required
                />
              </div>


              <div>
                <Label htmlFor="date" className="text-sm font-medium text-gray-900 mb-2 block">
                  <Calendar className="inline w-4 h-4 mr-2 text-gray-600" />
                  Event Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                />
              </div>

              <div>
                <Label htmlFor="picture" className="text-sm font-medium text-gray-900 mb-2 block">
                  <ImageIcon className="inline w-4 h-4 mr-2 text-gray-600" />
                  Event Picture
                </Label>
                <div className="mt-2">
                  {picture ? (
                    <div className="relative mb-4">
                      <img 
                        src={picture} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPicture('');
                          setPictureFile(null);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-[#2E235C] text-white rounded-full hover:bg-[#2E235C]/90 transition-colors shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#2E235C]/50 transition-colors cursor-pointer bg-gray-50/50">
                      <Input
                        id="picture"
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/gif"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="picture" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                          <p className="text-sm font-medium text-gray-900 mb-1">Click to upload image</p>
                          <p className="text-xs text-gray-500">JPEG, PNG or GIF (Max 5MB)</p>
                        </div>
                      </label>
                    </div>
                  )}
                  {fileError && (
                    <p className="text-sm text-[#2E235C] mt-2 font-medium flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {fileError}
                    </p>
                  )}
                  {pictureFile && !fileError && (
                    <p className="text-sm text-green-600 mt-2 font-medium flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Selected: {pictureFile.name} ({(pictureFile.size / (1024 * 1024)).toFixed(2)}MB)
                    </p>
                  )}
                </div>
              </div>

              {type === 'wedding' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="groomName" className="text-sm font-medium text-gray-900 mb-2 block">
                        Groom's Name
                      </Label>
                      <Input
                        id="groomName"
                        value={groomName}
                        onChange={(e) => setGroomName(e.target.value)}
                        className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                        placeholder="Enter groom's name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="brideName" className="text-sm font-medium text-gray-900 mb-2 block">
                        Bride's Name
                      </Label>
                      <Input
                        id="brideName"
                        value={brideName}
                        onChange={(e) => setBrideName(e.target.value)}
                        className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
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
                className="flex-1 h-11 bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90"
              >
                Create Gift
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Gift Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        setIsEditModalOpen(open);
        if (!open) {
          setType('');
          setTitle('');
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
        <DialogContent className="max-w-[90vw] sm:max-w-[500px] p-0 border-0 shadow-2xl rounded-2xl bg-white overflow-auto max-h-[80vh]">
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
                className="absolute top-3 right-3 p-2 bg-[#2E235C] text-white rounded-full hover:bg-[#2E235C]/90 transition-colors shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-white z-10">
            <DialogTitle className="text-xl font-semibold text-gray-900">Edit Gift</DialogTitle>
            <p className="text-sm text-gray-600 mt-1">Update your gift details</p>
          </DialogHeader>
          <form onSubmit={handleUpdateGift} className="px-6 pb-6">
            <div className="space-y-5 mt-4">
              <div>
                <Label className="text-sm font-medium text-gray-900 mb-2 block">
                  Event Type
                </Label>
                <Select onValueChange={setType} value={type}>
                  <SelectTrigger className="w-full h-11 border-gray-300 bg-white hover:bg-gray-50 transition-colors">
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
                  <Label htmlFor="customType" className="text-sm font-medium text-gray-900 mb-2 block">
                    Custom Type
                  </Label>
                  <Input
                    id="customType"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                    placeholder="Enter custom event type"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="title" className="text-sm font-medium text-gray-900 mb-2 block">
                  Gift Link Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                  placeholder="e.g., John & Jane's Wedding"
                  required
                />
              </div>


              <div>
                <Label htmlFor="date" className="text-sm font-medium text-gray-900 mb-2 block">
                  <Calendar className="inline w-4 h-4 mr-2 text-gray-600" />
                  Event Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-900 mb-3 block">
                  <ImageIcon className="inline w-4 h-4 mr-2 text-gray-600" />
                  Change Picture
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#2E235C]/50 transition-colors cursor-pointer bg-gray-50/50">
                  <Input
                    id="picture"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/gif"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="picture" className="cursor-pointer">
                    <div className="flex flex-col items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-900 mb-1">Click to upload new image</p>
                      <p className="text-xs text-gray-500">JPEG, PNG or GIF (Max 5MB)</p>
                    </div>
                  </label>
                </div>
                {fileError && (
                  <p className="text-sm text-[#2E235C] mt-2 font-medium flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {fileError}
                  </p>
                )}
                {pictureFile && !fileError && (
                  <p className="text-sm text-green-600 mt-2 font-medium flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Selected: {pictureFile.name}
                  </p>
                )}
              </div>

              {type === 'wedding' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="groomName" className="text-sm font-medium text-gray-900 mb-2 block">
                        Groom's Name
                      </Label>
                      <Input
                        id="groomName"
                        value={groomName}
                        onChange={(e) => setGroomName(e.target.value)}
                        className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                        placeholder="Enter groom's name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="brideName" className="text-sm font-medium text-gray-900 mb-2 block">
                        Bride's Name
                      </Label>
                      <Input
                        id="brideName"
                        value={brideName}
                        onChange={(e) => setBrideName(e.target.value)}
                        className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
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
                className="flex-1 h-11 bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90"
              >
                Update Gift
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={isWithdrawModalOpen} onOpenChange={(open) => {
        setIsWithdrawModalOpen(open);
        if (!open) {
          setWithdrawAmount('');
          setWithdrawBank('');
          setWithdrawAccount('');
          setWithdrawAccountName('');
        }
      }}>
        <DialogContent className="max-w-[90vw] sm:max-w-[500px] p-0 border-0 shadow-2xl rounded-2xl bg-white overflow-auto max-h-[80vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-white z-10">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg">
                <ArrowDownToLine className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">Withdraw Funds</DialogTitle>
                <p className="text-sm text-gray-600 mt-1">Transfer money to your bank account</p>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleWithdraw} className="px-6 pb-6">
            <div className="space-y-5 mt-4">
              <div>
                <Label htmlFor="amount" className="text-sm font-medium text-gray-900 mb-2 block">
                  Amount (₦)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="h-12 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                  placeholder="Enter amount"
                  required
                  min="1000"
                />
                <p className="text-xs text-gray-500 mt-2">Available balance: ₦{user.wallet}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-900 mb-2 block">
                  Bank
                </Label>
                <Select onValueChange={setWithdrawBank} value={withdrawBank}>
                  <SelectTrigger className="w-full h-12 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20">
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
                <Label htmlFor="account" className="text-sm font-medium text-gray-900 mb-2 block">
                  Account Number
                </Label>
                <Input
                  id="account"
                  value={withdrawAccount}
                  onChange={(e) => setWithdrawAccount(e.target.value)}
                  className="h-12 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                  placeholder="Enter account number"
                  required
                  maxLength={10}
                />
              </div>
              <div>
                <Label htmlFor="accountName" className="text-sm font-medium text-gray-900 mb-2 block">
                  Account Name
                </Label>
                <Input
                  id="accountName"
                  value={withdrawAccountName}
                  readOnly
                  className="h-12 bg-gray-50 border-gray-300"
                  placeholder="Account name will appear here"
                />
              </div>
              
              {/* Fee Info */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Withdrawal Amount:</span>
                  <span className="font-semibold">₦{withdrawAmount || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">Processing Fee:</span>
                  <span className="font-semibold">₦50.00</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total to Receive:</span>
                  <span className="text-green-600">₦{(parseFloat(withdrawAmount || '0') - 50).toFixed(2)}</span>
                </div>
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
                className="flex-1 h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                disabled={!withdrawAccountName}
              >
                <ArrowDownToLine className="w-5 h-5 mr-2" />
                Withdraw Funds
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Share Link Modal */}
      <Dialog open={isShareLinkModalOpen} onOpenChange={setIsShareLinkModalOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg rounded-2xl border-0 shadow-2xl p-0 overflow-hidden bg-white">
          <div className="bg-gradient-to-r from-[#2E235C]/10 to-[#2E235C]/10 p-6">
            <DialogHeader>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-r from-[#2E235C] to-[#2E235C] rounded-lg">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    Link Created!
                  </DialogTitle>
                  <p className="text-gray-600 text-sm mt-2">
                    Share your gift link with friends and family
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            {/* QR Code Display */}
            <div className="flex justify-center">
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-lg">
                <QRCodeSVG 
                  value={createdGiftLink}
                  size={200}
                  level="H"
                  includeMargin={true}
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
              </div>
            </div>

            {/* Link Display */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-600 mb-2 font-medium">Your Gift Link</p>
              <div className="flex items-center space-x-2">
                <LinkIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <p className="text-sm font-mono text-gray-900 break-all flex-1">{createdGiftLink}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(createdGiftLink);
                  alert('Link copied to clipboard!');
                }}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
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
                <Download className="w-5 h-5 mr-2" />
                Download QR
              </Button>
            </div>

            {/* Share Options */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3 font-medium">Share via</p>
              <div className="grid grid-cols-4 gap-2">
                <Button variant="outline" size="sm" className="flex-col h-auto py-3">
                  <GlobeIcon className="w-5 h-5 mb-1" />
                  <span className="text-xs">Copy</span>
                </Button>
                <Button variant="outline" size="sm" className="flex-col h-auto py-3">
                  <MessageSquare className="w-5 h-5 mb-1" />
                  <span className="text-xs">WhatsApp</span>
                </Button>
                <Button variant="outline" size="sm" className="flex-col h-auto py-3">
                  <Mail className="w-5 h-5 mb-1" />
                  <span className="text-xs">Email</span>
                </Button>
                <Button variant="outline" size="sm" className="flex-col h-auto py-3">
                  <Smartphone className="w-5 h-5 mb-1" />
                  <span className="text-xs">SMS</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gift Table Modal */}
      <Dialog open={isGiftTableModalOpen} onOpenChange={setIsGiftTableModalOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {selectedGiftForTable?.title || selectedGiftForTable?.type}
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              All contributions for this gift
            </p>
          </DialogHeader>
          
          <div className="mt-4">
            {selectedGiftForTable && (() => {
              const giftContributions = contributions.filter((c) => {
                return selectedGiftForTable.shareLink === selectedGiftForTable.shareLink;
              });
              const totalAmount = giftContributions.reduce((sum, c) => sum + Number(c.amount), 0);

              return (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                      <p className="font-bold text-lg text-green-600">₦{totalAmount.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Total Gifters</p>
                      <p className="font-bold text-lg">{giftContributions.length}</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Avg. Gift</p>
                      <p className="font-bold text-lg">₦{(totalAmount / Math.max(giftContributions.length, 1)).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="border rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-100">
                        <TableRow>
                          <TableHead className="font-semibold text-gray-700">Gifter Name</TableHead>
                          <TableHead className="font-semibold text-gray-700">Email</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Amount</TableHead>
                          <TableHead className="font-semibold text-gray-700">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {giftContributions.length > 0 ? (
                          giftContributions.map((contrib) => (
                            <TableRow key={contrib.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#2E235C]/20 to-[#2E235C]/10 flex items-center justify-center">
                                    <span className="text-xs font-bold text-[#2E235C]">
                                      {contrib.contributorName?.charAt(0) || 'A'}
                                    </span>
                                  </div>
                                  <span>{contrib.contributorName || 'Anonymous'}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {contrib.contributorEmail || '-'}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-green-600">
                                ₦{contrib.amount.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-sm">
                                {new Date(contrib.createdAt).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                              <p>No contributions yet</p>
                              <p className="text-sm text-gray-400 mt-1">
                                Share your gift link to receive contributions
                              </p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Guest Modal */}
      <Dialog open={isAddGuestModalOpen} onOpenChange={(open) => {
        setIsAddGuestModalOpen(open);
        if (!open) {
          setGuestFirstName('');
          setGuestLastName('');
          setGuestAllowed('1');
          setIsBulkMode(false);
          setBulkNames('');
          setEditingGuest(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {editingGuest ? 'Edit Guest' : `Add Guest${isBulkMode ? 's' : ''}`}
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              {editingGuest ? 'Update guest information' : (isBulkMode ? 'Add multiple guests at once' : 'Add a new guest to your RSVP list')}
            </p>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();

            if (editingGuest) {
              // Handle edit mode
              if (!guestFirstName.trim() || !guestLastName.trim()) {
                alert('Please enter both first and last name');
                return;
              }
              const updatedGuests = guests.map(g => 
                g.id === editingGuest.id 
                  ? {...g, firstName: guestFirstName, lastName: guestLastName, allowed: parseInt(guestAllowed) || 1, attending: g.attending || 'yes'}
                  : g
              );
              setGuests(updatedGuests);
              setEditingGuest(null);
            } else if (isBulkMode) {
              // Handle bulk addition
              const names = bulkNames.split('\n').map(n => n.trim()).filter(n => n);
              if (names.length === 0) {
                alert('Please enter at least one guest name');
                return;
              }
              const newGuests = names.map(name => {
                const parts = name.split(' ');
                const firstName = parts[0] || '';
                const lastName = parts.slice(1).join(' ') || '';
                return {
                  id: Date.now(),
                  firstName,
                  lastName,
                  allowed: parseInt(guestAllowed) || 1,
                  attending: 'yes',
                  giftId: selectedEventForRSVP
                };
              });
              setGuests([...guests, ...newGuests]);
              setBulkNames('');
            } else {
              // Handle single addition
              if (!guestFirstName.trim() || !guestLastName.trim()) {
                alert('Please enter both first and last name');
                return;
              }
              const token = localStorage.getItem('token');
              try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/guests`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    firstName: guestFirstName,
                    lastName: guestLastName,
                    allowed: parseInt(guestAllowed) || 1,
                    attending: 'yes',
                    giftId: selectedEventForRSVP,
                  }),
                });
                if (res.ok) {
                  const newGuest = await res.json();
                  setGuests([...guests, newGuest]);
                  setGuestFirstName('');
                  setGuestLastName('');
                } else {
                  alert('Failed to add guest');
                }
              } catch (err) {
                console.error(err);
                alert('Error adding guest');
              }
            }
            
            setGuestAllowed('1');
            setIsAddGuestModalOpen(false);
          }} className="px-6 pb-6">
            {/* Toggle between Single and Bulk */}
            {!editingGuest && (
            <div className="flex gap-2 mb-4 mt-4">
              <Button
                type="button"
                variant={!isBulkMode ? "default" : "outline"}
                className={`flex-1 ${!isBulkMode ? 'bg-gradient-to-r from-[#2E235C] to-[#2E235C]' : ''}`}
                onClick={() => setIsBulkMode(false)}
              >
                Single Guest
              </Button>
              <Button
                type="button"
                variant={isBulkMode ? "default" : "outline"}
                className={`flex-1 ${isBulkMode ? 'bg-gradient-to-r from-[#2E235C] to-[#2E235C]' : ''}`}
                onClick={() => setIsBulkMode(true)}
              >
                Bulk Add
              </Button>
            </div>
            )}

            <div className="space-y-4" style={{marginTop: editingGuest ? '1rem' : '0'}}>
              {editingGuest || !isBulkMode ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="guestFirstName" className="text-sm font-medium text-gray-900 mb-2 block">
                      First Name
                    </Label>
                    <Input
                      id="guestFirstName"
                      value={guestFirstName}
                      onChange={(e) => setGuestFirstName(e.target.value)}
                      className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                      placeholder="First name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="guestLastName" className="text-sm font-medium text-gray-900 mb-2 block">
                      Last Name
                    </Label>
                    <Input
                      id="guestLastName"
                      value={guestLastName}
                      onChange={(e) => setGuestLastName(e.target.value)}
                      className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="bulkNames" className="text-sm font-medium text-gray-900 mb-2 block">
                    Guest Names (one per line)
                  </Label>
                  <Textarea
                    id="bulkNames"
                    value={bulkNames}
                    onChange={(e) => setBulkNames(e.target.value)}
                    className="min-h-32 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                    placeholder="David & Chizzy"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter one name per line. All guests will have the same allowed number.
                  </p>
                </div>
              )}
              
              <div>
                <Label htmlFor="guestAllowed" className="text-sm font-medium text-gray-900 mb-2 block">
                  Number Allowed{isBulkMode ? ' (for all guests)' : ''}
                </Label>
                <Input
                  id="guestAllowed"
                  type="number"
                  min="1"
                  value={guestAllowed}
                  onChange={(e) => setGuestAllowed(e.target.value)}
                  className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                  placeholder="How many people allowed"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11"
                onClick={() => setIsAddGuestModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90"
              >
                {editingGuest ? 'Update Guest' : 'Add Guest'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Goal Modal */}
      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl border-0 shadow-2xl p-0 bg-white">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl font-semibold text-gray-900">Set Fundraising Goal</DialogTitle>
            <p className="text-sm text-gray-600 mt-1">Set a target amount for your gift collection</p>
          </DialogHeader>
          <div className="px-6 pb-6">
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="goalAmount" className="text-sm font-medium text-gray-900 mb-2 block">
                  Goal Amount (₦)
                </Label>
                <Input
                  id="goalAmount"
                  type="number"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(parseFloat(e.target.value))}
                  className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                  placeholder="Enter goal amount"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Current progress: ₦{totalContributions.toFixed(2)} ({totalGoalProgress.toFixed(1)}%)
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Goal Progress</h4>
                <Progress value={totalGoalProgress} className="h-2 bg-blue-100">
                  <div className="h-full bg-gradient-to-r from-[#2E235C] to-[#2E235C] rounded-full" />
                </Progress>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-blue-700">₦{totalContributions.toFixed(2)} raised</span>
                  <span className="font-semibold text-[#2E235C]">
                    ₦{(goalAmount - totalContributions).toLocaleString()} to go
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11"
                onClick={() => setIsGoalModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 h-11 bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90"
                onClick={() => setIsGoalModalOpen(false)}
              >
                Save Goal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
