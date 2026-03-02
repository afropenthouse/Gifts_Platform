import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Users, Gift, Banknote, LogOut, ShoppingBag, LayoutDashboard, Trash2, Wallet, CalendarDays, Menu, BarChart3, MoreHorizontal, UserCheck, UserMinus, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Metrics {
  totalUsers: number;
  totalGifts: number;
  totalContributions: number;
  totalAsoebiContributions: number;
  totalWalletBalance: number;
  guestListOpenEvents: number;
  guestListRestrictedEvents: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  isActive: boolean;
  wallet: string;
  _count: {
    gifts: number;
    contributions: number;
  };
}

interface Contribution {
  id: number;
  contributorName: string | null;
  amount: number;
  createdAt: string;
  isAsoebi: boolean;
  gift: {
    id?: number;
    title: string | null;
    type?: string;
  } | null;
}

interface EventOwner {
  id: number;
  name: string | null;
  email: string;
}

interface EventItem {
  id: number;
  title: string | null;
  type: string;
  createdAt: string;
  deadline: string | null;
  shareLink: string | null;
  enableCashGifts: boolean | null;
  isSellingAsoebi: boolean | null;
  user: EventOwner;
  _count: {
    contributions: number;
    guests: number;
  };
}

interface GuestRow {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  createdAt: string;
  gift?: { id: number; title: string | null } | null;
}

type AdminTab = 'overview' | 'transactions' | 'events' | 'guests';
type TimeFilter = 'all' | '7days' | '14days' | '30days' | '3months' | 'year';

const adminTabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: Gift },
  { id: 'guests', label: 'Guests', icon: Users },
  { id: 'events', label: 'Events', icon: CalendarDays },
];

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [allContributions, setAllContributions] = useState<Contribution[]>([]);
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingContributions, setLoadingContributions] = useState(false);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [selectedEventId, setSelectedEventId] = useState<number | 'all'>('all');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilter>('all');
  const [selectedTxnType, setSelectedTxnType] = useState<'all' | 'cash' | 'asoebi'>('all');
  const [guestEmailFilter, setGuestEmailFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [deleteUserName, setDeleteUserName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletingUser, setDeletingUser] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      const [metricsRes, usersRes] = await Promise.all([
        fetch(`${baseUrl}/api/admin/metrics?time=${selectedTimeFilter}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (metricsRes.status === 401 || usersRes.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }

      const metricsData = await metricsRes.json();
      const usersData = await usersRes.json();

      setMetrics(metricsData.metrics);
      setUsers(usersData);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [navigate, selectedTimeFilter]);

  const fetchContributions = useCallback(async () => {
    if (loadingContributions || allContributions.length > 0) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      setLoadingContributions(true);
      const response = await fetch(`${baseUrl}/api/admin/contributions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }

      if (!response.ok) {
        toast.error('Failed to fetch contributions');
        return;
      }

      const data = await response.json();
      setAllContributions(data);
    } catch (error) {
      toast.error('Failed to fetch contributions');
    } finally {
      setLoadingContributions(false);
    }
  }, [allContributions.length, loadingContributions, navigate]);

  const fetchGuests = useCallback(async () => {
    if (loadingGuests) {
      return;
    }
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      setLoadingGuests(true);
      setGuests([]);
      const params = new URLSearchParams();
      if (guestEmailFilter !== 'all') params.set('hasEmail', guestEmailFilter);
      if (selectedEventId !== 'all') params.set('eventId', String(selectedEventId));
      const response = await fetch(`${baseUrl}/api/admin/guests?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }
      if (!response.ok) {
        toast.error('Failed to fetch guests');
        return;
      }
      const data = await response.json();
      setGuests(data);
    } catch (error) {
      toast.error('Failed to fetch guests');
    } finally {
      setLoadingGuests(false);
    }
  }, [guestEmailFilter, loadingGuests, navigate, selectedEventId]);

  const fetchEvents = useCallback(async () => {
    if (loadingEvents || events.length > 0) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      setLoadingEvents(true);
      const response = await fetch(`${baseUrl}/api/admin/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }

      if (!response.ok) {
        toast.error('Failed to fetch events');
        return;
      }

      const data = await response.json();
      setEvents(data);
    } catch (error) {
      toast.error('Failed to fetch events');
    } finally {
      setLoadingEvents(false);
    }
  }, [events.length, loadingEvents, navigate]);

  useEffect(() => {
    fetchDashboardData();
    fetchEvents();
  }, [fetchDashboardData, fetchEvents, selectedTimeFilter]);

  useEffect(() => {
    if (activeTab === 'transactions' || activeTab === 'events') {
      fetchContributions();
    }
    if (activeTab === 'events') {
      fetchEvents();
    }
  }, [activeTab, fetchContributions, fetchEvents]);

  useEffect(() => {
    if (activeTab === 'guests') {
      fetchGuests();
    }
  }, [activeTab, guestEmailFilter, selectedEventId]);

  const handleToggleUser = async (userId: number) => {
    const token = localStorage.getItem('adminToken');
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/admin/users/${userId}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u)));
        toast.success('User status updated');
      } else {
        toast.error('Failed to update user status');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const openDeleteDialog = (user: User) => {
    setDeleteUserId(user.id);
    setDeleteUserName(user.name);
    setDeleteConfirm('');
  };

  const closeDeleteDialog = () => {
    setDeleteUserId(null);
    setDeleteUserName('');
    setDeleteConfirm('');
    setDeletingUser(false);
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId || deleteConfirm.toLowerCase() !== 'delete') {
      return;
    }

    const token = localStorage.getItem('adminToken');
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      setDeletingUser(true);
      const response = await fetch(`${baseUrl}/api/admin/users/${deleteUserId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== deleteUserId));
        toast.success('User deleted');
        closeDeleteDialog();
      } else {
        const data = await response.json().catch(() => null);
        toast.error(data?.msg || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setDeletingUser(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const filterByEvent = useCallback(
    (items: Contribution[]) => {
      if (selectedEventId === 'all') {
        return items;
      }
      return items.filter((item) => item.gift && item.gift.id === selectedEventId);
    },
    [selectedEventId]
  );

  const filterByTime = useCallback(
    (items: Contribution[]) => {
      if (selectedTimeFilter === 'all') {
        return items;
      }

      const now = new Date();
      let filterDate = new Date();

      switch (selectedTimeFilter) {
        case '7days':
          filterDate.setDate(now.getDate() - 7);
          break;
        case '14days':
          filterDate.setDate(now.getDate() - 14);
          break;
        case '30days':
          filterDate.setDate(now.getDate() - 30);
          break;
        case '3months':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          return items;
      }

      return items.filter((item) => new Date(item.createdAt) >= filterDate);
    },
    [selectedTimeFilter]
  );

  const filteredContributions = (tab: AdminTab) => {
    let rows = allContributions;
    if (tab === 'transactions') {
      if (selectedTxnType === 'asoebi') {
        rows = rows.filter((c) => c.isAsoebi);
      } else if (selectedTxnType === 'cash') {
        rows = rows.filter((c) => !c.isAsoebi);
      }
    }
    
    rows = filterByEvent(rows);
    return filterByTime(rows);
  };

  const renderOverview = () => {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{((metrics?.totalContributions || 0) + (metrics?.totalAsoebiContributions || 0)).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Wallet Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{(metrics?.totalWalletBalance || 0).toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cash Gifts</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{(metrics?.totalContributions || 0).toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Asoebi Sales</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{(metrics?.totalAsoebiContributions || 0).toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Gifts</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalGifts || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open Guest Events</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.guestListOpenEvents || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Closed Guest Events</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.guestListRestrictedEvents || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Gifts</TableHead>
                  <TableHead>Contributions</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">₦{Number(user.wallet).toLocaleString()}</TableCell>
                    <TableCell className="text-center">{user._count.gifts}</TableCell>
                    <TableCell className="text-center">{user._count.contributions}</TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleToggleUser(user.id)}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                          user.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                        title={user.isActive ? "Click to suspend" : "Click to activate"}
                      >
                        {user.isActive ? "Active" : "Suspended"}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => openDeleteDialog(user)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </>
    );
  };

  const renderWallets = () => {
    const totalBalance = users.reduce((acc, user) => acc + Number(user.wallet), 0);

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Wallet Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{totalBalance.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Wallet Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Wallet Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      ₦{Number(user.wallet).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </>
    );
  };

  const renderMetrics = () => {
    const totalEvents = metrics?.totalGifts || 0;
    const openEvents = metrics?.guestListOpenEvents || 0;
    const restrictedEvents = metrics?.guestListRestrictedEvents || 0;
    const openPercentage = totalEvents ? Math.round((openEvents / totalEvents) * 100) : 0;
    const restrictedPercentage = totalEvents ? Math.round((restrictedEvents / totalEvents) * 100) : 0;

    return (
      <>
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-semibold">Platform metrics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            High-level view of users, gifts and cash activity across the platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold tracking-tight">
                {metrics?.totalUsers || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total Events
              </CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold tracking-tight">
                {metrics?.totalGifts || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Cash Gifts (₦)
              </CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold tracking-tight">
                ₦{(metrics?.totalContributions || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Asoebi Sales (₦)
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold tracking-tight">
                ₦{(metrics?.totalAsoebiContributions || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-3">
          <h3 className="text-base md:text-lg font-semibold">Guest list modes</h3>
          <p className="text-sm text-muted-foreground mt-1">
            See how many events are open to anyone versus strictly by guest list.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Open Guest Events
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold tracking-tight">
                {openEvents}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {openPercentage}% of all events
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Closed Guest Events
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold tracking-tight">
                {restrictedEvents}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {restrictedPercentage}% of all events
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  };

  const renderContributions = (tab: AdminTab) => {
    const rows = filteredContributions(tab);

    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {tab === 'transactions'
              ? 'All Transactions'
              : 'Transactions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingContributions ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading contributions...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contributor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Gift</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((contribution) => (
                  <TableRow key={contribution.id}>
                    <TableCell className="font-medium">
                      {contribution.contributorName || 'Anonymous'}
                    </TableCell>
                    <TableCell>₦{contribution.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-sm">
                      {contribution.gift?.title || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[10px] w-fit px-2 py-1 rounded-full ${
                          contribution.isAsoebi
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-purple-50 text-purple-700'
                        }`}
                      >
                        {contribution.isAsoebi ? 'Asoebi' : 'Cash Gift'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(contribution.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderEvents = () => {
    const rows = selectedEventId === 'all'
      ? events
      : events.filter((event) => event.id === selectedEventId);

    // Calculate stats if an event is selected
    const selectedEvent = selectedEventId !== 'all' ? events.find(e => e.id === selectedEventId) : null;
    const eventContributions = selectedEventId !== 'all' 
      ? allContributions.filter(c => c.gift?.id === selectedEventId)
      : [];
    
    const totalAmount = eventContributions.reduce((sum, c) => sum + Number(c.amount), 0);
    const asoebiAmount = eventContributions.filter(c => c.isAsoebi).reduce((sum, c) => sum + Number(c.amount), 0);
    const cashAmount = totalAmount - asoebiAmount;

    return (
    <div className="space-y-6">
      {selectedEvent && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Received</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">₦{totalAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Cash Gifts</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">₦{cashAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Asoebi Sales</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">₦{asoebiAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{selectedEvent._count.guests}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingEvents ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading events...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Contributions</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {event.title || 'Untitled'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {event.type === 'wedding'
                        ? 'Wedding'
                        : event.type === 'birthday'
                        ? 'Birthday'
                        : event.type === 'graduation'
                        ? 'Graduation'
                        : event.type === 'convocation'
                        ? 'Convocation'
                        : 'Other'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {event.user?.name || event.user?.email}
                    </TableCell>
                    <TableCell className="text-center">
                      {event._count.guests}
                    </TableCell>
                    <TableCell className="text-center">
                      {event._count.contributions}
                    </TableCell>
                    <TableCell className="text-sm">
                      {event.deadline
                        ? new Date(event.deadline).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(event.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                      No events found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
  };

  const renderGuests = () => {
    const rows = guests.filter((g) => {
      if (selectedEventId !== 'all') {
        return g.gift?.id === selectedEventId;
      }
      return true;
    }).filter((g) => {
      if (guestEmailFilter === 'yes') return Boolean(g.email);
      if (guestEmailFilter === 'no') return !g.email;
      return true;
    });

    const total = guests.length;
    const withEmail = guests.filter(g => Boolean(g.email)).length;
    const withoutEmail = total - withEmail;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Guests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-semibold">{total}</span> • With email: <span className="font-semibold">{withEmail}</span> • Without email: <span className="font-semibold">{withoutEmail}</span>
            </div>
          </div>
          {loadingGuests ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading guests...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Date Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium">
                      {guest.firstName} {guest.lastName}
                    </TableCell>
                    <TableCell className="text-sm">{guest.email || '-'}</TableCell>
                    <TableCell className="text-sm">{guest.gift?.title || '-'}</TableCell>
                    <TableCell className="text-sm">{new Date(guest.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      No guests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="hidden md:flex w-64 flex-col border-r bg-white px-4 py-6">
        <div className="flex flex-col gap-4 mb-8">
          <img
            src="/logo2.png"
            alt="BeThere Weddings logo"
            className="h-8 w-auto self-start"
          />
          <div>
            <div className="text-sm font-semibold text-gray-900">BeThere Admin</div>
            <div className="text-xs text-muted-foreground">Control center</div>
          </div>
        </div>
        <nav className="space-y-1">
          <button
            type="button"
            className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
              activeTab === 'overview'
                ? 'bg-gray-900 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </button>
          <button
            type="button"
            className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
              activeTab === 'transactions'
                ? 'bg-gray-900 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('transactions')}
          >
            <Gift className="w-4 h-4" />
            Transactions
          </button>
          <button
            type="button"
            className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
              activeTab === 'guests'
                ? 'bg-gray-900 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('guests')}
          >
            <Users className="w-4 h-4" />
            Guests
          </button>
          <button
            type="button"
            className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
              activeTab === 'events'
                ? 'bg-gray-900 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('events')}
          >
            <CalendarDays className="w-4 h-4" />
            Events
          </button>
        </nav>
        <div className="mt-auto pt-6 border-t">
          <Button
            variant="outline"
            className="w-full justify-center gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="flex items-center justify-between mb-4 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {activeTab === 'overview' ? 'Admin Dashboard' : adminTabs.find(t => t.id === activeTab)?.label}
            </h1>
            {activeTab === 'overview' && (
              <p className="text-sm text-muted-foreground mt-1">
                Monitor users, cash gifts, Asoebi sales and platform activity.
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {activeTab === 'overview' && (
              <div className="hidden md:flex items-center gap-2">
                <Label htmlFor="overview-time-filter" className="whitespace-nowrap">
                  Filter:
                </Label>
                <Select
                  value={selectedTimeFilter}
                  onValueChange={(value) => setSelectedTimeFilter(value as TimeFilter)}
                >
                  <SelectTrigger id="overview-time-filter" className="w-[180px]">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="14days">Last 14 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="3months">Last 3 months</SelectItem>
                    <SelectItem value="year">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="md:hidden flex items-center">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="mt-8 space-y-1">
                  {adminTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                          isActive
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                  <div className="pt-4 mt-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full justify-center gap-2"
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>


        {events.length > 0 &&
          (activeTab === 'transactions' || activeTab === 'events' || activeTab === 'guests') && (
          <div className="flex flex-wrap justify-end gap-4 mb-4">
            {activeTab === 'transactions' && (
              <div className="flex items-center gap-2">
                <Label htmlFor="admin-time-filter" className="hidden md:inline whitespace-nowrap">
                  Time Period:
                </Label>
                <Select
                  value={selectedTimeFilter}
                  onValueChange={(value) => setSelectedTimeFilter(value as TimeFilter)}
                >
                  <SelectTrigger id="admin-time-filter" className="w-[180px]">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="14days">Last 14 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="3months">Last 3 months</SelectItem>
                    <SelectItem value="year">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {activeTab === 'transactions' && (
              <div className="flex items-center gap-2">
                <Label htmlFor="admin-txn-type" className="hidden md:inline whitespace-nowrap">
                  Type:
                </Label>
                <Select
                  value={selectedTxnType}
                  onValueChange={(value) => setSelectedTxnType(value as 'all' | 'cash' | 'asoebi')}
                >
                  <SelectTrigger id="admin-txn-type" className="w-[160px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="cash">Cash Gift</SelectItem>
                    <SelectItem value="asoebi">Asoebi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {activeTab === 'guests' && (
              <div className="flex items-center gap-2">
                <Label htmlFor="admin-guest-email" className="hidden md:inline whitespace-nowrap">
                  Email:
                </Label>
                <Select
                  value={guestEmailFilter}
                  onValueChange={(value) => setGuestEmailFilter(value as 'all' | 'yes' | 'no')}
                >
                  <SelectTrigger id="admin-guest-email" className="w-[160px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">With email</SelectItem>
                    <SelectItem value="no">Without email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Label htmlFor="admin-event-filter" className="hidden md:inline whitespace-nowrap">
                Event:
              </Label>
              <Select
                value={selectedEventId === 'all' ? 'all' : String(selectedEventId)}
                onValueChange={(value) =>
                  setSelectedEventId(value === 'all' ? 'all' : parseInt(value, 10))}
              >
                <SelectTrigger id="admin-event-filter" className="w-[180px]">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={String(event.id)}>
                      {event.title || 'Untitled'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'transactions' && renderContributions('transactions')}
        {activeTab === 'guests' && renderGuests()}
        {activeTab === 'events' && renderEvents()}
      </main>

      <Dialog
        open={deleteUserId !== null}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
            <DialogDescription>
              This will permanently remove {deleteUserName || 'this user'} and all their data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-semibold">delete</span> to confirm this action.
            </p>
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">Confirmation</Label>
              <Input
                id="delete-confirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="delete"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeDeleteDialog}
              disabled={deletingUser}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteConfirm.toLowerCase() !== 'delete' || deletingUser}
            >
              {deletingUser ? 'Deleting...' : 'Delete user'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
