import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, ChevronDown, ChevronUp, MessageCircle, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TEST_CATALOG, formatPrice, type TestItem } from "@/data/testCatalog";

type SelectedTest = TestItem & { category: string };

const TestCatalog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);

  // Smart search: prioritize starts-with, then contains
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

      // Sort: starts-with first, then contains
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

  // Group selected tests by category for WhatsApp message
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
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container flex h-16 items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-foreground tracking-tight">Ciana Diagnostics</span>
          </div>
        </div>
      </header>

      <main className="container py-8 md:py-12 max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Test Catalog & Pricing</h1>
          <p className="text-muted-foreground mt-2">Browse our tests, select the ones you need, and make payment via WhatsApp.</p>
        </motion.div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by category or test name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-base"
            maxLength={100}
          />
        </div>

        {/* Categories */}
        <div className="space-y-3">
          {filteredCategories.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No tests match your search.</p>
          )}
          {filteredCategories.map((cat) => (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-background rounded-xl border border-border shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
              >
                <div>
                  <h2 className="font-semibold text-foreground text-sm uppercase tracking-wide">{cat.category}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{cat.tests.length} tests available</p>
                </div>
                {expandedCategory === cat.category ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              <AnimatePresence>
                {expandedCategory === cat.category && (
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
                            className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${selected ? "bg-accent/50" : "hover:bg-muted/20"}`}
                          >
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() => toggleTest(test, cat.category)}
                            />
                            <span className="flex-1 text-sm font-medium text-foreground">{test.name}</span>
                            <span className="text-sm font-semibold text-primary">{formatPrice(test.price)}</span>
                          </label>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Sticky bottom bar */}
        <AnimatePresence>
          {selectedTests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50"
            >
              <div className="container max-w-3xl mx-auto flex items-center justify-between py-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{selectedTests.length} test{selectedTests.length > 1 ? "s" : ""} selected</p>
                  <p className="text-xl font-bold text-foreground">Total: {formatPrice(total)}</p>
                </div>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-whatsapp text-background font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  <MessageCircle className="w-5 h-5" />
                  Make Payment
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spacer when bar is visible */}
        {selectedTests.length > 0 && <div className="h-24" />}
      </main>
    </div>
  );
};

export default TestCatalog;
