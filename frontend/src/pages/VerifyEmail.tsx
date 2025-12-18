import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{message}</h1>
      </div>
    </div>
  );
};

export default VerifyEmail;