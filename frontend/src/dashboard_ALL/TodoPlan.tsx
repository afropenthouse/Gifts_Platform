import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ArrowUpRight, Calendar, Crown, Globe, Gift, Trash2, Users, Share2, Heart, Camera, ShoppingBag } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { cn } from '../lib/utils';

interface GiftItem {
  id: number;
  title: string;
  date?: string;
  picture?: string;
  enableRSVP?: boolean;
  enableCashGifts?: boolean;
  enableWebsite?: boolean;
  tier?: 'free' | 'vip' | 'royal';
  website?: { published?: boolean };
  invitation?: boolean;
  wishlists?: any[];
  moments?: any[];
  asoebiItems?: any[];
}

interface ContributionItem {
  giftId: number;
  amount: number;
  isAsoebi?: boolean;
}

interface GuestItem {
  id: number;
  giftId?: number;
}

type CompulsoryTask = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  tabId?: string;
  Icon?: any;
};

type CustomTask = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: number;
};

const storageKey = (giftId: number) => `todo_custom_tasks_${giftId}`;

const readCustomTasks = (giftId: number): CustomTask[] => {
  try {
    const raw = localStorage.getItem(storageKey(giftId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t) => t && typeof t === 'object')
      .map((t) => ({
        id: String(t.id || ''),
        title: String(t.title || '').trim(),
        description: String(t.description || '').trim(),
        completed: Boolean(t.completed),
        createdAt: Number(t.createdAt || Date.now()),
      }))
      .filter((t) => t.id && t.title);
  } catch {
    return [];
  }
};

const writeCustomTasks = (giftId: number, tasks: CustomTask[]) => {
  localStorage.setItem(storageKey(giftId), JSON.stringify(tasks));
};

export default function TodoPlan({
  gifts,
  contributions,
  guests,
  onOpenTab,
}: {
  gifts: GiftItem[];
  contributions: ContributionItem[];
  guests: GuestItem[];
  onOpenTab: (tabId: string) => void;
}) {
  const { toast } = useToast();
  const [selectedGiftId, setSelectedGiftId] = useState<number | null>(gifts[0]?.id ?? null);
  const [customTasks, setCustomTasks] = useState<CustomTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeCustomTaskId, setActiveCustomTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [editingCompleted, setEditingCompleted] = useState(false);

  useEffect(() => {
    if (!gifts.length) {
      setSelectedGiftId(null);
      setCustomTasks([]);
      return;
    }
    setSelectedGiftId((prev) => (prev && gifts.some((g) => g.id === prev) ? prev : gifts[0].id));
  }, [gifts]);

  useEffect(() => {
    if (!selectedGiftId) return;
    setCustomTasks(readCustomTasks(selectedGiftId));
    setActiveCustomTaskId(null);
  }, [selectedGiftId]);

  const selectedGift = useMemo(
    () => (selectedGiftId ? gifts.find((g) => g.id === selectedGiftId) ?? null : null),
    [gifts, selectedGiftId]
  );

  const eventContributions = useMemo(() => {
    if (!selectedGiftId) return [];
    return contributions.filter((c) => c.giftId === selectedGiftId && !c.isAsoebi && Number(c.amount) > 0);
  }, [contributions, selectedGiftId]);

  const eventGuests = useMemo(() => {
    if (!selectedGiftId) return [];
    return guests.filter((g) => g.giftId === selectedGiftId);
  }, [guests, selectedGiftId]);

  const compulsoryTasks: CompulsoryTask[] = useMemo(() => {
    if (!selectedGift) return [];

    const rsvpEnabled = Boolean(selectedGift.enableRSVP);
    const websiteEnabled = Boolean(selectedGift.enableWebsite) || Boolean(selectedGift.website);
    const invitationEnabled = Boolean(selectedGift.invitation);
    const wishlistEnabled = Boolean(selectedGift.wishlists && selectedGift.wishlists.length > 0);
    const photosEnabled = Boolean(selectedGift.moments && selectedGift.moments.length > 0);
    const asoebiEnabled = Boolean(selectedGift.asoebiItems && selectedGift.asoebiItems.length > 0);
    const isUpgraded = selectedGift.tier && selectedGift.tier !== 'free';

    return [
      {
        id: 'event-created',
        title: 'Create your event',
        description: 'Set up an event to start receiving gifts and sharing your link',
        completed: true,
        tabId: 'gifts',
        Icon: Gift,
      },
      {
        id: 'rsvp-guests',
        title: 'Add RSVP guests',
        description: 'Add guests to your event and start collecting RSVPs',
        completed: rsvpEnabled,
        tabId: 'rsvp',
        Icon: Users,
      },
      {
        id: 'website-create',
        title: 'Build your website',
        description: 'Create a beautiful event website from templates',
        completed: websiteEnabled,
        tabId: 'website',
        Icon: Globe,
      },
      {
        id: 'invitation-create',
        title: 'Create invitation',
        description: 'Design and send beautiful invitations to your guests',
        completed: invitationEnabled,
        tabId: 'invitation',
        Icon: Share2,
      },
      {
        id: 'wishlist-create',
        title: 'Add wishlist',
        description: 'Create and share a wishlist with your friends and family',
        completed: wishlistEnabled,
        tabId: 'wishlists',
        Icon: Heart,
      },
      {
        id: 'photos-add',
        title: 'Share photos',
        description: 'Share photos from your event with your guests',
        completed: photosEnabled,
        tabId: 'photobook',
        Icon: Camera,
      },
      {
        id: 'asoebi-add',
        title: 'Asoebi',
        description: 'Set up asoebi orders for your event',
        completed: asoebiEnabled,
        tabId: 'asoebi',
        Icon: ShoppingBag,
      },
      {
        id: 'upgrade',
        title: 'Upgrade',
        description: 'Upgrade your event to remove commission',
        completed: isUpgraded,
        tabId: 'premium',
        Icon: Crown,
      },
    ];
  }, [selectedGift]);

  const totals = useMemo(() => {
    const compulsoryTotal = compulsoryTasks.length;
    const compulsoryCompleted = compulsoryTasks.filter((t) => t.completed).length;
    const customTotal = customTasks.length;
    const customCompleted = customTasks.filter((t) => t.completed).length;
    const total = compulsoryTotal;
    const completed = compulsoryCompleted;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { compulsoryTotal, compulsoryCompleted, customTotal, customCompleted, total, completed, percent };
  }, [compulsoryTasks, customTasks]);

  const statusLine = useMemo(() => {
    if (!totals.total) return 'Start with the essentials, then add your own tasks.';
    if (totals.percent >= 80) return 'You’re almost done. Keep the momentum.';
    if (totals.percent >= 40) return 'Nice progress. Stay consistent.';
    return 'Let’s build momentum one task at a time.';
  }, [totals.percent, totals.total]);

  const addCustomTask = () => {
    if (!selectedGiftId) return;
    const title = newTaskTitle.trim();
    if (!title) return;

    const next: CustomTask[] = [
      {
        id: `${selectedGiftId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title,
        description: '',
        completed: false,
        createdAt: Date.now(),
      },
      ...customTasks,
    ];
    setCustomTasks(next);
    writeCustomTasks(selectedGiftId, next);
    setNewTaskTitle('');
    toast({ title: 'Task added', description: 'Added to your personal list.' });
  };

  const toggleCustomTask = (taskId: string, checked: boolean) => {
    if (!selectedGiftId) return;
    const next = customTasks.map((t) => (t.id === taskId ? { ...t, completed: checked } : t));
    setCustomTasks(next);
    writeCustomTasks(selectedGiftId, next);
  };

  const deleteCustomTask = (taskId: string) => {
    if (!selectedGiftId) return;
    const next = customTasks.filter((t) => t.id !== taskId);
    setCustomTasks(next);
    writeCustomTasks(selectedGiftId, next);
    setActiveCustomTaskId((prev) => (prev === taskId ? null : prev));
    toast({ title: 'Task removed' });
  };

  const openCustomTask = (task: CustomTask) => {
    setActiveCustomTaskId(task.id);
    setEditingTitle(task.title);
    setEditingDescription(task.description || '');
    setEditingCompleted(task.completed);
  };

  const saveCustomTaskEdits = () => {
    if (!selectedGiftId) return;
    if (!activeCustomTaskId) return;
    const title = editingTitle.trim();
    if (!title) {
      toast({ title: 'Title required', description: 'Add a title for your task.', variant: 'destructive' });
      return;
    }

    const next = customTasks.map((t) =>
      t.id === activeCustomTaskId
        ? { ...t, title, description: editingDescription.trim(), completed: editingCompleted }
        : t
    );
    setCustomTasks(next);
    writeCustomTasks(selectedGiftId, next);
    toast({ title: 'Task updated' });
    setActiveCustomTaskId(null);
  };

  const openTask = (tabId?: string) => {
    if (!tabId) return;
    onOpenTab(tabId);
  };

  if (!gifts.length) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#2E235C]">Todo</CardTitle>
        </CardHeader>
        <CardContent className="text-gray-600">
          Create your first event to start your planning checklist.
        </CardContent>
      </Card>
    );
  }

   return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#2E235C] via-[#392B74] to-[#2E235C] p-5 sm:p-6 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <div className="text-base sm:text-lg font-semibold">Event Planning Progress</div>
              <div className="text-white/85 text-xs">{statusLine}</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="text-xl font-bold">
                {totals.percent}%
              </div>
              <div className="w-48 sm:w-64">
                <div className="h-3 w-full rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white relative"
                    style={{ width: `${totals.percent}%` }}
                  >
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Event</span>
              <Select
                value={selectedGiftId ? String(selectedGiftId) : undefined}
                onValueChange={(v) => setSelectedGiftId(Number(v))}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {gifts.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.title || `Event #${g.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[#2E235C]">
                Compulsory: {totals.compulsoryCompleted}/{totals.compulsoryTotal}
              </Badge>
              <Badge variant="secondary" className="text-[#2E235C]">
                My tasks: {totals.customCompleted}/{totals.customTotal}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900">Compulsory Tasks</CardTitle>
              <div className="rounded-lg bg-[#2E235C] text-white text-sm font-semibold px-3 py-1">
                {totals.compulsoryTotal}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Essential steps to complete your wedding planning
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-gray-100">
              {compulsoryTasks.map((task) => (
                <div key={task.id} className="py-4 flex items-start gap-3">
                  <div className="pt-0.5">
                    <Checkbox checked={task.completed} disabled />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className={cn('font-medium', task.completed ? 'text-gray-500 line-through' : 'text-gray-900')}>
                          {task.title}
                        </div>
                        <div className="text-sm text-gray-600">{task.description}</div>
                      </div>
                      {task.tabId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#2E235C] hover:text-white hover:bg-[#2E235C]"
                          onClick={() => openTask(task.tabId)}
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-gray-900">My Tasks</CardTitle>
            <div className="text-sm text-gray-600">Add and track your personal wedding to-dos</div>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="flex gap-2">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add a personal task..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addCustomTask();
                }}
              />
              <Button className="bg-[#2E235C] hover:bg-[#2E235C]/90" onClick={addCustomTask}>
                Add
              </Button>
            </div>

            <div className="divide-y divide-gray-100">
              {customTasks.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  No personal tasks yet. Add one to start tracking.
                </div>
              ) : (
                customTasks.map((t) => (
                  <div
                    key={t.id}
                    className="py-4 flex items-start gap-3 cursor-pointer rounded-lg -mx-2 px-2 hover:bg-gray-50"
                    onClick={() => openCustomTask(t)}
                  >
                    <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={t.completed} onCheckedChange={(v) => toggleCustomTask(t.id, Boolean(v))} />
                    </div>
                    <div className="flex-1">
                      <div className={cn('font-medium', t.completed ? 'text-gray-500 line-through' : 'text-gray-900')}>
                        {t.title}
                      </div>
                      {t.description ? (
                        <div className={cn('text-sm mt-0.5', t.completed ? 'text-gray-400' : 'text-gray-600')}>
                          {t.description}
                        </div>
                      ) : null}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCustomTask(t.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(activeCustomTaskId)} onOpenChange={(open) => (!open ? setActiveCustomTaskId(null) : null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-900">Title</div>
              <Input value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} placeholder="Task title" />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-900">Description</div>
              <Textarea
                value={editingDescription}
                onChange={(e) => setEditingDescription(e.target.value)}
                placeholder="Add more details..."
                className="min-h-[110px]"
              />
            </div>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Checkbox checked={editingCompleted} onCheckedChange={(v) => setEditingCompleted(Boolean(v))} />
              <div className="text-sm text-gray-700">Mark as completed</div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                if (!activeCustomTaskId) return;
                deleteCustomTask(activeCustomTaskId);
              }}
            >
              Delete
            </Button>
            <Button className="bg-[#2E235C] hover:bg-[#2E235C]/90" onClick={saveCustomTaskEdits}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
