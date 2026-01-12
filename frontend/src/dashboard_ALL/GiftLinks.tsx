import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  Gift, Copy, Eye, Edit, Download, Filter, Trash2, Users, ExternalLink
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';

interface Gift {
  id: string;
  type: string;
  title: string;
  description?: string;
  date?: string;
  picture?: string;
  details?: any;
  customType?: string;
  shareLink: string;
  createdAt: string;
  contributions?: Contribution[];
}

interface Contribution {
  id: number;
  giftId: number;
  contributorName: string;
  contributorEmail: string;
  amount: number;
  message: string;
  createdAt: string;
}

interface GiftLinksProps {
  gifts: Gift[];
  contributions: Contribution[];
  onCreateGift: () => void;
  onEditGift: (gift: Gift) => void;
  onViewDetails: (gift: Gift) => void;
  onDeleteGift: (giftId: string) => void;
  onRSVP: (gift: Gift) => void;
  deletingGiftId?: string | null;
}

export const GiftLinks = ({
  gifts,
  contributions,
  onCreateGift,
  onEditGift,
  onViewDetails,
  onDeleteGift,
  onRSVP,
  deletingGiftId,
}: GiftLinksProps) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [giftToDelete, setGiftToDelete] = useState<Gift | null>(null);

  const handleDeleteConfirm = () => {
    if (giftToDelete) {
      onDeleteGift(giftToDelete.id);
      setDeleteModalOpen(false);
      setGiftToDelete(null);
    }
  };
  return (
    <div>
      {gifts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 overflow-y-auto max-h-[800px]">
          {gifts.map((gift) => {
            const giftContributions = contributions.filter((c) => {
              return String(c.giftId) === gift.id;
            });
            const totalGiftAmount = giftContributions.reduce((sum, c) => sum + Number(c.amount), 0);

            return (
              <Card key={gift.id} className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-0 shadow-lg bg-gradient-to-r from-white to-gray-50 overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-black group-hover:w-1.5 transition-all duration-300"></div>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-stretch">
                    {/* Left Section - Visual Assets */}
                    <div className="flex flex-col md:flex-row gap-4 flex-shrink-0 items-center md:items-start">
                      {/* Picture with Enhanced Styling */}
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          {gift.picture ? (
                            <div className="w-24 h-24 rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                              <img
                                src={gift.picture}
                                alt={gift.title || gift.type}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 bg-black via-red-100/20 to-red-50 rounded-xl flex items-center justify-center shadow-md">
                              <Gift className="w-10 h-10 text-black" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-bold text-base text-gray-900 text-center line-clamp-2">{gift.title}</h3>
                      </div>

                      {/* QR Code with Enhanced Styling */}
                      <div className="flex flex-col items-center gap-3">
                        <div className="bg-white rounded-lg p-2 shadow-md border-2 border-black transition-colors" data-gift-id={gift.id}>
                          <QRCodeSVG
                            value={`${window.location.origin}/gift/${gift.shareLink}`}
                            size={80}
                            level="L"
                            includeMargin={false}
                            fgColor="#000000"
                            bgColor="#ffffff"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const svg = document.querySelector(`[data-gift-id="${gift.id}"] svg`);
                            if (svg) {
                              const svgData = new XMLSerializer().serializeToString(svg);
                              const canvas = document.createElement('canvas');
                              const ctx = canvas.getContext('2d');
                              const img = new Image();

                              img.onload = () => {
                                canvas.width = img.width;
                                canvas.height = img.height;
                                ctx?.drawImage(img, 0, 0);

                                canvas.toBlob((blob) => {
                                  if (blob) {
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${gift.title || gift.type}-qr-code.png`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  }
                                });
                              };

                              img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                            }
                          }}
                          className="text-xs font-medium text-black hover:text-red-700 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-[#E10032]/5 hover:bg-black transition-all"
                          title="Download QR Code"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>

                    {/* Right Section - Content & Actions */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      {/* Top Content */}
                      <div>

                        {/* Amount Display */}
                        <div className="mb-3">
                          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Total Received</p>
                          <p className="text-2xl font-bold text-black">₦{totalGiftAmount.toFixed(2)}</p>
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">{gift.description}</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100 items-center">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-9 border-black text-black hover:bg-black hover:text-white hover:border-[#E10032] transition-all font-medium"
                            onClick={() => onViewDetails(gift)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-9 border-black text-black hover:bg-black hover:text-white transition-all font-medium"
                            onClick={() => {
                              const previewUrl = `${window.location.origin}/gift/${gift.shareLink}`;
                              window.open(previewUrl, '_blank');
                            }}
                            title="Preview gift page"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs h-9 bg-black text-white hover:shadow-lg transition-all font-medium"
                            onClick={() => {
                              const link = `${window.location.origin}/gift/${gift.shareLink}`;
                              navigator.clipboard.writeText(link);
                              alert('Link copied to clipboard!');
                            }}
                          >
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            Share Link
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-9 border-black text-black hover:bg-black hover:text-white transition-all font-medium"
                            onClick={() => onRSVP(gift)}
                            title="RSVP"
                          >
                            <Users className="w-3.5 h-3.5 mr-1" />
                            RSVP
                          </Button>
                        </div>

                        <div className="flex-1" />

                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditGift(gift)}
                            className="text-gray-600 hover:text-[#E10032] hover:bg-[#E10032]/5 transition-all"
                            title="Edit Gift"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-9 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-600 transition-all font-medium"
                            onClick={() => {
                              setGiftToDelete(gift);
                              setDeleteModalOpen(true);
                            }}
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4">
          <Gift className="w-16 h-16 mx-auto mb-6 text-[#2E235C]/40" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No event created yet</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Create your first event link to start collecting RSVPs from friends and family
          </p>
          <Button 
            onClick={onCreateGift}
            className="bg-[#2E235C] hover:bg-[#2E235C]/90 text-white px-8 font-semibold"
          >
            <Gift className="w-4 h-4 mr-2" />
            Create Your First Event
          </Button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "<span className="font-semibold text-gray-900">{giftToDelete?.title}</span>"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setGiftToDelete(null);
              }}
              className="font-medium"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white font-medium"
              disabled={!!deletingGiftId}
            >
              {deletingGiftId ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GiftLinks;
