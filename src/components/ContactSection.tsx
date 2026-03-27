import { motion } from "framer-motion";
import { Phone, MapPin, Clock, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";

const ContactSection = () => {
  return (
    <section id="contact" className="section-padding gradient-medical relative overflow-hidden">
      <div className="blob blob-secondary w-[400px] h-[400px] top-0 right-0" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center space-y-4 mb-14"
        >
          <span className="label-text">Contact Us</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Get In Touch</h2>
          <p className="text-muted-foreground leading-relaxed">
            Have questions or ready to book? Reach out to us through any of the channels below.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              {[
                { icon: Phone, label: "Phone", value: "0703 236 4300", href: "tel:07032364300" },
                { icon: MapPin, label: "Address", value: "189 Ugwuaji Rd, Independence Layout, Enugu", href: undefined },
                { icon: Clock, label: "Hours", value: "Mon – Sat: 8:00 AM – 6:00 PM", href: undefined },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-sm font-medium text-foreground hover:text-primary transition-colors">{item.value}</a>
                    ) : (
                      <p className="text-sm font-medium text-foreground">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl overflow-hidden border border-border/50 shadow-md">
              <iframe
                title="Ciana Diagnostics location on Google Maps"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.7!2d7.5!3d6.43!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s189+Ugwuaji+Rd%2C+Independence+Layout%2C+Enugu!5e0!3m2!1sen!2sng!4v1"
                width="100%"
                height="250"
                style={{ border: 0, filter: "grayscale(1) contrast(1.1)" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="glass-card p-8 space-y-6 text-center">
              <h3 className="text-lg font-bold text-foreground">Ready to Book?</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Use our appointment booking system to schedule your visit. Select your services, preferred date and time, and we'll confirm via WhatsApp.
              </p>
              <Link
                to="/appointment"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-sm hover:scale-[1.03] hover:shadow-lg transition-all"
              >
                <CalendarDays className="w-4 h-4" />
                Book Appointment
              </Link>
              <div className="pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-3">Or view our full service catalog</p>
                <Link
                  to="/services"
                  className="inline-flex items-center gap-2 bg-card text-foreground border border-border px-6 py-3 rounded-xl font-semibold text-sm hover:shadow-md transition-all"
                >
                  View Our Services
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
