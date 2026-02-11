import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Eye, Lock, FileText, Bell, MessageSquare } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
              <Shield className="w-8 h-8 text-[#2E235C]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#2E235C]">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
            </p>
          </div>

          <div className="prose prose-slate max-w-none bg-card border border-border/50 rounded-2xl shadow-sm p-6 md:p-10">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#2E235C] flex items-center gap-2">
                <Eye className="w-6 h-6" /> 1. Information We Collect
              </h2>
              <p className="text-muted-foreground">
                We collect information you provide directly to us when you create an account, use our services, or communicate with us. This includes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Account Information:</strong> Name, email address, password, and contact details.</li>
                <li><strong>Event Information:</strong> Wedding dates, guest lists, and event descriptions.</li>
                <li><strong>Payment Information:</strong> We use third-party payment processors (like Paystack) to handle financial transactions. We do not store your full credit card or bank details on our servers.</li>
              </ul>
            </section>

            <hr className="my-8 border-border/50" />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#2E235C] flex items-center gap-2">
                <Lock className="w-6 h-6" /> 2. How We Use Your Information
              </h2>
              <p className="text-muted-foreground">
                We use the information we collect to provide, maintain, and improve our services, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Facilitating RSVPs and gift collections.</li>
                <li>Sending you technical notices, updates, and security alerts.</li>
                <li>Responding to your comments and questions.</li>
                <li>Personalizing your experience on our platform.</li>
              </ul>
            </section>

            <hr className="my-8 border-border/50" />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#2E235C] flex items-center gap-2">
                <FileText className="w-6 h-6" /> 3. Data Sharing and Disclosure
              </h2>
              <p className="text-muted-foreground">
                We do not sell your personal information. We may share information with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Service Providers:</strong> Third-party vendors who help us provide our services (e.g., hosting providers, payment processors).</li>
                <li><strong>Legal Requirements:</strong> If required by law or to protect our rights and safety.</li>
              </ul>
            </section>

            <hr className="my-8 border-border/50" />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#2E235C] flex items-center gap-2">
                <Bell className="w-6 h-6" /> 4. Data Security
              </h2>
              <p className="text-muted-foreground">
                We implement reasonable security measures to protect your information from unauthorized access, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <hr className="my-8 border-border/50" />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#2E235C] flex items-center gap-2">
                <MessageSquare className="w-6 h-6" /> 5. Your Choices
              </h2>
              <p className="text-muted-foreground">
                You can update your account information at any time by logging into your account settings. You may also contact us to request the deletion of your personal data.
              </p>
            </section>

            <hr className="my-8 border-border/50" />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#2E235C]">6. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
              </p>
            </section>
          </div>

          
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
