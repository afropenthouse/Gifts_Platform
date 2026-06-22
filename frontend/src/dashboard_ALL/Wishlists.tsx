
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { useToast } from '../hooks/use-toast';
import { Heart, Plus, Edit, Trash2, Copy, ExternalLink, ShoppingBag, Image as ImageIcon, Upload, X, Calendar } from 'lucide-react';

interface WishlistItem {
  id: number;
  name: string;
  productUrl?: string;
  price?: number;
  quantity: number;
  purchased: number;
  imageUrl?: string;
  description?: string;
  isCashGiftAllowed: boolean;
}

interface Gift {
  id: number;
  type: string;
  title?: string;
  date?: string;
  picture?: string;
}

interface Wishlist {
  id: number;
  userId: number;
  giftId?: number;
  title: string;
  description?: string;
  address?: string;
  shareLink: string;
  items: WishlistItem[];
  createdAt: string;
  updatedAt: string;
  gift?: Gift;
}

interface WishlistsProps {
  onTabChange?: (tab: string) => void;
  preselectedGiftId?: number;
  onPreselectedGiftIdUsed?: () => void;
}

const Wishlists: React.FC<WishlistsProps> = ({ onTabChange, preselectedGiftId, onPreselectedGiftIdUsed }) => {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Modal states
  const [isCreateWishlistOpen, setIsCreateWishlistOpen] = useState(false);
  const [isEditWishlistOpen, setIsEditWishlistOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [isDeleteWishlistOpen, setIsDeleteWishlistOpen] = useState(false);
  const [isDeleteItemOpen, setIsDeleteItemOpen] = useState(false);

  // Current selected items
  const [selectedWishlist, setSelectedWishlist] = useState<Wishlist | null>(null);
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);

  // Form states
  const [wishlistTitle, setWishlistTitle] = useState('');
  const [wishlistDescription, setWishlistDescription] = useState('');
  const [wishlistAddress, setWishlistAddress] = useState('');
  const [wishlistGiftId, setWishlistGiftId] = useState<string>('none');

  // Fetch gifts/events
  const fetchGifts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gifts/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGifts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching gifts:', err);
    }
  };

  const [itemName, setItemName] = useState('');
  const [itemProductUrl, setItemProductUrl] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemImageFile, setItemImageFile] = useState<File | null>(null);
  const [itemDescription, setItemDescription] = useState('');
  const [itemIsCashGiftAllowed, setItemIsCashGiftAllowed] = useState(false);
  const [fileError, setFileError] = useState('');

  const fetchWishlists = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/wishlists/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWishlists(data);
      }
    } catch (err) {
      console.error('Error fetching wishlists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlists();
    fetchGifts();
  }, []);

  // When preselectedGiftId changes and create modal is open, select it
  useEffect(() => {
    if (preselectedGiftId) {
      setWishlistGiftId(preselectedGiftId.toString());
      setIsCreateWishlistOpen(true);
      if (onPreselectedGiftIdUsed) {
        onPreselectedGiftIdUsed();
      }
    }
  }, [preselectedGiftId, onPreselectedGiftIdUsed]);

  const handleCreateWishlist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/wishlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: wishlistTitle,
          description: wishlistDescription || null,
          address: wishlistAddress || null,
          giftId: wishlistGiftId === 'none' ? null : parseInt(wishlistGiftId),
        }),
      });

      if (res.ok) {
        const newWishlist = await res.json();
        setWishlists([newWishlist, ...wishlists]);
        setIsCreateWishlistOpen(false);
        resetWishlistForm();
        toast({
          title: 'Wishlist created',
          description: 'Your wishlist has been successfully created.',
        });
      } else {
        toast({
          title: 'Failed to create wishlist',
          description: 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error creating wishlist:', err);
    }
  };

  const handleEditWishlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWishlist) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/wishlists/${selectedWishlist.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: wishlistTitle,
          description: wishlistDescription || null,
          address: wishlistAddress || null,
          giftId: wishlistGiftId === 'none' ? null : parseInt(wishlistGiftId),
        }),
      });

      if (res.ok) {
        const updatedWishlist = await res.json();
        setWishlists(wishlists.map(w => w.id === updatedWishlist.id ? updatedWishlist : w));
        setIsEditWishlistOpen(false);
        resetWishlistForm();
        toast({
          title: 'Wishlist updated',
          description: 'Your wishlist has been successfully updated.',
        });
      }
    } catch (err) {
      console.error('Error updating wishlist:', err);
    }
  };

  const handleDeleteWishlist = async () => {
    if (!selectedWishlist) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/wishlists/${selectedWishlist.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setWishlists(wishlists.filter(w => w.id !== selectedWishlist.id));
        setIsDeleteWishlistOpen(false);
        setSelectedWishlist(null);
        toast({
          title: 'Wishlist deleted',
          description: 'Your wishlist has been deleted.',
        });
      }
    } catch (err) {
      console.error('Error deleting wishlist:', err);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWishlist) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', itemName);
      if (itemProductUrl) formData.append('productUrl', itemProductUrl);
      if (itemPrice) formData.append('price', itemPrice);
      if (itemQuantity) formData.append('quantity', itemQuantity);
      if (itemImageUrl) formData.append('imageUrl', itemImageUrl);
      if (itemDescription) formData.append('description', itemDescription);
      if (itemImageFile) formData.append('image', itemImageFile);
      formData.append('isCashGiftAllowed', itemIsCashGiftAllowed.toString());

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/wishlists/${selectedWishlist.id}/items`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const newItem = await res.json();
        setWishlists(wishlists.map(w => {
          if (w.id === selectedWishlist.id) {
            return { ...w, items: [...w.items, newItem] };
          }
          return w;
        }));
        setIsAddItemOpen(false);
        resetItemForm();
        toast({
          title: 'Item added',
          description: 'Item has been added to your wishlist.',
        });
      }
    } catch (err) {
      console.error('Error adding item:', err);
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWishlist || !selectedItem) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', itemName);
      if (itemProductUrl) formData.append('productUrl', itemProductUrl);
      if (itemPrice) formData.append('price', itemPrice);
      if (itemQuantity) formData.append('quantity', itemQuantity);
      if (itemImageUrl) formData.append('imageUrl', itemImageUrl);
      if (itemDescription) formData.append('description', itemDescription);
      if (itemImageFile) formData.append('image', itemImageFile);
      formData.append('isCashGiftAllowed', itemIsCashGiftAllowed.toString());

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/wishlists/${selectedWishlist.id}/items/${selectedItem.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const updatedItem = await res.json();
        setWishlists(wishlists.map(w => {
          if (w.id === selectedWishlist.id) {
            return {
              ...w,
              items: w.items.map(i => i.id === updatedItem.id ? updatedItem : i)
            };
          }
          return w;
        }));
        setIsEditItemOpen(false);
        resetItemForm();
        toast({
          title: 'Item updated',
          description: 'Item has been updated.',
        });
      }
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedWishlist || !selectedItem) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/wishlists/${selectedWishlist.id}/items/${selectedItem.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setWishlists(wishlists.map(w => {
          if (w.id === selectedWishlist.id) {
            return { ...w, items: w.items.filter(i => i.id !== selectedItem.id) };
          }
          return w;
        }));
        setIsDeleteItemOpen(false);
        setSelectedItem(null);
        toast({
          title: 'Item deleted',
          description: 'Item has been removed from your wishlist.',
        });
      }
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const resetWishlistForm = () => {
    setWishlistTitle('');
    setWishlistDescription('');
    setWishlistAddress('');
    setWishlistGiftId('');
  };

  const resetItemForm = () => {
    setItemName('');
    setItemProductUrl('');
    setItemPrice('');
    setItemQuantity('1');
    setItemImageUrl('');
    setItemImageFile(null);
    setItemDescription('');
    setItemIsCashGiftAllowed(false);
    setFileError('');
  };

  const openEditWishlistModal = (wishlist: Wishlist) => {
    setSelectedWishlist(wishlist);
    setWishlistTitle(wishlist.title);
    setWishlistDescription(wishlist.description || '');
    setWishlistAddress(wishlist.address || '');
    setWishlistGiftId(wishlist.giftId ? wishlist.giftId.toString() : '');
    setIsEditWishlistOpen(true);
  };

  const openAddItemModal = (wishlist: Wishlist) => {
    setSelectedWishlist(wishlist);
    setIsAddItemOpen(true);
  };

  const openEditItemModal = (wishlist: Wishlist, item: WishlistItem) => {
    setSelectedWishlist(wishlist);
    setSelectedItem(item);
    setItemName(item.name);
    setItemProductUrl(item.productUrl || '');
    setItemPrice(item.price?.toString() || '');
    setItemQuantity(item.quantity.toString());
    setItemImageUrl(item.imageUrl || '');
    setItemImageFile(null);
    setItemDescription(item.description || '');
    setItemIsCashGiftAllowed((item as any).isCashGiftAllowed || false);
    setIsEditItemOpen(true);
  };

  const copyShareLink = (wishlist: Wishlist) => {
    const shareLink = `${window.location.origin}/wishlist/${wishlist.shareLink.replace('wishlist/', '')}`;
    navigator.clipboard.writeText(shareLink);
    toast({
      title: 'Link copied!',
      description: 'Wishlist link has been copied to clipboard.',
    });
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 6 * 1024 * 1024; // 6MB
      if (file.size > maxSize) {
        setFileError('File size must be less than 6MB');
        return;
      }
      setFileError('');
      setItemImageFile(file);
    }
  };

  const clearImageFile = () => {
    setItemImageFile(null);
    setFileError('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Wishlist</h2>
          <p className="text-gray-600 mt-1">Create a wishlist and share it with friends and family</p>
        </div>
        <Dialog open={isCreateWishlistOpen} onOpenChange={setIsCreateWishlistOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#2E235C] hover:bg-[#2E235C]/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Wishlist
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Wishlist</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateWishlist} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={wishlistTitle}
                  onChange={(e) => setWishlistTitle(e.target.value)}
                  placeholder="e.g., Wedding Registry"
                  required
                />
              </div>
              {gifts.length > 0 && (
                <div>
                  <Label htmlFor="gift">Select Event</Label>
                  <Select
                    value={wishlistGiftId}
                    onValueChange={setWishlistGiftId}
                    required
                  >
                    <SelectTrigger id="gift">
                      <SelectValue placeholder="Select an event..." />
                    </SelectTrigger>
                    <SelectContent>
                      {gifts.map((gift) => (
                        <SelectItem key={gift.id} value={gift.id.toString()}>
                          {gift.title || gift.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={wishlistDescription}
                  onChange={(e) => setWishlistDescription(e.target.value)}
                  placeholder="Tell people what this wishlist is for..."
                />
              </div>
              <div>
                <Label htmlFor="address">Delivery Address</Label>
                <Textarea
                  id="address"
                  value={wishlistAddress}
                  onChange={(e) => setWishlistAddress(e.target.value)}
                  placeholder="Where should gifts be delivered?"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsCreateWishlistOpen(false);
                    resetWishlistForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-[#2E235C] hover:bg-[#2E235C]/90">
                  Create
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {wishlists.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No wishlist yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first wishlist to start collecting gifts from friends and family.
            </p>
            <Button
              onClick={() => setIsCreateWishlistOpen(true)}
              className="bg-[#2E235C] hover:bg-[#2E235C]/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Wishlist
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {wishlists.map((wishlist) => (
            <Card key={wishlist.id} className="border-0 shadow-lg">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 space-y-0 pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                    <Heart className="w-5 h-5 text-[#2E235C]" />
                    {wishlist.title}
                  </CardTitle>
                  {wishlist.gift && (
                    <p className="text-sm text-purple-600 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Linked to: {wishlist.gift.title || wishlist.gift.type}
                    </p>
                  )}
                  {wishlist.description && (
                    <p className="text-sm text-gray-600">{wishlist.description}</p>
                  )}
                  {wishlist.address && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span>📍</span> {wishlist.address}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyShareLink(wishlist)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const shareLink = `${window.location.origin}/wishlist/${wishlist.shareLink.replace('wishlist/', '')}`;
                      window.open(shareLink, '_blank');
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditWishlistModal(wishlist)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setSelectedWishlist(wishlist);
                      setIsDeleteWishlistOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex justify-end mb-4">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => openAddItemModal(wishlist)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {wishlist.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No items in this wishlist yet. Add some!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlist.items.map((item) => (
                      <Card key={item.id} className="overflow-hidden group">
                        <div className="relative h-40 bg-gray-100">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-10 h-10 text-gray-300" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => openEditItemModal(wishlist, item)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setSelectedWishlist(wishlist);
                                setSelectedItem(item);
                                setIsDeleteItemOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                          {item.price && (
                            <p className="text-[#2E235C] font-bold mb-1">
                              ₦{item.price.toLocaleString()}
                            </p>
                          )}
                          <p className="text-xs text-gray-600 mb-2">
                            {item.purchased} of {item.quantity} purchased
                          </p>
                          {item.description && (
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          {item.productUrl && (
                            <a
                              href={item.productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline mt-2 inline-flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View Product
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <Dialog open={isEditWishlistOpen} onOpenChange={setIsEditWishlistOpen}>
        <DialogContent className="max-w-md h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Wishlist</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditWishlist} className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={wishlistTitle}
                onChange={(e) => setWishlistTitle(e.target.value)}
                required
              />
            </div>
            {gifts.length > 0 && (
                <div>
                  <Label htmlFor="edit-gift">Select Event</Label>
                  <Select
                    value={wishlistGiftId}
                    onValueChange={setWishlistGiftId}
                    required
                  >
                    <SelectTrigger id="edit-gift">
                      <SelectValue placeholder="Select an event..." />
                    </SelectTrigger>
                    <SelectContent>
                      {gifts.map((gift) => (
                        <SelectItem key={gift.id} value={gift.id.toString()}>
                          {gift.title || gift.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={wishlistDescription}
                onChange={(e) => setWishlistDescription(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Delivery Address</Label>
              <Textarea
                id="edit-address"
                value={wishlistAddress}
                onChange={(e) => setWishlistAddress(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsEditWishlistOpen(false);
                  resetWishlistForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-[#2E235C] hover:bg-[#2E235C]/90">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="max-w-md h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Item to Wishlist</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <Label htmlFor="item-name">Item Name *</Label>
              <Input
                id="item-name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g., Blender"
                required
              />
            </div>
            <div>
              <Label htmlFor="item-url">Product URL</Label>
              <Input
                id="item-url"
                value={itemProductUrl}
                onChange={(e) => setItemProductUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Allow Cash Gift Equivalent</Label>
              <RadioGroup
                value={itemIsCashGiftAllowed ? "yes" : "no"}
                onValueChange={(v) => setItemIsCashGiftAllowed(v === "yes")}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="yes" id="cash-gift-yes" />
                  <Label htmlFor="cash-gift-yes">Yes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="no" id="cash-gift-no" />
                  <Label htmlFor="cash-gift-no">No</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="item-price">Price (₦)</Label>
                <Input
                  id="item-price"
                  type="number"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="5000"
                />
              </div>
              <div>
                <Label htmlFor="item-quantity">Quantity</Label>
                <Input
                  id="item-quantity"
                  type="number"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  min="1"
                />
              </div>
            </div>
            <div>
              <Label>Item Image</Label>
              {itemImageFile ? (
                <div className="mt-2 relative">
                  <img
                    src={URL.createObjectURL(itemImageFile)}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                    onClick={clearImageFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="mt-2">
                  <Label
                    htmlFor="item-image-upload-add"
                    className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6 cursor-pointer hover:border-gray-400"
                  >
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-400 mt-1">Maximum size: 6MB</p>
                    </div>
                  </Label>
                  <Input
                    id="item-image-upload-add"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileChange}
                  />
                </div>
              )}
              {fileError && (
                <p className="text-red-500 text-sm mt-1">{fileError}</p>
              )}
            </div>
            <div>
              <Label htmlFor="item-image-url">Or Enter Image URL</Label>
              <Input
                id="item-image-url"
                value={itemImageUrl}
                onChange={(e) => setItemImageUrl(e.target.value)}
                placeholder="https://..."
                disabled={!!itemImageFile}
              />
            </div>
            <div>
              <Label htmlFor="item-desc">Description</Label>
              <Textarea
                id="item-desc"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="Tell people about this item..."
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsAddItemOpen(false);
                  resetItemForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-[#2E235C] hover:bg-[#2E235C]/90">
                Add Item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
        <DialogContent className="max-w-md h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditItem} className="space-y-4">
            <div>
              <Label htmlFor="edit-item-name">Item Name *</Label>
              <Input
                id="edit-item-name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-item-url">Product URL</Label>
              <Input
                id="edit-item-url"
                value={itemProductUrl}
                onChange={(e) => setItemProductUrl(e.target.value)}
              />
            </div>
            <div>
              <Label>Allow Cash Gift Equivalent</Label>
              <RadioGroup
                value={itemIsCashGiftAllowed ? "yes" : "no"}
                onValueChange={(v) => setItemIsCashGiftAllowed(v === "yes")}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="yes" id="edit-cash-gift-yes" />
                  <Label htmlFor="edit-cash-gift-yes">Yes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="no" id="edit-cash-gift-no" />
                  <Label htmlFor="edit-cash-gift-no">No</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-item-price">Price (₦)</Label>
                <Input
                  id="edit-item-price"
                  type="number"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-item-quantity">Quantity</Label>
                <Input
                  id="edit-item-quantity"
                  type="number"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  min="1"
                />
              </div>
            </div>
            <div>
              <Label>Item Image</Label>
              {itemImageFile ? (
                <div className="mt-2 relative">
                  <img
                    src={URL.createObjectURL(itemImageFile)}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                    onClick={clearImageFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="mt-2">
                  <Label
                    htmlFor="item-image-upload-edit"
                    className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6 cursor-pointer hover:border-gray-400"
                  >
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-400 mt-1">Maximum size: 6MB</p>
                    </div>
                  </Label>
                  <Input
                    id="item-image-upload-edit"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileChange}
                  />
                </div>
              )}
              {fileError && (
                <p className="text-red-500 text-sm mt-1">{fileError}</p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-item-image-url">Or Enter Image URL</Label>
              <Input
                id="edit-item-image-url"
                value={itemImageUrl}
                onChange={(e) => setItemImageUrl(e.target.value)}
                disabled={!!itemImageFile}
              />
            </div>
            <div>
              <Label htmlFor="edit-item-desc">Description</Label>
              <Textarea
                id="edit-item-desc"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsEditItemOpen(false);
                  resetItemForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-[#2E235C] hover:bg-[#2E235C]/90">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteWishlistOpen} onOpenChange={setIsDeleteWishlistOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Wishlist</DialogTitle>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this wishlist? This action cannot be undone.
            </p>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsDeleteWishlistOpen(false);
                setSelectedWishlist(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDeleteWishlist}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteItemOpen} onOpenChange={setIsDeleteItemOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Item</DialogTitle>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this item from your wishlist?
            </p>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsDeleteItemOpen(false);
                setSelectedItem(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDeleteItem}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Wishlists;
