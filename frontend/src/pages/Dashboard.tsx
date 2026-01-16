import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import GiftLinks from '../dashboard_ALL/GiftLinks';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import Navbar from '../components/Navbar';
import { useToast } from '../hooks/use-toast';
import { useIsMobile } from '../hooks/use-mobile';
import {
  Gift, DollarSign, TrendingUp, Users, Copy, Eye,
  ArrowDownToLine, Calendar, Image as ImageIcon, X, Edit,
  Home, Package, CreditCard, Settings, HelpCircle,
  Share2, QrCode, Filter, MoreVertical, Sparkles, Trophy,
  Target, Zap, Heart, Menu, X as CloseIcon, LogOut,
  BarChart3, MessageSquare, Shield, Globe, Download,
  Star, TrendingDown, CheckCircle, AlertCircle, Wallet,
  CreditCard as CreditCardIcon, Smartphone, Globe as GlobeIcon,
  Link as LinkIcon, User, Mail, Phone, MapPin, Clock, FileDown,
  Plus, Minus
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
// ...existing code...


import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { QRCodeSVG } from 'qrcode.react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import * as XLSX from 'xlsx';
import { Toaster } from '../components/ui/toaster';

interface Gift {
  id: number;
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
  guestListMode?: string;
}

interface Contribution {
  id: number;
  giftId: number;
  contributorName: string;
  contributorEmail: string;
  amount: number;
  message: string;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  // Success Modal State for withdrawal
  const [showWithdrawSuccess, setShowWithdrawSuccess] = useState(false);
  const { user, loading, updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
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
  const [bankSearch, setBankSearch] = useState('');
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [isShareLinkModalOpen, setIsShareLinkModalOpen] = useState(false);
  const [createdGiftLink, setCreatedGiftLink] = useState('');
  const [selectedGiftForTable, setSelectedGiftForTable] = useState<Gift | null>(null);
  const [isGiftTableModalOpen, setIsGiftTableModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('gifts');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);
  const [goalAmount, setGoalAmount] = useState(500000);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [guests, setGuests] = useState<Array<{id: number, firstName: string, lastName: string, email?: string, phone?: string, allowed: number, attending: string, giftId?: number, tableSitting?: string}>>([]);
  const [selectedEventForRSVP, setSelectedEventForRSVP] = useState<number | null>(null);
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<{id: number, firstName: string, lastName: string, allowed: number, attending: string, tableSitting?: string} | null>(null);
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestAllowed, setGuestAllowed] = useState('1');
  const [guestTableSitting, setGuestTableSitting] = useState('Table seating');
  const [customTableSitting, setCustomTableSitting] = useState('');
  const [customTableOptions, setCustomTableOptions] = useState<string[]>([]);
  const [guestMode, setGuestMode] = useState<'single' | 'bulk' | 'excel'>('single');
  const [address, setAddress] = useState('');
  const [reminder, setReminder] = useState('none');
  const [bulkNames, setBulkNames] = useState('');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [bulkTableMode, setBulkTableMode] = useState<'same' | 'custom'>('same');
  const [bulkTableSitting, setBulkTableSitting] = useState('Table seating');
  const [bulkGuests, setBulkGuests] = useState<Array<{firstName: string, lastName: string, tableSitting: string}>>([]);
  const [excelParsing, setExcelParsing] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('');
  const [createGuestListMode, setCreateGuestListMode] = useState('restricted');
  const [editGuestListMode, setEditGuestListMode] = useState('restricted');
  const [isCreatingGift, setIsCreatingGift] = useState(false);
  const [isUpdatingGift, setIsUpdatingGift] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  // RSVP duplicate error state
  const [rsvpDuplicateError, setRsvpDuplicateError] = useState('');
    // Helper to check for duplicate RSVP (case-insensitive, trimmed)
    const isDuplicateRSVP = (firstName: string, lastName: string, eventId: number | null) => {
      const normalized = (s: string) => s.trim().toLowerCase();
      return guests.some(g =>
        normalized(g.firstName) === normalized(firstName) &&
        normalized(g.lastName) === normalized(lastName) &&
        (eventId ? g.giftId === eventId : true)
      );
    };
  const [deletingGiftId, setDeletingGiftId] = useState<number | null>(null);
  const [deletingGuestId, setDeletingGuestId] = useState<number | null>(null);
  const [guestSearch, setGuestSearch] = useState('');
  const [attendingFilter, setAttendingFilter] = useState('all');
  const [tableFilter, setTableFilter] = useState('all');
  const [isCustomTableModalOpen, setIsCustomTableModalOpen] = useState(false);
  const [customTableName, setCustomTableName] = useState('');
  const [currentEditingGuestId, setCurrentEditingGuestId] = useState<number | null>(null);
  const [currentEditingBulkGuestIndex, setCurrentEditingBulkGuestIndex] = useState<number | null>(null);
  const [showAnalyticsButtons, setShowAnalyticsButtons] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);

  const totalAllowedGuests = guests.reduce((sum, g) => sum + g.allowed, 0);
  const isMobile = useIsMobile();

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Home, color: 'text-blue-500', badge: null },
    { id: 'gifts', label: 'My Events', icon: Gift, color: 'text-purple-500', badge: gifts.length },
    { id: 'rsvp', label: 'RSVP', icon: Users, color: 'text-[#2E235C]', badge: totalAllowedGuests },
    { id: 'withdraw', label: 'Withdraw', icon: CreditCard, color: 'text-[#2E235C]', badge: null },
  ];

  useEffect(() => {
    document.title = "Dashboard";
  }, []);

  const downloadGuestListPDF = () => {
    // Create a simple HTML table for PDF generation
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    // Use filtered guests for the selected event
    const guestsToExport = filteredGuests;
    
    const totalGuests = guestsToExport.reduce((sum, guest) => sum + guest.allowed, 0);
    const selectedEvent = selectedEventForRSVP ? gifts.find(g => g.id === selectedEventForRSVP) : null;
    const eventTitle = selectedEvent ? selectedEvent.title : 'All Events';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Guest List - ${eventTitle}</title>
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
          <h1>Guest List - ${eventTitle}</h1>
          <div class="meta">
            <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 60px;">#</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th style="width: 120px;">Allowed</th>
                <th>Table seating</th>
              </tr>
            </thead>
            <tbody>
              ${guestsToExport.map((guest, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${guest.firstName}</td>
                  <td>${guest.lastName}</td>
                  <td>${guest.allowed}</td>
                  <td>${guest.tableSitting || 'Table seating'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="summary">
            <div class="summary-item">
              <strong>Total Guests:</strong>
              <span>${guestsToExport.length}</span>
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
          setWithdrawHistory(Array.isArray(data) ? data : []);
        } else {
          setWithdrawHistory([]);
        }
      } catch (err) {
        console.error('Error fetching withdrawal history:', err);
        setWithdrawHistory([]);
      }
    };

    if (user) {
      fetchBanks();
      fetchWithdrawHistory();
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Extract unique custom table sittings from existing guests
  useEffect(() => {
    const predefinedOptions = ['Table seating', "Groom's family", "Bride's family", "Groom's friends", "Bride's friends", "Other"];
    const customOptions = guests
      .map(g => g.tableSitting)
      .filter((sitting): sitting is string =>
        sitting !== undefined &&
        sitting !== null &&
        sitting.trim() !== '' &&
        !predefinedOptions.includes(sitting)
      )
      .filter((value, index, self) => self.indexOf(value) === index) // unique values only
      .sort();
    setCustomTableOptions(customOptions);
  }, [guests]);

  // Parse bulk names for custom table seating mode
  useEffect(() => {
    if (bulkTableMode === 'custom' && bulkNames.trim()) {
      const names = bulkNames.split('\n').map(n => n.trim()).filter(n => n);
      const parsed = names.map(name => {
        const parts = name.split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';
        return { firstName, lastName, tableSitting: 'Table seating' };
      });
      setBulkGuests(parsed);
    } else {
      setBulkGuests([]);
    }
  }, [bulkNames, bulkTableMode]);

  //add filter
  // useEffect(() => {
  //   if (user) {
  //     filteredGuests = async () => {
  //       try (user){
  //         console.log("Add f")
  //       }catch{

  //       }
  //     }
  //   }
  // });

  useEffect(() => {
    if (user) {
      const fetchGifts = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gifts/my`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) {
            console.error('Error fetching gifts: HTTP', res.status);
            return; // Keep previous state on transient errors to prevent UI flicker
          }

          const data = await res.json();
          const safeGifts = Array.isArray(data) ? data : [];
          setGifts(safeGifts);

          const allContributions: Contribution[] = [];
          for (const gift of safeGifts) {
            try {
              if (gift.shareLink) {
                const encodedLink = encodeURIComponent(gift.shareLink);
                const contribRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/contributions/${encodedLink}`);
                if (!contribRes.ok) continue;
                const contribData = await contribRes.json();
                if (Array.isArray(contribData)) {
                  allContributions.push(...contribData);
                }
              }
            } catch (err) {
              console.error('Error fetching contributions for gift', gift.id, err);
            }
          }
          setContributions(allContributions);
        } catch (error) {
          console.error('Error fetching gifts:', error);
          // Keep existing state on failure to avoid disappearing cards
        }
      };

      const refreshUserData = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const updatedUser = await res.json();
            updateUser(updatedUser);
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      };

      fetchGifts();

      // Set up interval to refresh data at a calmer cadence to reduce flicker
      const intervalId = setInterval(() => {
        fetchGifts();
        refreshUserData();
      }, 10000);

      const fetchGuests = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/guests`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          setGuests(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('Error fetching guests:', error);
          setGuests([]);
        }
      };
      fetchGuests();

      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileError('');
      const maxSize = 6 * 1024 * 1024;
      if (file.size > maxSize) {
        const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        setFileError(`File size (${fileSizeInMB}MB) exceeds the maximum allowed size of 6MB. Please choose a smaller image.`);
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
      setAddress(gift.details.address || '');
      setReminder(gift.details.reminder || 'none');
      setCustomType(gift.customType || '');
    } else {
      setGroomName('');
      setBrideName('');
      setAddress('');
      setReminder('none');
      setCustomType('');
    }
    setEditGuestListMode(gift.guestListMode || 'restricted');
    setIsEditModalOpen(true);
  };

  const handleDeleteGift = async (giftId: number) => {
    if (deletingGiftId) return; // Prevent multiple deletions
    
    const giftToDelete = gifts.find(g => g.id === giftId);
    const giftName = giftToDelete?.title || giftToDelete?.type || 'Event';
    
    setDeletingGiftId(giftId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gifts/${giftId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setGifts(gifts.filter(g => g.id !== giftId));
        setContributions(contributions.filter(c => Number(c.giftId) !== Number(giftId)));
        
        toast({
          title: "Event deleted",
          description: `${giftName} has been successfully deleted.`,
        });
      } else {
        alert('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting gift:', error);
      alert('Error deleting gift');
    } finally {
      setDeletingGiftId(null);
    }
  };

  const handleCreateGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingGift) return; // Prevent duplicate submissions
    
    if (fileError) {
      alert('Please fix the file upload error before submitting.');
      return;
    }

    setIsCreatingGift(true);
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
    if (address) {
      details.address = address;
    }
    if (reminder && reminder !== 'none') {
      details.reminder = reminder;
    }
    formData.append('details', JSON.stringify(details));
    formData.append('guestListMode', createGuestListMode);

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
        
        // Optimistic update - add the new gift to the list immediately
        setGifts([...gifts, createdGift]);

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
        setCreateGuestListMode('restricted');
        setIsCreateModalOpen(false);

        const shareLink = `${window.location.origin}/gift/${createdGift.shareLink}`;
        setCreatedGiftLink(shareLink);
        setIsShareLinkModalOpen(true);
      } else {
        alert('Failed to create event');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while creating the event');
    } finally {
      setIsCreatingGift(false);
    }
  };

  const handleUpdateGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGift || isUpdatingGift) return; // Prevent duplicate submissions
    
    if (fileError) {
      alert('Please fix the file upload error before submitting.');
      return;
    }

    setIsUpdatingGift(true);
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
    if (address) {
      details.address = address;
    }
    if (reminder && reminder !== 'none') {
      details.reminder = reminder;
    }
    formData.append('details', JSON.stringify(details));
    formData.append('guestListMode', editGuestListMode);

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
        const updatedGift = await res.json();
        
        // Optimistic update - update the gift in the list immediately
        setGifts(gifts.map(g => g.id === editingGift.id ? updatedGift : g));

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
        setEditGuestListMode('restricted');
      } else {
        alert('Failed to update event');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while updating the event');
    } finally {
      setIsUpdatingGift(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isWithdrawing) return; // Prevent duplicate submissions
    
    setIsWithdrawing(true);
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
        setShowWithdrawSuccess(true);
        const profileRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const updatedUser = await profileRes.json();
          updateUser(updatedUser);
        }
        setWithdrawAmount('');
        setWithdrawBank('');
        setWithdrawAccount('');
        setWithdrawAccountName('');
        setIsWithdrawModalOpen(false);
      } else {
        alert(data.msg || 'Withdrawal failed');
      }
          {/* Withdraw Success Modal */}
          <Dialog open={showWithdrawSuccess} onOpenChange={setShowWithdrawSuccess}>
            <DialogContent className="max-w-[90vw] sm:max-w-[400px] p-0 border-0 shadow-2xl rounded-2xl bg-white overflow-auto">
              <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-white z-10">
                <DialogTitle className="text-xl font-semibold text-gray-900">Withdrawal initiated successfully!</DialogTitle>
              </DialogHeader>
              <div className="px-6 py-6 text-center">
                <p className="text-lg text-gray-700 mb-4">Your withdrawal request has been sent and is being processed.</p>
                <Button className="w-full mt-2" onClick={() => setShowWithdrawSuccess(false)}>OK</Button>
              </div>
            </DialogContent>
          </Dialog>
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setIsWithdrawing(false);
    }
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
  
  // Filter guests by selected event for RSVP tab
  const eventFilteredGuests = selectedEventForRSVP
    ? guests.filter(g => g.giftId === selectedEventForRSVP)
    : guests;
  
  // Apply additional filters for display
  let filteredGuests = eventFilteredGuests;
  
  // Apply search filter
  if (guestSearch.trim()) {
    const searchLower = guestSearch.toLowerCase();
    filteredGuests = filteredGuests.filter(g =>
      g.firstName.toLowerCase().includes(searchLower) ||
      g.lastName.toLowerCase().includes(searchLower)
    );
  }
  
  // Apply attending filter
  if (attendingFilter !== 'all') {
    filteredGuests = filteredGuests.filter(g => g.attending === attendingFilter);
  }
  
  // Apply table filter
  if (tableFilter !== 'all') {
    filteredGuests = filteredGuests.filter(g => g.tableSitting === tableFilter);
  }
  
  const totalAttending = Array.isArray(eventFilteredGuests) ? eventFilteredGuests.filter(g => g.attending === 'yes').reduce((sum, g) => sum + g.allowed, 0) : 0;
  const selectedGift = selectedEventForRSVP ? gifts.find(g => g.id === selectedEventForRSVP) : null;
  const isOpenGuestList = selectedGift?.guestListMode === 'open';

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
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
        className={`lg:hidden fixed top-4 ${sidebarOpen ? 'right-4' : 'left-4'} z-50 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors`}
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
      >
        {sidebarOpen ? <CloseIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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
                <img src="/logo2.png" alt="Logo" className="h-14 w-auto"/>
                {/* <h1 className="text-xl font-semibold text-primary">MyCashGift</h1> */}
              </div>
              <h2 className="text-lg font-semi-bold text-gray-900 mt-3">Welcome, {user.name}</h2>
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

              {/* Mobile-visible logout placed after nav items */}
              <div className="pt-3 lg:hidden mt-6">
                <Button 
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full text-gray-600 hover:text-white hover:bg-[#2E235C] justify-start"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </nav>

            {/* Footer/Create Button */}
            <div className="p-4 border-t border-gray-100 mb-16 hidden lg:block">
              <Button 
                variant="ghost"
                onClick={handleLogout}
                className="w-full mt-3 text-gray-600 hover:text-white hover:bg-[#2E235C]"
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
            <div className="p-4 lg:p-6 pl-16 lg:pl-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {activeTab === 'overview' && 'Dashboard Overview'}
                    {activeTab === 'gifts' && 'Events'}
                    {activeTab === 'withdraw' && 'Withdraw Funds'}
                    {activeTab === 'rsvp' && 'RSVP'}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {activeTab === 'overview' && 'Welcome back! Here is your dashboard summary'}
                    {activeTab === 'gifts' && 'Manage all your event links & cash gifts'}
                    {activeTab === 'withdraw' && 'Withdraw funds to your bank account'}
                    {activeTab === 'rsvp' && 'Manage your event guest list'}
                  </p>
                </div>
                
                <div className="flex flex-col lg:flex-row items-center space-y-2 lg:space-y-0 lg:space-x-4">
                  {activeTab === 'rsvp' && (
                    <>
                      {isMobile ? (
                        <Button
                          
                          size="sm"
                          className="w-full bg-primary"
                          onClick={() => setIsAnalyticsModalOpen(true)}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analytics
                        </Button>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" className="w-auto">
                            <Users className="w-4 h-4 mr-2" />
                            Total Guests: {eventFilteredGuests.length}
                          </Button>
                          <Button variant="outline" size="sm" className="w-auto">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Total Attending: {totalAttending}
                          </Button>
                          <Button variant="outline" size="sm" className="w-auto" onClick={() => window.open('mailto:teambethere@gmail.com.com')}>
                            <HelpCircle className="w-4 h-4 mr-2" />
                            Help
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-4 lg:p-8 pt-4">
            {/* Overview Section */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-[#2E235C] via-[#2E235C] to-[#2E235C] rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-lg overflow-hidden relative">
                  <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
                      <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
                          Welcome back, {user.name}!
                        </h1>
                        <p className="text-white/90 max-w-2xl">
                          You've received ₦{totalContributions.toFixed(2)} from {contributions.length} gifters. 
                          Keep sharing your RSVP links to receive more!
                        </p>
                      </div>
                      <div className="flex flex-row space-x-2 items-center mt-4">
                         <Button
                           variant="outline"
                           size="sm"
                           className="bg-white/20 hover:bg-white/30 border-white/30 text-white flex-1"
                           onClick={() => setIsCreateModalOpen(true)}
                         >
                           <Gift className="w-4 h-4 mr-1" />
                           Create Link
                         </Button>
                         <Button
                           variant="secondary"
                           size="sm"
                           className="bg-white hover:bg-gray-100 text-gray-900 flex-1"
                           onClick={() => setActiveTab('rsvp')}
                         >
                           <Users className="w-4 h-4 mr-1" />
                           Manage RSVP
                         </Button>
                       </div>
                    </div>
                    
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mt-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-sm opacity-90">Wallet Balance</p>
                        <p className="text-2xl font-bold">₦{user.wallet}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-sm opacity-90">Total Received</p>
                        <p className="text-2xl font-bold">₦{totalContributions.toFixed(2)}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-sm opacity-90">Active Events</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Create Gift Card */}
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => setIsCreateModalOpen(true)}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">Create Event</h3>
                          <p className="text-sm text-gray-600">Start a new gift link</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <p className="text-center text-gray-600 text-sm">
                          Create an RSVP link for your wedding, birthday, or any special occasion
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
                          <p className="text-2xl font-bold text-gray-900 mb-1">{totalAllowedGuests}</p>
                          <p className="text-sm text-gray-600">Total Allowed Guests</p>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        className="w-full mt-4 border-[#2E235C] text-[#2E235C] hover:bg-[#2E235C] hover:text-white hover:border-[#2E235C] transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab('rsvp');
                        }}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Manage
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
                        className="w-full mt-4 border-green-600 text-green-600 hover:bg-green-600 hover:text-white hover:border-green-600 transition-all duration-200"
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
                    <p className="text-gray-600 mt-1">Create and manage all your events and gift collection links</p>
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
                      Create event
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
                  deletingGiftId={deletingGiftId}
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
                            const gift = gifts.find(g => Number(g.id) === Number(contribution.giftId));
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
                                  <span className="font-bold text-green-600">₦{(typeof contribution.amount === 'number' ? contribution.amount : parseFloat(String(contribution.amount))).toFixed(2)}</span>
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
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Withdrawals */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-gray-600" />
                      Recent Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentContributions.length > 0 ? (
                      <div className="space-y-4">
                        {recentContributions.map((contribution, index) => {
                          const amount = typeof contribution.amount === 'number' ? contribution.amount : parseFloat(String(contribution.amount));
                          const commission = amount * 0.15;
                          const amountReceived = amount * 0.85;
                          const gift = gifts.find(g => Number(g.id) === Number(contribution.giftId));
                          return (
                            <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 rounded-full bg-green-100">
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium">Gifts {gift?.title || 'Gift'}</p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(contribution.createdAt).toLocaleDateString()} • {contribution.contributorName || 'Anonymous'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-900">₦{amount.toFixed(2)}</p>
                                <p className="text-xs text-gray-500">Commission: ₦{commission.toFixed(2)}</p>
                                <p className="text-xs text-green-600">Received: ₦{amountReceived.toFixed(2)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CreditCardIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">No transaction history yet</p>
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
                            typeGifts.some(g => Number(g.id) === Number(c.giftId))
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
                                <p className="font-bold text-green-600">₦{parseFloat(gifter.amount).toFixed(2)}</p>
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
                    <h2 className="text-2xl font-bold text-gray-900">RSVP Management</h2>
                    <p className="text-gray-600 mt-1">
                      {isOpenGuestList
                        ? 'View RSVPs - anyone can join via the event link'
                        : 'Manage your event guest list and track RSVPs'
                      }
                    </p>
                  </div>
                </div>

                {/* Event Selection and Actions */}
                <div className="flex gap-2 items-center">
                  <Select value={selectedEventForRSVP?.toString()} onValueChange={(value) => {
                    const eventId = value ? parseInt(value) : null;
                    setSelectedEventForRSVP(eventId);
                  }}>
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

                  {selectedEventForRSVP && eventFilteredGuests.length > 0 && (
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

                {selectedEventForRSVP && (
                  <>
                    <div className="flex flex-col gap-2 mt-4 sm:flex-row sm:gap-4 sm:items-center">
                      <div className="flex-1 w-full">
                        <Input
                          placeholder="Search guests by name..."
                          value={guestSearch}
                          onChange={(e) => setGuestSearch(e.target.value)}
                          className="h-10 w-full"
                        />
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Select value={attendingFilter} onValueChange={setAttendingFilter}>
                          <SelectTrigger className="w-full h-10 sm:w-40">
                            <SelectValue placeholder="Filter by attending" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Attending</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={tableFilter} onValueChange={setTableFilter}>
                          <SelectTrigger className="w-full h-10 sm:w-40">
                            <SelectValue placeholder="Filter by table" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Table seating (All)</SelectItem>
                            
                            <SelectItem value="Groom's family">Groom's family</SelectItem>
                            <SelectItem value="Bride's family">Bride's family</SelectItem>
                            <SelectItem value="Groom's friends">Groom's friends</SelectItem>
                            <SelectItem value="Bride's friends">Bride's friends</SelectItem>
                            {customTableOptions.map(option => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mt-2">
                      {`Showing ${filteredGuests.reduce((sum, guest) => sum + Number(guest.allowed), 0)} allowed guests`}
                    </p>

                    <div className="mt-6">
                {selectedEventForRSVP ? (
                  eventFilteredGuests.length > 0 ? (
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
                            <TableHead className="font-semibold">Table seating</TableHead>
                            <TableHead className="font-semibold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredGuests.map((guest, index) => (
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
                                  value={guest.attending || 'pending'}
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
                                          firstName: guest.firstName,
                                          lastName: guest.lastName,
                                          allowed: guest.allowed,
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
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center space-x-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={async () => {
                                      const newAllowed = Math.max(1, guest.allowed - 1);
                                      const token = localStorage.getItem('token');
                                      try {
                                        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/guests/${guest.id}`, {
                                          method: 'PUT',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${token}`,
                                          },
                                          body: JSON.stringify({
                                            firstName: guest.firstName,
                                            lastName: guest.lastName,
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
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
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
                                            firstName: guest.firstName,
                                            lastName: guest.lastName,
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
                                    className="w-12 h-6 text-center border-0 focus:ring-0 focus:outline-none text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={async () => {
                                      const newAllowed = guest.allowed + 1;
                                      const token = localStorage.getItem('token');
                                      try {
                                        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/guests/${guest.id}`, {
                                          method: 'PUT',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${token}`,
                                          },
                                          body: JSON.stringify({
                                            firstName: guest.firstName,
                                            lastName: guest.lastName,
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
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const tableSitting = guest.tableSitting || 'Table seating';

                                  return (
                                    <Select
                                      value={tableSitting}
                                      onValueChange={async (value) => {
                                        if (value === 'Other') {
                                          setCurrentEditingGuestId(guest.id);
                                          setIsCustomTableModalOpen(true);
                                          return;
                                        }
                                        const token = localStorage.getItem('token');
                                        try {
                                          const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/guests/${guest.id}`, {
                                            method: 'PUT',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              Authorization: `Bearer ${token}`,
                                            },
                                            body: JSON.stringify({
                                              firstName: guest.firstName,
                                              lastName: guest.lastName,
                                              allowed: guest.allowed,
                                              tableSitting: value,
                                            }),
                                          });
                                          if (res.ok) {
                                            const updatedGuest = await res.json();
                                            const updatedGuests = guests.map(g =>
                                              g.id === guest.id ? updatedGuest : g
                                            );
                                            setGuests(updatedGuests);
                                          } else {
                                            alert('Failed to update table sitting');
                                          }
                                        } catch (err) {
                                          console.error(err);
                                          alert('Error updating table sitting');
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="w-40 h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Table seating">Table seating</SelectItem>
                                        <SelectItem value="Groom's family">Groom's family</SelectItem>
                                        <SelectItem value="Bride's family">Bride's family</SelectItem>
                                        <SelectItem value="Groom's friends">Groom's friends</SelectItem>
                                        <SelectItem value="Bride's friends">Bride's friends</SelectItem>
                                        {customTableOptions.map(option => (
                                          <SelectItem key={option} value={option}>{option}</SelectItem>
                                        ))}
                                        <SelectItem value="Other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  );
                                })()}
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
                                      const tableSitting = guest.tableSitting || 'Table seating';
                                      const predefinedOptions = ['Table seating', "Groom's family", "Bride's family", "Groom's friends", "Bride's friends"];
                                      if (predefinedOptions.includes(tableSitting)) {
                                        setGuestTableSitting(tableSitting);
                                        setCustomTableSitting('');
                                      } else {
                                        setGuestTableSitting('Other');
                                        setCustomTableSitting(tableSitting);
                                      }
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
                                      if (deletingGuestId) return; // Prevent multiple deletions
                                      
                                      setDeletingGuestId(guest.id);
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
                                      } finally {
                                        setDeletingGuestId(null);
                                      }
                                    }}
                                    disabled={deletingGuestId === guest.id}
                                    className="text-[#2E235C] hover:text-[#2E235C] hover:bg-[#2E235C]/5 disabled:opacity-50"
                                  >
                                    {deletingGuestId === guest.id ? (
                                      <div className="w-4 h-4 border-2 border-[#2E235C] border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <X className="w-4 h-4" />
                                    )}
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
                  </>
                )}

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
           setAddress('');
           setReminder('none');
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
                <Label htmlFor="address" className="text-sm font-medium text-gray-900 mb-2 block">
                  <MapPin className="inline w-4 h-4 mr-2 text-gray-600" />
                  Event Address
                </Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="min-h-20 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                  placeholder="Enter the event location address"
                />
              </div>

              <div>
                <Label htmlFor="reminder" className="text-sm font-medium text-gray-900 mb-2 block">
                  <Clock className="inline w-4 h-4 mr-2 text-gray-600" />
                  Send Reminder
                </Label>
                <Select onValueChange={setReminder} value={reminder}>
                  <SelectTrigger className="w-full h-11 border-gray-300 bg-white hover:bg-gray-50 transition-colors">
                    <SelectValue placeholder="Select reminder timing" />
                  </SelectTrigger>
                  <SelectContent className="border-0 shadow-lg">
                    <SelectItem value="none">No reminder</SelectItem>
                    <SelectItem value="1week">1 week before</SelectItem>
                    <SelectItem value="3days">3 days before</SelectItem>
                    <SelectItem value="1day">1 day before</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-900 mb-2 block">
                  Guest List Mode
                </Label>
                <Select onValueChange={setCreateGuestListMode} value={createGuestListMode}>
                  <SelectTrigger className="w-full h-11 border-gray-300 bg-white hover:bg-gray-50 transition-colors">
                    <SelectValue placeholder="Select guest list mode" />
                  </SelectTrigger>
                  <SelectContent className="border-0 shadow-lg">
                    <SelectItem value="restricted">Restricted - Require guest list</SelectItem>
                    <SelectItem value="open">Open - Allow anyone to RSVP</SelectItem>
                  </SelectContent>
                </Select>
                {/* <p className="text-xs text-gray-500 mt-1">
                  You can change this later in the RSVP management section.
                </p> */}
              </div>

              <div>
                <Label htmlFor="picture" className="text-sm font-medium text-gray-900 mb-2 block">
                  <ImageIcon className="inline w-4 h-4 mr-2 text-gray-600" />
                  Event Invite
                </Label>
                <div className="mt-2">
                  {picture ? (
                    <div className="relative mb-4">
                      <img
                        src={picture}
                        alt="Preview"
                        style={{
                          width: '100%',
                          height: 'auto',
                          objectFit: 'none', // Do not crop or scale
                          imageRendering: 'auto', // Render as uploaded
                          borderRadius: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#fff',
                          display: 'block',
                        }}
                        draggable={false}
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
                          <p className="text-xs text-gray-500">JPEG, PNG or GIF (Max 6MB)</p>
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
                disabled={isCreatingGift}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90"
                disabled={isCreatingGift}
              >
                {isCreatingGift ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create Event'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <div>
      </div>

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
          setAddress('');
          setReminder('none');
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
                <Label className="text-sm font-medium text-gray-900 mb-2 block">
                  Guest List Mode
                </Label>
                <Select onValueChange={setEditGuestListMode} value={editGuestListMode}>
                  <SelectTrigger className="w-full h-11 border-gray-300 bg-white hover:bg-gray-50 transition-colors">
                    <SelectValue placeholder="Select guest list mode" />
                  </SelectTrigger>
                  <SelectContent className="border-0 shadow-lg">
                    <SelectItem value="restricted">Restricted - Require guest list</SelectItem>
                    <SelectItem value="open">Open - Allow anyone to RSVP</SelectItem>
                  </SelectContent>
                </Select>
                {/* <p className="text-xs text-gray-500 mt-1">
                  You can change this later in the RSVP management section.
                </p> */}
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
                      <p className="text-xs text-gray-500">JPEG, PNG or GIF (Max 6MB)</p>
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
                disabled={isUpdatingGift}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90"
                disabled={isUpdatingGift}
              >
                {isUpdatingGift ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Gift'
                )}
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
                  min="100"
                />
                <p className="text-xs text-gray-500 mt-2">Available balance: ₦{user.wallet}</p>
                <p className="text-xs text-gray-500 mt-1">Minimum withdrawal amount is ₦100.</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-900 mb-2 block">
                  Bank
                </Label>
                <Popover open={isBankDropdownOpen} onOpenChange={setIsBankDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isBankDropdownOpen}
                      className="w-full h-12 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20 justify-between"
                    >
                      {withdrawBank
                        ? banks.find((bank: any) => bank.code === withdrawBank)?.name
                        : "Select your bank"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" side="bottom" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search banks..." 
                        value={bankSearch}
                        onValueChange={setBankSearch}
                      />
                      <CommandEmpty>No bank found.</CommandEmpty>
                      <CommandList className="max-h-[300px]">
                        <CommandGroup>
                          {banks
                            .filter((bank: any) =>
                              bank.name.toLowerCase().includes(bankSearch.toLowerCase())
                            )
                            .map((bank: any) => (
                              <CommandItem
                                key={bank.code}
                                value={bank.name}
                                onSelect={() => {
                                  setWithdrawBank(bank.code);
                                  setBankSearch('');
                                  setIsBankDropdownOpen(false);
                                }}
                              >
                                {bank.name}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                  <span className="text-gray-600">Amount to Receive:</span>
                  <span className="text-green-600 font-semibold">₦{withdrawAmount || '0.00'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11"
                onClick={() => setIsWithdrawModalOpen(false)}
                disabled={isWithdrawing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                disabled={!withdrawAccountName || isWithdrawing}
              >
                {isWithdrawing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-5 h-5 mr-2" />
                    Withdraw Funds
                  </>
                )}
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
                    Share your RSVP link with friends and family
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
                return Number(selectedGiftForTable.id) === Number(c.giftId);
              });
              const totalAmount = giftContributions.reduce((sum, c) => sum + Number(c.amount), 0);

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
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

                  {/* Desktop Table View */}
                  <div className="hidden md:block border rounded-xl overflow-hidden">
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
                                ₦{(typeof contrib.amount === 'number' ? contrib.amount : parseFloat(String(contrib.amount))).toFixed(2)}
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

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {giftContributions.length > 0 ? (
                      giftContributions.map((contrib) => (
                        <div key={contrib.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#2E235C]/20 to-[#2E235C]/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-[#2E235C]">
                                {contrib.contributorName?.charAt(0) || 'A'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm mb-1">
                                {contrib.contributorName || 'Anonymous'}
                              </p>
                              <p className="text-xs text-gray-500 break-all">
                                {contrib.contributorEmail || '-'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Amount</p>
                              <p className="font-bold text-green-600 text-base">
                                ₦{(typeof contrib.amount === 'number' ? contrib.amount : parseFloat(String(contrib.amount))).toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 mb-1">Date</p>
                              <p className="text-xs text-gray-700 font-medium">
                                {new Date(contrib.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-500 border rounded-lg bg-gray-50">
                        <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p>No contributions yet</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Share your gift link to receive contributions
                        </p>
                      </div>
                    )}
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
     setGuestTableSitting('Table seating');
     setCustomTableSitting('');
     setGuestMode('single');
     setBulkNames('');
     setExcelFile(null);
     setExcelParsing(false);
     setEditingGuest(null);
     setBulkTableMode('same');
     setBulkTableSitting('Table seating');
     setBulkGuests([]);
     setCurrentEditingBulkGuestIndex(null);
   }
}}>
  <DialogContent className="max-w-md w-full">
    <DialogHeader>
      <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900">
        {editingGuest ? 'Edit Guest' : guestMode === 'single' ? 'Add Guest' : 'Add Guests'}
      </DialogTitle>
      <p className="text-xs sm:text-sm text-gray-600 mt-1">
        {editingGuest
          ? 'Update guest information'
          : guestMode === 'bulk'
            ? 'Add multiple guests at once'
            : guestMode === 'excel'
              ? 'Upload an Excel sheet to add guests'
              : 'Add a new guest to your RSVP list'}
      </p>
    </DialogHeader>
    {/* Show RSVP duplicate error if present */}
    {rsvpDuplicateError && (
      <div className="mb-4 text-sm sm:text-base text-red-600 text-center font-medium bg-red-50 border border-red-200 rounded p-2">
        {rsvpDuplicateError}
      </div>
    )}
    <form onSubmit={async (e) => {
      e.preventDefault();
      setRsvpDuplicateError('');
      if (isAddingGuest) return; // Prevent duplicate submissions

      if (!editingGuest && guestMode === 'single') {
        // Check for duplicate RSVP before adding
        if (!guestFirstName.trim() || !guestLastName.trim()) {
          setErrorTitle('Missing Information');
          setErrorMessage('Please enter both first and last name');
          setErrorModalOpen(true);
          return;
        }
        if (isDuplicateRSVP(guestFirstName, guestLastName, selectedEventForRSVP)) {
          setRsvpDuplicateError('You have already submitted a response for this event.');
          return;
        }
      }

      if (editingGuest) {
        // Handle edit mode
        if (!guestFirstName.trim() || !guestLastName.trim()) {
          setErrorTitle('Missing Information');
          setErrorMessage('Please enter both first and last name');
          setErrorModalOpen(true);
          return;
        }

        setIsAddingGuest(true);
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/guests/${editingGuest.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              firstName: guestFirstName,
              lastName: guestLastName,
              allowed: parseInt(guestAllowed) || 1,
              tableSitting: guestTableSitting === 'Other' ? customTableSitting : guestTableSitting,
            }),
          });
          if (res.ok) {
            const updatedGuest = await res.json();
            const updatedGuests = guests.map(g => 
              g.id === editingGuest.id ? updatedGuest : g
            );
            setGuests(updatedGuests);
            setGuestFirstName('');
            setGuestLastName('');
            setGuestAllowed('1');
            setGuestTableSitting('Table seating');
            setEditingGuest(null);
            setIsAddGuestModalOpen(false);
          } else {
            setErrorTitle('Update Failed');
            setErrorMessage('Failed to update guest. Please try again.');
            setErrorModalOpen(true);
          }
        } catch (err) {
          console.error(err);
          setErrorTitle('Error');
          setErrorMessage('An error occurred while updating the guest.');
          setErrorModalOpen(true);
        } finally {
          setIsAddingGuest(false);
        }
      } else if (guestMode === 'bulk') {
         // Handle bulk addition
         let guestsToAdd: Array<{firstName: string, lastName: string, tableSitting: string}>;
         if (bulkTableMode === 'same') {
           const names = bulkNames.split('\n').map(n => n.trim()).filter(n => n);
           guestsToAdd = names.map(name => {
             const parts = name.split(' ');
             const firstName = parts[0] || '';
             const lastName = parts.slice(1).join(' ') || '';
             return { firstName, lastName, tableSitting: bulkTableSitting };
           });
         } else {
           guestsToAdd = bulkGuests;
         }
         if (guestsToAdd.length === 0) {
           setErrorTitle('No Names Entered');
           setErrorMessage('Please enter at least one guest name');
           setErrorModalOpen(true);
           return;
         }

         setIsAddingGuest(true);
         const token = localStorage.getItem('token');
         const createdGuests = [] as any[];

         try {
           for (const guest of guestsToAdd) {
             if (!guest.firstName && !guest.lastName) continue;

             try {
               const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/guests`, {
                 method: 'POST',
                 headers: {
                   'Content-Type': 'application/json',
                   Authorization: `Bearer ${token}`,
                 },
                 body: JSON.stringify({
                   firstName: guest.firstName,
                   lastName: guest.lastName,
                   allowed: parseInt(guestAllowed) || 1,
                   attending: 'pending',
                   giftId: selectedEventForRSVP,
                   tableSitting: guest.tableSitting,
                 }),
               });
               if (res.ok) {
                 const newGuest = await res.json();
                 createdGuests.push(newGuest);
               }
             } catch (err) {
               console.error(err);
             }
           }

          if (createdGuests.length === 0) {
            setErrorTitle('No Guests Added');
            setErrorMessage('No guests were added. Please check your entries and try again.');
            setErrorModalOpen(true);
            return;
          }

          setGuests([...guests, ...createdGuests]);
          setBulkNames('');
          setGuestAllowed('1');
          setIsAddGuestModalOpen(false);
        } finally {
          setIsAddingGuest(false);
        }
      } else if (guestMode === 'excel') {
        if (!excelFile) {
          setErrorTitle('No File Selected');
          setErrorMessage('Please upload an Excel file (.xlsx or .xls)');
          setErrorModalOpen(true);
          return;
        }

        setIsAddingGuest(true);
        setExcelParsing(true);
        
        try {
          const buffer = await excelFile.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

          const parsedGuests = rows.map((row) => {
            const firstName = row.firstName || row.FirstName || row['First Name'] || row['First name'] || '';
            const lastName = row.lastName || row.LastName || row['Last Name'] || row['Last name'] || '';
            const allowedVal = row.allowed || row.Allowed || row['Number Allowed'] || row['Allowed'] || row['allowed'] || '';
            const allowed = parseInt(allowedVal) || parseInt(guestAllowed) || 1;
            const tableSitting = row.tableSitting || row.TableSitting || row['Table seating'] || row['Table Seating'] || row['Table Seating'] || 'Table seating';
            return { firstName: String(firstName).trim(), lastName: String(lastName).trim(), allowed, tableSitting: String(tableSitting).trim() };
          }).filter((g) => g.firstName || g.lastName);

          if (parsedGuests.length === 0) {
            setErrorTitle('Invalid Excel Format');
            setErrorMessage('No valid rows found. Please include First Name / Last Name columns in your Excel file.');
            setErrorModalOpen(true);
            return;
          }

          const token = localStorage.getItem('token');
          const createdGuests = [] as any[];

          for (const g of parsedGuests) {
            try {
              const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/guests`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  firstName: g.firstName,
                  lastName: g.lastName,
                  allowed: g.allowed,
                  attending: 'pending',
                  giftId: selectedEventForRSVP,
                  tableSitting: g.tableSitting || 'Table seating',
                }),
              });
              if (res.ok) {
                const newGuest = await res.json();
                createdGuests.push(newGuest);
              }
            } catch (err) {
              console.error(err);
            }
          }

          if (createdGuests.length === 0) {
            setErrorTitle('Upload Failed');
            setErrorMessage('No guests were added. Please verify your Excel file columns.');
            setErrorModalOpen(true);
            return;
          }

          setGuests([...guests, ...createdGuests]);
          setExcelFile(null);
          setGuestAllowed('1');
          setIsAddGuestModalOpen(false);
        } catch (err) {
          console.error(err);
          setErrorTitle('Processing Error');
          setErrorMessage('Could not process the Excel file. Please check the format and try again.');
          setErrorModalOpen(true);
        } finally {
          setExcelParsing(false);
          setIsAddingGuest(false);
        }
      } else {
        // Handle single addition
        if (!guestFirstName.trim() || !guestLastName.trim()) {
          setErrorTitle('Missing Information');
          setErrorMessage('Please enter both first and last name');
          setErrorModalOpen(true);
          return;
        }
        
        setIsAddingGuest(true);
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
              attending: 'pending',
              giftId: selectedEventForRSVP,
              tableSitting: guestTableSitting === 'Other' ? customTableSitting : guestTableSitting,
            }),
          });
          if (res.ok) {
            const newGuest = await res.json();
            setGuests([...guests, newGuest]);
            setGuestFirstName('');
            setGuestLastName('');
            setGuestAllowed('1');
            setGuestTableSitting('Table seating');
            setIsAddGuestModalOpen(false);
          } else {
            setErrorTitle('Failed to Add Guest');
            setErrorMessage('Failed to add guest. Please try again.');
            setErrorModalOpen(true);
          }
        } catch (err) {
          console.error(err);
          setErrorTitle('Error');
          setErrorMessage('Error adding guest. Please try again.');
          setErrorModalOpen(true);
        } finally {
          setIsAddingGuest(false);
        }
      }
    }} className="px-4 sm:px-6 pb-4 sm:pb-6">
      {/* Toggle between Single, Bulk, and Excel upload */}
      {!editingGuest && (
      <div className="grid grid-cols-3 gap-2 mb-4 mt-4">
        <Button
          type="button"
          variant={guestMode === 'single' ? "default" : "outline"}
          className={`w-full text-xs sm:text-sm ${guestMode === 'single' ? 'bg-gradient-to-r from-[#2E235C] to-[#2E235C]' : ''}`}
          onClick={() => setGuestMode('single')}
        >
          Single Guest
        </Button>
        <Button
          type="button"
          variant={guestMode === 'bulk' ? "default" : "outline"}
          className={`w-full text-xs sm:text-sm ${guestMode === 'bulk' ? 'bg-gradient-to-r from-[#2E235C] to-[#2E235C]' : ''}`}
          onClick={() => setGuestMode('bulk')}
        >
          Bulk Add
        </Button>
        <Button
          type="button"
          variant={guestMode === 'excel' ? "default" : "outline"}
          className={`w-full text-xs sm:text-sm ${guestMode === 'excel' ? 'bg-gradient-to-r from-[#2E235C] to-[#2E235C]' : ''}`}
          onClick={() => setGuestMode('excel')}
        >
          Upload Excel
        </Button>
      </div>
      )}

      <div className="space-y-4" style={{marginTop: editingGuest ? '1rem' : '0'}}>
        {editingGuest || guestMode === 'single' ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="guestFirstName" className="text-xs sm:text-sm font-medium text-gray-900 mb-2 block">
                First Name
              </Label>
              <Input
                id="guestFirstName"
                value={guestFirstName}
                onChange={(e) => setGuestFirstName(e.target.value)}
                className="h-10 sm:h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                placeholder="First name"
                required
              />
            </div>
            <div>
              <Label htmlFor="guestLastName" className="text-xs sm:text-sm font-medium text-gray-900 mb-2 block">
                Last Name
              </Label>
              <Input
                id="guestLastName"
                value={guestLastName}
                onChange={(e) => setGuestLastName(e.target.value)}
                className="h-10 sm:h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                placeholder="Last name"
                required
              />
            </div>
          </div>
        ) : guestMode === 'bulk' ? (
           <div className="space-y-4">
             <div>
               <Label htmlFor="bulkNames" className="text-xs sm:text-sm font-medium text-gray-900 mb-2 block">
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
             <div>
               {/* <Label className="text-xs sm:text-sm font-medium text-gray-900 mb-2 block">
                 Table Seating Mode
               </Label>
               <Select value={bulkTableMode} onValueChange={(value: 'same' | 'custom') => setBulkTableMode(value)}>
                 <SelectTrigger className="h-10 sm:h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="same">Same for all guests</SelectItem>
                   <SelectItem value="custom">Customize per guest</SelectItem>
                 </SelectContent>
               </Select> */}
             </div>
             {bulkTableMode === 'same' ? (
               <div>
                 <Label className="text-xs sm:text-sm font-medium text-gray-900 mb-2 block">
                   Table Seating
                 </Label>
                 <Select value={bulkTableSitting} onValueChange={(value) => {
                   if (value === 'Other') {
                     setIsCustomTableModalOpen(true);
                     return;
                   }
                   setBulkTableSitting(value);
                 }}>
                   <SelectTrigger className="h-10 sm:h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20">
                     <SelectValue placeholder="Select table seating" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="Table seating">Table seating</SelectItem>
                     <SelectItem value="Groom's family">Groom's family</SelectItem>
                     <SelectItem value="Bride's family">Bride's family</SelectItem>
                     <SelectItem value="Groom's friends">Groom's friends</SelectItem>
                     <SelectItem value="Bride's friends">Bride's friends</SelectItem>
                     {customTableOptions.map(option => (
                       <SelectItem key={option} value={option}>{option}</SelectItem>
                     ))}
                     <SelectItem value="Other">Other</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             ) : (
               bulkGuests.length > 0 && (
                 <div className="space-y-2">
                   <Label className="text-xs sm:text-sm font-medium text-gray-900 mb-2 block">
                     Customize Table Seating
                   </Label>
                   {bulkGuests.map((guest, index) => (
                     <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                       <span className="flex-1 text-sm">{guest.firstName} {guest.lastName}</span>
                       <Select value={guest.tableSitting} onValueChange={(value) => {
                         if (value === 'Other') {
                           setCurrentEditingBulkGuestIndex(index);
                           setIsCustomTableModalOpen(true);
                           return;
                         }
                         const newGuests = [...bulkGuests];
                         newGuests[index].tableSitting = value;
                         setBulkGuests(newGuests);
                       }}>
                         <SelectTrigger className="w-40 h-8">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="Table seating">Table seating</SelectItem>
                           <SelectItem value="Groom's family">Groom's family</SelectItem>
                           <SelectItem value="Bride's family">Bride's family</SelectItem>
                           <SelectItem value="Groom's friends">Groom's friends</SelectItem>
                           <SelectItem value="Bride's friends">Bride's friends</SelectItem>
                           {customTableOptions.map(option => (
                             <SelectItem key={option} value={option}>{option}</SelectItem>
                           ))}
                           <SelectItem value="Other">Other</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   ))}
                 </div>
               )
             )}
           </div>
        ) : (
          <div>
            <Label htmlFor="excelFile" className="text-xs sm:text-sm font-medium text-gray-900 mb-2 block">
              Upload Excel (.xlsx or .xls)
            </Label>
            <Input
              id="excelFile"
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
              className="h-10 sm:h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20 cursor-pointer"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Columns supported: First Name, Last Name, Table seating (optional). Blank rows are ignored.
            </p>
          </div>
        )}
        
        <div>
          <Label htmlFor="guestAllowed" className="text-xs sm:text-sm font-medium text-gray-900 mb-2 block">
            {guestMode === 'excel' ? 'Default Number Allowed' : 'Number Allowed'}{guestMode === 'bulk' ? ' (for all guests)' : ''}
          </Label>
          <Input
            id="guestAllowed"
            type="number"
            min="1"
            value={guestAllowed}
            onChange={(e) => setGuestAllowed(e.target.value)}
            className="h-10 sm:h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
            placeholder="How many people allowed"
            required
          />
        </div>

        {(editingGuest || guestMode === 'single') && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="guestTableSitting" className="text-xs sm:text-sm font-medium text-gray-900 mb-2 block">
                Table seating
              </Label>
              <Select value={guestTableSitting} onValueChange={(value) => {
                setGuestTableSitting(value);
                if (value !== 'Other') {
                  setCustomTableSitting('');
                }
              }}>
                <SelectTrigger className="h-10 sm:h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20">
                  <SelectValue placeholder="Select table seating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Table seating">Table seating</SelectItem>
                  <SelectItem value="Groom's family">Groom's family</SelectItem>
                  <SelectItem value="Bride's family">Bride's family</SelectItem>
                  <SelectItem value="Groom's friends">Groom's friends</SelectItem>
                  <SelectItem value="Bride's friends">Bride's friends</SelectItem>
                  {customTableOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {guestTableSitting === 'Other' && (
              <div>
                <Label htmlFor="customTableSitting" className="text-xs sm:text-sm font-medium text-gray-900 mb-2 block">
                  Custom Table Name
                </Label>
                <Input
                  id="customTableSitting"
                  value={customTableSitting}
                  onChange={(e) => setCustomTableSitting(e.target.value)}
                  className="h-10 sm:h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                  placeholder="Enter custom table name"
                  required
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-row gap-3 pt-6">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-10 sm:h-11 text-xs sm:text-sm"
          onClick={() => setIsAddGuestModalOpen(false)}
          disabled={isAddingGuest || excelParsing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 h-10 sm:h-11 bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90 text-xs sm:text-sm"
          disabled={isAddingGuest || excelParsing}
        >
          {isAddingGuest || excelParsing ? (
            <>
              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {excelParsing ? 'Processing...' : (editingGuest ? 'Updating...' : 'Adding...')}
            </>
          ) : (
            editingGuest ? 'Update Guest' : 'Add Guest'
          )}
        </Button>
      </div>
    </form>
  </DialogContent>
</Dialog>

{/* Error Modal */}
<Dialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
  <DialogContent className="max-w-md w-full">
    <div className="flex flex-col items-center text-center p-4 sm:p-6">
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
      </div>
      <DialogHeader>
        <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          {errorTitle}
        </DialogTitle>
      </DialogHeader>
      <p className="text-sm text-gray-600 mb-6">
        {errorMessage}
      </p>
      <Button
        onClick={() => setErrorModalOpen(false)}
        className="w-full h-10 sm:h-11 bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90"
      >
        OK
      </Button>
    </div>
  </DialogContent>
</Dialog>

{/* Goal Modal */}
<Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
  <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-md rounded-2xl border-0 shadow-2xl p-0 bg-white">
    <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b">
      <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900">Set Fundraising Goal</DialogTitle>
      <p className="text-xs sm:text-sm text-gray-600 mt-1">Set a target amount for your gift collection</p>
    </DialogHeader>
    <div className="px-4 sm:px-6 pb-4 sm:pb-6">
      <div className="space-y-4 mt-4">
        <div>
          <Label htmlFor="goalAmount" className="text-xs sm:text-sm font-medium text-gray-900 mb-2 block">
            Goal Amount (₦)
          </Label>
          <Input
            id="goalAmount"
            type="number"
            value={goalAmount}
            onChange={(e) => setGoalAmount(parseFloat(e.target.value))}
            className="h-10 sm:h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
            placeholder="Enter goal amount"
          />
          <p className="text-xs text-gray-500 mt-2">
            Current progress: ₦{totalContributions.toFixed(2)} ({totalGoalProgress.toFixed(1)}%)
          </p>
        </div>
        
        <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 text-sm sm:text-base mb-2">Goal Progress</h4>
          <Progress value={totalGoalProgress} className="h-2 bg-blue-100">
            <div className="h-full bg-gradient-to-r from-[#2E235C] to-[#2E235C] rounded-full" />
          </Progress>
          <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm mt-2">
            <span className="text-blue-700">₦{totalContributions.toFixed(2)} raised</span>
            <span className="font-semibold text-[#2E235C] mt-1 sm:mt-0">
              ₦{(goalAmount - totalContributions).toLocaleString()} to go
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-6">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-10 sm:h-11 text-xs sm:text-sm"
          onClick={() => setIsGoalModalOpen(false)}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="flex-1 h-10 sm:h-11 bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90 text-xs sm:text-sm"
          onClick={() => setIsGoalModalOpen(false)}
        >
          Save Goal
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>

      {/* Custom Table Modal */}
      <Dialog open={isCustomTableModalOpen} onOpenChange={(open) => {
         setIsCustomTableModalOpen(open);
         if (!open) {
           setCustomTableName('');
           setCurrentEditingGuestId(null);
           setCurrentEditingBulkGuestIndex(null);
         }
       }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Create Custom Table</DialogTitle>
            <p className="text-sm text-gray-600 mt-1">Enter a name for the custom table seating</p>
          </DialogHeader>
          <form onSubmit={async (e) => {
             e.preventDefault();
             if (!customTableName.trim()) return;

             if (currentEditingGuestId) {
               const guest = guests.find(g => g.id === currentEditingGuestId);
               if (!guest) return;

               const token = localStorage.getItem('token');
               try {
                 const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/guests/${currentEditingGuestId}`, {
                   method: 'PUT',
                   headers: {
                     'Content-Type': 'application/json',
                     Authorization: `Bearer ${token}`,
                   },
                   body: JSON.stringify({
                     firstName: guest.firstName,
                     lastName: guest.lastName,
                     tableSitting: customTableName.trim(),
                   }),
                 });
                 if (res.ok) {
                   const updatedGuest = await res.json();
                   const updatedGuests = guests.map(g =>
                     g.id === currentEditingGuestId ? updatedGuest : g
                   );
                   setGuests(updatedGuests);
                 } else {
                   alert('Failed to update table sitting');
                   return;
                 }
               } catch (err) {
                 console.error(err);
                 alert('Error updating table sitting');
                 return;
               }
             } else if (currentEditingBulkGuestIndex !== null) {
               const newGuests = [...bulkGuests];
               newGuests[currentEditingBulkGuestIndex].tableSitting = customTableName.trim();
               setBulkGuests(newGuests);
               setCurrentEditingBulkGuestIndex(null);
             } else {
               setBulkTableSitting(customTableName.trim());
             }

             setIsCustomTableModalOpen(false);
             setCustomTableName('');
             setCurrentEditingGuestId(null);
           }}>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="customTableName" className="text-sm font-medium text-gray-900 mb-2 block">
                  Custom Table Name
                </Label>
                <Input
                  id="customTableName"
                  value={customTableName}
                  onChange={(e) => setCustomTableName(e.target.value)}
                  className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                  placeholder="Enter custom table name"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11"
                onClick={() => setIsCustomTableModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90"
              >
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Analytics Modal */}
      <Dialog open={isAnalyticsModalOpen} onOpenChange={setIsAnalyticsModalOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-[400px] p-0 border-0 shadow-2xl rounded-2xl bg-white overflow-auto">
          <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-white z-10">
            <DialogTitle className="text-xl font-semibold text-gray-900">Analytics</DialogTitle>
            <p className="text-sm text-gray-600 mt-1">Quick overview of your RSVP data</p>
          </DialogHeader>
          <div className="px-6 py-6 space-y-4">
            <Button variant="outline" className="w-full justify-start h-12">
              <Users className="w-5 h-5 mr-3 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">Total Guests</div>
                <div className="text-sm text-gray-600">{eventFilteredGuests.length}</div>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start h-12">
              <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
              <div className="text-left">
                <div className="font-medium">Total Attending</div>
                <div className="text-sm text-gray-600">{totalAttending}</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={() => {
                window.open('mailto:teambethere@gmail.com.com');
                setIsAnalyticsModalOpen(false);
              }}
            >
              <HelpCircle className="w-5 h-5 mr-3 text-purple-600" />
              <div className="text-left">
                <div className="font-medium">Help</div>
                <div className="text-sm text-gray-600">Contact support</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
};

export default Dashboard;