import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import Navbar from '../components/Navbar';
import { ScanLine, Loader2 } from 'lucide-react';

const CheckInPage = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 mx-auto text-[#2E235C] animate-spin" />
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-[#2E235C]/10 rounded-full flex items-center justify-center">
                  <ScanLine className="w-8 h-8 text-[#2E235C]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Use Event Scanner</h2>
                <p className="text-gray-600">
                  This QR code can only be checked in by the event scanner. Please show this code to the event staff at the entrance.
                </p>
                <Button onClick={() => (window.location.href = '/')} variant="outline" className="mt-2">
                  Go Home
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckInPage;
