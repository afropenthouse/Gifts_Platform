import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { openLoginModal } = useAuth();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify/${token}`);
        const data = await res.json();
        if (res.ok) {
          setMessage(data.msg);
        } else {
          setMessage(data.msg || 'Verification failed');
        }
      } catch (err) {
        setMessage('Network error. Please try again.');
      }
    };
    if (token) verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Email Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-lg">{message || 'Verifying your email...'}</p>
              {message && (
                <Button onClick={openLoginModal} className="w-full" style={{ backgroundColor: '#2E235C' }}>Go to Login</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;