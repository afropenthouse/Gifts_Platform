import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ScanLine, CheckCircle2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import Navbar from '../components/Navbar';
import { useToast } from '../hooks/use-toast';

const PRIMARY = '#2E235C';
const PRIMARY_LIGHT = 'rgba(46, 35, 92, 0.08)';

const CheckInScan = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [checkedInCount, setCheckedInCount] = useState(0);
  const { toast } = useToast();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const handleScan = useCallback(async (decodedText: string) => {
    try {
      const url = new URL(decodedText);
      
      if (url.origin !== window.location.origin) {
        toast({ title: 'Invalid QR code: not from this app', variant: 'destructive' });
        return;
      }

      const token = url.pathname.split('/').pop();
      if (!token || !url.pathname.includes('/checkin/')) {
        toast({ title: 'Invalid QR code', variant: 'destructive' });
        return;
      }

      const res = await fetch(`${backendUrl}/api/guests/checkin/${token}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        if (data.alreadyCheckedIn) {
          toast({ title: 'Guest already Checked-In' });
        } else {
          toast({ title: 'Guest Checked-In successfully' });
          setCheckedInCount(prev => prev + 1);
        }
      } else {
        toast({ title: data.msg || 'Check-In failed', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Check-In failed', variant: 'destructive' });
    }
  }, [backendUrl, toast]);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    const start = async () => {
      setScanError('');
      try {
        html5QrCode = new Html5Qrcode('checkin-scanner-page');
        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 280, height: 280 } },
          async (decodedText: string) => {
            if (html5QrCode) {
              html5QrCode.pause();
            }
            await handleScan(decodedText);
            setTimeout(() => {
              if (html5QrCode && scanning) {
                html5QrCode.resume();
              }
            }, 1500);
          },
          () => {}
        );
        setScanning(true);
      } catch (err) {
        setScanError('Unable to start camera. Please allow camera access.');
        setScanning(false);
      }
    };

    start();

    return () => {
      if (html5QrCode) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, [handleScan, scanning]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: PRIMARY }}>Scan QR Check-In</h1>
          <p className="text-gray-600 text-base">Point your camera at the guest's QR code</p>
          {checkedInCount > 0 && (
            <div
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full"
              style={{ backgroundColor: PRIMARY_LIGHT }}
            >
              <CheckCircle2 className="w-5 h-5" style={{ color: PRIMARY }} />
              <span className="font-semibold" style={{ color: PRIMARY }}>
                {checkedInCount} guest{checkedInCount > 1 ? 's' : ''} Checked-In
              </span>
            </div>
          )}
        </div>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: PRIMARY }}>
              <ScanLine className="w-5 h-5" />
              QR Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              id="checkin-scanner-page"
              className="w-full rounded-lg overflow-hidden bg-black aspect-square max-w-md mx-auto border-2"
              style={{ borderColor: PRIMARY }}
            />
            {scanError && (
              <p className="text-sm text-red-600 mt-4 text-center">{scanError}</p>
            )}
            {scanning && !scanError && (
              <p
                className="text-sm mt-4 text-center flex items-center justify-center gap-2 font-medium"
                style={{ color: PRIMARY }}
              >
                <ScanLine className="w-4 h-4 animate-pulse" />
                Scanning... Hold camera steady
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={() => navigate(`/checkin-options/${eventId}`)}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Choose another method
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckInScan;
