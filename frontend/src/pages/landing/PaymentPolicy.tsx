import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShieldCheck, CreditCard, Lock, Info, AlertTriangle, CheckCircle } from "lucide-react";

const PaymentPolicy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
              <ShieldCheck className="w-8 h-8 text-[#2E235C]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#2E235C]">
              Payment Policy
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              How we handle your money and protect you from scams.
            </p>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl shadow-sm p-6 md:p-10 space-y-10">
            {/* Section 1: Security */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-[#2E235C]">
                <Lock className="w-6 h-6" />
                <h2 className="text-2xl font-semibold">Secure Transactions</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                All financial transactions on BeThere Weddings are processed through industry-leading payment gateways (like Paystack). We do not store your credit card or bank login details on our servers. Your data is encrypted and handled according to PCI-DSS standards.
              </p>
            </section>

            <hr className="border-border/50" />

            {/* Section 2: How Money is Handled */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-[#2E235C]">
                <CreditCard className="w-6 h-6" />
                <h2 className="text-2xl font-semibold">How Your Money Moves</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" /> For Guests
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    When you send a gift, the funds are collected by our secure payment partner and held until the couple requests a payout.
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" /> For Couples
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Gifts are accumulated in your BeThere wallet. You can request a payout to your verified Nigerian bank account at any time.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-border/50" />

            {/* Section 3: Anti-Scam Policy */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-[#2E235C]">
                <AlertTriangle className="w-6 h-6" />
                <h2 className="text-2xl font-semibold">Anti-Scam & Safety</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                We are a legal entity committed to transparency. To prevent scams and fraudulent gift collections:
              </p>
              <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
                <li><strong>Identity Verification:</strong> We may require couples to verify their identity before large payouts are processed.</li>
                <li><strong>Reporting:</strong> If you suspect an event page is fraudulent, please report it immediately to <a href="mailto:teambethere@gmail.com" className="text-blue-600 underline">teambethere@gmail.com</a>.</li>
                <li><strong>Legal Protection:</strong> We cooperate with law enforcement in cases of proven financial fraud. BeThere Weddings is not liable for gifts sent to verified users, but we will assist in investigations where possible.</li>
              </ul>
            </section>

            <hr className="border-border/50" />

            {/* Section 4: Fees */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-[#2E235C]">
                <Info className="w-6 h-6" />
                <h2 className="text-2xl font-semibold">Fees & Charges</h2>
              </div>
              <p className="text-muted-foreground">
                To maintain our platform and cover transaction costs, a small processing fee is applied to cash gifts. This fee is typically shown to the guest at the point of payment. There are no hidden monthly charges for couples.
              </p>
            </section>
          </div>

          <div className="text-center p-8 bg-[#2E235C]/5 rounded-2xl">
            <h3 className="text-lg font-semibold text-[#2E235C] mb-2">Legal Compliance</h3>
            <p className="text-sm text-muted-foreground">
              BeThere Weddings operates in compliance with Nigerian financial regulations. We are committed to ensuring a safe and transparent environment for wedding gifting.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentPolicy;
