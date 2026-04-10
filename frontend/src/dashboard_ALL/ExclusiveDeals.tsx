import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Phone, Clock } from 'lucide-react';

interface VendorDeal {
  id: number;
  vendorName: string;
  vendorImage: string;
  dealTitle: string;
  priceRange: string;
  originalPrice: string;
  discount: string;
  rating: number;
  location: string;
  availability: string;
  description: string;
  tags: string[];
  featured: boolean;
}

const mockDeals: VendorDeal[] = [
  {
    id: 1,
    vendorName: "Bloom & Blossom Florists",
    vendorImage: "/images (2).png",
    dealTitle: "Premium Wedding Flower Package",
    priceRange: "800K - 1M",
    originalPrice: "1.5M",
    discount: "47% OFF",
    rating: 4.8,
    location: "Ikoyi, Lagos",
    availability: "Limited slots",
    description: "Complete wedding floral arrangements including bridal bouquet, centerpieces, and venue decoration",
    tags: ["Flowers", "Decoration", "Premium"],
    featured: true
  },
  {
    id: 2,
    vendorName: "Gourmet Delights Catering",
    vendorImage: "/images (3).png",
    dealTitle: "All-Inclusive Wedding Catering",
    priceRange: "900K - 1.2M",
    originalPrice: "2M",
    discount: "50% OFF",
    rating: 4.9,
    location: "Victoria Island, Lagos",
    availability: "5 slots left",
    description: "Full catering service for 200 guests with international cuisine and professional staff",
    tags: ["Catering", "Food", "Service"],
    featured: true
  },
  {
    id: 3,
    vendorName: "Capture Moments Photography",
    vendorImage: "/images (4).png",
    dealTitle: "Professional Wedding Photography",
    priceRange: "750K - 950K",
    originalPrice: "1.8M",
    discount: "53% OFF",
    rating: 4.7,
    location: "Lekki, Lagos",
    availability: "3 slots left",
    description: "Complete wedding photography package with pre-wedding shoot, wedding day coverage, and album",
    tags: ["Photography", "Memories", "Professional"],
    featured: true
  }
];

interface ExclusiveDealsProps {
  onDealRequest?: (dealId: number, phoneNumber: string) => void;
}

export const ExclusiveDeals = ({ onDealRequest }: ExclusiveDealsProps) => {
  const [selectedDeal, setSelectedDeal] = useState<VendorDeal | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleDealClick = (deal: VendorDeal) => {
    setSelectedDeal(deal);
    setIsModalOpen(true);
  };

  const handleSubmitRequest = async () => {
    if (!selectedDeal || !phoneNumber) return;

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      if (onDealRequest) {
        onDealRequest(selectedDeal.id, phoneNumber);
      }
      setIsSubmitting(false);
      setIsModalOpen(false);
      setShowSuccessModal(true);
      setPhoneNumber('');
      setSelectedDeal(null);
    }, 1500);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPhoneNumber('');
    setSelectedDeal(null);
  };

  const formatPhoneNumber = (value: string) => {
    // Format phone number for Nigerian numbers
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return cleaned.slice(0, 11);
    }
    return cleaned.slice(0, 10);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Exclusive Deals</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover amazing wedding deals from top vendors. Limited time offers with huge discounts!
        </p>
      </div>


      {/* Deals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockDeals.map((deal) => (
          <Card key={deal.id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-[#2E235C]/20">
            <div className="relative">
              {/* Deal Image */}
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <img
                  src={deal.vendorImage}
                  alt={deal.vendorName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Deal Content */}
              <CardContent className="p-4 space-y-3">
                {/* Vendor Name */}
                <h3 className="font-semibold text-lg text-gray-900">{deal.vendorName}</h3>

                {/* Deal Title */}
                <p className="text-gray-700 font-medium">{deal.dealTitle}</p>

                {/* Price */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[#2E235C]">{deal.priceRange}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 line-through">{deal.originalPrice}</span>
                    <span className="text-sm text-green-600 font-medium">Save {deal.discount}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {deal.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-2">{deal.description}</p>

                {/* Action Button */}
                <Button 
                  onClick={() => handleDealClick(deal)}
                  className="w-full bg-[#2E235C] hover:bg-[#2E235C]/90 text-white font-medium"
                >
                  Request This Deal
                </Button>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>

      {/* Phone Number Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Request Exclusive Deal
            </DialogTitle>
            <DialogDescription>
              Enter your phone number to request this exclusive deal from {selectedDeal?.vendorName}
            </DialogDescription>
          </DialogHeader>

          {selectedDeal && (
            <div className="space-y-4">
              {/* Deal Summary */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <h4 className="font-semibold text-sm">{selectedDeal.dealTitle}</h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-bold text-[#2E235C]">{selectedDeal.priceRange}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-bold text-green-600">{selectedDeal.discount}</span>
                </div>
              </div>

              {/* Phone Number Input */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="08012345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                  maxLength={11}
                />
                <p className="text-xs text-gray-500">
                  Enter your Nigerian phone number (e.g., 08012345678)
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitRequest}
              disabled={!phoneNumber || phoneNumber.length < 11 || isSubmitting}
              className="bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90"
            >
              {isSubmitting ? 'Submitting...' : 'Request Deal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              Deal Request Successful!
            </DialogTitle>
            <DialogDescription className="text-center">
              Thank you for your interest! Our vendor will contact you within <strong>1 to 24 hours</strong> to discuss your exclusive wedding deal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">
                <strong>What happens next?</strong>
              </p>
              <ul className="text-xs text-gray-600 mt-2 space-y-1 text-left">
                <li>• Vendor will call you on your provided number</li>
                <li>• Discuss your specific wedding requirements</li>
                <li>• Customize the deal to match your needs</li>
                <li>• Confirm pricing and availability</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex justify-center">
            <Button 
              onClick={handleCloseSuccessModal}
              className="bg-gradient-to-r from-[#2E235C] to-[#2E235C] hover:from-[#2E235C]/90 hover:to-[#2E235C]/90"
            >
              Got it, Thanks!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
