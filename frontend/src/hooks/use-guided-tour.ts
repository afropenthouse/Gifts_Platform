import { useState, useEffect } from 'react';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void;
}

export const useGuidedTour = (tourKey: string) => {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [hasCompletedTour, setHasCompletedTour] = useState(true);

  useEffect(() => {
    const tourStatus = localStorage.getItem(`tour_${tourKey}_completed`);
    const isFirstTimeUser = !localStorage.getItem(`tour_${tourKey}_started`);
    
    setHasCompletedTour(!!tourStatus);
    
    // Auto-start tour on every login
    setTimeout(() => {
      setIsTourOpen(true);
      if (!localStorage.getItem(`tour_${tourKey}_started`)) {
        localStorage.setItem(`tour_${tourKey}_started`, 'true');
      }
    }, 1000); // Wait 1 second after component mount
  }, [tourKey]);

  const startTour = () => {
    setIsTourOpen(true);
  };

  const completeTour = () => {
    setIsTourOpen(false);
    setHasCompletedTour(true);
    localStorage.setItem(`tour_${tourKey}_completed`, 'true');
  };

  const skipTour = () => {
    setIsTourOpen(false);
    localStorage.setItem(`tour_${tourKey}_completed`, 'true');
  };

  const resetTour = () => {
    localStorage.removeItem(`tour_${tourKey}_completed`);
    localStorage.removeItem(`tour_${tourKey}_started`);
    setHasCompletedTour(false);
    setIsTourOpen(true);
  };

  return {
    isTourOpen,
    hasCompletedTour,
    startTour,
    completeTour,
    skipTour,
    resetTour,
  };
};

export type { TourStep };
