import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';

const CreateGift: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [customType, setCustomType] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if image is portrait
      const img = new Image();
      img.onload = () => {
        if (img.naturalHeight >= img.naturalWidth) {
          setPictureFile(file);
        } else {
          alert('Please select a portrait image (height should be greater than or equal to width).');
          e.target.value = ''; // Reset the input
        }
      };
      img.onerror = () => {
        alert('Invalid image file.');
        e.target.value = '';
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}/gift/${shareLink}`;
    navigator.clipboard.writeText(fullUrl);
    alert('Link copied to clipboard!');
  };

  const handleShareWithFriends = () => {
    const fullUrl = `${window.location.origin}/gift/${shareLink}`;
    if (navigator.share) {
      navigator.share({
        title: 'Check out this gift!',
        text: 'Join me in celebrating this special occasion.',
        url: fullUrl,
      });
    } else {
      navigator.clipboard.writeText(fullUrl);
      alert('Link copied to clipboard! Share it with your friends.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('type', type);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('date', date);

    // Add picture file if selected
    if (pictureFile) {
      formData.append('picture', pictureFile);
    }

    // Add details
    const details = {} as any;
    if (type === 'wedding') {
      details.groomName = groomName;
      details.brideName = brideName;
    }
    formData.append('details', JSON.stringify(details));

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
        const data = await res.json();
        setShareLink(data.shareLink);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-2xl font-bold">Create Gift</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <Label>Event Type</Label>
          <Select onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
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
            <Label htmlFor="customType">Custom Type</Label>
            <Input
              id="customType"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
            />
          </div>
        )}
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2 border p-4 rounded-lg">
          <Checkbox 
            id="sellAsoebi" 
            checked={isSellingAsoebi}
            onCheckedChange={(checked) => setIsSellingAsoebi(checked as boolean)}
          />
          <Label htmlFor="sellAsoebi" className="text-sm font-medium text-gray-900">
            Sell Asoebi for this event?
          </Label>
        </div>

        {isSellingAsoebi && (
          <div>
            <Label htmlFor="asoebiPrice">Asoebi Price (₦)</Label>
            <Input
              id="asoebiPrice"
              type="number"
              value={asoebiPrice}
              onChange={(e) => setAsoebiPrice(e.target.value)}
              placeholder="Enter price per Asoebi"
              required={isSellingAsoebi}
            />
          </div>
        )}

        <div>
          <Label htmlFor="picture">Picture</Label>
          <Input
            id="picture"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
          {pictureFile && <p className="text-sm text-muted-foreground mt-1">Selected: {pictureFile.name}</p>}
        </div>
        {type === 'wedding' && (
          <>
            <div>
              <Label htmlFor="groomName">Groom Name</Label>
              <Input
                id="groomName"
                value={groomName}
                onChange={(e) => setGroomName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="brideName">Bride Name</Label>
              <Input
                id="brideName"
                value={brideName}
                onChange={(e) => setBrideName(e.target.value)}
              />
            </div>
          </>
        )}
        <Button type="submit">Create Gift</Button>
      </form>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Link Created!</DialogTitle>
            <DialogDescription className="text-center">
              Your gift link has been created successfully. Share it with friends and family to start receiving contributions.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 mt-4">
            <Button onClick={handleCopyLink} className="flex-1">
              Copy Link
            </Button>
            <Button onClick={handleShareWithFriends} variant="outline" className="flex-1">
              Share with Friends
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateGift;