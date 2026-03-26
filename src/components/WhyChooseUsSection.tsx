import { motion } from "framer-motion";
import { Target, Users, Headphones, Zap, Building2 } from "lucide-react";

const items = [
  { icon: Target, label: "Accurate Results" },
  { icon: Users, label: "Professional Staff" },
  { icon: Headphones, label: "Excellent Service" },
  { icon: Zap, label: "Fast Diagnosis" },
  { icon: Building2, label: "Modern Facility" },
];

const WhyChooseUsSection = () => {
  return (
    <section className="border-y border-border/50 py-12 gradient-medical">
      <div className="container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap justify-center gap-8 md:gap-14"
        >
          {items.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                <item.icon className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-sm font-bold text-foreground">{item.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
