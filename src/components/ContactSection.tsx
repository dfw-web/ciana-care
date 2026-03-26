import { motion } from "framer-motion";
import { Phone, MapPin, Clock, Send } from "lucide-react";
import { useState, FormEvent } from "react";
import { toast } from "sonner";

const ContactSection = () => {
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success("Your enquiry has been sent! We'll get back to you shortly.");
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

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
            <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
              <h3 className="text-lg font-bold text-foreground">Book an Appointment</h3>

              {[
                { id: "name", label: "Full Name", type: "text", placeholder: "Your full name", required: true, maxLength: 100 },
                { id: "phone", label: "Phone Number", type: "tel", placeholder: "e.g. 0703 236 4300", required: true, maxLength: 20 },
                { id: "email", label: "Email (Optional)", type: "email", placeholder: "your@email.com", required: false, maxLength: 255 },
              ].map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <label htmlFor={field.id} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {field.label}
                  </label>
                  <input
                    id={field.id}
                    name={field.id}
                    type={field.type}
                    required={field.required}
                    maxLength={field.maxLength}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background/80 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}

              <div className="space-y-1.5">
                <label htmlFor="message" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Message / Service Needed
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  maxLength={1000}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background/80 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-shadow"
                  placeholder="Tell us about the test or service you need…"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-sm hover:scale-[1.02] hover:shadow-md transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {sending ? "Sending…" : "Send Enquiry"}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
