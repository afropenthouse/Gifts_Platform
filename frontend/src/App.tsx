import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from './context/AuthContext';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ShareGift from "./pages/ShareGift";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import HowItWorks from "./pages/HowItWorks";
import NotFound from "./pages/NotFound";

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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/gift/:link" element={<ShareGift />} />
          <Route path="/gift/:slug/:id" element={<ShareGift />} />
          <Route path="/verify/:token" element={<VerifyEmail />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <LoginModal open={loginModalOpen} onClose={closeModals} />
        <SignupModal open={signupModalOpen} onClose={closeModals} />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;