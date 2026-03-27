import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, Search, X, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SERVICE_GROUPS, formatPrice, type TestItem } from "@/data/testCatalog";
import cianaLogo from "@/assets/ciana-logo.png";

const allServices = SERVICE_GROUPS.flatMap((g) =>
  g.categories.flatMap((c) => c.tests.map((t) => ({ ...t, category: c.category })))
);

type SelectedService = TestItem & { category: string };

const Appointment = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredServices = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase();
    if (!q) return [];
    return allServices
      .filter((s) => s.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const aS = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bS = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        return aS - bS;
      })
      .slice(0, 10);
  }, [serviceSearch]);

  const toggleService = (svc: SelectedService) => {
    setSelectedServices((prev) => {
      const key = `${svc.category}-${svc.name}`;
      if (prev.some((s) => `${s.category}-${s.name}` === key)) {
        return prev.filter((s) => `${s.category}-${s.name}` !== key);
      }
      return [...prev, svc];
    });
    setServiceSearch("");
  };

  const removeService = (svc: SelectedService) => {
    setSelectedServices((prev) =>
      prev.filter((s) => !(s.category === svc.category && s.name === svc.name))
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Full name is required";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Valid email is required";
    if (!phone.trim() || phone.trim().length < 7) e.phone = "Phone number is required";
    if (selectedServices.length === 0) e.services = "Select at least one service";
    if (!date) e.date = "Preferred date is required";
    if (!time) e.time = "Preferred time is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const servicesList = selectedServices.map((s) => `${s.name} (${formatPrice(s.price)})`).join(", ");
    const msg = `Hello, I would like to book an appointment.\n\nName: ${fullName.trim()}\nEmail: ${email.trim()}\nPhone: ${phone.trim()}\nService(s): ${servicesList}\nPreferred Date: ${date}\nPreferred Time: ${time}${message.trim() ? `\nAdditional Message: ${message.trim()}` : ""}`;

    window.open(`https://wa.me/2347032364300?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container flex h-16 items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <img src={cianaLogo} alt="Ciana Diagnostics" className="h-8 w-auto" />
            <span className="font-semibold text-foreground tracking-tight">Ciana Diagnostics</span>
          </div>
        </div>
      </header>

      <main className="container py-8 md:py-12 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-7 h-7 text-accent-foreground" />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Book an Appointment</h1>
          <p className="text-muted-foreground mt-2">Fill in the form below and we'll get back to you via WhatsApp.</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-background rounded-xl border border-border shadow-sm p-6 space-y-5"
        >
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name *</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" maxLength={100} />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email *</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" maxLength={255} />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number *</label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0703 236 4300" maxLength={20} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          {/* Services */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Service(s) *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Search services to add..."
                className="pl-9"
                maxLength={100}
              />
              {filteredServices.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredServices.map((svc) => {
                    const alreadySelected = selectedServices.some(
                      (s) => s.category === svc.category && s.name === svc.name
                    );
                    return (
                      <button
                        type="button"
                        key={`${svc.category}-${svc.name}`}
                        onClick={() => toggleService(svc)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted/30 flex justify-between ${
                          alreadySelected ? "bg-accent/30" : ""
                        }`}
                      >
                        <span>{svc.name}</span>
                        <span className="text-primary font-semibold">{formatPrice(svc.price)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {selectedServices.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedServices.map((svc) => (
                  <span
                    key={`${svc.category}-${svc.name}`}
                    className="inline-flex items-center gap-1 bg-accent text-accent-foreground text-xs font-medium px-3 py-1.5 rounded-full"
                  >
                    {svc.name}
                    <button type="button" onClick={() => removeService(svc)} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {errors.services && <p className="text-xs text-destructive">{errors.services}</p>}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preferred Date *</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
              {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preferred Time *</label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              {errors.time && <p className="text-xs text-destructive">{errors.time}</p>}
            </div>
          </div>

          {/* Additional Message */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Additional Message (Optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-shadow"
              placeholder="Any additional information..."
            />
          </div>

          <Button type="submit" className="w-full gap-2">
            <MessageCircle className="w-4 h-4" />
            Book via WhatsApp
          </Button>
        </motion.form>
      </main>
    </div>
  );
};

export default Appointment;
