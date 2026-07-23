import { Variants } from "framer-motion";

/**
 * Standardized durations for UI transitions across the platform.
 * These align with the target of feeling fast, responsive, and natural.
 */
export const DURATIONS = {
  hover: 0.15,
  button: 0.15,
  card: 0.2,
  modal: 0.25,
  drawer: 0.25,
  page: 0.3,
  dropdown: 0.15,
  accordion: 0.2,
  theme: 0.2,
  toast: 0.18,
};

/**
 * Standardized easing curves for natural, premium-feeling motion.
 */
export const EASINGS = {
  // Smooth, natural feel (similar to Apple/Material Design standard curves)
  easeOut: [0.25, 1, 0.5, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
  easeIn: [0.4, 0, 1, 1] as const,
  // Bouncy feel for specific interactions like modals or drawers
  spring: { type: "spring", stiffness: 300, damping: 30 },
};

/**
 * Default transitions for elements to avoid repeating configurations.
 */
export const defaultTransition = {
  duration: DURATIONS.page,
  ease: EASINGS.easeOut,
};

export const fastTransition = {
  duration: DURATIONS.hover,
  ease: EASINGS.easeOut,
};

/**
 * Common Framer Motion Variants for reuse across the application.
 * All variants prioritize GPU-accelerated properties (opacity, transform).
 */

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: defaultTransition },
  exit: { opacity: 0, transition: fastTransition },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: defaultTransition },
  exit: { opacity: 0, y: -20, transition: fastTransition },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: defaultTransition },
  exit: { opacity: 0, x: 20, transition: fastTransition },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: defaultTransition },
  exit: { opacity: 0, scale: 0.95, transition: fastTransition },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};
