import React, { useState, useEffect, useRef } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { X, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector for the target element
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void; // Optional action to perform when step is shown
}

interface GuidedTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  className?: string;
  onStepChange?: (stepId: string) => void;
}

const GuidedTour: React.FC<GuidedTourProps> = ({
  steps,
  isOpen,
  onComplete,
  onSkip,
  className = '',
  onStepChange,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tourPosition, setTourPosition] = useState({ top: 0, left: 0 });
  const tourRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updateHighlight = () => {
      const step = steps[currentStep];
      if (!step) return;

      if (step.target === 'body') {
        setHighlightRect(null);
        setTourPosition({
          top: window.innerHeight / 2 - 150,
          left: window.innerWidth / 2 - 200,
        });
        return;
      }

      const targetElement = document.querySelector(step.target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setHighlightRect(rect);

        // Calculate tour box position based on step position
        let top = 0;
        let left = 0;
        const tourBoxWidth = Math.min(400, window.innerWidth - 40);
        const tourBoxHeight = 220;
        const sidebarWidth = window.innerWidth >= 1024 ? 256 : 0; // Sidebar width on desktop

        switch (step.position) {
          case 'top':
            top = Math.max(20, rect.top - tourBoxHeight - 20);
            left = rect.left + rect.width / 2 - tourBoxWidth / 2;
            break;
          case 'bottom':
            top = rect.bottom + 20;
            left = rect.left + rect.width / 2 - tourBoxWidth / 2;
            break;
          case 'left':
            top = rect.top + rect.height / 2 - tourBoxHeight / 2;
            left = Math.max(sidebarWidth + 20, rect.left - tourBoxWidth - 20);
            break;
          case 'right':
            top = rect.top + rect.height / 2 - tourBoxHeight / 2;
            left = rect.right + 20;
            break;
          case 'center':
            top = window.innerHeight / 2 - tourBoxHeight / 2;
            left = window.innerWidth / 2 - tourBoxWidth / 2;
            break;
        }

        // Ensure tour box stays within viewport and doesn't overlap sidebar
        top = Math.max(20, Math.min(top, window.innerHeight - tourBoxHeight - 20));
        left = Math.max(sidebarWidth + 20, Math.min(left, window.innerWidth - tourBoxWidth - 20));

        setTourPosition({ top, left });
      }
    };

    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight);

    // Execute action if defined for this step
    if (steps[currentStep]?.action) {
      steps[currentStep].action!();
    }

    // Notify parent component of step change
    if (onStepChange && steps[currentStep]) {
      onStepChange(steps[currentStep].id);
    }

    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight);
    };
  }, [currentStep, isOpen, steps, onStepChange]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!isOpen || !steps[currentStep]) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 pointer-events-none" />
      
      {/* Highlight Box */}
      {highlightRect && (
        <div
          className="absolute border-4 border-[#2E235C] bg-[#2E235C] bg-opacity-10 rounded-lg pointer-events-none z-50 transition-all duration-300"
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
          }}
        />
      )}

      {/* Tour Box */}
      <div
        ref={tourRef}
        className={`fixed z-50 pointer-events-auto transition-all duration-300 ${className}`}
        style={{
          top: `${tourPosition.top}px`,
          left: `${tourPosition.left}px`,
          width: `${Math.min(400, window.innerWidth - 40)}px`,
          maxWidth: '90vw',
        }}
      >
        <Card className="shadow-2xl border-2 border-[#2E235C]/20">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-[#2E235C]">
                  Step {currentStep + 1} of {steps.length}
                </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-[#2E235C] h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            {/* Content */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {step.content}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
                >
                  Skip Tour
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-[#2E235C] hover:bg-[#2E235C]/90"
                >
                  {isLastStep ? 'Get Started' : 'Next'}
                  {!isLastStep && <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default GuidedTour;
