import { motion } from "framer-motion";
import { Eye, Target, Heart } from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const AboutSection = () => {
  return (
    <section id="about" className="section-padding relative overflow-hidden">
      <div className="blob blob-secondary w-[300px] h-[300px] -bottom-32 -right-32" />

      <div className="container relative z-10 space-y-20">
        {/* OUR VISION */}
        <motion.div {...fadeInUp} className="max-w-3xl mx-auto text-center space-y-4">
          <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mx-auto">
            <Eye className="w-7 h-7 text-accent-foreground" />
          </div>
          <span className="label-text">Our Vision</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            To make the most reliable diagnosis and provide the most outstanding services.
          </h2>
          <p className="text-muted-foreground leading-relaxed text-lg">
            We want to be the name you trust whenever you need answers, because we know your health is the most important thing you have.
          </p>
        </motion.div>

        {/* ABOUT US */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-3xl mx-auto text-center space-y-4"
        >
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <Heart className="w-7 h-7 text-primary" />
          </div>
          <span className="label-text">About Us</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Who We Are
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We are a community-focused laboratory and diagnostic center located in the heart of Enugu, committed to providing the most reliable medical testing and the most outstanding care for our clients.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            At Ciana, we understand that your health is more than just numbers on a report. It's about giving you the answers you need to make informed decisions about your well-being. We believe in quality, accuracy, and trust as the foundation of everything we do.
          </p>
        </motion.div>

        {/* OUR MISSION STATEMENT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <div className="glass-card p-8 md:p-12 text-center space-y-4">
            <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mx-auto">
              <Target className="w-7 h-7 text-accent-foreground" />
            </div>
            <span className="label-text">Our Mission Statement</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Our Commitment to You
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We exist to ensure that the chain of high-quality health care delivery is never broken. We are here to exceed the expectations of our clients, offering not just top-notch diagnostic services, but also compassionate support every step of the way.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our mission is to be the preferred diagnostic center, where your health concerns are addressed with the utmost professionalism and care.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
