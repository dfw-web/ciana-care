import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Adaeze O.",
    text: "Ciana Lab gave me my results the same day. The staff were professional and the environment was very clean. Highly recommended!",
    rating: 5,
  },
  {
    name: "Chukwuma E.",
    text: "I've been using Ciana Diagnostics for over 2 years now. Their accuracy is top-notch and the customer service is excellent.",
    rating: 5,
  },
  {
    name: "Blessing N.",
    text: "Very modern facility with state-of-the-art equipment. The results were fast and the prices are reasonable for the quality.",
    rating: 5,
  },
  {
    name: "Dr. Ifeanyi A.",
    text: "As a physician, I trust Ciana Lab for accurate diagnostics. Their turnaround time helps me provide timely care to my patients.",
    rating: 5,
  },
];

const ReviewsSection = () => {
  return (
    <section id="reviews" className="section-padding relative overflow-hidden">
      <div className="blob blob-primary w-[300px] h-[300px] -top-32 -left-32" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center space-y-4 mb-14"
        >
          <span className="label-text">Patient Reviews</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            What Our Patients Say
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="glass-card p-6"
            >
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: r.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{r.text}"</p>
              <p className="text-sm font-bold text-foreground">{r.name}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
