import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { CheckCircle, Crown, CreditCard, LogOut, CalendarPlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface UpgradeEventOption {
  id: number;
  title: string;
}

interface ForcedUpgradeGateProps {
  events: UpgradeEventOption[];
  isProcessingPayment?: boolean;
  onUpgrade: (eventId: number) => void;
  onCreateEvent: () => void;
  onLogout: () => void;
}

const VIP_BENEFITS = [
  '0% commission on all cash gifts',
  '0% commission on all asoebi orders',
  'Premium website templates',
  'Premium invitation templates',
  'Event check-in',
  'Photobook',
  'Personalized event planner (on request)',
];

const ForcedUpgradeGate: React.FC<ForcedUpgradeGateProps> = ({
  events,
  isProcessingPayment = false,
  onUpgrade,
  onCreateEvent,
  onLogout,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  useEffect(() => {
    if (events.length > 0 && selectedEventId === null) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const hasEvents = events.length > 0;

  const handleUpgrade = () => {
    if (!selectedEventId) return;
    onUpgrade(selectedEventId);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 sm:p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 pt-6 pb-1 flex-1 overflow-y-auto min-h-0">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Upgrade Required</h3>
          </div>
          <p className="text-gray-600 mt-1.5 text-sm">
            We're now requiring everyone to upgrade to continue using BeThere.
          </p>

          <div className="px-3 py-2.5 rounded-xl border mt-3 bg-yellow-50 border-yellow-200">
            <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">VIP Benefits</h4>
            <ul className="space-y-1 text-xs text-gray-600">
              {VIP_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {hasEvents ? (
            <>
              {events.length > 1 && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Select Event
                  </label>
                  <Select
                    value={selectedEventId ? String(selectedEventId) : undefined}
                    onValueChange={(v) => setSelectedEventId(Number(v))}
                  >
                    <SelectTrigger className="w-full h-9 bg-white text-gray-900 border border-[#2E235C] hover:bg-[#2E235C]/5 text-sm">
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900">
                      {events.map((ev) => (
                        <SelectItem key={ev.id} value={ev.id.toString()}>
                          {ev.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {events.length === 1 && (
                <div className="mt-3 px-3 py-2 rounded-xl border bg-gray-50 border-gray-200">
                  <span className="text-[11px] text-gray-500 block mb-0.5">Event</span>
                  <span className="text-sm font-medium text-gray-900">{events[0].title}</span>
                </div>
              )}
            </>
          ) : (
            <div className="mt-3 px-3 py-2.5 rounded-xl border bg-gray-50 border-gray-200">
              <p className="text-sm font-medium text-gray-900">You don't have an event yet</p>
              <p className="text-xs text-gray-600 mt-1">
                Create your first event, then upgrade it to keep using BeThere.
              </p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 flex-shrink-0 border-t border-gray-100">
          {hasEvents && (
            <div className="flex items-center justify-end">
              <p className="text-lg font-bold text-gray-900">₦50,000</p>
            </div>
          )}

          <div className="mt-3.5 flex flex-col sm:flex-row gap-2.5">
            <Button
              variant="outline"
              onClick={onLogout}
              disabled={isProcessingPayment}
              size="sm"
              className="w-full sm:w-auto sm:flex-1 h-9 order-2 sm:order-1"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Log out
            </Button>
            {hasEvents ? (
              <Button
                onClick={handleUpgrade}
                disabled={isProcessingPayment || !selectedEventId}
                size="sm"
                className="w-full sm:w-auto sm:flex-1 h-9 text-white bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 order-1 sm:order-2"
              >
                {isProcessingPayment ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5" />
                    Pay Now
                  </div>
                )}
              </Button>
            ) : (
              <Button
                onClick={onCreateEvent}
                size="sm"
                className="w-full sm:w-auto sm:flex-1 h-9 text-white bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 order-1 sm:order-2"
              >
                <CalendarPlus className="w-3.5 h-3.5 mr-1.5" />
                Create an event
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForcedUpgradeGate;
