import { motion } from "framer-motion";
import { CalendarDays, FileSearch } from "lucide-react";
import { Link } from "react-router-dom";
import labHero from "@/assets/lab-hero.jpg";
import cianaLogo from "@/assets/ciana-logo.png";

const HeroSection = () => {
  return (
    <section id="home" className="section-padding gradient-hero relative overflow-hidden">
      <div className="blob blob-primary w-[500px] h-[500px] -top-64 -left-64" />
      <div className="blob blob-secondary w-[350px] h-[350px] top-20 right-0" />
      <img src={cianaLogo} alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-auto opacity-[0.06] pointer-events-none select-none" aria-hidden="true" />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-3 space-y-6"
          >
            <span className="label-text">Trusted Diagnostics in Enugu</span>
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-foreground leading-[1.08]">
              Accurate Diagnostics{" "}
              <span className="text-primary">You Can Trust</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-xl">
              Fast, reliable lab results in Enugu. Precision-led laboratory services with expert staff and results you can rely on.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/appointment"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-sm hover:scale-[1.03] hover:shadow-lg transition-all duration-200 active:scale-[0.97]"
              >
                <CalendarDays className="w-4 h-4" />
                Book Appointment
              </Link>
              <Link
                to="/check-result"
                className="inline-flex items-center gap-2 bg-card/80 backdrop-blur text-foreground border border-border/50 px-8 py-4 rounded-xl font-semibold text-sm hover:scale-[1.03] hover:shadow-md transition-all duration-200 active:scale-[0.97]"
              >
                <FileSearch className="w-4 h-4" />
                Check My Result
              </Link>
            </div>

            <div className="flex gap-8 pt-4">
              {[
                { value: "99.7%", label: "Accuracy Rate" },
                { value: "Same-day", label: "Core Results" },
                { value: "10+", label: "Years Experience" },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                >
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-2"
          >
            <img
              src={labHero}
              alt="Modern diagnostic laboratory with advanced medical equipment at Ciana Diagnostics"
              className="w-full rounded-2xl object-cover aspect-[4/5] shadow-xl ring-1 ring-border/20"
              loading="eager"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
