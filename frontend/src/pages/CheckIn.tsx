import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import Navbar from '../components/Navbar';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const CheckInPage = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already'>('loading');
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const performCheckIn = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid Check-In link.');
        return;
      }

      try {
        const res = await fetch(`${backendUrl}/api/guests/checkin/${token}`, {
          method: 'POST',
        });
        const data = await res.json();
        if (res.ok) {
          if (data.alreadyCheckedIn) {
            setStatus('already');
            setMessage('This guest has already Checked-In.');
          } else {
            setStatus('success');
            setMessage('Check-In successful! Welcome to the event.');
          }
        } else {
          setStatus('error');
          setMessage(data.msg || 'Check-In failed.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
      }
    };

    performCheckIn();
  }, [token, backendUrl]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            {status === 'loading' && (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 mx-auto text-[#2E235C] animate-spin" />
                <p className="text-gray-600">Processing Check-In...</p>
              </div>
            )}
            {status === 'success' && (
              <div className="space-y-4">
                <CheckCircle2 className="w-12 h-12 mx-auto text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">Welcome!</h2>
                <p className="text-gray-600">{message}</p>
              </div>
            )}
            {status === 'already' && (
              <div className="space-y-4">
                <CheckCircle2 className="w-12 h-12 mx-auto text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Already Checked-In</h2>
                <p className="text-gray-600">{message}</p>
              </div>
            )}
            {status === 'error' && (
              <div className="space-y-4">
                <XCircle className="w-12 h-12 mx-auto text-red-600" />
                <h2 className="text-2xl font-bold text-gray-900">Oops</h2>
                <p className="text-gray-600">{message}</p>
                <Button onClick={() => (window.location.href = '/')} className="mt-4">
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
