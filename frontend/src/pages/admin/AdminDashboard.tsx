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
import { Users, Gift, DollarSign, LogOut, ShoppingBag, LayoutDashboard, Trash2, Wallet, CalendarDays, Menu } from "lucide-react";

interface Metrics {
  totalUsers: number;
  totalGifts: number;
  totalContributions: number;
  totalAsoebiContributions: number;
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

type AdminTab = 'overview' | 'users' | 'transactions' | 'asoebi' | 'cashGifts' | 'events';

const adminTabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'transactions', label: 'Transactions', icon: Gift },
  { id: 'cashGifts', label: 'Cash Gifts', icon: Wallet },
  { id: 'asoebi', label: 'Asoebi', icon: ShoppingBag },
  { id: 'events', label: 'Events', icon: CalendarDays },
];

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [allContributions, setAllContributions] = useState<Contribution[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingContributions, setLoadingContributions] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [selectedEventId, setSelectedEventId] = useState<number | 'all'>('all');
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
        fetch(`${baseUrl}/api/admin/metrics`, {
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
  }, [navigate]);

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
  }, [fetchDashboardData, fetchEvents]);

  useEffect(() => {
    if (activeTab === 'transactions' || activeTab === 'asoebi' || activeTab === 'cashGifts') {
      fetchContributions();
    }
    if (activeTab === 'events') {
      fetchEvents();
    }
  }, [activeTab, fetchContributions, fetchEvents]);

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

  const filteredContributions = (tab: AdminTab) => {
    let rows = allContributions;
    if (tab === 'asoebi') {
      rows = rows.filter((c) => c.isAsoebi);
    } else if (tab === 'cashGifts') {
      rows = rows.filter((c) => !c.isAsoebi);
    }
    return filterByEvent(rows);
  };

  const renderOverview = () => {
    const recentUsers = users.slice(0, 5);

    return (
      <>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Cash Gifts</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
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

        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {recentUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
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

  const renderUsers = () => (
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
                  <Switch checked={user.isActive} onCheckedChange={() => handleToggleUser(user.id)} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="inline-flex items-center gap-1 text-gray-700 border-gray-200 hover:bg-gray-50"
                    onClick={() => openDeleteDialog(user)}
                  >
                    Actions
                  </Button>
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
  );

  const renderContributions = (tab: AdminTab) => {
    const rows = filteredContributions(tab);

    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {tab === 'transactions'
              ? 'All Transactions'
              : tab === 'asoebi'
              ? 'Asoebi Orders'
              : 'Cash Gifts'}
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

    return (
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
  );
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="hidden md:flex w-64 flex-col border-r bg-white px-4 py-6">
        <div className="flex items-center gap-3 mb-8">
          <img
            src="/logo2.png"
            alt="BeThere Weddings logo"
            className="h-8 w-auto"
          />
          <div>
            <div className="text-sm font-semibold">BeThere Admin</div>
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
              activeTab === 'users'
                ? 'bg-gray-900 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('users')}
          >
            <Users className="w-4 h-4" />
            Users
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
              activeTab === 'cashGifts'
                ? 'bg-gray-900 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('cashGifts')}
          >
            <Wallet className="w-4 h-4" />
            Cash Gifts
          </button>
          <button
            type="button"
            className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
              activeTab === 'asoebi'
                ? 'bg-gray-900 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('asoebi')}
          >
            <ShoppingBag className="w-4 h-4" />
            Asoebi
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
            <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor users, cash gifts, Asoebi sales and platform activity.
            </p>
          </div>
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

        {events.length > 0 &&
          (activeTab === 'transactions' ||
            activeTab === 'cashGifts' ||
            activeTab === 'asoebi' ||
            activeTab === 'events') && (
          <div className="flex justify-end mb-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="admin-event-filter" className="hidden md:inline">
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
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'transactions' && renderContributions('transactions')}
        {activeTab === 'cashGifts' && renderContributions('cashGifts')}
        {activeTab === 'asoebi' && renderContributions('asoebi')}
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
