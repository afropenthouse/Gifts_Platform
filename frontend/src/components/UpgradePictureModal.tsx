import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Crown, X } from 'lucide-react';

const STORAGE_KEY = 'upgrade_picture_modal_dismissed';

const PLACEHOLDER_SVG =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22640%22 height=%22360%22 viewBox=%220 0 640 360%22 fill=%22none%22%3E%3Crect width=%22640%22 height=%22360%22 rx=%2216%22 fill=%22%23f3f4f6%22/%3E%3Crect x=%2290%22 y=%2280%22 width=%22460%22 height=%22200%22 rx=%2212%22 fill=%22%23e5e7eb%22/%3E%3Ccircle cx=%22250%22 cy=%22190%22 r=%2216%22 fill=%22%239ca3af%22/%3E%3Crect x=%22360%22 y=%22120%22 width=%22140%22 height=%2228%22 rx=%226%22 fill=%22%23d1d5db%22/%3E%3Crect x=%22360%22 y=%22160%22 width=%22100%22 height=%2220%22 rx=%224%22 fill=%22%23d1d5db%22/%3E%3Crect x=%22360%22 y=%22200%22 width=%22160%22 height=%2220%22 rx=%224%22 fill=%22%23d1d5db%22/%3E%3Ctext x=%22320%22 y=%22325%22 text-anchor=%22middle%22 font-family=%22Arial,%20sans-serif%22 font-size=%2222%22 fill=%22%239ca3af%22%3EPLACEHOLDER IMAGE%3C/text%3E%3Ctext x=%22320%22 y=%22348%22 text-anchor=%22middle%22 font-family=%22Arial,%20sans-serif%22 font-size=%2214%22 fill=%22%239ca3af%22%3EReplace with your actual image%3C/text%3E%3C/svg%3E';

const OPEN_DELAY_MS = 300;

interface UpgradePictureModalProps {
  imageSrc?: string;
  title?: string;
  description?: string;
  upgradeLabel?: string;
  onUpgrade?: () => void;
}

const UpgradePictureModal: React.FC<UpgradePictureModalProps> = ({
  imageSrc = PLACEHOLDER_SVG,
  title = 'Upgrade Your Experience',
  description = '',
  upgradeLabel = 'Upgrade Now',
  onUpgrade,
}: UpgradePictureModalProps) => {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'true') return;
    const timer = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    if (dontShowAgain) localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
  };

  const handleUpgrade = () => {
    if (dontShowAgain) localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
    onUpgrade?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>

        <img src={imageSrc} alt="Upgrade" className="h-64 w-full object-cover" />

        <div className="p-6 pt-5">
          <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
          <p className="mt-2 text-sm text-gray-600">{description}</p>

          <div className="mt-2 flex items-center gap-2">
            <input
              id="upgrade-modal-dont-show"
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#2E235C] focus:ring-[#2E235C]"
            />
            <label htmlFor="upgrade-modal-dont-show" className="text-sm text-gray-600">
              Don&apos;t show again
            </label>
          </div>

          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={close} className="flex-1">
              Not now
            </Button>
            <Button
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-[#2E235C] to-[#392B74] text-white hover:from-[#2E235C]/90 hover:to-[#392B74]/90"
            >
              <Crown className="h-4 w-4 mr-2" />
              {upgradeLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePictureModal;
