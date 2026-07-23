import React from "react";
import { motion } from "framer-motion";

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delay?: string;
}

export function RevealOnScroll({ children, className = "", delay = "0s" }: RevealOnScrollProps) {
  // Parse delay string like "200ms" or "0.2s" to number in seconds
  const parseDelay = (d: string) => {
    if (d.endsWith("ms")) return parseFloat(d) / 1000;
    if (d.endsWith("s")) return parseFloat(d);
    return 0;
  };

  const delaySeconds = parseDelay(delay);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: delaySeconds, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
