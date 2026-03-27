import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, ChevronDown, ChevronUp, MessageCircle, FlaskConical, ScanLine, Building2, GraduationCap, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SERVICE_GROUPS, formatPrice, type TestItem, type ServiceGroup } from "@/data/testCatalog";
import cianaLogo from "@/assets/ciana-logo.png";

type SelectedTest = TestItem & { category: string };

const groupIcons: Record<string, React.ElementType> = {
  "Laboratory Testing": FlaskConical,
  "Ultrasound Services": ScanLine,
  "Clinic Partnerships": Building2,
  "School Admission Screening": GraduationCap,
  "Employment Screening": Briefcase,
};

const ServiceCatalog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);

  const activeGroupData = useMemo(() => {
    if (!activeGroup) return null;
    return SERVICE_GROUPS.find((g) => g.group === activeGroup) || null;
  }, [activeGroup]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const cats = activeGroupData ? activeGroupData.categories : SERVICE_GROUPS.flatMap((g) => g.categories);

    if (!q) return cats;

    return cats
      .map((cat) => {
        const categoryMatch = cat.category.toLowerCase().includes(q);
        const matchingTests = cat.tests.filter(
          (t) => t.name.toLowerCase().startsWith(q) || t.name.toLowerCase().includes(q)
        );
        matchingTests.sort((a, b) => {
          const aS = a.name.toLowerCase().startsWith(q) ? 0 : 1;
          const bS = b.name.toLowerCase().startsWith(q) ? 0 : 1;
          return aS - bS;
        });
        if (categoryMatch) return { ...cat };
        if (matchingTests.length > 0) return { ...cat, tests: matchingTests };
        return null;
      })
      .filter(Boolean) as typeof cats;
  }, [searchQuery, activeGroupData]);

  const effectiveExpanded = searchQuery.trim()
    ? filteredCategories.length === 1 ? filteredCategories[0].category : expandedCategory
    : expandedCategory;

  const toggleTest = (test: TestItem, category: string) => {
    setSelectedTests((prev) => {
      const key = `${category}-${test.name}`;
      const exists = prev.find((s) => `${s.category}-${s.name}` === key);
      if (exists) return prev.filter((s) => `${s.category}-${s.name}` !== key);
      return [...prev, { ...test, category }];
    });
  };

  const isSelected = (test: TestItem, category: string) =>
    selectedTests.some((s) => s.category === category && s.name === test.name);

  const total = selectedTests.reduce((sum, t) => sum + t.price, 0);

  const buildWhatsAppMessage = () => {
    if (selectedTests.length === 0) return "";
    const grouped: Record<string, SelectedTest[]> = {};
    selectedTests.forEach((t) => {
      if (!grouped[t.category]) grouped[t.category] = [];
      grouped[t.category].push(t);
    });
    let msg = "Hello, I would like to inquire/pay for the following services:\n\n";
    Object.entries(grouped).forEach(([cat, tests]) => {
      msg += `*${cat}*\n`;
      tests.forEach((t) => {
        msg += `• ${t.name} — ${formatPrice(t.price)}\n`;
      });
      msg += "\n";
    });
    msg += `*Total: ${formatPrice(total)}*`;
    return msg;
  };

  const whatsappUrl = `https://wa.me/2347032364300?text=${encodeURIComponent(buildWhatsAppMessage())}`;

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

      <main className="container py-8 md:py-12 max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Our Services</h1>
          <p className="text-muted-foreground mt-2">Browse our services, select what you need, and make an inquiry via WhatsApp.</p>
        </motion.div>

        {/* Service Group Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SERVICE_GROUPS.map((g) => {
            const Icon = groupIcons[g.group] || FlaskConical;
            const isActive = activeGroup === g.group;
            return (
              <button
                key={g.group}
                onClick={() => {
                  setActiveGroup(isActive ? null : g.group);
                  setExpandedCategory(null);
                  setSearchQuery("");
                }}
                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-background border-border hover:border-primary/30 hover:shadow-sm"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? "bg-primary-foreground/20" : "bg-accent"
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? "text-primary-foreground" : "text-accent-foreground"}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isActive ? "" : "text-foreground"}`}>{g.group}</p>
                  <p className={`text-xs mt-0.5 ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {g.categories.length > 0
                      ? `${g.categories.reduce((s, c) => s + c.tests.length, 0)} services`
                      : "Info"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Informational groups (no pricing) */}
        {activeGroupData && activeGroupData.categories.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background rounded-xl border border-border p-8 text-center"
          >
            <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto">{activeGroupData.description}</p>
            <a
              href="https://wa.me/2347032364300?text=Hello%2C%20I%20would%20like%20to%20inquire%20about%20your%20services"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:scale-[1.03] transition-transform"
            >
              <MessageCircle className="w-5 h-5" />
              Contact Us for Details
            </a>
          </motion.div>
        )}

        {/* Search (only for groups with categories) */}
        {(!activeGroupData || activeGroupData.categories.length > 0) && (
          <>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-base rounded-2xl bg-card/70 backdrop-blur border-border/50"
                maxLength={100}
              />
            </div>

            {/* Categories */}
            <div className="space-y-3">
              {filteredCategories.length === 0 && (
                <div className="text-center py-12">
                  <FlaskConical className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No services match your search.</p>
                </div>
              )}
              {filteredCategories.map((cat) => {
                const isExpanded = effectiveExpanded === cat.category;
                const selectedCount = selectedTests.filter((s) => s.category === cat.category).length;

                return (
                  <motion.div
                    key={cat.category}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-background rounded-xl border border-border shadow-sm overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div>
                        <h2 className="font-semibold text-foreground text-sm uppercase tracking-wide">{cat.category}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cat.tests.length} services
                          {selectedCount > 0 && (
                            <span className="ml-2 text-primary font-semibold">• {selectedCount} selected</span>
                          )}
                        </p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border divide-y divide-border">
                            {cat.tests.map((test) => {
                              const selected = isSelected(test, cat.category);
                              return (
                                <label
                                  key={`${cat.category}-${test.name}`}
                                  className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors ${
                                    selected ? "bg-accent/50" : "hover:bg-muted/20"
                                  }`}
                                >
                                  <Checkbox checked={selected} onCheckedChange={() => toggleTest(test, cat.category)} />
                                  <span className="flex-1 text-sm font-medium text-foreground">{test.name}</span>
                                  <span className="text-sm font-bold text-primary">{formatPrice(test.price)}</span>
                                </label>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* Sticky bottom bar */}
        <AnimatePresence>
          {selectedTests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50"
            >
              <div className="container max-w-4xl mx-auto flex items-center justify-between py-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{selectedTests.length} service{selectedTests.length > 1 ? "s" : ""} selected</p>
                  <p className="text-xl font-bold text-foreground">Total: {formatPrice(total)}</p>
                </div>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-whatsapp text-white font-semibold text-sm hover:scale-105 transition-transform shadow-md"
                >
                  <MessageCircle className="w-5 h-5" />
                  Make Inquiry
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedTests.length > 0 && <div className="h-24" />}
      </main>
    </div>
  );
};

export default ServiceCatalog;
