import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, ChevronUp, MessageCircle, FlaskConical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { TEST_CATALOG, formatPrice, type TestItem } from "@/data/testCatalog";

type SelectedTest = TestItem & { category: string };

const categoryIcons: Record<string, string> = {
  "LIVER FUNCTION": "🫁",
  "KIDNEY": "🫘",
  "CARDIOVASCULAR SYSTEM": "❤️",
  "GASTROINTESTINAL TRACT": "🔬",
  "MUSCULOSKELETAL FUNCTION": "🦴",
  "TUMOUR MARKERS": "🧬",
  "METABOLIC DISORDERS": "⚗️",
  "HEMATOLOGY": "🩸",
  "GENERAL TESTS": "🩺",
};

const TestsWeOfferSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return TEST_CATALOG;

    return TEST_CATALOG.map((cat) => {
      const categoryMatch =
        cat.category.toLowerCase().startsWith(q) ||
        cat.category.toLowerCase().includes(q);

      const matchingTests = cat.tests.filter(
        (t) =>
          t.name.toLowerCase().startsWith(q) ||
          t.name.toLowerCase().includes(q)
      );

      matchingTests.sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        return aStarts - bStarts;
      });

      if (categoryMatch) return { ...cat, tests: cat.tests };
      if (matchingTests.length > 0) return { ...cat, tests: matchingTests };
      return null;
    }).filter(Boolean) as typeof TEST_CATALOG;
  }, [searchQuery]);

  // Auto-expand when searching
  const effectiveExpanded = searchQuery.trim()
    ? filteredCategories.length === 1
      ? filteredCategories[0].category
      : expandedCategory
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

    let msg = "Hello, I would like to pay for the following tests:\n\n";
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
    <section id="services" className="section-padding relative overflow-hidden">
      {/* Background blobs */}
      <div className="blob blob-primary w-[400px] h-[400px] -top-48 -right-48" />
      <div className="blob blob-secondary w-[300px] h-[300px] bottom-0 -left-32" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center space-y-4 mb-10"
        >
          <span className="label-text">Our Tests</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Tests We Offer
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Browse our comprehensive test catalog. Select the tests you need and make payment via WhatsApp.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="max-w-xl mx-auto mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by category or test name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-base rounded-2xl bg-card/70 backdrop-blur border-border/50 shadow-sm focus:shadow-md transition-shadow"
              maxLength={100}
            />
          </div>
        </motion.div>

        {/* Categories grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FlaskConical className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No tests match your search.</p>
            </div>
          )}
          {filteredCategories.map((cat, i) => {
            const isExpanded = effectiveExpanded === cat.category;
            const selectedCount = selectedTests.filter((s) => s.category === cat.category).length;

            return (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className={`glass-card overflow-hidden ${isExpanded ? "md:col-span-2 lg:col-span-3" : ""}`}
              >
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{categoryIcons[cat.category] || "🧪"}</span>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">
                        {cat.category}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cat.tests.length} tests
                        {selectedCount > 0 && (
                          <span className="ml-2 text-primary font-semibold">
                            • {selectedCount} selected
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border/50 divide-y divide-border/30">
                        {cat.tests.map((test) => {
                          const selected = isSelected(test, cat.category);
                          return (
                            <label
                              key={`${cat.category}-${test.name}`}
                              className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-all duration-200 ${
                                selected
                                  ? "bg-primary/5"
                                  : "hover:bg-accent/20"
                              }`}
                            >
                              <Checkbox
                                checked={selected}
                                onCheckedChange={() => toggleTest(test, cat.category)}
                              />
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

        {/* Sticky bottom bar */}
        <AnimatePresence>
          {selectedTests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border/50 shadow-lg z-50"
            >
              <div className="container max-w-5xl mx-auto flex items-center justify-between py-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {selectedTests.length} test{selectedTests.length > 1 ? "s" : ""} selected
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    Total: {formatPrice(total)}
                  </p>
                </div>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-whatsapp text-white font-semibold text-sm hover:scale-105 transition-transform shadow-md"
                >
                  <MessageCircle className="w-5 h-5" />
                  Make Payment
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedTests.length > 0 && <div className="h-24" />}
      </div>
    </section>
  );
};

export default TestsWeOfferSection;
