import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Download, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface Gift {
  id: number;
  title: string;
  shareLink: string;
  [key: string]: any;
}

interface QrCodePageProps {
  gifts: Gift[];
}

const QrCodePage: React.FC<QrCodePageProps> = ({ gifts }) => {
  const [selectedGiftId, setSelectedGiftId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (gifts.length > 0 && !selectedGiftId) {
      setSelectedGiftId(gifts[0].id.toString());
    }
  }, [gifts, selectedGiftId]);

  const selectedGift = gifts.find(g => g.id.toString() === selectedGiftId);

  const qrUrl = selectedGift ? `${window.location.origin}/qr-gift/${selectedGift.shareLink}` : '';

  const downloadQRCode = () => {
    const svg = document.getElementById("event-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `qrcode-${selectedGift?.title || 'event'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const copyLink = () => {
    if (qrUrl) {
      navigator.clipboard.writeText(qrUrl);
      toast({
        title: "Link copied",
        description: "QR gift link copied to clipboard",
      });
    }
  };

  if (gifts.length === 0) {
    return (
        <div className="text-center py-12">
            <p className="text-gray-500">No events found. Create an event to generate a QR code.</p>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-900">QR Code for Cash gifts</h2>
            <p className="text-gray-600">Place this QR code at your event to receive cash gifts</p>
        </div>
        <div className="w-full md:w-64 flex flex-row items-center gap-2">
          <span className="text-sm text-gray-600 whitespace-nowrap">Select event</span>
          <Select value={selectedGiftId} onValueChange={setSelectedGiftId}>
            <SelectTrigger>
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              {gifts.map(gift => (
                <SelectItem key={gift.id} value={gift.id.toString()}>
                  {gift.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedGift && (
        <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-8 flex flex-col items-center justify-center space-y-8">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <QRCodeSVG
                        id="event-qr-code"
                        value={qrUrl}
                        size={300}
                        level={"H"}
                        includeMargin={true}
                    />
                </div>
                
                <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold">{selectedGift.title}</h3>
                    <p className="text-gray-500 text-sm break-all">{qrUrl}</p>
                </div>

                <div className="flex flex-wrap gap-4 justify-center">
                    <Button onClick={downloadQRCode} className="bg-[#2E235C] hover:bg-[#2E235C]/90">
                        <Download className="w-4 h-4 mr-2" />
                        Download QR Code
                    </Button>
                    <Button variant="outline" onClick={copyLink}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                    </Button>
                    <Button variant="ghost" onClick={() => window.open(qrUrl, '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Preview
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QrCodePage;
