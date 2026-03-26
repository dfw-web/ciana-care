import { motion } from "framer-motion";
import { ShieldCheck, Clock, Award } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="about" className="section-padding relative overflow-hidden">
      <div className="blob blob-secondary w-[300px] h-[300px] -bottom-32 -right-32" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center space-y-4"
        >
          <span className="label-text">About Us</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            A Commitment to Precision
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Ciana Diagnostics And Laboratory is a trusted medical diagnostics center in Enugu, Nigeria.
            We combine advanced technology with experienced professionals to deliver fast, accurate,
            and reliable diagnostic results that physicians and patients can depend on.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mt-14">
          {[
            {
              icon: ShieldCheck,
              title: "Trusted Results",
              desc: "Every test undergoes rigorous quality control to ensure diagnostic accuracy you can rely on.",
            },
            {
              icon: Clock,
              title: "Fast Turnaround",
              desc: "Same-day results for core tests. Because timely diagnosis leads to better health outcomes.",
            },
            {
              icon: Award,
              title: "Expert Staff",
              desc: "Our team of certified laboratory scientists brings over a decade of combined clinical experience.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card p-8 text-center"
            >
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mx-auto mb-5">
                <item.icon className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
