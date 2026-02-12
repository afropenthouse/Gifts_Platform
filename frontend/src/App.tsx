import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from './context/AuthContext';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';
import SignupRef from "./pages/SignupRef";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ShareGift from "./pages/ShareGift";
import QRGift from "./pages/QRGift";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import HowItWorks from "./pages/HowItWorks";
import WeddingRSVP from "./pages/landing/WeddingRSVP";
import CollectCashGifts from "./pages/landing/CollectCashGifts";
import WeddingQRCode from "./pages/landing/WeddingQRCode";
import VendorPaymentTracker from "./pages/landing/VendorPaymentTracker";
import ScheduleVendorPayments from "./pages/landing/ScheduleVendorPayments";
import AsoebiLanding from "./pages/landing/AsoebiLanding";
import FAQ from "./pages/landing/FAQ";
import TermsAndConditions from "./pages/landing/TermsAndConditions";
import PaymentPolicy from "./pages/landing/PaymentPolicy";
import PrivacyPolicy from "./pages/landing/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";

const queryClient = new QueryClient();

const App = () => {
  const { loginModalOpen, signupModalOpen, closeModals } = useAuth();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signup" element={<SignupRef />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/wedding-rsvp" element={<WeddingRSVP />} />
          <Route path="/collect-cash-gifts" element={<CollectCashGifts />} />
          <Route path="/wedding-qr-code" element={<WeddingQRCode />} />
          <Route path="/vendor-payment-tracker" element={<VendorPaymentTracker />} />
          <Route path="/schedule-vendor-payments" element={<ScheduleVendorPayments />} />
          <Route path="/asoebi" element={<AsoebiLanding />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/payment-policy" element={<PaymentPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/gift/:link" element={<ShareGift />} />
          <Route path="/gift/:slug/:id" element={<ShareGift />} />
          <Route path="/qr-gift/:link" element={<QRGift />} />
          <Route path="/qr-gift/:slug/:id" element={<QRGift />} />
          <Route path="/verify/:token" element={<VerifyEmail />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <LoginModal open={loginModalOpen} onClose={closeModals} />
        <SignupModal open={signupModalOpen} onClose={closeModals} />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;