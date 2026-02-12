import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Users, Gift, DollarSign, LogOut, ShoppingBag } from "lucide-react";

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
  contributorName: string;
  amount: number;
  createdAt: string;
  isAsoebi: boolean;
  gift: {
    title: string;
  };
}

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [recentContributions, setRecentContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      const [metricsRes, usersRes] = await Promise.all([
        fetch(`${baseUrl}/api/admin/metrics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (metricsRes.status === 401 || usersRes.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }

      const metricsData = await metricsRes.json();
      const usersData = await usersRes.json();

      setMetrics(metricsData.metrics);
      setRecentContributions(metricsData.recentContributions);
      setUsers(usersData);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleUser = async (userId: number) => {
    const token = localStorage.getItem('adminToken');
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/admin/users/${userId}/toggle`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
        toast.success('User status updated');
      } else {
        toast.error('Failed to update user status');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
          <LogOut size={16} /> Logout
        </Button>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-[10px] bg-green-100 text-green-800">
                        Active
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contributor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Gift</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentContributions.map((contribution) => (
                  <TableRow key={contribution.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{contribution.contributorName || 'Anonymous'}</span>
                        <span className={`text-[10px] w-fit px-1 rounded ${contribution.isAsoebi ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                          {contribution.isAsoebi ? 'Asoebi' : 'Cash Gift'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>₦{contribution.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{contribution.gift?.title || 'N/A'}</TableCell>
                    <TableCell className="text-sm">{new Date(contribution.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {recentContributions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      No recent contributions
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
