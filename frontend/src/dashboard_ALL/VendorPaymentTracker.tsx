import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { Plus, Edit, Trash2, Filter, Download } from 'lucide-react';

interface Vendor {
  id: number;
  eventId: number;
  Gift: {
    id: number;
    title: string;
    type: string;
  };
  category: string;
  vendorEmail?: string;
  amountAgreed: number;
  amountPaid: number;
  scheduledAmount?: number;
  dueDate: string;
  releaseDate?: string;
  status: 'Not Scheduled' | 'Scheduled' | 'Released' | 'Cancelled';
  balance: number;
  createdAt: string;
  updatedAt: string;
}

interface Event {
  id: number;
  title: string;
  type: string;
}

const VendorPaymentTracker: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedulingVendor, setSchedulingVendor] = useState<Vendor | null>(null);
  const [isVendorDetailsModalOpen, setIsVendorDetailsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [filterEvent, setFilterEvent] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [eventId, setEventId] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [amountAgreed, setAmountAgreed] = useState('');
  const [amountPaid, setAmountPaid] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [amountToSchedule, setAmountToSchedule] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [banks, setBanks] = useState<any[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
    fetchVendors();
    fetchUser();
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vendors/banks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBanks(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
    }
  };

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gifts/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vendors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVendors(data);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const finalCategory = category === 'Other' ? customCategory : category;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: parseInt(eventId),
          category: finalCategory,
          vendorEmail,
          amountAgreed: parseFloat(amountAgreed),
          amountPaid: parseFloat(amountPaid),
          dueDate,
        }),
      });

      if (res.ok) {
        const newVendor = await res.json();
        setVendors([...vendors, newVendor]);
        setIsAddModalOpen(false);
        resetForm();
        toast({
          title: 'Vendor added',
          description: 'Vendor has been successfully added.',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to add vendor.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding vendor:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while adding the vendor.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateVendor = async (id: number, updates: Partial<Vendor>) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vendors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const updatedVendor = await res.json();
        setVendors(vendors.map(v => v.id === id ? updatedVendor : v));
        toast({
          title: 'Vendor updated',
          description: 'Vendor has been successfully updated.',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update vendor.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating vendor:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while updating the vendor.',
        variant: 'destructive',
      });
    }
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setEventId(vendor.eventId.toString());
    setCategory(vendor.category === 'MC' || vendor.category === 'Caterer' || vendor.category === 'Decor' || vendor.category === 'Photography' ? vendor.category : 'Other');
    setCustomCategory(vendor.category === 'MC' || vendor.category === 'Caterer' || vendor.category === 'Decor' || vendor.category === 'Photography' ? '' : vendor.category);
    setVendorEmail(vendor.vendorEmail || '');
    setAmountAgreed(vendor.amountAgreed.toString());
    setAmountPaid(vendor.amountPaid.toString());
    setDueDate(vendor.dueDate.split('T')[0]);
    setIsEditModalOpen(true);
  };

  const handleUpdateVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor || isSubmitting) return;

    const finalCategory = category === 'Other' ? customCategory : category;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vendors/${editingVendor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: finalCategory,
          vendorEmail,
          amountAgreed: parseFloat(amountAgreed),
          amountPaid: parseFloat(amountPaid),
          dueDate,
        }),
      });

      if (res.ok) {
        const updatedVendor = await res.json();
        setVendors(vendors.map(v => v.id === editingVendor.id ? updatedVendor : v));
        setIsEditModalOpen(false);
        setEditingVendor(null);
        resetForm();
        toast({
          title: 'Vendor updated',
          description: 'Vendor has been successfully updated.',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update vendor.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating vendor:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while updating the vendor.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVendor = (vendor: Vendor) => {
    setDeletingVendor(vendor);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteVendor = async () => {
    if (!deletingVendor) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vendors/${deletingVendor.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        // Refetch vendors to ensure totals are correct
        await fetchVendors();
        setIsDeleteModalOpen(false);
        setDeletingVendor(null);
        toast({
          title: 'Vendor deleted',
          description: 'Vendor has been successfully deleted.',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete vendor.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while deleting the vendor.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSchedulePayment = (vendor: Vendor) => {
    setSchedulingVendor(vendor);
    setVendorEmail(vendor.vendorEmail || '');
    setAmountToSchedule('');
    setAccountName(user?.name || '');
    setIsScheduleModalOpen(true);
  };

  const handleSchedulePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingVendor || isSubmitting) return;

    if (!vendorEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Vendor email is required.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vendors/${schedulingVendor.id}/schedule-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amountToSchedule),
          vendorEmail,
          accountName,
          accountNumber,
          bankCode,
          bankName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          setVendors(vendors.map(v => v.id === schedulingVendor.id ? data : v));
          setIsScheduleModalOpen(false);
          setSchedulingVendor(null);
          resetForm();
          toast({
            title: 'Payment scheduled',
            description: 'Payment has been scheduled successfully.',
          });
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to schedule payment.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error scheduling payment:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while scheduling the payment.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelScheduled = async (vendor: Vendor) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vendors/${vendor.id}/cancel-scheduled`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const updatedVendor = await res.json();
        setVendors(vendors.map(v => v.id === vendor.id ? updatedVendor : v));
        toast({
          title: 'Scheduled payment cancelled',
          description: 'The scheduled payment has been cancelled.',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to cancel scheduled payment.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error cancelling scheduled payment:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while cancelling the scheduled payment.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveAccount = async () => {
    if (!accountNumber || !bankCode) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vendors/resolve-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountNumber,
          bankCode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status && data.data) {
          setAccountName(data.data.account_name);
        }
      }
    } catch (error) {
      console.error('Error resolving account:', error);
    }
  };

  const resetForm = () => {
    setEventId('');
    setCategory('');
    setCustomCategory('');
    setVendorEmail('');
    setAmountAgreed('');
    setAmountPaid('0');
    setDueDate('');
    setAmountToSchedule('');
    setAccountName('');
    setAccountNumber('');
    setBankCode('');
    setBankName('');
  };

  const filteredVendors = filterEvent
    ? vendors.filter(v => v.eventId === filterEvent)
    : vendors;

  const totalBudget = filteredVendors.reduce((sum, v) => sum + Number(v.amountAgreed), 0);
  const totalPaid = filteredVendors.reduce((sum, v) => sum + Number(v.amountPaid), 0);
  const totalScheduled = filteredVendors.reduce((sum, v) => sum + Number(v.scheduledAmount || 0), 0);
  const totalOutstanding = totalBudget - totalPaid - totalScheduled;

  const handleDownload = () => {
    const headers = ['Category', 'Event', 'Total Cost', 'Paid', 'Scheduled', 'Balance', 'Due Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredVendors.map(vendor => {
        const balance = vendor.amountAgreed - vendor.amountPaid - (vendor.scheduledAmount || 0);
        return [
          `"${vendor.category}"`,
          `"${vendor.Gift.title}"`,
          vendor.amountAgreed,
          vendor.amountPaid,
          vendor.scheduledAmount || 0,
          balance,
          vendor.dueDate.split('T')[0],
          vendor.status
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'wedding_expenses.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#2E235C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expenses</h2>
          <p className="text-gray-600 mt-1">Track payments for your wedding vendors</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
          <Select value={filterEvent ? filterEvent.toString() : 'all'} onValueChange={(value) => {
            setFilterEvent(value === 'all' ? null : parseInt(value));
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map(event => (
                <SelectItem key={event.id} value={event.id.toString()}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#2E235C] to-[#2E235C]">
                {/* <Plus className="w-4 h-4 mr-2" /> */}
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Vendor</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddVendor} className="space-y-4">
                <div>
                  <Label htmlFor="event">Event</Label>
                  <Select value={eventId} onValueChange={setEventId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map(event => (
                        <SelectItem key={event.id} value={event.id.toString()}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Vendor Category</Label>
                  <Select value={category} onValueChange={(value) => {
                    setCategory(value);
                    if (value !== 'Other') {
                      setCustomCategory('');
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MC">MC</SelectItem>
                      <SelectItem value="Caterer">Caterer</SelectItem>
                      <SelectItem value="Decor">Decor</SelectItem>
                      <SelectItem value="Photography">Photography</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {category === 'Other' && (
                  <div>
                    <Label htmlFor="customCategory">Custom Category</Label>
                    <Input
                      id="customCategory"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter custom category"
                      required
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="vendorEmail">Vendor Email Address <span className="text-gray-400 text-xs">(optional)</span></Label>
                  <Input
                    id="vendorEmail"
                    type="email"
                    value={vendorEmail}
                    onChange={(e) => setVendorEmail(e.target.value)}
                    placeholder="vendor@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="amountAgreed">Amount Agreed (₦)</Label>
                  <Input
                    id="amountAgreed"
                    type="number"
                    value={amountAgreed}
                    onChange={(e) => setAmountAgreed(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amountPaid">Amount Paid (₦)</Label>
                  <Input
                    id="amountPaid"
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Vendor'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button className="bg-gradient-to-r from-[#2E235C] to-[#2E235C]" onClick={() => setIsScheduleModalOpen(true)}>
            Schedule Payment
          </Button>
          <Button variant="outline" onClick={handleDownload} className="border-[#2E235C] text-[#2E235C] hover:bg-[#2E235C] hover:text-white">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>

          <Dialog open={isEditModalOpen} onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) {
              setEditingVendor(null);
              resetForm();
            }
          }}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Vendor</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateVendorSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="editCategory">Vendor Category</Label>
                  <Select value={category} onValueChange={(value) => {
                    setCategory(value);
                    if (value !== 'Other') {
                      setCustomCategory('');
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MC">MC</SelectItem>
                      <SelectItem value="Caterer">Caterer</SelectItem>
                      <SelectItem value="Decor">Decor</SelectItem>
                      <SelectItem value="Photography">Photography</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {category === 'Other' && (
                  <div>
                    <Label htmlFor="editCustomCategory">Custom Category</Label>
                    <Input
                      id="editCustomCategory"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter custom category"
                      required
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="editVendorEmail">Vendor Email Address</Label>
                  <Input
                    id="editVendorEmail"
                    type="email"
                    value={vendorEmail}
                    onChange={(e) => setVendorEmail(e.target.value)}
                    placeholder="vendor@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="editAmountAgreed">Amount Agreed (₦)</Label>
                  <Input
                    id="editAmountAgreed"
                    type="number"
                    value={amountAgreed}
                    onChange={(e) => setAmountAgreed(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editAmountPaid">Amount Paid (₦)</Label>
                  <Input
                    id="editAmountPaid"
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="editDueDate">Due Date</Label>
                  <Input
                    id="editDueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? 'Updating...' : 'Update Vendor'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isDeleteModalOpen} onOpenChange={(open) => {
            setIsDeleteModalOpen(open);
            if (!open) {
              setDeletingVendor(null);
            }
          }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Delete Vendor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Are you sure you want to delete the vendor "{deletingVendor?.category}"? This action cannot be undone.
                </p>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" variant="destructive" className="flex-1" onClick={confirmDeleteVendor} disabled={isSubmitting}>
                    {isSubmitting ? 'Deleting...' : 'Delete Vendor'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isScheduleModalOpen} onOpenChange={(open) => {
            setIsScheduleModalOpen(open);
            if (!open) {
              setSchedulingVendor(null);
              resetForm();
            }
          }}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Schedule Vendor Payment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSchedulePaymentSubmit} className="space-y-4">
                {!schedulingVendor && (
                  <div>
                    <Label htmlFor="scheduleVendor">Select Vendor</Label>
                    <Select value={schedulingVendor?.id.toString() || ''} onValueChange={(value) => {
                      const vendor = vendors.find(v => v.id === parseInt(value));
                      setSchedulingVendor(vendor || null);
                      if (vendor) {
                        setVendorEmail(vendor.vendorEmail || '');
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.filter(v => (v.amountAgreed - v.amountPaid - (v.scheduledAmount || 0)) > 0).map(vendor => (
                          <SelectItem key={vendor.id} value={vendor.id.toString()}>
                            {vendor.category} - {vendor.Gift.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {schedulingVendor && (
                  <div>
                    <Label htmlFor="scheduleCategory">Vendor Category</Label>
                    <Input
                      id="scheduleCategory"
                      value={schedulingVendor.category}
                      readOnly
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="scheduleVendorEmail">Vendor Email Address</Label>
                  <Input
                    id="scheduleVendorEmail"
                    type="email"
                    value={vendorEmail}
                    onChange={(e) => setVendorEmail(e.target.value)}
                    placeholder="vendor@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="scheduleAmount">Amount to Schedule (₦)</Label>
                  <Input
                    id="scheduleAmount"
                    type="number"
                    value={amountToSchedule}
                    onChange={(e) => setAmountToSchedule(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bankCode">Bank</Label>
                  <Select value={bankCode} onValueChange={(value) => {
                    setBankCode(value);
                    const selectedBank = banks.find(b => b.code === value);
                    setBankName(selectedBank ? selectedBank.name : '');
                    setAccountName(''); // Reset when bank changes
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank: any) => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="accountNumber">Your Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    onBlur={handleResolveAccount}
                    placeholder="Your account number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="accountName">Your Account Name</Label>
                  <Input
                    id="accountName"
                    value={accountName}
                    readOnly
                    placeholder="Auto-filled after entering account number"
                  />
                </div>
                <div>
                  <Label htmlFor="scheduleDueDate">Due Date</Label>
                  <Input
                    id="scheduleDueDate"
                    type="date"
                    value={schedulingVendor ? new Date(schedulingVendor.dueDate).toISOString().split('T')[0] : ''}
                    readOnly
                  />
                </div>
                <div>
                  <Label>Release Rule</Label>
                  <p className="text-sm text-gray-600">Payment will be automatically released 24 hours after the due date.</p>
                </div>
                <div>
                  <Label>Summary</Label>
                  <p className="text-sm text-gray-600">
                    ₦{amountToSchedule || '0'} will be held by BeThere and released to this vendor on {schedulingVendor ? new Date(new Date(schedulingVendor.dueDate).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString() : ''}.
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsScheduleModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? 'Scheduling...' : 'Pay & Schedule'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isVendorDetailsModalOpen} onOpenChange={(open) => {
            setIsVendorDetailsModalOpen(open);
            if (!open) {
              setSelectedVendor(null);
            }
          }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Vendor Details</DialogTitle>
              </DialogHeader>
              {selectedVendor && (
                <div className="space-y-4">
                  <div>
                    <Label>Status</Label>
                    <p className="text-sm text-gray-900">
                      {(selectedVendor.amountAgreed - selectedVendor.amountPaid - (selectedVendor.scheduledAmount || 0)) <= 0 ? 'Paid' : 'Outstanding'}
                    </p>
                  </div>
                  <div>
                    <Label>Scheduled Amount</Label>
                    <p className="text-sm">₦{(selectedVendor.scheduledAmount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Outstanding Balance</Label>
                    <p className="text-sm">₦{(selectedVendor.amountAgreed - selectedVendor.amountPaid - (selectedVendor.scheduledAmount || 0)).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Release Date & Time</Label>
                    <p className="text-sm">
                      {selectedVendor.releaseDate 
                        ? `${new Date(selectedVendor.releaseDate).toLocaleDateString()} at ${new Date(selectedVendor.releaseDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` 
                        : '-'}
                    </p>
                  </div>
                  <div className="flex gap-3 pt-4">
                    {(selectedVendor.amountAgreed - selectedVendor.amountPaid - (selectedVendor.scheduledAmount || 0)) > 0 && (
                      <Button onClick={() => {
                        setSchedulingVendor(selectedVendor);
                        setIsVendorDetailsModalOpen(false);
                        setIsScheduleModalOpen(true);
                      }}>
                        Schedule Payment
                      </Button>
                    )}
                    {selectedVendor.status === 'Scheduled' && new Date(selectedVendor.dueDate) > new Date() && (
                      <Button variant="destructive" onClick={() => {
                        handleCancelScheduled(selectedVendor);
                        setIsVendorDetailsModalOpen(false);
                      }}>
                        Cancel Scheduled
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setIsVendorDetailsModalOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-[#2E235C] to-[#2E235C] border-0">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-white/80">Total Cost</p>
              <p className="text-2xl font-bold text-white">₦{totalBudget.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-[#2E235C] to-[#2E235C] border-0">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-white/80">Total Paid</p>
              <p className="text-2xl font-bold text-white">₦{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-[#2E235C] to-[#2E235C] border-0">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-white/80">Total<br className="md:hidden" /> Scheduled</p>
              <p className="text-2xl font-bold text-white">₦{totalScheduled.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-[#2E235C] to-[#2E235C] border-0">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-white/80">Outstanding<br className="md:hidden" /> Balance</p>
              <p className="text-2xl font-bold text-white">₦{totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">
                  <span className="hidden md:inline">Cost (₦)</span>
                  <span className="inline md:hidden flex items-center">
                    Cost <span className="ml-1 text-gray-500">(₦)</span>
                  </span>
                </TableHead>
                <TableHead className="font-semibold">
                  <span className="hidden md:inline">Paid (₦)</span>
                  <span className="inline md:hidden flex items-center">
                    Paid <span className="ml-1 text-gray-500">(₦)</span>
                  </span>
                </TableHead>
                <TableHead className="font-semibold">
                  <span className="hidden md:inline">Balance (₦)</span>
                  <span className="inline md:hidden flex items-center">
                    Balance <span className="ml-1 text-gray-500">(₦)</span>
                  </span>
                </TableHead>
                <TableHead className="font-semibold">
                  <span className="hidden md:inline">Scheduled (₦)</span>
                  <span className="inline md:hidden flex items-center">
                    Scheduled <span className="ml-1 text-gray-500">(₦)</span>
                  </span>
                </TableHead>
                <TableHead className="font-semibold">Due Date</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.length > 0 ? (
                filteredVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell><span className="font-semibold">{vendor.category}</span></TableCell>
                    <TableCell>{Number(vendor.amountAgreed).toLocaleString()}</TableCell>
                    <TableCell>{Number(vendor.amountPaid).toLocaleString()}</TableCell>
                    <TableCell>{Number(vendor.amountAgreed - vendor.amountPaid - (vendor.scheduledAmount || 0)).toLocaleString()}</TableCell>
                    <TableCell>{Number(vendor.scheduledAmount || 0).toLocaleString()}</TableCell>
                    <TableCell>{new Date(vendor.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="p-0 h-auto text-left font-normal text-black hover:underline focus:outline-none"
                        style={{ fontWeight: 'normal', fontSize: 'inherit' }}
                        onClick={() => {
                          setSelectedVendor(vendor);
                          setIsVendorDetailsModalOpen(true);
                        }}
                      >
                        View
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditVendor(vendor)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVendor(vendor)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <p className="text-gray-500">No vendors found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Add your first vendor to start tracking payments
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorPaymentTracker;
