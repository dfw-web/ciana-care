import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import SiteHeader from "@/components/SiteHeader";
import HeroSection from "@/components/HeroSection";
import PatientPortalStrip from "@/components/PatientPortalStrip";
import WhyChooseUsSection from "@/components/WhyChooseUsSection";
import AboutSection from "@/components/AboutSection";
import TestsWeOfferSection from "@/components/TestsWeOfferSection";
import ReviewsSection from "@/components/ReviewsSection";
import ContactSection from "@/components/ContactSection";
import SiteFooter from "@/components/SiteFooter";
import WhatsAppFAB from "@/components/WhatsAppFAB";
import CianaLoader from "@/components/CianaLoader";

const Index = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {loading && <CianaLoader fullScreen text="Loading..." />}
      </AnimatePresence>
      <SiteHeader />
      <main>
        <HeroSection />
        <PatientPortalStrip />
        <WhyChooseUsSection />
        <AboutSection />
        <TestsWeOfferSection />
        <ReviewsSection />
        <ContactSection />
      </main>
      <SiteFooter />
      <WhatsAppFAB />
    </>
  );
};

export default Index;
