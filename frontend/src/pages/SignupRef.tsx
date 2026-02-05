import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignupRef = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openSignupModal } = useAuth();

  useEffect(() => {
    // 1. Extract 'ref' from URL
    const searchParams = new URLSearchParams(location.search);
    const refCode = searchParams.get('ref');

    // 2. If present, save to localStorage
    if (refCode) {
      localStorage.setItem('referralCode', refCode);
    }

    // 3. Open the signup modal
    openSignupModal();

    // 4. Redirect to home (so the modal appears over the home page)
    navigate('/', { replace: true });
  }, [location, navigate, openSignupModal]);

  return null; // Render nothing as we are redirecting
};

export default SignupRef;
