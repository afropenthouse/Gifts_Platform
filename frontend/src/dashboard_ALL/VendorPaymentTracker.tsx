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
import { Plus, Edit, Trash2, Filter } from 'lucide-react';

interface Vendor {
  id: number;
  eventId: number;
  event: {
    id: number;
    title: string;
    type: string;
  };
  category: string;
  amountAgreed: number;
  amountPaid: number;
  dueDate: string;
  status: string;
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
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [filterEvent, setFilterEvent] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [eventId, setEventId] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [amountAgreed, setAmountAgreed] = useState('');
  const [amountPaid, setAmountPaid] = useState('0');
  const [dueDate, setDueDate] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
    fetchVendors();
  }, []);

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

  const fetchVendors = async (eventId?: number) => {
    try {
      const token = localStorage.getItem('token');
      const url = eventId
        ? `${import.meta.env.VITE_BACKEND_URL}/api/vendors?eventId=${eventId}`
        : `${import.meta.env.VITE_BACKEND_URL}/api/vendors`;
      const res = await fetch(url, {
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

  const resetForm = () => {
    setEventId('');
    setCategory('');
    setCustomCategory('');
    setAmountAgreed('');
    setAmountPaid('0');
    setDueDate('');
  };

  const filteredVendors = filterEvent
    ? vendors.filter(v => v.eventId === filterEvent)
    : vendors;

  const totalBudget = filteredVendors.reduce((sum, v) => sum + Number(v.amountAgreed), 0);
  const totalPaid = filteredVendors.reduce((sum, v) => sum + Number(v.amountPaid), 0);
  const totalOutstanding = totalBudget - totalPaid;

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
          <h2 className="text-2xl font-bold text-gray-900">Vendor Payment Tracker</h2>
          <p className="text-gray-600 mt-1">Track payments for your wedding vendors</p>
        </div>
        <div className="flex gap-3">
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
                <Plus className="w-4 h-4 mr-2" />
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
                  Are you sure you want to delete the vendor "{deletingVendor?.category}" for the event "{deletingVendor?.event.title}"? This action cannot be undone.
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
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount Agreed</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.length > 0 ? (
                filteredVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>{vendor.event.title}</TableCell>
                    <TableCell>{vendor.category}</TableCell>
                    <TableCell>{vendor.amountAgreed.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>{vendor.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>{vendor.balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>{new Date(vendor.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {vendor.status}
                      </Badge>
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
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">₦{totalBudget.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">₦{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Outstanding Balance</p>
              <p className="text-2xl font-bold text-red-600">₦{totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorPaymentTracker;