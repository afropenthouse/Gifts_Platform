import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const FAQ = () => {
  const faqs = [
    {
      question: "What is BeThere Weddings?",
      answer: "BeThere Weddings is an all-in-one platform that helps couples manage their wedding planning effortlessly. From collecting cash gifts and selling Asoebi to managing RSVPs and vendor payments, we've got you covered."
    },
    {
      question: "How do I send a cash gift?",
      answer: "It's simple! Just click on the unique link shared by the couple, select the 'Send Cash Gift' option, enter the amount you wish to contribute, and complete the secure payment process."
    },
    {
      question: "Is my payment information secure?",
      answer: "Yes, absolutely. We use industry-standard encryption and partner with trusted payment gateways like Paystack to ensure your financial data is always protected."
    },
    {
      question: "Can I purchase Asoebi on the platform?",
      answer: "Yes! Couples can list their Asoebi fabrics, and guests can purchase them directly through the event page. We handle the tracking so the couple knows exactly who ordered what."
    },
    {
      question: "Are there any fees for using the service?",
      answer: "Creating an account is free. For cash gifts, a small processing fee applies to cover transaction costs."
    },
    {
      question: "How do I RSVP for a wedding?",
      answer: "When you receive an invitation link, simply click on it and look for the RSVP button. Fill in your details, indicate whether you'll be attending, and you're all set! You'll receive an email confirmation."
    },
    {
      question: "Can I manage my wedding budget here?",
      answer: "Yes, our 'Manage Expenses' feature allows you to schedule and track payments to your vendors, helping you stay on top of your wedding budget and avoid missed deadlines."
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
              <HelpCircle className="w-8 h-8 text-[#2E235C]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#2E235C]">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to know about using BeThere Weddings to plan your perfect day.
            </p>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl shadow-sm p-6 md:p-8">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b-border/50">
                  <AccordionTrigger className="text-left font-medium text-lg text-foreground hover:text-[#2E235C] transition-colors py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="text-center mt-12 p-8 bg-[#2E235C]/5 rounded-2xl">
            <h3 className="text-xl font-semibold text-[#2E235C] mb-2">
              Still have questions?
            </h3>
            <p className="text-muted-foreground mb-6">
              We're here to help! Reach out to our support team anytime.
            </p>
            <a 
              href="mailto:teambethere@gmail.com" 
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#2E235C] hover:bg-[#2E235C]/90 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Contact Support
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
