import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText, ShieldCheck, UserCheck, AlertCircle, CreditCard, HelpCircle } from "lucide-react";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
              <FileText className="w-8 h-8 text-[#2E235C]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#2E235C]">
              Terms and Conditions
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Please read these terms carefully before using BeThere Weddings.
            </p>
          </div>

          <div className="prose prose-slate max-w-none bg-card border border-border/50 rounded-2xl shadow-sm p-6 md:p-10">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#2E235C] flex items-center gap-2">
                <UserCheck className="w-6 h-6" /> 1. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground">
                By accessing or using the BeThere Weddings platform, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use our services.
              </p>
            </section>

            <hr className="my-8 border-border/50" />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#2E235C] flex items-center gap-2">
                <ShieldCheck className="w-6 h-6" /> 2. User Accounts
              </h2>
              <p className="text-muted-foreground">
                To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information during registration.
              </p>
            </section>

            <hr className="my-8 border-border/50" />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#2E235C] flex items-center gap-2">
                <CreditCard className="w-6 h-6" /> 3. Cash Gifts and Payments
              </h2>
              <p className="text-muted-foreground">
                BeThere Weddings facilitates the collection of cash gifts and payments for services like Asoebi. We partner with secure third-party payment processors (e.g., Paystack) to handle transactions. By using our payment features, you also agree to the terms of our payment processors.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Processing fees may apply to transactions.</li>
                <li>Couples are responsible for ensuring their bank details are correct for payouts.</li>
                <li>Gifts are non-refundable once processed, unless explicitly agreed upon by the recipient.</li>
              </ul>
            </section>

            <hr className="my-8 border-border/50" />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#2E235C] flex items-center gap-2">
                <AlertCircle className="w-6 h-6" /> 4. Prohibited Conduct
              </h2>
              <p className="text-muted-foreground">
                Users may not use the platform for any fraudulent or illegal activities. This includes, but is not limited to, impersonation, scamming, or uploading harmful content. We reserve the right to suspend or terminate accounts that violate these terms.
              </p>
            </section>

            <hr className="my-8 border-border/50" />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#2E235C] flex items-center gap-2">
                <HelpCircle className="w-6 h-6" /> 5. Limitation of Liability
              </h2>
              <p className="text-muted-foreground">
                BeThere Weddings acts as a facilitator and is not responsible for disputes between guests and couples, or between couples and vendors. We are not liable for any financial losses resulting from unauthorized access to your account if you failed to secure it.
              </p>
            </section>

            <hr className="my-8 border-border/50" />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#2E235C]">6. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may update these terms from time to time. Continued use of the platform after changes are posted constitutes acceptance of the new terms.
              </p>
            </section>
          </div>

         
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsAndConditions;
