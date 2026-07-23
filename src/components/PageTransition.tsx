import { motion, HTMLMotionProps } from "framer-motion";
import { slideUp } from "@/utils/motion";

export function PageTransition({ children, className = "", ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={slideUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
