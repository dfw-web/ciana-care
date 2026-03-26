import { MessageCircle } from "lucide-react";

const WhatsAppFAB = () => {
  return (
    <a
      href="https://wa.me/2347032364300?text=Hello%2C%20I%20would%20like%20to%20make%20an%20enquiry"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-whatsapp text-background rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
};

export default WhatsAppFAB;
