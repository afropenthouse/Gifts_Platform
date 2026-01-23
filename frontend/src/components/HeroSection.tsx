import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Gift, X, AlertCircle, CheckCircle, ImageIcon, Calendar } from "lucide-react";

const HeroSection = () => {
  const { user, openLoginModal } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picture, setPicture] = useState('');
  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [customType, setCustomType] = useState('');
  const [fileError, setFileError] = useState('');

  const handleCreateGiftClick = () => {
    if (!user) {
      openLoginModal();
    } else {
      setIsModalOpen(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileError('');
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        setFileError(`File size (${fileSizeInMB}MB) exceeds the maximum allowed size of 6MB. Please choose a smaller image.`);
        setPictureFile(null);
        setPicture('');
        e.target.value = '';
        return;
      }

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setFileError('Please upload a valid image file (JPEG, PNG, or GIF).');
        setPictureFile(null);
        setPicture('');
        e.target.value = '';
        return;
      }

      setPictureFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (fileError) {
      alert('Please fix the file upload error before submitting.');
      return;
    }

    const formData = new FormData();
    formData.append('type', type);
    formData.append('title', title);
    formData.append('date', date);

    if (pictureFile) {
      formData.append('picture', pictureFile);
    }

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
        setType('');
        setTitle('');
        setDate('');
        setPictureFile(null);
        setPicture('');
        setFileError('');
        setGroomName('');
        setBrideName('');
        setCustomType('');
        setIsModalOpen(false);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
    <section className="min-h-[calc(100vh-80px)] md:min-h-[60vh] flex flex-col-reverse lg:flex-row items-center bg-white px-4 md:px-6 pt-1 md:pt-2 pb-8 md:pb-10">
      {/* Content */}
      <div className="flex-1 w-full text-center lg:text-left px-0 lg:px-6 py-0 md:py-2 lg:py-4 max-w-4xl mx-auto lg:mx-0">
        {/* Main heading */}
        <h1 
          className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold text-foreground mb-4 md:mb-6 leading-snug md:leading-tight"
        >
          <span style={{ color: '#2E235C' }}>Everything your </span>
          <span className="text-gold" style={{ color: '#C9A14A' }}>Wedding needs</span>
          <span style={{ color: '#2E235C' }}>.</span>
          <br />
          <span className="font-serif font-semibold block" style={{ color: '#2E235C' }}>In one simple link.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-lg lg:text-xl text-black max-w-xl mb-6 md:mb-8 mx-auto lg:mx-0 font-sans font-thin">
          Manage guests, collect cash gifts, sell Aso-ebi, and manage vendor payments - all in one place.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 md:gap-4">
          <Button 
            size="lg" 
            onClick={handleCreateGiftClick}
            className="w-full sm:w-auto px-8 py-6 text-base md:text-lg"
            style={{ backgroundColor: '#2E235C' }}
          >
            Create RSVP Link
          </Button>
        </div>
      </div>

      {/* Images - Hidden on small mobile, shown on medium and up */}
      <div className="flex-1 w-full lg:w-auto mt-8 lg:mt-0 mb-6 lg:mb-0 px-0 lg:px-4 flex items-center justify-center">
        <img 
          src="/6ty1.JPG" 
          alt="Celebration" 
          className="w-full max-w-[260px] sm:max-w-[300px] lg:max-w-[200px] xl:max-w-xs h-auto rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
        />
      </div>
    </section>

    {/* Create Gift Modal - Responsive Dialog */}
    <Dialog open={isModalOpen} onOpenChange={(open) => {
      setIsModalOpen(open);
      if (!open) {
        setType('');
        setTitle('');
        setDate('');
        setPicture('');
        setPictureFile(null);
        setFileError('');
        setGroomName('');
        setBrideName('');
        setCustomType('');
      }
    }}>
      <DialogContent className="max-w-[90vw] sm:max-w-[500px] p-0 border-0 shadow-2xl rounded-2xl bg-white overflow-auto max-h-[80vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-[#2E235C]/10 to-[#2E235C]/10 rounded-lg">
              <Gift className="w-5 h-5 text-[#2E235C]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">Create RSVP Link</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">Share your special moment and receive gifts</p>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          <div className="space-y-5 mt-4">
            <div>
              <Label className="text-sm font-medium text-gray-900 mb-2 block">
                Event Type
              </Label>
              <Select onValueChange={setType} value={type}>
                <SelectTrigger className="w-full h-11 border-gray-300 bg-white hover:bg-gray-50 transition-colors">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent className="border-0 shadow-lg">
                  <SelectItem value="wedding">Wedding</SelectItem>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="graduation">Graduation</SelectItem>
                  <SelectItem value="convocation">Convocation</SelectItem>
                  <SelectItem value="baby-shower">Baby Shower</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {type === 'other' && (
              <div>
                <Label htmlFor="customType" className="text-sm font-medium text-gray-900 mb-2 block">
                  Custom Type
                </Label>
                <Input
                  id="customType"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                  placeholder="Enter custom event type"
                />
              </div>
            )}

            <div>
              <Label htmlFor="title" className="text-sm font-medium text-gray-900 mb-2 block">
                Event Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                placeholder="e.g. James & Jane's Wedding"
                required
              />
            </div>

            <div>
              <Label htmlFor="date" className="text-sm font-medium text-gray-900 mb-2 block">
                <Calendar className="inline w-4 h-4 mr-2 text-gray-600" />
                Event Date
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
              />
            </div>

            <div>
              <Label htmlFor="picture" className="text-sm font-medium text-gray-900 mb-2 block">
                <ImageIcon className="inline w-4 h-4 mr-2 text-gray-600" />
                Event Invite
              </Label>
              <div className="mt-2">
                {picture ? (
                  <div className="relative mb-4">
                    <img 
                      src={picture} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPicture('');
                        setPictureFile(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-[#2E235C] text-white rounded-full hover:bg-[#2E235C]/90 transition-colors shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#2E235C]/50 transition-colors cursor-pointer bg-gray-50/50">
                    <Input
                      id="picture"
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/gif"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="picture" className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="text-sm font-medium text-gray-900 mb-1">Click to upload image</p>
                        <p className="text-xs text-gray-500">JPEG, PNG or GIF (Max 6MB)</p>
                      </div>
                    </label>
                  </div>
                )}
                {fileError && (
                  <p className="text-sm text-[#2E235C] mt-2 font-medium flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {fileError}
                  </p>
                )}
                {pictureFile && !fileError && (
                  <p className="text-sm text-green-600 mt-2 font-medium flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Selected: {pictureFile.name} ({(pictureFile.size / (1024 * 1024)).toFixed(2)}MB)
                  </p>
                )}
              </div>
            </div>

            {type === 'wedding' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="groomName" className="text-sm font-medium text-gray-900 mb-2 block">
                      Groom's Name
                    </Label>
                    <Input
                      id="groomName"
                      value={groomName}
                      onChange={(e) => setGroomName(e.target.value)}
                      className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                      placeholder="Enter groom's name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="brideName" className="text-sm font-medium text-gray-900 mb-2 block">
                      Bride's Name
                    </Label>
                    <Input
                      id="brideName"
                      value={brideName}
                      onChange={(e) => setBrideName(e.target.value)}
                      className="h-11 border-gray-300 focus:border-[#2E235C] focus:ring-[#2E235C]/20"
                      placeholder="Enter bride's name"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90"
              disabled={!type || !title || !date}
            >
              Create Gift
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default HeroSection;