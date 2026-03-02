import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { ImageIcon, Upload, X, Calendar, Gift, Filter, Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface Moment {
  id: number;
  imageUrl: string;
  event: string;
  createdAt: string;
  Gift?: {
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
  onTabChange: (tab: string) => void;
}

const Moments: React.FC<MomentsProps> = ({ gifts, onTabChange }) => {
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
  const [filterGiftId, setFilterGiftId] = useState<string>('all');
  const [viewingMoment, setViewingMoment] = useState<Moment | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const handleDownload = async (e: React.MouseEvent, imageUrl: string, filename: string) => {
    e.stopPropagation();
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'moment.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(imageUrl, '_blank');
    }
  };

  const handleDownloadAll = async (momentsToDownload?: any, folderName: string = "all-moments") => {
    // Ensure we have an array. If momentsToDownload is a React event, use getVisibleMoments instead.
    const visibleMoments = Array.isArray(momentsToDownload) ? momentsToDownload : getVisibleMoments();
    if (visibleMoments.length === 0) return;

    setDownloadingAll(true);
    const zip = new JSZip();
    const folder = zip.folder(folderName);

    try {
      toast({
        title: "Preparing download",
        description: `Downloading ${visibleMoments.length} moments...`,
      });

      const downloadPromises = visibleMoments.map(async (moment) => {
        try {
          const response = await fetch(moment.imageUrl);
          const blob = await response.blob();
          const extension = moment.imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
          folder?.file(`moment-${moment.id}.${extension}`, blob);
        } catch (err) {
          console.error(`Failed to download image ${moment.id}:`, err);
        }
      });

      await Promise.all(downloadPromises);
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${folderName}-${new Date().getTime()}.zip`);

      toast({
        title: "Download complete",
        description: "Your moments have been zipped and downloaded.",
      });
    } catch (err) {
      console.error('Error creating zip:', err);
      toast({
        title: "Download failed",
        description: "An error occurred while preparing the download.",
        variant: "destructive",
      });
    } finally {
      setDownloadingAll(false);
    }
  };

  // Group moments by gift
  const momentsByGift = moments.reduce((acc, moment) => {
    if (!moment.Gift) return acc;
    const giftId = moment.Gift.id;
    if (!acc[giftId]) {
      acc[giftId] = {
        gift: moment.Gift,
        moments: []
      };
    }
    acc[giftId].moments.push(moment);
    return acc;
  }, {} as Record<number, { gift: MomentGift; moments: Moment[] }>);

  const getVisibleMoments = () => {
    return Object.entries(momentsByGift)
      .filter(([giftId]) => filterGiftId === 'all' || giftId === filterGiftId)
      .flatMap(([_, { moments }]) => moments);
  };

  const handleNextMoment = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!viewingMoment) return;
    const visibleMoments = getVisibleMoments();
    const currentIndex = visibleMoments.findIndex(m => m.id === viewingMoment.id);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % visibleMoments.length;
    setViewingMoment(visibleMoments[nextIndex]);
  };

  const handlePrevMoment = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!viewingMoment) return;
    const visibleMoments = getVisibleMoments();
    const currentIndex = visibleMoments.findIndex(m => m.id === viewingMoment.id);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + visibleMoments.length) % visibleMoments.length;
    setViewingMoment(visibleMoments[prevIndex]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!viewingMoment) return;
      if (e.key === 'ArrowRight') handleNextMoment();
      if (e.key === 'ArrowLeft') handlePrevMoment();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingMoment, filterGiftId, moments]);

  const showNavigation = getVisibleMoments().length > 1;

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
          <p className="text-gray-600 mt-1">Let guests capture and share moments with your event QR code</p>
        </div>
        <div className="flex items-center gap-3">
          {moments.length > 0 && (
            <Button
              onClick={() => handleDownloadAll()}
              disabled={downloadingAll}
              variant="outline"
              className="border-[#2E235C] text-[#2E235C] hover:bg-[#2E235C] hover:text-white transition-colors"
            >
              {downloadingAll ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Zipping...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </>
              )}
            </Button>
          )}
          <Button 
            onClick={() => onTabChange('qr')} 
            className="bg-[#2E235C] hover:bg-[#2E235C]/90 whitespace-nowrap"
          >
            Get event QR code
          </Button>
        </div>
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogTrigger asChild>
            {/* <Button className="bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90">
              <Upload className="w-4 h-4 mr-2" />
              Upload Moment
            </Button> */}
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

      {Object.keys(momentsByGift).length > 0 && (
        <div className="flex items-center justify-end gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <Select value={filterGiftId} onValueChange={setFilterGiftId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {gifts.map((gift) => (
                <SelectItem key={gift.id} value={gift.id.toString()}>
                  {gift.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {Object.keys(momentsByGift).length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No moments yet</h3>
            <p className="text-gray-600 mb-6">
              Share your wedding QR code at your event and let guests upload photos, videos, and memories you can relive here.
            </p>
            <Button
              onClick={() => onTabChange('qr')}
              className="bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90"
            >
              <Upload className="w-4 h-4 mr-2" />
              Share your QR code
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(momentsByGift).filter(([giftId]) => filterGiftId === 'all' || giftId === filterGiftId).length === 0 && (
             <div className="text-center py-12 text-gray-500">No moments found for this event.</div>
          )}
          {Object.entries(momentsByGift)
            .filter(([giftId]) => filterGiftId === 'all' || giftId === filterGiftId)
            .map(([giftId, { gift, moments: giftMoments }]) => (
            <Card key={giftId} className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-3">
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
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#2E235C] hover:bg-[#2E235C] hover:text-white transition-colors"
                  onClick={() => handleDownloadAll(giftMoments, gift.title.replace(/\s+/g, '-').toLowerCase())}
                  disabled={downloadingAll}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download all for this event
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {giftMoments.map((moment) => (
                    <div 
                      key={moment.id} 
                      className="relative group cursor-pointer"
                      onClick={() => setViewingMoment(moment)}
                    >
                      <img
                        src={moment.imageUrl}
                        alt={moment.event}
                        className="w-full aspect-square md:aspect-auto md:h-48 object-cover rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
                      
                      {/* Actions overlay */}
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 bg-white/90 hover:bg-white"
                          onClick={(e) => handleDownload(e, moment.imageUrl, `moment-${moment.id}.jpg`)}
                          title="Download"
                        >
                          <Download className="w-4 h-4 text-gray-700" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(moment);
                          }}
                          title="Delete"
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

      {/* View Moment Modal */}
      <Dialog open={!!viewingMoment} onOpenChange={(open) => !open && setViewingMoment(null)}>
        <DialogContent className="max-w-4xl w-full p-1 bg-transparent border-0 shadow-none [&>button]:hidden">
          {viewingMoment && (
            <div className="relative flex flex-col items-center justify-center">
              <div className="relative w-fit mx-auto">
                {showNavigation && (
                  <Button
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 h-10 w-10 backdrop-blur-sm"
                    onClick={handlePrevMoment}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                )}

                <img
                  src={viewingMoment.imageUrl}
                  alt={viewingMoment.event}
                  className="max-h-[85vh] w-auto max-w-full rounded-lg shadow-2xl"
                />

                {showNavigation && (
                  <Button
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 h-10 w-10 backdrop-blur-sm"
                    onClick={handleNextMoment}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                )}

                <Button
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 h-10 w-10 backdrop-blur-sm"
                  onClick={() => setViewingMoment(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
                <Button
                  className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-black rounded-full p-2 h-10 w-10 shadow-lg backdrop-blur-sm"
                  onClick={(e) => handleDownload(e, viewingMoment.imageUrl, `moment-${viewingMoment.id}.jpg`)}
                >
                  <Download className="w-5 h-5" />
                </Button>
              </div>
              <div className="mt-4 bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-lg">
                <p className="text-gray-900 font-medium capitalize">
                  {viewingMoment.event.replace('-', ' ')}
                  <span className="text-gray-500 mx-2">•</span>
                  <span className="text-gray-600 font-normal">
                    {new Date(viewingMoment.createdAt).toLocaleDateString()}
                  </span>
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Moments;
