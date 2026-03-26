import { motion } from "framer-motion";
import { Droplets, Microscope, Heart, Baby, Stethoscope, FlaskConical, Syringe, ScanLine } from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, ease: [0.2, 0, 0, 1] as const },
};

const services = [
  { icon: Droplets, title: "Blood Tests", desc: "Comprehensive blood analysis including full blood count, glucose, and lipid panels." },
  { icon: Microscope, title: "Malaria Test", desc: "Rapid and microscopy-based malaria parasite detection with accurate results." },
  { icon: FlaskConical, title: "Typhoid Test", desc: "Widal test and blood culture for reliable typhoid fever diagnosis." },
  { icon: Syringe, title: "HIV Screening", desc: "Confidential HIV testing with pre- and post-test counselling support." },
  { icon: Baby, title: "Pregnancy Test", desc: "Urine and blood-based pregnancy detection with same-day results." },
  { icon: ScanLine, title: "Urinalysis", desc: "Complete urine analysis for kidney function and metabolic screening." },
  { icon: Heart, title: "Cardiac Markers", desc: "Troponin, BNP, and complete cardiac risk assessment profiles." },
  { icon: Stethoscope, title: "General Health Checks", desc: "Preventive screening packages tailored to your health needs." },
];

const ServicesSection = () => {
  return (
    <section id="services" className="section-padding bg-background">
      <div className="container">
        <motion.div {...fadeInUp} className="max-w-2xl mx-auto text-center space-y-4 mb-14">
          <span className="label-text">Our Services</span>
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
            Comprehensive Diagnostic Services
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            From routine blood work to specialized diagnostics, we offer a full spectrum of laboratory services.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: [0.2, 0, 0, 1] }}
              whileHover={{ y: -4 }}
              className="p-6 bg-card rounded-xl shadow-card border border-border hover:shadow-md transition-shadow cursor-default"
            >
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center mb-4">
                <s.icon className="w-5 h-5 text-accent-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1.5">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
