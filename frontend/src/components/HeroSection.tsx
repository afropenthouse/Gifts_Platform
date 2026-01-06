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
    <section className="min-h-[calc(100vh-80px)] md:min-h-[60vh] flex flex-col lg:flex-row items-center bg-gradient-hero px-4 md:px-6 py-12 md:py-16">
      {/* Content */}
      <div className="flex-1 w-full text-center lg:text-left px-0 lg:px-6 py-6 md:py-8 lg:py-16 max-w-4xl mx-auto lg:mx-0">
        {/* Main heading */}
        <h1 
          className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-foreground mb-4 md:mb-6 leading-snug md:leading-tight"
        >
          Share Your {" "}
          <span className="text-rose font-medium block md:inline">Celebration</span>
          <span className="text-gold font-medium block">Receive Cash Gifts</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-lg lg:text-xl text-black max-w-xl mb-6 md:mb-8 mx-auto lg:mx-0 font-sans font-medium">
          One trusted link to share your celebration and receive all your cash gifts in one place.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 md:gap-4">
          <Button 
            variant="hero" 
            size="lg" 
            onClick={handleCreateGiftClick}
            className="w-full sm:w-auto px-8 py-6 text-base md:text-lg"
          >
            Create Your Gift Link
          </Button>
        </div>
      </div>

      {/* Images - Hidden on small mobile, shown on medium and up */}
      <div className="flex-1 w-full lg:w-auto mt-8 lg:mt-0 px-0 lg:px-4">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 p-2 md:p-4">
          <img 
            src="/wedd.jpg" 
            alt="Wedding celebration" 
            className="w-full h-40 sm:h-48 md:h-56 lg:h-48 xl:h-56 object-cover object-top rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
          />
          <img 
            src="/grad.jpg" 
            alt="Graduation celebration" 
            className="w-full h-40 sm:h-48 md:h-56 lg:h-48 xl:h-56 object-cover object-top rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
          />
          <img 
            src="/conv.jpg" 
            alt="Convocation celebration" 
            className="w-full h-40 sm:h-48 md:h-56 lg:h-48 xl:h-56 object-cover object-top rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
          />
          <img 
            src="/Bode.jpg" 
            alt="Birthday celebration" 
            className="w-full h-40 sm:h-48 md:h-56 lg:h-48 xl:h-56 object-cover object-top rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
          />
        </div>
      </div>
    </section>

    {/* Create Gift Modal - Responsive Dialog */}
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="w-[95vw] max-w-md sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-serif">Create Your Gift Collection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="type" className="text-sm md:text-base">Event Type *</Label>
              <Select onValueChange={setType} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select event type" />
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

            <div className="space-y-3">
              <Label htmlFor="date" className="text-sm md:text-base">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full"
              />
            </div>
          </div>

          {type === 'other' && (
            <div className="space-y-3">
              <Label htmlFor="customType" className="text-sm md:text-base">Custom Event Type *</Label>
              <Input
                id="customType"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                required
                placeholder="e.g., Baby Shower, Housewarming"
              />
            </div>
          )}

          <div className="space-y-3">
            <Label htmlFor="title" className="text-sm md:text-base">Event Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., John & Jane's Wedding"
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="description" className="text-sm md:text-base">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell your story... What makes this celebration special?"
              className="min-h-[100px]"
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="picture" className="text-sm md:text-base">Cover Image</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-rose/50 transition-colors">
              <Input
                id="picture"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Label 
                htmlFor="picture" 
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-12 h-12 bg-rose/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-rose" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium">
                  {pictureFile ? pictureFile.name : "Click to upload image"}
                </span>
                <span className="text-xs text-muted-foreground">
                  PNG, JPG or JPEG (max. 5MB)
                </span>
              </Label>
            </div>
            {pictureFile && (
              <p className="text-sm text-green-600 mt-1">
                ✓ Selected: {pictureFile.name}
              </p>
            )}
          </div>

          {type === 'wedding' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-3">
                <Label htmlFor="groomName" className="text-sm md:text-base">Groom's Name</Label>
                <Input
                  id="groomName"
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                  placeholder="Groom's full name"
                  className="w-full"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="brideName" className="text-sm md:text-base">Bride's Name</Label>
                <Input
                  id="brideName"
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  placeholder="Bride's full name"
                  className="w-full"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="submit" 
              className="w-full sm:w-auto px-8 py-6 text-base bg-rose hover:bg-rose/90"
              disabled={!type || !title || !date}
            >
              Create Gift Collection
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              className="w-full sm:w-auto px-8 py-6 text-base"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default HeroSection;