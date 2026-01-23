import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { ImageIcon, Upload, X, Calendar, Gift } from 'lucide-react';

interface Moment {
  id: number;
  imageUrl: string;
  event: string;
  createdAt: string;
  gift: {
    id: number;
    title: string;
    type: string;
    date: string | null;
  };
}

interface MomentGift {
  id: number;
  title: string;
  type: string;
  date?: string;
}

interface MomentsProps {
  gifts: MomentGift[];
}

const Moments: React.FC<MomentsProps> = ({ gifts }) => {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedGiftId, setSelectedGiftId] = useState<string>('');
  const [eventType, setEventType] = useState<string>('');
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [momentToDelete, setMomentToDelete] = useState<Moment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMoments();
  }, []);

  const fetchMoments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/moments/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMoments(data);
      }
    } catch (err) {
      console.error('Error fetching moments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a valid image file (JPEG, PNG, or GIF).",
          variant: "destructive",
        });
        return;
      }
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please choose an image smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      setPictureFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pictureFile || !selectedGiftId || !eventType) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields and select an image.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('picture', pictureFile);
    formData.append('giftId', selectedGiftId);
    formData.append('event', eventType);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/moments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const newMoment = await res.json();
        setMoments([newMoment, ...moments]);
        setIsUploadModalOpen(false);
        setSelectedGiftId('');
        setEventType('');
        setPictureFile(null);
        toast({
          title: "Moment uploaded",
          description: "Your moment has been successfully uploaded.",
        });
      } else {
        const error = await res.json();
        toast({
          title: "Upload failed",
          description: error.msg || "Failed to upload moment.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error uploading moment:', err);
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (moment: Moment) => {
    setMomentToDelete(moment);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!momentToDelete) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/moments/${momentToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setMoments(moments.filter(m => m.id !== momentToDelete.id));
        toast({
          title: "Moment deleted",
          description: "The moment has been successfully deleted.",
        });
        setDeleteModalOpen(false);
        setMomentToDelete(null);
      } else {
        toast({
          title: "Delete failed",
          description: "Failed to delete moment.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error deleting moment:', err);
      toast({
        title: "Delete failed",
        description: "An error occurred while deleting.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Group moments by gift
  const momentsByGift = moments.reduce((acc, moment) => {
    const giftId = moment.gift.id;
    if (!acc[giftId]) {
      acc[giftId] = {
        gift: moment.gift,
        moments: []
      };
    }
    acc[giftId].moments.push(moment);
    return acc;
  }, {} as Record<number, { gift: MomentGift; moments: Moment[] }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading moments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Moments</h2>
          <p className="text-gray-600 mt-1">Capture and share special moments from your events</p>
        </div>
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90">
              <Upload className="w-4 h-4 mr-2" />
              Upload Moment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload a Moment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <Label htmlFor="gift">Select Event</Label>
                <Select value={selectedGiftId} onValueChange={setSelectedGiftId}>
                  <SelectTrigger>
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
              </div>

              <div>
                <Label htmlFor="event">Event Type</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wedding">Wedding Ceremony</SelectItem>
                    <SelectItem value="reception">Reception</SelectItem>
                    <SelectItem value="cake-cutting">Cake Cutting</SelectItem>
                    <SelectItem value="first-dance">First Dance</SelectItem>
                    <SelectItem value="speeches">Speeches</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="picture">Photo</Label>
                <Input
                  id="picture"
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {pictureFile && (
                  <p className="text-sm text-green-600 mt-1">
                    Selected: {pictureFile.name}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {Object.keys(momentsByGift).length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No moments yet</h3>
            <p className="text-gray-600 mb-6">
              Start capturing special moments from your events. Upload photos to share memories with your guests.
            </p>
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Your First Moment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(momentsByGift).map(([giftId, { gift, moments: giftMoments }]) => (
            <Card key={giftId} className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Gift className="w-5 h-5 text-purple-500" />
                  {gift.title}
                  <span className="text-sm font-normal text-gray-500">
                    ({giftMoments.length} moment{giftMoments.length !== 1 ? 's' : ''})
                  </span>
                </CardTitle>
                {gift.date && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(gift.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {giftMoments.map((moment) => (
                    <div key={moment.id} className="relative group">
                      <img
                        src={moment.imageUrl}
                        alt={moment.event}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
                      <div className="absolute top-2 right-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                          onClick={() => handleDeleteClick(moment)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 rounded-b-lg">
                        <p className="text-white text-sm font-medium capitalize">
                          {moment.event.replace('-', ' ')}
                        </p>
                        <p className="text-white/80 text-xs">
                          {new Date(moment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Moment</DialogTitle>
            <p className="text-sm text-gray-600">Are you sure you want to delete this moment? This action cannot be undone.</p>
          </DialogHeader>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setDeleteModalOpen(false);
                setMomentToDelete(null);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Moments;