import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Users, Gift, Banknote, LogOut, ShoppingBag, LayoutDashboard, Trash2, Wallet, CalendarDays, Menu, BarChart3, MoreHorizontal, UserCheck, UserMinus, Eye, Mail } from "lucide-react";
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
  totalGifters: number;
  totalAsoebi: number;
  totalContributions: number;
  totalAsoebiContributions: number;
  totalWalletBalance: number;
  guestListOpenEvents: number;
  guestListRestrictedEvents: number;
  totalRevenue: number;
  referralRevenue: number;
  estimatedPaystackFees: number;
  payoutFees?: number;
  netProfit: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
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
  commission: number;
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
  date: string | null;
  deadline: string | null;
  shareLink: string | null;
  enableCashGifts: boolean | null;
  isSellingAsoebi: boolean | null;
  asoebiSalesCount?: number;
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

interface EmailTemplate {
  id: number;
  key: string;
  name: string;
  subject: string;
  heading: string;
  greeting: string | null;
  body: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  footer: string | null;
  createdAt: string;
  updatedAt: string;
}

type AdminTab = 'overview' | 'transactions' | 'events' | 'guests' | 'emails';
type TimeFilter = 'all' | '7days' | '14days' | '30days' | '3months' | 'year';

const adminTabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: Gift },
  { id: 'guests', label: 'Guest Users', icon: Users },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'emails', label: 'Bulk Emails', icon: Mail },
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
  
  // Refs to prevent infinite loops and redundant fetches
  const fetchingContributions = React.useRef(false);
  const fetchingEvents = React.useRef(false);
  const fetchingGuests = React.useRef(false);
  const contributionsLength = React.useRef(0);
  const eventsLength = React.useRef(0);

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [selectedEventId, setSelectedEventId] = useState<number | 'all'>('all');
  const [overviewTimeFilter, setOverviewTimeFilter] = useState<TimeFilter>('all');
  const [txnTimeFilter, setTxnTimeFilter] = useState<TimeFilter>('all');
  const [selectedTxnType, setSelectedTxnType] = useState<'all' | 'cash' | 'asoebi'>('all');
  const [guestEmailFilter, setGuestEmailFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [userSearch, setUserSearch] = useState('');
  const [txnSearch, setTxnSearch] = useState('');
  const [guestSearch, setGuestSearch] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [emailSourceFilter, setEmailSourceFilter] = useState<'all' | 'user' | 'guest'>('all');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [sendingBulk, setSendingBulk] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [loadingEmailTemplates, setLoadingEmailTemplates] = useState(false);
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState<number | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateDraft, setTemplateDraft] = useState<{
    id?: number;
    key?: string;
    name: string;
    subject: string;
    heading: string;
    greeting: string;
    body: string;
    ctaLabel: string;
    ctaUrl: string;
    footer: string;
  }>({
    name: '',
    subject: '',
    heading: '',
    greeting: '',
    body: '',
    ctaLabel: '',
    ctaUrl: '',
    footer: '',
  });
  const [savingTemplate, setSavingTemplate] = useState(false);
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
      const metricsTimeFilter = activeTab === 'transactions' ? txnTimeFilter : overviewTimeFilter;
      const metricsParams = new URLSearchParams();
      metricsParams.set('time', metricsTimeFilter);
      if (activeTab === 'transactions') {
        if (selectedTxnType !== 'all') metricsParams.set('type', selectedTxnType);
        if (selectedEventId !== 'all') metricsParams.set('eventId', String(selectedEventId));
      }

      const [metricsRes, usersRes] = await Promise.all([
        fetch(`${baseUrl}/api/admin/metrics?${metricsParams.toString()}`, {
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
  }, [activeTab, navigate, overviewTimeFilter, selectedEventId, selectedTxnType, txnTimeFilter]);

  const fetchContributions = useCallback(async (time: TimeFilter = 'all', force = false) => {
    if (!force && (fetchingContributions.current || (contributionsLength.current > 0 && !force))) {
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
      fetchingContributions.current = true;
      const params = new URLSearchParams();
      params.set('time', time);
      if (activeTab === 'transactions') {
        if (selectedTxnType !== 'all') params.set('type', selectedTxnType);
        if (selectedEventId !== 'all') params.set('eventId', String(selectedEventId));
      }
      const response = await fetch(`${baseUrl}/api/admin/contributions?${params.toString()}`, {
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
      contributionsLength.current = data.length;
    } catch (error) {
      toast.error('Failed to fetch contributions');
    } finally {
      setLoadingContributions(false);
      fetchingContributions.current = false;
    }
  }, [activeTab, navigate, selectedEventId, selectedTxnType]);

  const fetchGuests = useCallback(async () => {
    if (fetchingGuests.current) {
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
      fetchingGuests.current = true;
      setGuests([]);
      const params = new URLSearchParams();
      params.set('hasEmail', 'yes');
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
      fetchingGuests.current = false;
    }
  }, [navigate, selectedEventId]);

  const fetchEvents = useCallback(async () => {
    if (fetchingEvents.current || eventsLength.current > 0) {
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
      fetchingEvents.current = true;
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
      eventsLength.current = data.length;
    } catch (error) {
      toast.error('Failed to fetch events');
    } finally {
      setLoadingEvents(false);
      fetchingEvents.current = false;
    }
  }, [navigate]);

  const fetchEmailTemplates = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      setLoadingEmailTemplates(true);

      const ensureDefaultRes = await fetch(`${baseUrl}/api/admin/email-templates/default-welcome`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (ensureDefaultRes.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }
      if (!ensureDefaultRes.ok) {
        setEmailTemplates([]);
        setSelectedEmailTemplateId(null);
        toast.error('Email templates are not available yet');
        return;
      }

      const listRes = await fetch(`${baseUrl}/api/admin/email-templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (listRes.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }

      if (!listRes.ok) {
        toast.error('Failed to fetch email templates');
        return;
      }

      const templates: EmailTemplate[] = await listRes.json();
      setEmailTemplates(templates);

      if (templates.length === 0) {
        setSelectedEmailTemplateId(null);
        localStorage.removeItem('adminEmailTemplateId');
        return;
      }

      const remembered = localStorage.getItem('adminEmailTemplateId');
      const rememberedId = remembered ? parseInt(remembered, 10) : null;
      const isRememberedValid = rememberedId ? templates.some((t) => t.id === rememberedId) : false;
      const defaultTemplate = templates.find((t) => t.key === 'welcome_default') || templates[0] || null;

      if (!selectedEmailTemplateId) {
        const nextId = (isRememberedValid && rememberedId) ? rememberedId : (defaultTemplate ? defaultTemplate.id : null);
        if (nextId) {
          setSelectedEmailTemplateId(nextId);
          localStorage.setItem('adminEmailTemplateId', String(nextId));
        }
      } else {
        const stillValid = templates.some((t) => t.id === selectedEmailTemplateId);
        if (!stillValid && defaultTemplate) {
          setSelectedEmailTemplateId(defaultTemplate.id);
          localStorage.setItem('adminEmailTemplateId', String(defaultTemplate.id));
        }
      }
    } catch (error) {
      toast.error('Failed to fetch email templates');
    } finally {
      setLoadingEmailTemplates(false);
    }
  }, [navigate, selectedEmailTemplateId]);

  useEffect(() => {
    fetchDashboardData();
    fetchEvents();
  }, [fetchDashboardData, fetchEvents]);

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchContributions(txnTimeFilter, true);
    }
    if (activeTab === 'events') {
      fetchContributions('all');
      fetchEvents();
    }
  }, [activeTab, fetchContributions, fetchEvents, txnTimeFilter]);

  useEffect(() => {
    if (activeTab === 'guests' || activeTab === 'emails') {
      fetchGuests();
    }
  }, [activeTab, fetchGuests]);

  useEffect(() => {
    if (activeTab === 'emails') {
      fetchEmailTemplates();
    }
  }, [activeTab, fetchEmailTemplates]);

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

  const handleSendBulkEmail = async () => {
    if (selectedEmails.length === 0) {
      toast.error('Please select at least one email');
      return;
    }

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      setSendingBulk(true);
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/admin/send-bulk-welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emails: selectedEmails, templateId: selectedEmailTemplateId }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.msg);
        setSelectedEmails([]);
      } else {
        toast.error(data.msg || 'Failed to send emails');
      }
    } catch (error) {
      toast.error('Failed to send emails');
    } finally {
      setSendingBulk(false);
    }
  };

  const selectedEmailTemplate = selectedEmailTemplateId
    ? emailTemplates.find((t) => t.id === selectedEmailTemplateId) || null
    : null;

  const openEditEmailTemplate = () => {
    if (!selectedEmailTemplate) {
      toast.error('Select a template first');
      return;
    }
    setTemplateDraft({
      id: selectedEmailTemplate.id,
      key: selectedEmailTemplate.key,
      name: selectedEmailTemplate.name || '',
      subject: selectedEmailTemplate.subject || '',
      heading: selectedEmailTemplate.heading || '',
      greeting: selectedEmailTemplate.greeting || '',
      body: selectedEmailTemplate.body || '',
      ctaLabel: selectedEmailTemplate.ctaLabel || '',
      ctaUrl: selectedEmailTemplate.ctaUrl || '',
      footer: selectedEmailTemplate.footer || '',
    });
    setTemplateDialogOpen(true);
  };

  const openNewEmailTemplate = () => {
    const base = selectedEmailTemplate;
    setTemplateDraft({
      name: base ? `${base.name} (Copy)` : 'New Email Template',
      subject: base?.subject || 'BeThere',
      heading: base?.heading || 'Hello from BeThere',
      greeting: base?.greeting || 'Hi {name},',
      body: base?.body || "Write your message here.\n\nTip: use {name} to personalize.",
      ctaLabel: base?.ctaLabel || '',
      ctaUrl: base?.ctaUrl || '',
      footer: base?.footer || '',
    });
    setTemplateDialogOpen(true);
  };

  const closeTemplateDialog = () => {
    if (savingTemplate) return;
    setTemplateDialogOpen(false);
  };

  const saveEmailTemplate = async ({ asNew }: { asNew: boolean }) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    const payload = {
      key: templateDraft.key?.trim() || undefined,
      name: templateDraft.name.trim(),
      subject: templateDraft.subject.trim(),
      heading: templateDraft.heading.trim(),
      greeting: templateDraft.greeting.trim() || undefined,
      body: templateDraft.body.trim(),
      ctaLabel: templateDraft.ctaLabel.trim() || undefined,
      ctaUrl: templateDraft.ctaUrl.trim() || undefined,
      footer: templateDraft.footer.trim() || undefined,
    };

    if (!payload.name || !payload.subject || !payload.heading || !payload.body) {
      toast.error('Name, Subject, Heading, and Body are required');
      return;
    }

    try {
      setSavingTemplate(true);
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const isUpdate = Boolean(templateDraft.id) && !asNew;
      const url = isUpdate
        ? `${baseUrl}/api/admin/email-templates/${templateDraft.id}`
        : `${baseUrl}/api/admin/email-templates`;

      const response = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(data?.msg || 'Failed to save template');
        return;
      }

      toast.success(isUpdate ? 'Template updated' : 'Template created');
      setTemplateDialogOpen(false);
      await fetchEmailTemplates();

      const nextId = data?.id;
      if (typeof nextId === 'number') {
        setSelectedEmailTemplateId(nextId);
        localStorage.setItem('adminEmailTemplateId', String(nextId));
      }
    } catch (error) {
      toast.error('Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const escapePreviewHtml = (value: string) => {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const normalizePreviewPunctuationSpacing = (value: string) => {
    return String(value ?? '').replace(/\s+([,.;:!?])/g, '$1');
  };

  const applyPreviewVars = (input: string, vars: Record<string, string>) => {
    const replaced = String(input ?? '').replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
      const v = Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : undefined;
      if (v === undefined || v === null) return match;
      return String(v);
    });
    return normalizePreviewPunctuationSpacing(replaced);
  };

  const isValidPreviewLink = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  };

  const formatPreviewBodyToHtml = (raw: string) => {
    const text = String(raw ?? '').replace(/\r\n/g, '\n').trim();
    if (!text) return '';

    const lines = text.split('\n');
    const blocks: string[] = [];
    let buffer: string[] = [];

    const flush = () => {
      const t = buffer.join('\n').trim();
      buffer = [];
      if (t) blocks.push(t);
    };

    for (const line of lines) {
      if (!line.trim()) {
        flush();
        continue;
      }
      buffer.push(line);
    }
    flush();

    const htmlBlocks: string[] = [];
    for (const block of blocks) {
      const bulletLines = block
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      const allBullets = bulletLines.length > 0 && bulletLines.every((l) => l.startsWith('- ') || l.startsWith('• '));
      if (allBullets) {
        const items = bulletLines
          .map((l) => l.replace(/^(-\s+|•\s+)/, '').trim())
          .filter(Boolean)
          .map((item) => `<li style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">${escapePreviewHtml(item)}</li>`)
          .join('');
        htmlBlocks.push(`<ul style="margin: 12px auto 0; padding-left: 18px; max-width: 420px; text-align: left;">${items}</ul>`);
      } else {
        htmlBlocks.push(`<p style="margin: 12px 0 0; font-size: 14px; color: #4b5563; line-height: 1.6;">${escapePreviewHtml(block).replace(/\n/g, '<br/>')}</p>`);
      }
    }
    return htmlBlocks.join('');
  };

  const buildTemplatePreviewHtml = () => {
    const accent = '#2E235C';
    const muted = '#f6f4ff';
    const vars = { name: 'Alex' };

    const heading = escapePreviewHtml(applyPreviewVars(templateDraft.heading, vars));
    const greeting = escapePreviewHtml(applyPreviewVars(templateDraft.greeting, vars));
    const body = formatPreviewBodyToHtml(applyPreviewVars(templateDraft.body, vars));
    const footer = escapePreviewHtml(applyPreviewVars(templateDraft.footer, vars));
    const ctaLabel = escapePreviewHtml(applyPreviewVars(templateDraft.ctaLabel, vars));
    const ctaUrlRaw = applyPreviewVars(templateDraft.ctaUrl, vars);
    const ctaUrl = isValidPreviewLink(ctaUrlRaw) ? ctaUrlRaw : '';

    const year = new Date().getFullYear();
    const greetingHtml = greeting ? `<p style="margin: 0; font-size: 16px; color: #111827; font-weight: 600;">${greeting}</p>` : '';
    const ctaHtml = ctaLabel && ctaUrl
      ? `<div style="margin-top: 28px;"><a href="${ctaUrl}" style="display: inline-block; background-color: ${accent}; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(46,35,92,0.2);">${ctaLabel}</a></div>`
      : '';
    const footerLines = [
      footer ? `<p style="margin: 0 0 6px 0; font-size: 12px; color: #9ca3af;">${footer}</p>` : '',
      `<p style="margin: 0; font-size: 12px; color: #9ca3af;">&copy; ${year} BeThere Experience. All rights reserved.</p>`,
    ].filter(Boolean).join('');

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Email Preview</title>
        </head>
        <body style="margin: 0; padding: 0; background: #f3f2fb; min-height: 100vh;">
          <div style="background: #f3f2fb; padding: 24px; font-family: Arial, sans-serif; color: #1f2937; min-height: 100vh; box-sizing: border-box;">
            <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #ebe9f7; box-shadow: 0 12px 30px rgba(46, 35, 92, 0.08); overflow: hidden;">
              <div style="padding: 28px 28px 18px; text-align: center;">
                <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${accent}; letter-spacing: 0.4px;">${heading || 'Your heading'}</h2>
              </div>
              <div style="padding: 0 24px 24px; text-align: center;">
                <div style="margin: 0 auto 8px; max-width: 420px; background: ${muted}; border: 1px solid #e7e4f5; border-radius: 14px; padding: 20px;">
                  ${greetingHtml}
                  ${body}
                  ${ctaHtml}
                </div>
              </div>
              <div style="background: #fafafa; padding: 16px; text-align: center; border-top: 1px solid #f3f4f6;">
                ${footerLines}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    return html;
  };

  const toggleEmailSelection = (email: string) => {
    setSelectedEmails(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const selectAllEmails = (emails: string[]) => {
    if (selectedEmails.length === emails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(emails);
    }
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
    (items: Contribution[], timeFilter: TimeFilter) => {
      if (timeFilter === 'all') {
        return items;
      }

      const now = new Date();
      const filterDate = new Date();

      switch (timeFilter) {
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
    []
  );

  const filteredContributions = (tab: AdminTab) => {
    let rows = allContributions;
    if (tab === 'transactions') {
      // Exclude contributions with amount = 0 (wishes)
      rows = rows.filter((c) => c.amount > 0);
      if (selectedTxnType === 'asoebi') {
        rows = rows.filter((c) => c.isAsoebi);
      } else if (selectedTxnType === 'cash') {
        rows = rows.filter((c) => !c.isAsoebi);
      }
      rows = filterByEvent(rows);
      // Transactions are now filtered by time on the backend
      return rows;
    }
    
    rows = filterByEvent(rows);
    return rows;
  };

  const renderEmails = () => {
    const userEmails = users.map((u) => u.email.toLowerCase().trim()).filter(Boolean);
    const guestEmails = guests.map((g) => g.email?.toLowerCase().trim()).filter(Boolean) as string[];
    
    // Create base email list based on source filter
    let baseEmails: string[] = [];
    if (emailSourceFilter === 'all') {
      baseEmails = Array.from(new Set([...userEmails, ...guestEmails]));
    } else if (emailSourceFilter === 'user') {
      baseEmails = Array.from(new Set(userEmails));
    } else {
      baseEmails = Array.from(new Set(guestEmails));
    }
    
    const filteredEmails = baseEmails.sort().filter(email => 
      email.toLowerCase().includes(emailSearch.toLowerCase())
    );

    return (
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <CardTitle>Bulk Welcome Emails</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Send the welcome email template to selected users and guests.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button 
              variant="outline" 
              onClick={() => selectAllEmails(filteredEmails)}
              className="w-full sm:w-auto"
            >
              {selectedEmails.length === filteredEmails.length && filteredEmails.length > 0 ? 'Deselect All' : 'Select All Filtered'}
            </Button>
            <Button 
              disabled={selectedEmails.length === 0 || sendingBulk}
              onClick={handleSendBulkEmail}
              className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
            >
              {sendingBulk ? 'Sending...' : `Send to ${selectedEmails.length} selected`}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 rounded-xl border bg-gradient-to-r from-purple-50 to-white p-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="space-y-1 w-full sm:w-auto">
                  <Label className="text-sm font-medium">Email Template</Label>
                  <Select
                    disabled={loadingEmailTemplates || emailTemplates.length === 0}
                    value={selectedEmailTemplateId ? String(selectedEmailTemplateId) : ''}
                    onValueChange={(value) => {
                      const id = parseInt(value, 10);
                      setSelectedEmailTemplateId(id);
                      localStorage.setItem('adminEmailTemplateId', String(id));
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[260px] bg-white">
                      <SelectValue placeholder={loadingEmailTemplates ? 'Loading templates...' : 'Select a template'} />
                    </SelectTrigger>
                    <SelectContent>
                      {emailTemplates.length === 0 ? (
                        <SelectItem value="__none__" disabled>
                          No templates yet
                        </SelectItem>
                      ) : null}
                      {emailTemplates.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Use {`{name}`} to personalize.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button type="button" variant="outline" onClick={openNewEmailTemplate}>
                    New Template
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openEditEmailTemplate}
                    disabled={!selectedEmailTemplateId || loadingEmailTemplates || emailTemplates.length === 0}
                  >
                    Edit Template
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                {selectedEmailTemplate ? (
                  <span>
                    Subject: <span className="font-medium text-foreground">{selectedEmailTemplate.subject}</span>
                  </span>
                ) : (
                  <span>Select a template to see the subject.</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative w-full md:flex-1">
              <Input
                placeholder="Search emails..."
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
                className="w-full md:max-w-sm"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Label htmlFor="email-source-filter" className="text-sm font-medium whitespace-nowrap">Filter By Source:</Label>
              <Select
                value={emailSourceFilter}
                onValueChange={(value) => {
                  setEmailSourceFilter(value as 'all' | 'user' | 'guest');
                  setSelectedEmails([]); // Clear selection when switching filters to avoid hidden selections
                }}
              >
                <SelectTrigger id="email-source-filter" className="w-full md:w-[160px]">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="user">Users Only</SelectItem>
                  <SelectItem value="guest">Guests Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground bg-gray-100 px-3 py-1 rounded-full w-fit">
              Total Filtered: <span className="font-semibold text-gray-900">{filteredEmails.length}</span>
            </div>
            <div className="text-sm text-muted-foreground bg-purple-50 px-3 py-1 rounded-full border border-purple-100 w-fit">
              Selected: <span className="font-semibold text-purple-700">{selectedEmails.length}</span>
            </div>
          </div>
          
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      checked={selectedEmails.length > 0 && selectedEmails.length === filteredEmails.length}
                      onCheckedChange={() => selectAllEmails(filteredEmails)}
                    />
                  </TableHead>
                  <TableHead>Email Address</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmails.map((email) => {
                  const isUser = userEmails.includes(email);
                  const isGuest = guestEmails.includes(email);
                  
                  return (
                    <TableRow key={email} className={selectedEmails.includes(email) ? 'bg-purple-50/30' : ''}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedEmails.includes(email)}
                          onCheckedChange={() => toggleEmailSelection(email)}
                        />
                      </TableCell>
                      <TableCell className="text-sm font-medium">{email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {isUser && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold uppercase">User</span>
                          )}
                          {isGuest && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold uppercase">Guest</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(email);
                            toast.success("Copied!");
                          }}
                        >
                          Copy
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredEmails.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No emails match your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderOverview = () => {
    const filteredUsers = users.filter((u) => {
      const search = userSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      );
    });

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
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Gifters</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalGifters || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Asoebi</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalAsoebi || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(metrics?.guestListOpenEvents || 0) + (metrics?.guestListRestrictedEvents || 0)}
              </div>
              <div className="flex gap-2 mt-1">
                <span className="text-[10px] text-muted-foreground bg-gray-50 px-1.5 py-0.5 rounded">
                  {metrics?.guestListOpenEvents || 0} Open
                </span>
                <span className="text-[10px] text-muted-foreground bg-gray-50 px-1.5 py-0.5 rounded">
                  {metrics?.guestListRestrictedEvents || 0} Closed
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>User Management</CardTitle>
            <div className="relative w-64">
              <Input
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell className="text-sm">{user.phoneNumber || 'N/A'}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">₦{Number(user.wallet).toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.isActive ? "Active" : "Suspended"}
                      </span>
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
                            onClick={() => handleToggleUser(user.id)}
                          >
                            {user.isActive ? (
                              <>
                                <UserMinus className="mr-2 h-4 w-4" />
                                Suspend
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
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
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
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
                Total Gifters
              </CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold tracking-tight">
                {metrics?.totalGifters || 0}
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
                Total Events
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">
                {openEvents + restrictedEvents}
              </div>
              <div className="flex gap-2 mt-2">
                <span className="text-xs text-muted-foreground bg-gray-50 px-2 py-1 rounded">
                  {openEvents} Open ({openPercentage}%)
                </span>
                <span className="text-xs text-muted-foreground bg-gray-50 px-2 py-1 rounded">
                  {restrictedEvents} Closed ({restrictedPercentage}%)
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  };

  const renderContributions = (tab: AdminTab) => {
    let rows = filteredContributions(tab);

    if (txnSearch) {
      const search = txnSearch.toLowerCase();
      rows = rows.filter((c) => {
        return (
          (c.contributorName?.toLowerCase() || 'anonymous').includes(search) ||
          (c.gift?.title?.toLowerCase() || '').includes(search) ||
          c.amount.toString().includes(search)
        );
      });
    }

    const filteredTransactionAmount = rows.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const filteredRevenue = rows.reduce((sum, c) => sum + (Number(c.commission) || 0), 0);
    const revenueRatio = filteredTransactionAmount > 0
      ? (filteredRevenue / filteredTransactionAmount) * 100
      : 0;
    const timeFilterLabelMap: Record<TimeFilter, string> = {
      all: 'All Time',
      '7days': 'Last 7 days',
      '14days': 'Last 14 days',
      '30days': 'Last 30 days',
      '3months': 'Last 3 months',
      year: 'Last year',
    };

    return (
      <>
        {tab === 'transactions' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₦{filteredTransactionAmount.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on {timeFilterLabelMap[txnTimeFilter]} filters
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Platform Revenue</CardTitle>
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₦{filteredRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    From commissions and fees
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Profit Ratio</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {revenueRatio.toFixed(2)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Revenue as a share of filtered transaction value
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Paystack Fees</CardTitle>
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-black">
                    ₦{(metrics?.estimatedPaystackFees || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 space-y-0.5">
                    <p>Transfer Fees + Stamp Duty</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Referral Revenue</CardTitle>
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-black">
                    ₦{(metrics?.referralRevenue || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Earnings from referral transactions
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Platform Profit</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-black">
                    ₦{(metrics?.netProfit || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Net revenue after fees
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {tab === 'transactions'
                ? 'All Transactions'
                : 'Transactions'}
            </CardTitle>
            <div className="relative w-64">
              <Input
                placeholder="Search transactions..."
                value={txnSearch}
                onChange={(e) => setTxnSearch(e.target.value)}
              />
            </div>
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
                            ? 'bg-black/5 text-black border border-black/10'
                            : 'bg-black/5 text-black border border-black/10'
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
    </>
    );
  };

  const renderEvents = () => {
    let rows = selectedEventId === 'all'
      ? events
      : events.filter((event) => event.id === selectedEventId);

    if (eventSearch) {
      const search = eventSearch.toLowerCase();
      rows = rows.filter((event) => {
        return (
          (event.title?.toLowerCase() || '').includes(search) ||
          (event.user?.name?.toLowerCase() || '').includes(search) ||
          (event.user?.email?.toLowerCase() || '').includes(search)
        );
      });
    }

    // Calculate stats
    const eventContributions = selectedEventId === 'all'
      ? allContributions
      : allContributions.filter(c => c.gift?.id === selectedEventId);
    
    const totalAmount = eventContributions.reduce((sum, c) => sum + Number(c.amount), 0);
    const asoebiAmount = eventContributions.filter(c => c.isAsoebi).reduce((sum, c) => sum + Number(c.amount), 0);
    const cashAmount = totalAmount - asoebiAmount;
    
    const totalGuests = selectedEventId === 'all'
      ? events.reduce((sum, e) => sum + e._count.guests, 0)
      : events.find(e => e.id === selectedEventId)?._count.guests || 0;

    return (
    <div className="space-y-6">
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
            <div className="text-xl font-bold">{totalGuests}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Events</CardTitle>
          <div className="relative w-64">
            <Input
              placeholder="Search events or host email..."
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loadingEvents ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading events...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-xs md:text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-2">Event</TableHead>
                    <TableHead className="px-2 hidden md:table-cell">Type</TableHead>
                    <TableHead className="px-2">Host</TableHead>
                    <TableHead className="text-center whitespace-nowrap px-2">Guests</TableHead>
                    <TableHead className="text-center whitespace-nowrap px-2 hidden sm:table-cell">Contribs</TableHead>
                    <TableHead className="text-center whitespace-nowrap px-2">Asoebi</TableHead>
                    <TableHead className="px-2 whitespace-nowrap hidden lg:table-cell">Event Date</TableHead>
                    <TableHead className="px-2 whitespace-nowrap hidden lg:table-cell">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium px-2">
                        {event.title || 'Untitled'}
                      </TableCell>
                      <TableCell className="text-sm px-2 hidden md:table-cell">
                        <span className="capitalize">{event.type}</span>
                      </TableCell>
                      <TableCell className="text-sm px-2">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{event.user?.name || 'No Name'}</span>
                          <span className="text-xs text-muted-foreground hidden md:inline">{event.user?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center px-2">
                        {event._count.guests}
                      </TableCell>
                      <TableCell className="text-center px-2 hidden sm:table-cell">
                        {allContributions.filter(c => c.amount > 0 && c.gift?.id === event.id).length}
                      </TableCell>
                      <TableCell className="text-center px-2">
                        {(event.asoebiSalesCount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm px-2 whitespace-nowrap hidden lg:table-cell">
                        {event.date
                          ? new Date(event.date).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm px-2 whitespace-nowrap hidden lg:table-cell">
                        {new Date(event.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                        No events found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
  };

  const renderGuests = () => {
    let rows = guests.filter((g) => {
      if (selectedEventId !== 'all') {
        return g.gift?.id === selectedEventId;
      }
      return true;
    }).filter((g) => Boolean(g.email));

    if (guestSearch) {
      const search = guestSearch.toLowerCase();
      rows = rows.filter((g) => {
        return (
          g.firstName.toLowerCase().includes(search) ||
          g.lastName.toLowerCase().includes(search) ||
          (g.email?.toLowerCase() || '').includes(search) ||
          (g.gift?.title?.toLowerCase() || '').includes(search)
        );
      });
    }

    const totalWithEmail = rows.length;

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Guest Users</CardTitle>
          <div className="relative w-64">
            <Input
              placeholder="Search guests..."
              value={guestSearch}
              onChange={(e) => setGuestSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="text-sm text-muted-foreground">
              Total Guest Users: <span className="font-semibold">{totalWithEmail}</span>
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
            src="/logo1.png"
            alt="BeThere  logo"
            className="h-8 w-auto self-start"
          />
          <div>
            <div className="text-sm font-semibold text-gray-900">Admin</div>
            <div className="text-xs text-muted-foreground">Control center</div>
          </div>
        </div>
        <nav className="space-y-1">
          {adminTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
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
                  value={overviewTimeFilter}
                  onValueChange={(value) => setOverviewTimeFilter(value as TimeFilter)}
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
                  value={txnTimeFilter}
                  onValueChange={(value) => setTxnTimeFilter(value as TimeFilter)}
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

        <div className="space-y-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'transactions' && renderContributions('transactions')}
          {activeTab === 'guests' && renderGuests()}
          {activeTab === 'events' && renderEvents()}
          {activeTab === 'emails' && renderEmails()}
        </div>
      </main>

      <Dialog
        open={templateDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeTemplateDialog();
        }}
      >
        <DialogContent className="sm:max-w-[1100px] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Email Template</DialogTitle>
            <DialogDescription>
              Edit the template and preview it before sending. Tip: use {`{name}`} to personalize.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-y-auto pr-2">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template name</Label>
                  <Input
                    value={templateDraft.name}
                    onChange={(e) => setTemplateDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="Welcome Email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={templateDraft.subject}
                    onChange={(e) => setTemplateDraft((d) => ({ ...d, subject: e.target.value }))}
                    placeholder="Subject line"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Heading</Label>
                  <Input
                    value={templateDraft.heading}
                    onChange={(e) => setTemplateDraft((d) => ({ ...d, heading: e.target.value }))}
                    placeholder="Welcome to BeThere"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Greeting (optional)</Label>
                  <Input
                    value={templateDraft.greeting}
                    onChange={(e) => setTemplateDraft((d) => ({ ...d, greeting: e.target.value }))}
                    placeholder="Hi {name},"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea
                  value={templateDraft.body}
                  onChange={(e) => setTemplateDraft((d) => ({ ...d, body: e.target.value }))}
                  placeholder={"Write your message here.\n\nUse '- ' for bullet points."}
                  className="min-h-[220px]"
                />
                <p className="text-xs text-muted-foreground">
                  Lines starting with "- " become bullet points in the email.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Button text (optional)</Label>
                  <Input
                    value={templateDraft.ctaLabel}
                    onChange={(e) => setTemplateDraft((d) => ({ ...d, ctaLabel: e.target.value }))}
                    placeholder="View Dashboard"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Button link (optional)</Label>
                  <Input
                    value={templateDraft.ctaUrl}
                    onChange={(e) => setTemplateDraft((d) => ({ ...d, ctaUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Footer note (optional)</Label>
                <Input
                  value={templateDraft.footer}
                  onChange={(e) => setTemplateDraft((d) => ({ ...d, footer: e.target.value }))}
                  placeholder="Reply to this email if you need help."
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Preview</Label>
                <span className="text-xs text-muted-foreground">Sample: {`{name}`} = Alex</span>
              </div>
              <div className="rounded-xl border bg-white overflow-hidden">
                <iframe
                  title="Email preview"
                  className="w-full h-[560px]"
                  srcDoc={buildTemplatePreviewHtml()}
                  sandbox=""
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={closeTemplateDialog} disabled={savingTemplate}>
              Cancel
            </Button>
            {templateDraft.id ? (
              <Button type="button" variant="outline" onClick={() => saveEmailTemplate({ asNew: true })} disabled={savingTemplate}>
                Save as New
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={() => saveEmailTemplate({ asNew: false })}
              disabled={savingTemplate}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {savingTemplate ? 'Saving...' : templateDraft.id ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
