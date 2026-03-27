import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FlaskConical, ScanLine, Building2, GraduationCap, Briefcase, ArrowRight } from "lucide-react";

const serviceCards = [
  {
    icon: FlaskConical,
    title: "Laboratory Testing",
    desc: "Comprehensive blood tests, microbiology, hematology, serology and more.",
  },
  {
    icon: ScanLine,
    title: "Ultrasound Services",
    desc: "Abdominal, pelvic, obstetric, breast and other ultrasound scans.",
  },
  {
    icon: Building2,
    title: "Clinic Partnerships",
    desc: "Reliable diagnostic support for clinics and hospitals.",
  },
  {
    icon: GraduationCap,
    title: "School Admission Screening",
    desc: "Medical screening packages for student enrollment.",
  },
  {
    icon: Briefcase,
    title: "Employment Screening",
    desc: "Pre-employment health checks and assessments.",
  },
];

const ServicesOverviewSection = () => {
  return (
    <section id="services" className="section-padding relative overflow-hidden">
      <div className="blob blob-primary w-[400px] h-[400px] -top-48 -right-48" />
      <div className="blob blob-secondary w-[300px] h-[300px] bottom-0 -left-32" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center space-y-4 mb-12"
        >
          <span className="label-text">What We Offer</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Our Services</h2>
          <p className="text-muted-foreground leading-relaxed">
            From routine lab tests to specialized diagnostics and screening packages, we offer a full spectrum of services.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {serviceCards.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="glass-card p-7 text-center"
            >
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4">
                <s.icon className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-sm hover:scale-[1.03] hover:shadow-lg transition-all"
          >
            View All Services & Pricing
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesOverviewSection;
