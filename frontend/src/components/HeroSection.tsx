import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const HeroSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [customType, setCustomType] = useState('');

  const handleCreateGiftClick = () => {
    if (!user) {
      navigate('/login');
    } else {
      setIsModalOpen(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPictureFile(file);
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
        setIsModalOpen(false);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
    <section className="min-h-[60vh] flex items-center bg-gradient-hero">
      {/* Content */}
      <div className="flex-1 text-left px-6 py-16 max-w-3xl">
        {/* Main heading */}
        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-semibold text-foreground mb-6 leading-tight opacity-0 animate-fade-in-up delay-100" style={{ animationFillMode: 'forwards' }}>
          Share Your {" "}
          <span className="text-rose font-medium">Celebration</span>
          <span className="block text-gold font-medium">Receive Cash Gifts</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-black max-w-xl mb-8 font-sans opacity-0 animate-fade-in-up delay-200 font-medium" style={{ animationFillMode: 'forwards' }}>
          One trusted link to share your celebration and receive all your cash gifts in one place.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-start gap-4 opacity-0 animate-fade-in-up delay-300" style={{ animationFillMode: 'forwards' }}>
          <Button variant="hero" size="lg" onClick={handleCreateGiftClick}>
            Create Your Gift Link
          </Button>
        </div>
      </div>

      {/* Images */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4">
        <img src="/wedd.jpg" alt="" className="w-full h-48 object-cover object-top rounded-lg" />
        <img src="/grad.jpg" alt="" className="w-full h-48 object-cover object-top rounded-lg" />
        <img src="/conv.jpg" alt="" className="w-full h-48 object-cover object-top rounded-lg" />
        <img src="/Bode.jpg" alt="" className="w-full h-48 object-cover object-top rounded-lg" />


      </div>
    </section>

    {/* Create Gift Modal */}
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Gift</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
      </DialogContent>
    </Dialog>
    </>
  );
};

export default HeroSection;
